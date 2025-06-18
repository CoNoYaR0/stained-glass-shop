const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json', 'Allow': 'POST' },
    };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Use service key for admin actions

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase URL or Service Key is missing.');
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Server configuration error: Supabase credentials missing.' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 1. Authentication
  const authHeader = event.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('Missing or malformed Authorization header.');
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Unauthorized: Missing or malformed token.' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
  const token = authHeader.split(' ')[1];

  let staffUser;
  try {
    const { data: userResponse, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userResponse || !userResponse.user) {
      console.error('Error fetching staff user or user not found:', userError?.message || 'User not found.');
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized: Invalid token or user not found.' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }
    staffUser = userResponse.user;
    console.log('Staff user authenticated:', staffUser.id, staffUser.email);
  } catch (e) {
    console.error('Exception during staff authentication:', e);
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Unauthorized: Authentication error.' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  const staffName = staffUser.user_metadata?.full_name || staffUser.user_metadata?.name || staffUser.email || 'Staff';

  // 2. Parse request body
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    console.error('Error parsing request body:', e);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Bad Request: Invalid JSON format.' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  const { userId, message_content } = body;

  if (!userId || !message_content) {
    console.warn('Missing userId or message_content in request body.');
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Bad Request: Missing userId or message_content.' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  // 3. Insert Message into Supabase
  try {
    const messageData = {
      user_id: userId, // This is the client's user_id (conversation ID)
      message_content: message_content,
      sender_type: 'staff',
      staff_name: staffName, // Name of the staff member sending the reply
      // created_at will be set by default by Supabase
    };

    const { data: insertedMessage, error: insertError } = await supabase
      .from('live_chat_messages')
      .insert([messageData])
      .select(); // .select() to get the inserted row back

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Error sending message.', error: insertError.message }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    console.log('Staff reply sent and saved:', insertedMessage);

    // Additionally, broadcast this message to the client's channel
    // The client's channel name is typically 'chat-' + userId
    const clientChannelName = `chat-${userId}`;
    const broadcastPayload = {
        type: 'broadcast',
        event: 'new_message', // This should match what the client-side script.js listens for
        payload: {
            text: message_content,
            sender: staffName, // So the client can display who sent it
            created_at: insertedMessage[0]?.created_at || new Date().toISOString(),
            // id: insertedMessage[0]?.id // Optionally send the message ID
        }
    };

    // Use the main Supabase client (already initialized with service_key) to send broadcast
    // No need to create a separate client for broadcasting as admin
    const { error: broadcastError } = await supabase.channel(clientChannelName).send(broadcastPayload);

    if (broadcastError) {
        console.error(`Error broadcasting message to channel ${clientChannelName}:`, broadcastError);
        // Non-critical error, so we don't fail the whole request, but log it.
        // The message is saved, but the client might not get it in real-time if this fails.
    } else {
        console.log(`Message broadcasted to channel ${clientChannelName}`);
    }


    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Reply sent successfully.', data: insertedMessage[0] }),
      headers: { 'Content-Type': 'application/json' },
    };

  } catch (e) {
    console.error('Unexpected server error:', e);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error.', error: e.toString() }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};

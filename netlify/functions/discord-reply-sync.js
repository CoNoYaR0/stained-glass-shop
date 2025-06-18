const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
      headers: { 'Allow': 'POST' },
    };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase URL or Service Key is missing for discord-reply-sync.');
    return { statusCode: 500, body: JSON.stringify({ message: 'Server configuration error.' }) };
  }
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    console.error('Error parsing request body for discord-reply-sync:', e);
    return { statusCode: 400, body: JSON.stringify({ message: 'Bad Request: Invalid JSON.' }) };
  }

  const { user_id, message_content, staff_name } = body;

  // Validate required fields
  if (!user_id || !message_content || !staff_name) {
    let missingFields = [];
    if (!user_id) missingFields.push('user_id');
    if (!message_content) missingFields.push('message_content');
    if (!staff_name) missingFields.push('staff_name');
    console.warn(`Missing required fields for discord-reply-sync: ${missingFields.join(', ')}`);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: `Bad Request: Missing required fields: ${missingFields.join(', ')}.` }),
    };
  }

  try {
    const messageData = {
      user_id: user_id,
      message_content: message_content,
      sender_type: 'staff',
      staff_name: staff_name, // Name of the staff member from Discord
    };

    const { data: insertedMessage, error: insertError } = await supabase
      .from('live_chat_messages')
      .insert([messageData])
      .select();

    if (insertError) {
      console.error('Supabase insert error in discord-reply-sync:', insertError);
      return { statusCode: 500, body: JSON.stringify({ message: 'Error saving message to database.' }) };
    }

    console.log('Discord staff reply saved to Supabase:', insertedMessage);

    // Broadcast this message to the client's channel
    const clientChannelName = `chat-${user_id}`;
    const broadcastPayload = {
      type: 'broadcast',
      event: 'new_message',
      payload: {
        text: message_content,
        sender: staff_name,
        user_id: user_id,
        sender_type: 'staff',
        created_at: insertedMessage[0]?.created_at || new Date().toISOString(),
      }
    };

    const { error: broadcastError } = await supabase.channel(clientChannelName).send(broadcastPayload);

    if (broadcastError) {
      console.error(`Error broadcasting message from discord-reply-sync to channel ${clientChannelName}:`, broadcastError);
      // Non-critical for the function's success, as message is saved.
    } else {
      console.log(`Message from discord-reply-sync broadcasted to channel ${clientChannelName}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Reply processed and saved successfully.', data: insertedMessage[0] }),
    };

  } catch (e) {
    console.error('Unexpected server error in discord-reply-sync:', e);
    return { statusCode: 500, body: JSON.stringify({ message: 'Internal Server Error.' }) };
  }
};

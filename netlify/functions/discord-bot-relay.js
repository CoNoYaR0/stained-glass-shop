const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
// Use SUPABASE_SERVICE_KEY for backend operations like inserting into the table
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL or Service Key is not configured for discord-bot-relay function.');
}
let supabase;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

exports.handler = async (event) => {
  if (!supabase) {
    console.error('Supabase client is not initialized in discord-bot-relay. Check SUPABASE_URL/SERVICE_KEY.');
    return { statusCode: 500, body: JSON.stringify({ message: 'Supabase client not initialized. Check server logs.' }) };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (error) {
    console.error('Error parsing request body in discord-bot-relay:', error);
    return { statusCode: 400, body: JSON.stringify({ message: 'Bad Request: Invalid JSON.' }) };
  }

  const { userId, message, senderName } = body; // senderName is the admin/staff name

  if (!userId || !message) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Bad Request: Missing userId or message.' }) };
  }

  const channelName = `chat-${userId}`;
  let realtimeBroadcastSuccess = false;

  // 1. Broadcast message to user via Supabase Realtime
  try {
    const { error: realtimeError } = await supabase.channel(channelName).send({
      type: 'broadcast',
      event: 'new_message',
      payload: {
        text: message,
        sender: senderName || 'Staff',
        timestamp: new Date().toISOString(),
      },
    });

    if (realtimeError) {
      console.error('Supabase Realtime error sending message:', realtimeError);
      // Do not immediately return; still try to save to DB.
    } else {
      realtimeBroadcastSuccess = true;
      console.log(`Message successfully broadcasted via Supabase Realtime to channel ${channelName}.`);
    }
  } catch (error) {
    console.error('Unexpected error during Supabase Realtime broadcast:', error);
    // Do not immediately return; still try to save to DB.
  }

  // 2. Write staff reply to Supabase table
  let dbWriteSuccess = false; // This variable is not used to determine the final outcome in the provided logic, but kept for clarity
  if (realtimeBroadcastSuccess) { // Optionally, only write to DB if broadcast was initially successful or make it independent
    try {
      const { data, error: dbError } = await supabase
        .from('live_chat_messages')
        .insert([
          {
            user_id: userId,
            message_content: message,
            sender_type: 'staff',
            staff_name: senderName || 'Staff Admin', // Store the name of the staff member
            // timestamp will be set by default by the DB
          },
        ])
        .select();

      if (dbError) {
        console.error('Supabase error inserting staff reply:', dbError);
      } else {
        dbWriteSuccess = true;
        console.log('Staff reply successfully written to Supabase:', data);
      }
    } catch (dbError) {
      console.error('Exception writing staff reply to Supabase:', dbError);
    }
  } else {
    // If realtime broadcast failed, we might still want to log the message if a staff member tried to send it.
    // Or, we could decide not to save it if it couldn't be delivered.
    // For now, let's log it as a warning if broadcast failed but still attempt DB save.
    console.warn(`Realtime broadcast to ${channelName} failed or was skipped. Attempting to save staff message to DB anyway.`);
     try {
      const { data, error: dbError } = await supabase
        .from('live_chat_messages')
        .insert([
          {
            user_id: userId,
            message_content: message,
            sender_type: 'staff',
            staff_name: senderName || 'Staff Admin',
          },
        ])
        .select();
      if (dbError) {
        console.error('Supabase error inserting staff reply (after broadcast failed):', dbError);
      } else {
        dbWriteSuccess = true;
        console.log('Staff reply (after broadcast failed) successfully written to Supabase:', data);
      }
    } catch (dbErrorAll) {
        console.error('Exception writing staff reply to Supabase (after broadcast failed):', dbErrorAll);
    }
  }

  // Determine overall status for the client that called this function (the admin panel)
  if (realtimeBroadcastSuccess) {
    return { statusCode: 200, body: JSON.stringify({ message: 'Reply sent to user and saved.' }) };
  } else {
    // If broadcast failed, let the admin panel know it might not have been delivered in real-time.
    // The message might still be saved to DB for history.
    return { statusCode: 500, body: JSON.stringify({ message: 'Failed to send reply to user in real-time, but it might be saved to history.' }) };
  }
};

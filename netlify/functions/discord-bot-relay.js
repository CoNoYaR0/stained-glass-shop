const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY_PUBLIC;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is not configured. Ensure SUPABASE_URL and SUPABASE_ANON_KEY_PUBLIC environment variables are set.');
}

let supabase;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

exports.handler = async (event) => {
  if (!supabase) {
    // This check is important. If Supabase isn't initialized, we can't proceed.
    console.error('Supabase client is not initialized. This usually means SUPABASE_URL or SUPABASE_ANON_KEY_PUBLIC are missing or invalid at the time of function deployment/initialization.');
    return { statusCode: 500, body: JSON.stringify({ message: 'Supabase client not initialized. Check server logs.' }) };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (error) {
    console.error('Error parsing request body:', error);
    return { statusCode: 400, body: JSON.stringify({ message: 'Bad Request: Invalid JSON.' }) };
  }

  const { userId, message, senderName } = body;

  if (!userId || !message) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Bad Request: Missing userId or message.' }) };
  }

  const channelName = `chat-${userId}`;

  try {
    // Ensure Supabase client is available before attempting to use it.
    // This is a redundant check if the top-level check passed, but good for safety.
    if (!supabase) {
        throw new Error("Supabase client became unavailable unexpectedly.");
    }

    const { error } = await supabase.channel(channelName).send({
      type: 'broadcast',
      event: 'new_message',
      payload: {
        text: message,
        sender: senderName || 'Staff',
        timestamp: new Date().toISOString(),
      },
    });

    if (error) {
      console.error('Supabase error sending message:', error);
      return { statusCode: 500, body: JSON.stringify({ message: 'Error sending message via Supabase.', error: error.message }) };
    }

    return { statusCode: 200, body: JSON.stringify({ message: 'Message relayed successfully via Supabase.' }) };
  } catch (error) {
    console.error('Unexpected error relaying message:', error);
    // Check if the error is due to Supabase client not being available.
    if (!supabase) {
        console.error("Error likely due to Supabase client not being initialized. Check environment variables and Supabase status.");
    }
    return { statusCode: 500, body: JSON.stringify({ message: 'Unexpected error relaying message.', error: error.message }) };
  }
};

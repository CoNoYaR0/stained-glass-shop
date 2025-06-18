const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
// Ensure these environment variables are set in Netlify
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Use service key for backend operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL or Service Key is not configured for live-chat function.');
  // Depending on desired behavior, you might still allow Discord forwarding
  // or return an error immediately. For now, we'll log and proceed with Discord.
}
let supabase;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}


exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    console.error('Error parsing request body:', e);
    return { statusCode: 400, body: JSON.stringify({ message: 'Bad Request: Invalid JSON.'}) };
  }

  const { message, userId } = body;
  const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;

  // Validate essential data for Discord forwarding
  if (!discordWebhookUrl) {
    console.error('Discord webhook URL is not configured for live-chat function.');
    // Not returning error here to still attempt DB write if Supabase is configured
  }
  if (!message) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Bad Request: Missing message.' }) };
  }
  if (!userId) {
    // userId is crucial for both Discord message context and DB storage
    return { statusCode: 400, body: JSON.stringify({ message: 'Bad Request: Missing userId.' }) };
  }

  // 1. Attempt to send message to Discord
  let discordForwarded = false;
  if (discordWebhookUrl) {
    const discordPayload = {
      content: `Live Chat (User ID: ${userId}): ${message}`,
      // Consider more structured embeds if preferred
    };

    try {
      const discordResponse = await fetch(discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordPayload),
      });

      if (!discordResponse.ok) {
        const errorBody = await discordResponse.text();
        console.error(`Error sending to Discord: ${discordResponse.status} ${discordResponse.statusText}`, errorBody);
        // Continue to DB write even if Discord fails
      } else {
        discordForwarded = true;
        console.log('Message successfully forwarded to Discord.');
      }
    } catch (error) {
      console.error('Exception sending to Discord:', error);
      // Continue to DB write
    }
  } else {
    console.warn('Discord webhook URL not set. Skipping Discord forward.');
  }

  // 2. Attempt to write message to Supabase
  let dbWriteSuccess = false;
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('live_chat_messages')
        .insert([
          {
            user_id: userId,
            message_content: message,
            sender_type: 'user', // Message from user
            // staff_name will be null for user messages
            // timestamp will be set by default by the DB
          },
        ])
        .select(); // Optionally select to confirm/log

      if (error) {
        console.error('Supabase error inserting message:', error);
        // Do not return error to client if Discord part succeeded,
        // but log it for backend troubleshooting.
      } else {
        dbWriteSuccess = true;
        console.log('Message successfully written to Supabase:', data);

        // 3. Broadcast message to Supabase Realtime channel for the user
        const clientChannelName = `chat-${userId}`;
        const broadcastPayload = {
            type: 'broadcast',
            event: 'new_message', // Match client and admin listeners
            payload: {
                text: message, // The user's message content
                sender: userId, // Client/admin can format this
                user_id: userId, // Explicitly include userId
                sender_type: 'user', // Indicate it's a user message
                created_at: new Date().toISOString() // Add timestamp for the broadcast
            }
        };
        try {
            const { error: broadcastError } = await supabase.channel(clientChannelName).send(broadcastPayload);
            if (broadcastError) {
                console.error(`Error broadcasting user message to channel ${clientChannelName}:`, broadcastError);
                // Non-critical, don't fail the function if DB write and Discord hook succeeded.
            } else {
                console.log(`User message broadcasted to channel ${clientChannelName}`);
            }
        } catch (e) {
            console.error(`Exception broadcasting user message to channel ${clientChannelName}:`, e);
        }
      }
    } catch (dbError) {
      console.error('Exception writing to Supabase:', dbError);
    }
  } else {
    console.warn('Supabase client not initialized. Skipping database write for live-chat message.');
  }

  // Determine overall status
  if (discordForwarded || dbWriteSuccess) {
    // If at least one operation succeeded (or was not configured but others were)
    return { statusCode: 200, body: JSON.stringify({ message: 'Message processed.' }) };
  } else {
    // If both Discord (if configured) and Supabase (if configured) failed
    return { statusCode: 500, body: JSON.stringify({ message: 'Failed to process message fully.' }) };
  }
};

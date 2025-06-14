const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL or Service Key is not configured for get-chat-history.');
}
let supabase;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

exports.handler = async (event, context) => {
  if (!supabase) {
    return { statusCode: 500, body: JSON.stringify({ message: 'Supabase client not initialized.' }) };
  }

  // Security: Ensure this function is only callable by authenticated Netlify Identity users (admins)
  // The `context.clientContext.user` object contains information about the calling user.
  // If this is null or lacks an admin role, deny access.
  // You'll need to configure Netlify Identity and role-based function access.
  // For now, we'll check if there's a user context. A more robust check would involve roles.
  if (!context.clientContext || !context.clientContext.user) {
    console.warn('get-chat-history: Unauthenticated access attempt.');
    return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized: Admin access required.' }) };
  }
  // You might want to log context.clientContext.user to see its structure
  // console.log('Client context user:', context.clientContext.user);


  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  const userId = event.queryStringParameters.userId;

  if (!userId) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Bad Request: Missing userId query parameter.' }) };
  }

  try {
    const { data, error } = await supabase
      .from('live_chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: true }); // Get messages in chronological order

    if (error) {
      console.error('Supabase error fetching chat history:', error);
      return { statusCode: 500, body: JSON.stringify({ message: 'Error fetching chat history.', error: error.message }) };
    }

    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (error) {
    console.error('Unexpected error fetching chat history:', error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Unexpected error fetching chat history.', error: error.message }) };
  }
};

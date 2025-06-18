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
    console.error('get-chat-history: Supabase client not initialized at function start.');
    return { statusCode: 500, body: JSON.stringify({ message: 'Supabase client not initialized.' }) };
  }

  console.log('get-chat-history: Function invoked.');
  console.log('get-chat-history: Event query string params:', JSON.stringify(event.queryStringParameters, null, 2));

  // Extract Authorization header
  const authHeader = event.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('get-chat-history: Missing or invalid Authorization header.');
    return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized: Missing or invalid Authorization header.' }) };
  }

  const token = authHeader.substring('Bearer '.length);

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.warn('get-chat-history: Authentication failed.', authError);
      return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized: Invalid token.' }) };
    }

    // At this point, user is authenticated.
    // You might want to add role checks here if needed, based on your application's requirements.
    // For example, if you have user roles stored in Supabase and need to check them:
    // const { data: userRoles, error: rolesError } = await supabase
    //   .from('user_roles') // Assuming you have a table named 'user_roles'
    //   .select('role')
    //   .eq('user_id', user.id);
    // if (rolesError || !userRoles.some(roleEntry => roleEntry.role === 'admin')) {
    //   console.warn(`get-chat-history: Forbidden. User ${user.email} does not have 'admin' role.`);
    //   return { statusCode: 403, body: JSON.stringify({ message: 'Forbidden: Admin role required.' }) };
    // }


    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
    }

    const userId = event.queryStringParameters.userId;

    if (!userId) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Bad Request: Missing userId query parameter.' }) };
    }

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
    // Catching potential errors from supabase.auth.getUser or other unexpected issues
    console.error('Unexpected error in handler:', error);
    if (error.message.toLowerCase().includes('failed to fetch')) {
        // Specific handling for network-related errors if necessary
        return { statusCode: 503, body: JSON.stringify({ message: 'Service Unavailable: Could not connect to authentication service.'}) };
    }
    return { statusCode: 500, body: JSON.stringify({ message: 'Unexpected error processing request.', error: error.message }) };
  }
};

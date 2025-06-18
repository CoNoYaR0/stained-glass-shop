const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
      headers: { 'Allow': 'GET' },
    };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Using service key to read messages

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase URL or Service Key is missing for get-my-chat-history.');
    return { statusCode: 500, body: JSON.stringify({ message: 'Server configuration error.' }) };
  }
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Authenticate user with token from Authorization header
  const authHeader = event.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized: Missing or malformed token.' }) };
  }
  const token = authHeader.split(' ')[1];

  let user;
  try {
    // We need to use the anon key here if we want to validate the user's JWT
    // and not just trust any JWT.
    // However, the admin client (using service key) can also validate a JWT.
    // For simplicity in this step, using the service key's Supabase client to get user.
    // A more secure approach for user-facing functions might involve a separate Supabase client
    // initialized with the anon key to call supabase.auth.getUser(token),
    // then using the service key client for DB operations once user is verified.
    // For now, this is okay as we are fetching data scoped to the user_id from the token.

    const { data: { user: jwtUser }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !jwtUser) {
      console.error('Error fetching user from token or user not found:', userError?.message);
      return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized: Invalid token or user not found.' }) };
    }
    user = jwtUser;
  } catch (e) {
    console.error('Exception during user authentication:', e);
    return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized: Authentication error.' }) };
  }

  if (!user || !user.id) {
    return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized: User ID could not be determined from token.' }) };
  }

  try {
    const { data, error } = await supabase
      .from('live_chat_messages')
      .select('*')
      .eq('user_id', user.id) // Fetch messages for the authenticated user
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Supabase error fetching chat history for user:', user.id, error);
      return { statusCode: 500, body: JSON.stringify({ message: 'Error fetching chat history.' }) };
    }
    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (dbError) {
    console.error('Unexpected error fetching chat history for user:', user.id, dbError);
    return { statusCode: 500, body: JSON.stringify({ message: 'Unexpected error.' }) };
  }
};

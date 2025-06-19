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
  // For reading messages, we can use the service_key, or if we want to enforce RLS
  // based on the user fetching their own messages, we'd use anon_key and user's JWT.
  // Since this is for the user to get their own messages for a specific conversation/category they initiated,
  // and they are passing their JWT, we'll use the JWT to confirm their identity.
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Service key for now to read all necessary messages.

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase URL or Service Key is missing for get-support-messages.');
    return { statusCode: 500, body: JSON.stringify({ message: 'Server configuration error.' }) };
  }
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Authenticate user
  const authHeader = event.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized: Missing or malformed token.' }) };
  }
  const token = authHeader.split(' ')[1];

  let callingUser;
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error('Error fetching user from token for get-support-messages:', userError?.message);
      return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized: Invalid token.' }) };
    }
    callingUser = user;
  } catch (e) {
    console.error('Exception during user authentication for get-support-messages:', e);
    return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized: Authentication error.' }) };
  }

  const { userId, category, conversationId } = event.queryStringParameters;

  // Security Check: Ensure the authenticated user (from JWT) matches the requested userId
  if (!userId || !category || !conversationId) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Bad Request: Missing userId, category, or conversationId query parameters.' }) };
  }

  if (callingUser.id !== userId) {
    console.warn(`Forbidden: Authenticated user ${callingUser.id} tried to fetch messages for user ${userId}.`);
    return { statusCode: 403, body: JSON.stringify({ message: 'Forbidden: You can only fetch your own messages.' }) };
  }

  try {
    // Fetch messages matching all three criteria
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(`Supabase error fetching messages for u:${userId},cat:${category},cid:${conversationId}`, error);
      return { statusCode: 500, body: JSON.stringify({ message: 'Error fetching messages.' }) };
    }
    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (dbError) {
    console.error(`Unexpected error fetching messages for u:${userId},cat:${category},cid:${conversationId}`, dbError);
    return { statusCode: 500, body: JSON.stringify({ message: 'Unexpected error.' }) };
  }
};

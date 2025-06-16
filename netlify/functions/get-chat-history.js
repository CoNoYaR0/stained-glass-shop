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
    // This check should ideally use the supabase client defined in the outer scope
    // For robustness, ensure `supabase` is accessible or passed if initialized outside.
    // Assuming `supabase` is correctly initialized in the outer scope of this file.
    console.error('get-chat-history: Supabase client not initialized at function start.');
    return { statusCode: 500, body: JSON.stringify({ message: 'Supabase client not initialized.' }) };
  }

  console.log('get-chat-history: Function invoked.');
  console.log('get-chat-history: Event query string params:', JSON.stringify(event.queryStringParameters, null, 2));

  // Detailed logging of clientContext
  if (context.clientContext) {
    console.log('get-chat-history: Client context object:', JSON.stringify(context.clientContext, null, 2));
    if (context.clientContext.user) {
      console.log('get-chat-history: User object from clientContext:', JSON.stringify(context.clientContext.user, null, 2));
      console.log('get-chat-history: User email:', context.clientContext.user.email);
      console.log('get-chat-history: User app_metadata:', JSON.stringify(context.clientContext.user.app_metadata, null, 2));
      console.log('get-chat-history: User roles from app_metadata:', JSON.stringify(context.clientContext.user.app_metadata && context.clientContext.user.app_metadata.roles, null, 2));
    } else {
      console.warn('get-chat-history: context.clientContext.user is null or undefined.');
    }
  } else {
    console.warn('get-chat-history: context.clientContext is null or undefined.');
  }

  const user = context.clientContext && context.clientContext.user;

  if (!user) {
    console.warn('get-chat-history: No user in clientContext. Responding 401 Unauthorized.');
    return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized: Login required.' }) };
  }

  const roles = user.app_metadata && user.app_metadata.roles;
  // Ensure 'admin' matches the role name you use in Netlify Identity
  if (!roles || !roles.includes('admin')) {
    console.warn(`get-chat-history: Forbidden. User ${user.email} does not have 'admin' role. Detected roles: ${JSON.stringify(roles)}`);
    return { statusCode: 403, body: JSON.stringify({ message: 'Forbidden: Admin role required for this operation.' }) };
  }

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

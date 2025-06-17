exports.handler = async (event, context) => {
  console.log('[test-auth] Function invoked.');

  if (context.clientContext) {
    console.log('[test-auth] Client context object:', JSON.stringify(context.clientContext, null, 2));
    if (context.clientContext.user) {
      console.log('[test-auth] User object from clientContext:', JSON.stringify(context.clientContext.user, null, 2));
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Authenticated!",
          email: context.clientContext.user.email,
          roles: context.clientContext.user.app_metadata && context.clientContext.user.app_metadata.roles,
          user_metadata: context.clientContext.user.user_metadata,
          full_client_context_user: context.clientContext.user // Send the whole user object
        }),
      };
    } else {
      console.warn('[test-auth] context.clientContext.user is null or undefined.');
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "Not authenticated: context.clientContext.user is null." }),
      };
    }
  } else {
    console.warn('[test-auth] context.clientContext is null or undefined.');
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Not authenticated: context.clientContext is null." }),
    };
  }
};

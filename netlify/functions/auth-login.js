// Database functions will be set up on Netlify

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { authCode } = JSON.parse(event.body);
    
    if (!authCode) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Auth code is required' })
      };
    }

    // TODO: Database integration will be set up after deployment
    // For now, accept any 8-digit code for testing
    console.log(`Login attempt with auth code: ${authCode}`);
    
    if (authCode.length !== 8) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid auth code format' })
      };
    }
    
    // Mock user data for testing
    const user = {
      email: 'test@example.com',
      tokens: 1000
    };

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        user: {
          email: user.email,
          tokens: user.tokens
        }
      })
    };

  } catch (error) {
    console.error('Auth login error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
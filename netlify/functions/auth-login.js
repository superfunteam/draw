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
    
    // Mock user data for testing - simulate different token amounts based on auth code
    // In real implementation, this would look up the user by auth code and return their actual tokens
    let tokens = 200000; // Default micro plan
    
    // Simulate different plans for testing (based on auth code pattern)
    if (authCode.startsWith('1')) {
      tokens = 200000; // Micro
    } else if (authCode.startsWith('2')) {
      tokens = 500000; // Tinker  
    } else if (authCode.startsWith('3')) {
      tokens = 1000000; // Pro
    }
    
    const user = {
      email: 'test@example.com',
      tokens: tokens
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
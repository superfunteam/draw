// Database functions will be set up on Netlify

// Simple in-memory store for auth codes and their associated token amounts
// In production, this would be in a database
global.authCodeStore = global.authCodeStore || {};

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
    
    // Check if auth code exists in our store (simulates database lookup)
    const storedData = global.authCodeStore[authCode];
    
    let user;
    if (storedData) {
      // Use actual purchased data
      user = {
        email: storedData.email,
        tokens: storedData.tokens
      };
      console.log(`Found stored data for auth code: ${authCode}, tokens: ${storedData.tokens}`);
      
      // Remove used auth code (one-time use)
      delete global.authCodeStore[authCode];
    } else {
      // Fallback for testing - simulate different token amounts based on auth code pattern
      let tokens = 200000; // Default micro plan
      
      if (authCode.startsWith('1')) {
        tokens = 200000; // Micro
      } else if (authCode.startsWith('2')) {
        tokens = 500000; // Tinker  
      } else if (authCode.startsWith('3')) {
        tokens = 1000000; // Pro
      }
      
      user = {
        email: 'test@example.com',
        tokens: tokens
      };
      console.log(`Using fallback data for auth code: ${authCode}, tokens: ${tokens}`);
    }

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
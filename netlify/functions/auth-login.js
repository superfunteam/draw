// Database functions will be set up on Netlify

// Simple in-memory store for auth codes and users (shared with other functions)
// In production, this would be in a database
global.authCodeStore = global.authCodeStore || {};
global.userStore = global.userStore || {};

// Helper function to decode token data from auth code (shared with other functions)
function decodeAuthCode(authCode) {
  if (authCode.length !== 8) return null;
  try {
    // Last 4 chars contain the scaled token amount in base36
    const tokenPart = authCode.substring(4);
    const scaledTokens = parseInt(tokenPart, 36);
    // Scale back up (multiply by 1000)
    const tokens = scaledTokens * 1000;
    return tokens > 0 ? tokens : null;
  } catch (e) {
    return null;
  }
}

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
    
    // Try to decode token data from auth code (new method)
    const decodedTokens = decodeAuthCode(authCode);
    console.log('DEBUG: Auth-login - Decoded tokens from auth code:', decodedTokens);
    
    let user;
    if (decodedTokens) {
      // Use decoded token data from auth code
      user = {
        email: 'user@example.com', // Default email for decoded codes
        tokens: decodedTokens
      };
      console.log(`Using decoded token data from auth code: ${authCode}, tokens: ${decodedTokens}`);
    } else {
      // Fallback: Check if auth code exists in our store (legacy method)
      console.log('DEBUG: Auth-login - Current authCodeStore contents:', JSON.stringify(global.authCodeStore, null, 2));
      console.log('DEBUG: Auth-login - Looking for auth code:', authCode);
      
      const storedData = global.authCodeStore[authCode];
      console.log('DEBUG: Auth-login - Found stored data:', storedData);
      
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
        // Final fallback for testing - simulate different token amounts based on auth code pattern
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
        console.log(`Using final fallback data for auth code: ${authCode}, tokens: ${tokens}`);
      }
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
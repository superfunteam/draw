// Netlify database integration using Neon
const { neon } = require('@neondatabase/serverless');

// Database helper functions using real Netlify DB
async function getDbClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable not set');
    return null;
  }
  return neon(databaseUrl);
}

async function findUserByAuthCode(authCode) {
  try {
    const sql = await getDbClient();
    if (!sql) {
      console.error('Database client not available');
      return null;
    }
    
    const users = await sql('SELECT * FROM users WHERE auth_code = $1 AND auth_code_used = FALSE', [authCode]);
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error('Database query error:', error);
    return null;
  }
}

async function markAuthCodeUsed(authCode) {
  try {
    const sql = await getDbClient();
    if (!sql) {
      console.error('Database client not available');
      return false;
    }
    
    await sql('UPDATE users SET auth_code_used = TRUE WHERE auth_code = $1', [authCode]);
    return true;
  } catch (error) {
    console.error('Database update error:', error);
    return false;
  }
}

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
    
    // First try to find user by auth code in database
    console.log('DEBUG: Auth-login - Looking up auth code in database:', authCode);
    const dbUser = await findUserByAuthCode(authCode);
    console.log('DEBUG: Auth-login - Found user in database:', dbUser);
    
    let user;
    if (dbUser) {
      // Use database user data
      user = {
        email: dbUser.email,
        tokens: dbUser.tokens
      };
      console.log(`Found user in database for auth code: ${authCode}, email: ${dbUser.email}, tokens: ${dbUser.tokens}`);
      
      // Mark auth code as used (one-time use)
      await markAuthCodeUsed(authCode);
    } else {
      // Fallback: Try to decode token data from auth code (encoded method)
      const decodedTokens = decodeAuthCode(authCode);
      console.log('DEBUG: Auth-login - Decoded tokens from auth code:', decodedTokens);
      
      if (decodedTokens) {
        // Use decoded token data from auth code
        user = {
          email: 'user@example.com', // Default email for decoded codes
          tokens: decodedTokens
        };
        console.log(`Using decoded token data from auth code: ${authCode}, tokens: ${decodedTokens}`);
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
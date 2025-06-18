// Netlify database integration using Neon
const { neon } = require('@neondatabase/serverless');

// Database helper functions using real Netlify DB
async function getDbClient() {
  const databaseUrl = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('NETLIFY_DATABASE_URL environment variable not set');
    return null;
  }
  return neon(databaseUrl);
}

async function findUserByEmail(email) {
  try {
    const sql = await getDbClient();
    if (!sql) {
      console.error('Database client not available');
      return null;
    }
    
    const users = await sql('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error('Database query error:', error);
    return null;
  }
}

async function updateUserTokens(email, newTokenBalance) {
  try {
    const sql = await getDbClient();
    if (!sql) {
      console.error('Database client not available');
      return false;
    }
    
    await sql('UPDATE users SET tokens = $1, updated_at = NOW() WHERE email = $2', [newTokenBalance, email.toLowerCase()]);
    return true;
  } catch (error) {
    console.error('Database update error:', error);
    return false;
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
    const { email, tokensUsed } = JSON.parse(event.body);
    
    if (!email || !tokensUsed || tokensUsed <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email and valid token amount are required' })
      };
    }

    console.log(`DEBUG: Deduct tokens - Looking up user: ${email}, tokens to deduct: ${tokensUsed}`);
    
    // Find user in database to get their current balance
    const user = await findUserByEmail(email);
    if (!user) {
      console.log(`DEBUG: Deduct tokens - User not found: ${email}`);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' })
      };
    }
    
    const currentTokens = user.tokens;
    console.log(`DEBUG: Deduct tokens - Current balance for ${email}: ${currentTokens}`);
    
    // Check if user has enough tokens
    if (currentTokens < tokensUsed) {
      console.log(`DEBUG: Deduct tokens - Insufficient tokens: ${currentTokens} < ${tokensUsed}`);
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Insufficient tokens',
          currentBalance: currentTokens,
          tokensNeeded: tokensUsed
        })
      };
    }
    
    // Calculate new balance
    const newBalance = currentTokens - tokensUsed;
    console.log(`DEBUG: Deduct tokens - New balance will be: ${newBalance}`);
    
    // Update user's token balance in database
    const updateSuccess = await updateUserTokens(email, newBalance);
    if (!updateSuccess) {
      console.error('Failed to update user tokens in database');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to update token balance' })
      };
    }
    
    console.log(`Deducted ${tokensUsed} tokens from ${email}. Balance: ${currentTokens} -> ${newBalance}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        tokensUsed,
        previousBalance: currentTokens,
        newBalance
      })
    };

  } catch (error) {
    console.error('Deduct tokens error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
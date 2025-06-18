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

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { email } = JSON.parse(event.body);
    
    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email is required' })
      };
    }

    console.log(`DEBUG: Get user tokens - Looking up email: ${email}`);
    
    // Find user in database
    const user = await findUserByEmail(email);
    if (!user) {
      console.log(`DEBUG: Get user tokens - User not found: ${email}`);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' })
      };
    }
    
    console.log(`DEBUG: Get user tokens - Found user: ${email}, tokens: ${user.tokens}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        email: user.email,
        tokens: user.tokens,
        updated_at: user.updated_at
      })
    };

  } catch (error) {
    console.error('Get user tokens error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
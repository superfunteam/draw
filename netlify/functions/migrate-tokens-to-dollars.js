// Netlify database integration using Neon
const { neon } = require('@neondatabase/serverless');

// Database helper functions
async function getDbClient() {
  const databaseUrl = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('NETLIFY_DATABASE_URL environment variable not set');
    return null;
  }
  return neon(databaseUrl);
}

exports.handler = async function(event, context) {
  // Only allow POST method
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const sql = await getDbClient();
    if (!sql) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Database client not available' })
      };
    }

    console.log('Starting token to dollar migration...');
    
    // Get all users with tokens > 0
    const usersWithTokens = await sql('SELECT email, tokens FROM users WHERE tokens > 0');
    
    console.log(`Found ${usersWithTokens.length} users with tokens to convert`);
    
    let convertedCount = 0;
    let totalTokensConverted = 0;
    let totalCentsAfterConversion = 0;
    const conversions = [];

    // Convert each user's balance
    // Tinker rate: 150,000 tokens = $10.00 (1000 cents)
    // Formula: cents = Math.round(tokens * 1000 / 150000)
    for (const user of usersWithTokens) {
      const oldTokens = user.tokens;
      const newCents = Math.round(oldTokens * 1000 / 150000);
      
      console.log(`Converting ${user.email}: ${oldTokens} tokens -> ${newCents} cents ($${(newCents / 100).toFixed(2)})`);
      
      // Update the user's balance
      await sql('UPDATE users SET tokens = $1, updated_at = NOW() WHERE email = $2', [newCents, user.email]);
      
      convertedCount++;
      totalTokensConverted += oldTokens;
      totalCentsAfterConversion += newCents;
      
      conversions.push({
        email: user.email,
        oldTokens,
        newCents,
        newDollars: (newCents / 100).toFixed(2)
      });
    }

    const summary = {
      success: true,
      usersConverted: convertedCount,
      totalTokensConverted,
      totalCentsAfterConversion,
      totalDollarsAfterConversion: (totalCentsAfterConversion / 100).toFixed(2),
      conversions
    };

    console.log('Migration complete:', summary);

    return {
      statusCode: 200,
      body: JSON.stringify(summary)
    };

  } catch (error) {
    console.error('Migration error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Migration failed',
        details: error.message 
      })
    };
  }
};


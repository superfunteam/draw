// Database functions will be set up on Netlify

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

    // TODO: Database integration will be set up after deployment
    // For now, just simulate token deduction
    console.log(`Would deduct ${tokensUsed} tokens from ${email}`);
    
    // Mock current balance
    const currentTokens = 1000;
    const newBalance = Math.max(0, currentTokens - tokensUsed);

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
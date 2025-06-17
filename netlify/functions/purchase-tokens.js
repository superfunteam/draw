// Netlify database functions are available in the runtime

// Helper function to generate 8-digit random string
function generateAuthCode() {
  return Math.random().toString(36).substring(2, 10).padEnd(8, '0').substring(0, 8);
}

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { email, plan } = JSON.parse(event.body);
    
    if (!email || !plan) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email and plan are required' })
      };
    }

    // Map pricing plans to token amounts
    const tokenAmounts = {
      'micro': 500,
      'tinker': 1500,
      'pro': 10000
    };

    const tokens = tokenAmounts[plan];
    if (!tokens) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid plan selected' })
      };
    }

    // Generate auth code
    const authCode = generateAuthCode();
    
    // TODO: Database integration will be set up after deployment
    // For now, just generate auth code and send email
    console.log(`Generated auth code ${authCode} for ${email} with ${tokens} tokens`);

    // Send email (we'll call another function for this)
    const emailResult = await fetch(`${process.env.URL}/.netlify/functions/send-auth-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        tokens,
        authCode,
        plan
      })
    });

    if (!emailResult.ok) {
      console.error('Email sending failed:', await emailResult.text());
      // Don't fail the whole operation if email fails
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Check your email for login instructions!',
        tokens,
        email
      })
    };

  } catch (error) {
    console.error('Purchase tokens error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
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

    // Send email directly (not via another function)
    console.log('Attempting to send email to:', email);
    
    try {
      // Check if Mailjet credentials are available
      if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY) {
        console.error('Mailjet credentials missing');
        throw new Error('Email service not configured');
      }

      const mailjet = require('node-mailjet').apiConnect(
        process.env.MAILJET_API_KEY,
        process.env.MAILJET_SECRET_KEY
      );

      const siteUrl = process.env.URL || 'https://draw.superfun.games';
      const loginUrl = `${siteUrl}/?auth=${authCode}`;

      const emailContent = `
Hi there!

Thanks for getting tokens for Superfun Draw! Here are your details:

🎨 Token Plan: ${plan.charAt(0).toUpperCase() + plan.slice(1)}
🪙 Tokens: ${tokens}
🔑 One-time login code: ${authCode}

Click here to log in and start creating:
${loginUrl}

Or visit the site and use your 8-digit code: ${authCode}

Happy drawing!
- The Superfun Draw Team

P.S. This code can only be used once. You'll get a new one if you purchase more tokens.
      `.trim();

      console.log('Sending email via Mailjet...');
      console.log('Login URL:', loginUrl);
      
      // Send email via Mailjet
      const result = await mailjet
        .post("send", { 'version': 'v3.1' })
        .request({
          Messages: [
            {
              From: {
                Email: "clark@superfun.team",
                Name: "Superfun Draw"
              },
              To: [
                {
                  Email: email
                }
              ],
              Subject: `Your Superfun Draw tokens are ready! (${tokens} tokens)`,
              TextPart: emailContent
            }
          ]
        });

      console.log('Mailjet response status:', result.response?.status);
      console.log('Mailjet response body:', JSON.stringify(result.body));
      console.log('Email sent successfully');

    } catch (emailError) {
      console.error('Email sending failed:', emailError.message);
      console.error('Full email error:', emailError);
      // Don't fail the whole operation if email fails, but log it
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
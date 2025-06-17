const mailjet = require('node-mailjet').apiConnect(
  process.env.MAILJET_API_KEY,
  process.env.MAILJET_SECRET_KEY
);

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('Email function called with body:', event.body);
    
    const { email, tokens, authCode, plan } = JSON.parse(event.body);
    
    console.log('Parsed email data:', { email, tokens, authCode, plan });
    
    if (!email || !tokens || !authCode) {
      console.error('Missing required parameters:', { email: !!email, tokens: !!tokens, authCode: !!authCode });
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required parameters' })
      };
    }

    // Check if Mailjet credentials are available
    if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY) {
      console.error('Mailjet credentials missing:', {
        hasApiKey: !!process.env.MAILJET_API_KEY,
        hasSecretKey: !!process.env.MAILJET_SECRET_KEY
      });
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Email service not configured' })
      };
    }

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
              Email: "clark@superfun.games",
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

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        messageId: result.body.Messages[0].To[0].MessageID
      })
    };

  } catch (error) {
    console.error('Send email error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to send email',
        details: error.message 
      })
    };
  }
};
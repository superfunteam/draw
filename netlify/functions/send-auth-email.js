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
    const { email, tokens, authCode, plan } = JSON.parse(event.body);
    
    if (!email || !tokens || !authCode) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required parameters' })
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

    // Send email via Mailjet
    const result = await mailjet
      .post("send", { 'version': 'v3.1' })
      .request({
        Messages: [
          {
            From: {
              Email: "noreply@superfun.games",
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
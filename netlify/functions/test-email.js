const Mailjet = require('node-mailjet');

exports.handler = async (event) => {
    console.log('Test email function called');
    
    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }
    
    try {
        const { email } = JSON.parse(event.body);
        
        if (!email) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Email required' }) };
        }
        
        // Check credentials
        if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY) {
            console.error('Mailjet credentials missing');
            return { 
                statusCode: 500, 
                body: JSON.stringify({ 
                    error: 'Email service not configured',
                    hasApiKey: !!process.env.MAILJET_API_KEY,
                    hasSecretKey: !!process.env.MAILJET_SECRET_KEY
                }) 
            };
        }
        
        console.log('Initializing Mailjet...');
        const mailjet = Mailjet.apiConnect(
            process.env.MAILJET_API_KEY,
            process.env.MAILJET_SECRET_KEY
        );
        
        console.log('Sending test email to:', email);
        
        const emailRequest = mailjet.post('send', { version: 'v3.1' }).request({
            Messages: [
                {
                    From: {
                        Email: 'clark@superfun.team',
                        Name: 'Superfun Draw Test'
                    },
                    To: [
                        {
                            Email: email,
                            Name: 'Test User'
                        }
                    ],
                    Subject: '🧪 Superfun Draw - Email Test',
                    TextPart: `This is a test email from Superfun Draw.

If you received this, email sending is working correctly!

Test performed at: ${new Date().toISOString()}

- The Superfun Team`,
                    HTMLPart: `<h3>Test Email from Superfun Draw</h3>
<p>If you received this, email sending is working correctly!</p>
<p>Test performed at: ${new Date().toISOString()}</p>
<p>- The Superfun Team</p>`
                }
            ]
        });
        
        const result = await emailRequest;
        console.log('Email sent successfully:', result.response?.status);
        console.log('Response body:', JSON.stringify(result.body));
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: 'Test email sent',
                status: result.response?.status,
                messageId: result.body?.Messages?.[0]?.To?.[0]?.MessageID
            })
        };
        
    } catch (error) {
        console.error('Email test error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to send test email',
                details: error.message,
                statusCode: error.statusCode,
                response: error.response?.text
            })
        };
    }
};
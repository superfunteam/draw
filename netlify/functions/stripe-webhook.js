const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { neon } = require('@neondatabase/serverless');
const Mailjet = require('node-mailjet');

// Initialize Mailjet
const mailjet = Mailjet.apiConnect(
    process.env.MAILJET_API_KEY,
    process.env.MAILJET_SECRET_KEY
);

exports.handler = async (event) => {
    console.log('Webhook called, method:', event.httpMethod);
    console.log('Headers:', JSON.stringify(event.headers));
    
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    // Verify webhook signature if we have the secret
    let stripeEvent;
    
    try {
        if (process.env.STRIPE_WEBHOOK_SECRET) {
            console.log('Webhook secret exists, attempting signature verification');
            const sig = event.headers['stripe-signature'];
            console.log('Stripe signature header:', sig ? 'present' : 'missing');
            
            // For Netlify Functions, we need to handle the raw body
            const rawBody = event.isBase64Encoded 
                ? Buffer.from(event.body, 'base64').toString('utf8')
                : event.body;
            
            console.log('Body encoding:', event.isBase64Encoded ? 'base64' : 'raw');
            console.log('Body length:', rawBody.length);
            
            stripeEvent = stripe.webhooks.constructEvent(
                rawBody,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );
            console.log('Webhook signature verified successfully');
        } else {
            console.log('No webhook secret, parsing body directly');
            stripeEvent = JSON.parse(event.body);
        }
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        console.error('Full error:', err);
        return { statusCode: 400, body: JSON.stringify({ error: 'Webhook verification failed', details: err.message }) };
    }

    console.log('Event type:', stripeEvent.type);
    console.log('Event ID:', stripeEvent.id);
    
    // Handle the event
    if (stripeEvent.type === 'checkout.session.completed') {
        const session = stripeEvent.data.object;
        console.log('Session ID:', session.id);
        console.log('Session metadata:', JSON.stringify(session.metadata));
        
        try {
            // Extract metadata
            const { email, plan, cents } = session.metadata;
            const centsToAdd = parseInt(cents);
            
            console.log(`Processing payment for ${email}, plan: ${plan}, cents: ${centsToAdd} ($${(centsToAdd/100).toFixed(2)})`);
            
            // Connect to database
            const sql = neon(process.env.DATABASE_URL);
            
            // Check if user exists (email is the primary key)
            const existingUser = await sql`
                SELECT email, tokens FROM users WHERE email = ${email}
            `;
            
            let newTotalCents, isNewUser;
            
            if (existingUser.length > 0) {
                // Existing user - add cents
                const currentCents = existingUser[0].tokens || 0;  // Column still named 'tokens' but stores cents
                newTotalCents = currentCents + centsToAdd;
                
                await sql`
                    UPDATE users 
                    SET tokens = ${newTotalCents}, updated_at = CURRENT_TIMESTAMP
                    WHERE email = ${email}
                `;
                
                isNewUser = false;
                console.log(`Updated existing user ${email}: $${(currentCents/100).toFixed(2)} + $${(centsToAdd/100).toFixed(2)} = $${(newTotalCents/100).toFixed(2)}`);
            } else {
                // New user - create with cents
                await sql`
                    INSERT INTO users (email, tokens, created_at, updated_at)
                    VALUES (${email}, ${centsToAdd}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                `;
                
                newTotalCents = centsToAdd;
                isNewUser = true;
                console.log(`Created new user ${email} with $${(centsToAdd/100).toFixed(2)}`);
            }
            
            // Send confirmation email
            const emailContent = isNewUser 
                ? `🎉 Welcome to Superfun Draw!

Your payment was successful! Here's what you got:

📦 Package: ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
💵 Credits added: $${(centsToAdd/100).toFixed(2)}
💰 Total credits: $${(newTotalCents/100).toFixed(2)}

You can now start creating amazing drawings at https://app.draw.superfun.games

Happy drawing!
The Superfun Team`
                : `✅ Payment Successful!

Your credit purchase was completed successfully:

📦 Package: ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
💵 Credits added: $${(centsToAdd/100).toFixed(2)}
💰 New balance: $${(newTotalCents/100).toFixed(2)}

Continue creating at https://app.draw.superfun.games

Happy drawing!
The Superfun Team`;

            // Send email with error handling
            try {
                if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY) {
                    console.error('Mailjet credentials not configured');
                } else {
                    const emailRequest = mailjet.post('send', { version: 'v3.1' }).request({
                        Messages: [
                            {
                                From: {
                                    Email: 'clark@superfun.team',
                                    Name: 'Superfun Draw'
                                },
                                To: [
                                    {
                                        Email: email,
                                        Name: email.split('@')[0]
                                    }
                                ],
                                Subject: '🎯 Superfun Draw - Payment Confirmed!',
                                TextPart: emailContent
                            }
                        ]
                    });

                    const emailResult = await emailRequest;
                    console.log(`Confirmation email sent to ${email}`);
                    console.log('Email response:', emailResult.response?.status);
                }
            } catch (emailError) {
                console.error('Failed to send confirmation email:', emailError.message);
                // Don't fail the webhook if email fails
            }
            
            return {
                statusCode: 200,
                body: JSON.stringify({ 
                    success: true,
                    message: 'Payment processed successfully'
                })
            };
            
        } catch (error) {
            console.error('Error processing payment:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ 
                    error: 'Failed to process payment',
                    details: error.message 
                })
            };
        }
    }
    
    // Other webhook events we might want to handle in the future
    return {
        statusCode: 200,
        body: JSON.stringify({ received: true })
    };
};
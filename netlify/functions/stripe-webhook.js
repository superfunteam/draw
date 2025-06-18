const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { neon } = require('@neondatabase/serverless');
const Mailjet = require('node-mailjet');

// Initialize Mailjet
const mailjet = Mailjet.apiConnect(
    process.env.MAILJET_API_KEY,
    process.env.MAILJET_SECRET_KEY
);

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    // Verify webhook signature if we have the secret
    let stripeEvent;
    
    try {
        if (process.env.STRIPE_WEBHOOK_SECRET) {
            const sig = event.headers['stripe-signature'];
            // For Netlify Functions, we need to handle the raw body
            const rawBody = event.isBase64Encoded 
                ? Buffer.from(event.body, 'base64').toString('utf8')
                : event.body;
            
            stripeEvent = stripe.webhooks.constructEvent(
                rawBody,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } else {
            // For development/testing without webhook secret
            stripeEvent = JSON.parse(event.body);
        }
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return { statusCode: 400, body: JSON.stringify({ error: 'Webhook verification failed' }) };
    }

    // Handle the event
    if (stripeEvent.type === 'checkout.session.completed') {
        const session = stripeEvent.data.object;
        
        try {
            // Extract metadata
            const { email, plan, tokens } = session.metadata;
            const tokensToAdd = parseInt(tokens);
            
            console.log(`Processing payment for ${email}, plan: ${plan}, tokens: ${tokensToAdd}`);
            
            // Connect to database
            const sql = neon(process.env.DATABASE_URL);
            
            // Check if user exists
            const existingUser = await sql`
                SELECT id, email, tokens FROM users WHERE email = ${email}
            `;
            
            let userId, newTotalTokens, isNewUser;
            
            if (existingUser.length > 0) {
                // Existing user - add tokens
                userId = existingUser[0].id;
                const currentTokens = existingUser[0].tokens || 0;
                newTotalTokens = currentTokens + tokensToAdd;
                
                await sql`
                    UPDATE users 
                    SET tokens = ${newTotalTokens}
                    WHERE id = ${userId}
                `;
                
                isNewUser = false;
                console.log(`Updated existing user ${email}: ${currentTokens} + ${tokensToAdd} = ${newTotalTokens} tokens`);
            } else {
                // New user - create with tokens
                const result = await sql`
                    INSERT INTO users (email, tokens)
                    VALUES (${email}, ${tokensToAdd})
                    RETURNING id
                `;
                
                userId = result[0].id;
                newTotalTokens = tokensToAdd;
                isNewUser = true;
                console.log(`Created new user ${email} with ${tokensToAdd} tokens`);
            }
            
            // Record the transaction
            await sql`
                INSERT INTO token_transactions (user_id, amount, type, description)
                VALUES (${userId}, ${tokensToAdd}, 'purchase', ${`Stripe payment - ${plan} plan`})
            `;
            
            // Send confirmation email
            const emailContent = isNewUser 
                ? `🎉 Welcome to Superfun Draw!

Your payment was successful! Here's what you got:

📦 Package: ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
🪙 Tokens added: ${tokensToAdd}
💰 Total tokens: ${newTotalTokens}

You can now start creating amazing drawings at https://draw.superfun.games

Happy drawing!
The Superfun Team`
                : `✅ Payment Successful!

Your token purchase was completed successfully:

📦 Package: ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
🪙 Tokens added: ${tokensToAdd}
💰 New balance: ${newTotalTokens} tokens

Continue creating at https://draw.superfun.games

Happy drawing!
The Superfun Team`;

            const emailRequest = mailjet.post('send', { version: 'v3.1' }).request({
                Messages: [
                    {
                        From: {
                            Email: 'hello@superfun.games',
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

            await emailRequest;
            console.log(`Confirmation email sent to ${email}`);
            
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
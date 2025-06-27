const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { neon } = require('@neondatabase/serverless');
const Mailjet = require('node-mailjet');

// Initialize Mailjet
const mailjet = Mailjet.apiConnect(
    process.env.MAILJET_API_KEY,
    process.env.MAILJET_SECRET_KEY
);

// Enhanced logging function
function log(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
    if (data) {
        console.log(JSON.stringify(data, null, 2));
    }
}

exports.handler = async (event) => {
    log('========== WEBHOOK DEBUG START ==========');
    log('Environment variables check:', {
        hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
        hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasMailjetKey: !!process.env.MAILJET_API_KEY,
        hasMailjetSecret: !!process.env.MAILJET_SECRET_KEY
    });
    
    log('Request details:', {
        method: event.httpMethod,
        headers: event.headers,
        isBase64Encoded: event.isBase64Encoded,
        bodyLength: event.body ? event.body.length : 0
    });
    
    if (event.httpMethod !== 'POST') {
        log('ERROR: Invalid HTTP method');
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    // Verify webhook signature if we have the secret
    let stripeEvent;
    
    try {
        if (process.env.STRIPE_WEBHOOK_SECRET) {
            log('Attempting webhook signature verification');
            const sig = event.headers['stripe-signature'];
            log('Signature header present:', !!sig);
            
            // For Netlify Functions, we need to handle the raw body
            const rawBody = event.isBase64Encoded 
                ? Buffer.from(event.body, 'base64').toString('utf8')
                : event.body;
            
            log('Body processing:', {
                encoding: event.isBase64Encoded ? 'base64' : 'raw',
                decodedLength: rawBody.length,
                first100Chars: rawBody.substring(0, 100)
            });
            
            try {
                stripeEvent = stripe.webhooks.constructEvent(
                    rawBody,
                    sig,
                    process.env.STRIPE_WEBHOOK_SECRET
                );
                log('✅ Webhook signature verified successfully');
            } catch (verifyError) {
                log('❌ Webhook verification failed:', {
                    error: verifyError.message,
                    type: verifyError.type,
                    stack: verifyError.stack
                });
                throw verifyError;
            }
        } else {
            log('⚠️  No webhook secret configured - parsing body directly (INSECURE)');
            stripeEvent = JSON.parse(event.body);
        }
    } catch (err) {
        log('FATAL: Webhook processing failed:', err);
        return { 
            statusCode: 400, 
            body: JSON.stringify({ 
                error: 'Webhook verification failed', 
                details: err.message,
                debugInfo: {
                    hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
                    signaturePresent: !!event.headers['stripe-signature']
                }
            }) 
        };
    }

    log('Event received:', {
        type: stripeEvent.type,
        id: stripeEvent.id,
        created: new Date(stripeEvent.created * 1000).toISOString()
    });
    
    // Handle the event
    if (stripeEvent.type === 'checkout.session.completed') {
        const session = stripeEvent.data.object;
        log('Processing checkout.session.completed:', {
            sessionId: session.id,
            paymentStatus: session.payment_status,
            customerEmail: session.customer_email,
            metadata: session.metadata,
            amountTotal: session.amount_total,
            currency: session.currency
        });
        
        try {
            // Extract metadata
            const { email, plan, tokens } = session.metadata || {};
            
            if (!email || !plan || !tokens) {
                log('ERROR: Missing required metadata:', { email, plan, tokens });
                throw new Error('Missing required metadata in session');
            }
            
            const tokensToAdd = parseInt(tokens);
            log('Token processing:', { email, plan, tokensToAdd });
            
            // Test database connection
            if (!process.env.DATABASE_URL) {
                log('ERROR: DATABASE_URL not configured');
                throw new Error('Database not configured');
            }
            
            log('Connecting to database...');
            const sql = neon(process.env.DATABASE_URL);
            
            // Test connection
            try {
                const testResult = await sql`SELECT current_timestamp as time`;
                log('Database connection successful:', testResult[0]);
            } catch (dbTestError) {
                log('ERROR: Database connection test failed:', dbTestError);
                throw new Error(`Database connection failed: ${dbTestError.message}`);
            }
            
            // Check if user exists (email is the primary key)
            log('Checking for existing user...');
            const existingUser = await sql`
                SELECT email, tokens FROM users WHERE email = ${email}
            `;
            log('Existing user query result:', existingUser);
            
            let newTotalTokens, isNewUser;
            
            if (existingUser.length > 0) {
                // Existing user - add tokens
                const currentTokens = existingUser[0].tokens || 0;
                newTotalTokens = currentTokens + tokensToAdd;
                
                log('Updating existing user:', {
                    email,
                    currentTokens,
                    tokensToAdd,
                    newTotalTokens
                });
                
                const updateResult = await sql`
                    UPDATE users 
                    SET tokens = ${newTotalTokens}, updated_at = CURRENT_TIMESTAMP
                    WHERE email = ${email}
                    RETURNING *
                `;
                log('Update result:', updateResult);
                
                isNewUser = false;
            } else {
                // New user - create with tokens
                log('Creating new user:', {
                    email,
                    tokensToAdd
                });
                
                const insertResult = await sql`
                    INSERT INTO users (email, tokens, created_at, updated_at)
                    VALUES (${email}, ${tokensToAdd}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    RETURNING *
                `;
                log('Insert result:', insertResult);
                
                newTotalTokens = tokensToAdd;
                isNewUser = true;
            }
            
            // Verify the update/insert
            const verifyResult = await sql`
                SELECT email, tokens FROM users WHERE email = ${email}
            `;
            log('Verification query result:', verifyResult);
            
            // Send confirmation email
            log('Preparing to send email...');
            const emailContent = isNewUser 
                ? `🎉 Welcome to Superfun Draw!

Your payment was successful! Here's what you got:

📦 Package: ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
🪙 Tokens added: ${tokensToAdd}
💰 Total tokens: ${newTotalTokens}

You can now start creating amazing drawings at https://app.draw.superfun.games

Happy drawing!
The Superfun Team`
                : `✅ Payment Successful!

Your token purchase was completed successfully:

📦 Package: ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
🪙 Tokens added: ${tokensToAdd}
💰 New balance: ${newTotalTokens} tokens

Continue creating at https://app.draw.superfun.games

Happy drawing!
The Superfun Team`;

            if (process.env.MAILJET_API_KEY && process.env.MAILJET_SECRET_KEY) {
                try {
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

                    const emailResult = await emailRequest;
                    log('Email sent successfully:', {
                        status: emailResult.response?.status,
                        messageId: emailResult.body?.Messages?.[0]?.To?.[0]?.MessageID
                    });
                } catch (emailError) {
                    log('WARNING: Email sending failed (non-fatal):', emailError);
                }
            } else {
                log('WARNING: Email service not configured');
            }
            
            log('✅ Payment processed successfully');
            log('========== WEBHOOK DEBUG END ==========');
            
            return {
                statusCode: 200,
                body: JSON.stringify({ 
                    success: true,
                    message: 'Payment processed successfully',
                    debug: {
                        userCreated: isNewUser,
                        tokensAdded: tokensToAdd,
                        newBalance: newTotalTokens
                    }
                })
            };
            
        } catch (error) {
            log('ERROR: Payment processing failed:', {
                message: error.message,
                stack: error.stack,
                type: error.constructor.name
            });
            log('========== WEBHOOK DEBUG END WITH ERROR ==========');
            
            return {
                statusCode: 500,
                body: JSON.stringify({ 
                    error: 'Failed to process payment',
                    details: error.message,
                    debugInfo: {
                        hasDatabase: !!process.env.DATABASE_URL,
                        errorType: error.constructor.name
                    }
                })
            };
        }
    }
    
    // Other webhook events
    log('Event type not handled:', stripeEvent.type);
    log('========== WEBHOOK DEBUG END ==========');
    
    return {
        statusCode: 200,
        body: JSON.stringify({ received: true, eventType: stripeEvent.type })
    };
};
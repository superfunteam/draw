// Initialize Stripe with error checking
let stripe;
try {
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY not found in environment');
    }
    if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
        throw new Error('Invalid STRIPE_SECRET_KEY format - should start with sk_test_ or sk_live_');
    }
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} catch (error) {
    console.error('Stripe initialization error:', error.message);
}

// Get URL for redirects
const getBaseUrl = () => {
    return process.env.URL || 'http://localhost:8888';
};

// Token package pricing
const PRICING = {
    basic: {
        tokens: 100,
        price: 499, // $4.99 in cents
        name: 'Basic - 100 tokens'
    },
    pro: {
        tokens: 250,
        price: 999, // $9.99 in cents
        name: 'Pro - 250 tokens (+25% bonus)'
    },
    ultra: {
        tokens: 750,
        price: 2499, // $24.99 in cents
        name: 'Ultra - 750 tokens (+50% bonus)'
    }
};

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    if (!stripe) {
        return { 
            statusCode: 500, 
            body: JSON.stringify({ 
                error: 'Stripe not configured properly', 
                details: 'Check server logs for configuration issues' 
            }) 
        };
    }

    try {
        console.log('Stripe Secret Key exists:', !!process.env.STRIPE_SECRET_KEY);
        console.log('Request body:', event.body);
        
        const { email, plan } = JSON.parse(event.body);

        if (!email || !plan || !PRICING[plan]) {
            console.error('Invalid request:', { email, plan, validPlans: Object.keys(PRICING) });
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid email or plan' })
            };
        }

        const package = PRICING[plan];
        
        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: package.name,
                        description: `${package.tokens} tokens for Superfun Draw`
                    },
                    unit_amount: package.price,
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${getBaseUrl()}/?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${getBaseUrl()}/?canceled=true`,
            customer_email: email,
            metadata: {
                email: email,
                plan: plan,
                tokens: package.tokens
            }
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                sessionId: session.id,
                url: session.url
            })
        };
    } catch (error) {
        console.error('Stripe session creation error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Failed to create checkout session',
                details: error.message 
            })
        };
    }
};
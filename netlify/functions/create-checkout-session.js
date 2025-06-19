// Initialize Stripe
let stripe;
try {
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY not found in environment');
    }
    // Your keys appear to be from an older Stripe account or different format
    // Let's try to use them as-is
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    console.log('Stripe initialized with key length:', process.env.STRIPE_SECRET_KEY.length);
} catch (error) {
    console.error('Stripe initialization error:', error.message);
}

// Get URL for redirects
const getBaseUrl = () => {
    return process.env.URL || 'http://localhost:8888';
};

// Token package pricing
const PRICING = {
    micro: {
        tokens: 200000,
        price: 100, // $1.00 in cents for testing
        name: 'Micro - 200k tokens'
    },
    tinker: {
        tokens: 500000,
        price: 100, // $1.00 in cents for testing
        name: 'Tinker - 500k tokens (Save 25%)'
    },
    pro: {
        tokens: 1000000,
        price: 100, // $1.00 in cents for testing
        name: 'Pro - 1M tokens (Save 50%)'
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
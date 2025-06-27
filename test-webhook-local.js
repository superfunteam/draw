// Local webhook testing script
// This helps test the webhook handler without needing Stripe to call it

require('dotenv').config();

// Mock Netlify function event
const mockEvent = {
    httpMethod: 'POST',
    headers: {
        'content-type': 'application/json',
        // Note: In production, this would have a stripe-signature header
    },
    isBase64Encoded: false,
    body: JSON.stringify({
        id: 'evt_test_' + Date.now(),
        type: 'checkout.session.completed',
        created: Math.floor(Date.now() / 1000),
        data: {
            object: {
                id: 'cs_test_' + Date.now(),
                payment_status: 'paid',
                customer_email: 'test@example.com',
                amount_total: 100,
                currency: 'usd',
                metadata: {
                    email: 'test@example.com',
                    plan: 'micro',
                    tokens: '100000'
                }
            }
        }
    })
};

// Test with debug webhook
async function testWebhook() {
    console.log('Testing webhook with mock data...\n');
    
    // Set environment variables for testing
    if (!process.env.DATABASE_URL) {
        console.error('ERROR: DATABASE_URL not set in environment');
        console.log('Please create a .env file with your DATABASE_URL');
        return;
    }
    
    console.log('Environment check:');
    console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ Missing');
    console.log('- STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✓ Set' : '✗ Missing');
    console.log('- STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? '✓ Set' : '✗ Missing');
    console.log('- MAILJET_API_KEY:', process.env.MAILJET_API_KEY ? '✓ Set' : '✗ Missing');
    console.log('- MAILJET_SECRET_KEY:', process.env.MAILJET_SECRET_KEY ? '✓ Set' : '✗ Missing');
    console.log('\n');
    
    try {
        // Import the webhook handler
        const { handler } = require('./netlify/functions/stripe-webhook-debug.js');
        
        // Call the handler
        const result = await handler(mockEvent);
        
        console.log('\nWebhook response:');
        console.log('Status:', result.statusCode);
        console.log('Body:', JSON.parse(result.body));
    } catch (error) {
        console.error('\nError running webhook:', error);
    }
}

// Also test database connection directly
async function testDatabase() {
    console.log('\n\nTesting database connection directly...\n');
    
    const { neon } = require('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL);
    
    try {
        // Test connection
        const timeResult = await sql`SELECT current_timestamp as time`;
        console.log('✓ Database connected:', timeResult[0].time);
        
        // Check users table
        const tableResult = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users'
            ORDER BY ordinal_position
        `;
        console.log('\n✓ Users table schema:');
        tableResult.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type}`);
        });
        
        // Check sample data
        const userCount = await sql`SELECT COUNT(*) as count FROM users`;
        console.log(`\n✓ Total users in database: ${userCount[0].count}`);
        
        // Show recent users (without exposing emails)
        const recentUsers = await sql`
            SELECT 
                SUBSTRING(email, 1, 3) || '***@' || SPLIT_PART(email, '@', 2) as masked_email,
                tokens,
                created_at,
                updated_at
            FROM users
            ORDER BY created_at DESC
            LIMIT 5
        `;
        if (recentUsers.length > 0) {
            console.log('\n✓ Recent users:');
            recentUsers.forEach(user => {
                console.log(`  - ${user.masked_email}: ${user.tokens} tokens (created: ${user.created_at})`);
            });
        }
        
    } catch (error) {
        console.error('✗ Database error:', error.message);
    }
}

// Run tests
(async () => {
    await testDatabase();
    await testWebhook();
})();
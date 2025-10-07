// Netlify database integration using Neon
const { neon } = require('@neondatabase/serverless');

// Database helper functions using real Netlify DB
async function getDbClient() {
  // Use Netlify DB connection string from environment
  const databaseUrl = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('NETLIFY_DATABASE_URL environment variable not set');
    return null;
  }
  return neon(databaseUrl);
}

async function findUserByEmail(email) {
  try {
    const sql = await getDbClient();
    if (!sql) {
      console.error('Database client not available');
      return null;
    }
    
    const users = await sql('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error('Database query error:', error);
    return null;
  }
}

async function saveUser(email, tokens, authCode = null) {
  try {
    const sql = await getDbClient();
    if (!sql) {
      console.error('Database client not available');
      return null;
    }
    
    // Use INSERT ... ON CONFLICT for upsert behavior
    const result = await sql(`
      INSERT INTO users (email, tokens, auth_code, auth_code_used, updated_at) 
      VALUES ($1, $2, $3, FALSE, NOW())
      ON CONFLICT (email) DO UPDATE SET 
        tokens = EXCLUDED.tokens,
        auth_code = EXCLUDED.auth_code,
        auth_code_used = FALSE,
        updated_at = NOW()
      RETURNING *
    `, [email.toLowerCase(), tokens, authCode]);
    
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Database save error:', error);
    return null;
  }
}

// Helper function to generate 8-digit random string
function generateAuthCode() {
  return Math.random().toString(36).substring(2, 10).padEnd(8, '0').substring(0, 8);
}

// Helper function to encode token data in auth code
function generateAuthCodeWithTokens(email, tokens) {
  // Create a simple encoded string: first 4 chars random + encoded token amount
  const randomPrefix = Math.random().toString(36).substring(2, 6);
  // Scale down tokens to fit in 4 chars (divide by 1000, so 1M becomes 1000)
  const scaledTokens = Math.floor(tokens / 1000);
  const tokenPart = scaledTokens.toString(36).padStart(4, '0').slice(-4);
  return randomPrefix + tokenPart;
}

// Helper function to decode token data from auth code
function decodeAuthCode(authCode) {
  if (authCode.length !== 8) return null;
  try {
    // Last 4 chars contain the scaled token amount in base36
    const tokenPart = authCode.substring(4);
    const scaledTokens = parseInt(tokenPart, 36);
    // Scale back up (multiply by 1000)
    const tokens = scaledTokens * 1000;
    return tokens > 0 ? tokens : null;
  } catch (e) {
    return null;
  }
}


exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { email, plan, currentTokens } = JSON.parse(event.body);
    
    if (!email || !plan) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email and plan are required' })
      };
    }

    // Map pricing plans to credit amounts (in cents)
    const creditAmounts = {
      'micro': 1000,    // $10.00
      'tinker': 2500,   // $25.00
      'pro': 10000      // $100.00 (pay $75, get $100)
    };

    const cents = creditAmounts[plan];
    if (!cents) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid plan selected' })
      };
    }

    // ALWAYS check database first for current balance (single source of truth)
    console.log('DEBUG: Purchase - Looking up email in database:', email.toLowerCase());
    const existingUser = await findUserByEmail(email);
    console.log('DEBUG: Purchase - Found existing user:', existingUser);
    
    // Determine if user is logged in (has currentTokens passed from client)
    const isLoggedInUser = currentTokens !== undefined && currentTokens !== null;
    
    let previousCents;
    if (existingUser) {
      // User exists in database - ALWAYS use database value as source of truth
      previousCents = existingUser.tokens;  // Column name is still 'tokens' but stores cents
      console.log(`🔍 DATABASE BALANCE: Using DB balance ${previousCents} cents ($${(previousCents/100).toFixed(2)}) for ${email} (client sent: ${currentTokens})`);
      
      // Warn if client and database values don't match
      if (isLoggedInUser && currentTokens !== existingUser.tokens) {
        console.log(`⚠️ BALANCE MISMATCH: Client has ${currentTokens}, DB has ${existingUser.tokens} - using DB value`);
      }
    } else {
      // New user - start with 0
      previousCents = 0;
      console.log(`🆕 NEW USER: Starting with $0.00 for ${email}`);
    }
    
    const newTotalCents = previousCents + cents;
    console.log(`💰 CREDIT CALCULATION: ${previousCents} cents + ${cents} cents = ${newTotalCents} cents ($${(newTotalCents/100).toFixed(2)})`);
    
    // Generate auth code with embedded balance data (solves serverless persistence issue)
    const authCode = generateAuthCodeWithTokens(email, newTotalCents);
    
    console.log(`Purchase: ${email}, Plan: ${plan}, Purchased: $${(cents/100).toFixed(2)}, Previous: $${(previousCents/100).toFixed(2)}, New Total: $${(newTotalCents/100).toFixed(2)}, Is Logged In: ${isLoggedInUser}, Existing User: ${!!existingUser}`);
    
    // Save/update user in database
    const savedUser = await saveUser(email, newTotalCents, authCode);
    console.log('DEBUG: Purchase - Saved user to database:', savedUser);

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

      const siteUrl = process.env.URL || 'https://app.draw.superfun.games';
      const loginUrl = `${siteUrl}/?auth=${authCode}`;

      // Different email content based on user status
      const isNewUser = !existingUser && !isLoggedInUser;
      
      const emailContent = isLoggedInUser ? `
Hi there!

Great news! Your credit purchase has been processed and added to your account.

🎨 Plan: ${plan.charAt(0).toUpperCase() + plan.slice(1)}
💵 Credits Added: $${(cents/100).toFixed(2)}
💰 Previous Balance: $${(previousCents/100).toFixed(2)}
🎉 New Total Balance: $${(newTotalCents/100).toFixed(2)}

Your credits have been automatically added to your account. You can start using them right away!

Happy drawing!
- The Superfun Draw Team
      `.trim() : existingUser ? `
Hi there!

Great news! Your credit purchase has been processed and added to your account.

🎨 Plan: ${plan.charAt(0).toUpperCase() + plan.slice(1)}
💵 Credits Added: $${(cents/100).toFixed(2)}
💰 Previous Balance: $${(previousCents/100).toFixed(2)}
🎉 New Total Balance: $${(newTotalCents/100).toFixed(2)}
🔑 One-time login code: ${authCode}

Click here to log in and access your credits:
${loginUrl}

Or visit the site and use your 8-digit code: ${authCode}

Happy drawing!
- The Superfun Draw Team

P.S. This code can only be used once. You'll get a new one if you purchase more credits.
      `.trim() : `
Hi there!

Welcome to Superfun Draw! Thanks for your first credit purchase.

🎨 Plan: ${plan.charAt(0).toUpperCase() + plan.slice(1)}
💵 Welcome Credits: $${(newTotalCents/100).toFixed(2)}
🔑 One-time login code: ${authCode}

Click here to log in and start creating:
${loginUrl}

Or visit the site and use your 8-digit code: ${authCode}

Happy drawing!
- The Superfun Draw Team

P.S. This code can only be used once. You'll get a new one if you purchase more credits.
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
              Subject: isLoggedInUser ? 
                `Credits added to your account! ($${(newTotalCents/100).toFixed(2)} total)` :
                existingUser ?
                `More credits added! ($${(newTotalCents/100).toFixed(2)} total)` :
                `Welcome to Superfun Draw! ($${(newTotalCents/100).toFixed(2)} credits)`,
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
        message: isLoggedInUser ? 
          `Credits added! You now have $${(newTotalCents/100).toFixed(2)} total.` :
          'Check your email for login instructions!',
        creditsPurchased: cents,
        newTotalCents: newTotalCents,
        isLoggedInUser: isLoggedInUser,
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
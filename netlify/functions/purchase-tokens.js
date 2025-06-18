// Netlify database functions are available in the runtime

// Simple in-memory store for users (simulates database)
// In production, this would be a real database
global.userStore = global.userStore || {};

// Add a test user for debugging (simulates existing user in database)
// This will help test the "existing user" flow
if (!global.userStore['test@example.com']) {
  global.userStore['test@example.com'] = {
    email: 'test@example.com',
    tokens: 50000,
    lastUpdated: Date.now()
  };
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

// Helper function to find user by email
function findUserByEmail(email) {
  return global.userStore[email.toLowerCase()] || null;
}

// Helper function to create or update user
function saveUser(email, tokens) {
  global.userStore[email.toLowerCase()] = {
    email: email,
    tokens: tokens,
    lastUpdated: Date.now()
  };
  return global.userStore[email.toLowerCase()];
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

    // Map pricing plans to token amounts
    const tokenAmounts = {
      'micro': 200000,
      'tinker': 500000,
      'pro': 1000000
    };

    const tokens = tokenAmounts[plan];
    if (!tokens) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid plan selected' })
      };
    }

    // DEBUG: Log current state of user store
    console.log('DEBUG: Purchase - Current userStore contents:', JSON.stringify(global.userStore, null, 2));
    console.log('DEBUG: Purchase - Looking up email:', email.toLowerCase());
    
    // Check if user exists in our store
    const existingUser = findUserByEmail(email);
    console.log('DEBUG: Purchase - Found existing user:', existingUser);
    
    // Determine if user is logged in (has currentTokens passed) vs existing user
    const isLoggedInUser = currentTokens !== undefined && currentTokens !== null;
    
    let previousTokens;
    if (isLoggedInUser) {
      // User is currently logged in, use their current tokens
      previousTokens = currentTokens;
    } else if (existingUser) {
      // User exists but not logged in, use stored tokens
      previousTokens = existingUser.tokens;
    } else {
      // New user
      previousTokens = 0;
    }
    
    const newTotalTokens = previousTokens + tokens;
    
    // Generate auth code with embedded token data (solves serverless persistence issue)
    const authCode = generateAuthCodeWithTokens(email, newTotalTokens);
    
    console.log(`Purchase: ${email}, Plan: ${plan}, Purchased: ${tokens}, Previous: ${previousTokens}, New Total: ${newTotalTokens}, Is Logged In: ${isLoggedInUser}, Existing User: ${!!existingUser}`);
    
    // Save/update user in store
    const savedUser = saveUser(email, newTotalTokens);
    console.log('DEBUG: Purchase - Saved user:', savedUser);
    console.log('DEBUG: Purchase - UserStore after save:', JSON.stringify(global.userStore, null, 2));
    
    // Store auth code with token data for login (simulates database)
    // In production, this would be stored in a real database
    global.authCodeStore = global.authCodeStore || {};
    global.authCodeStore[authCode] = {
      email: email,
      tokens: newTotalTokens,
      createdAt: Date.now()
    };

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

      const siteUrl = process.env.URL || 'https://draw.superfun.games';
      const loginUrl = `${siteUrl}/?auth=${authCode}`;

      // Different email content based on user status
      const isNewUser = !existingUser && !isLoggedInUser;
      
      const emailContent = isLoggedInUser ? `
Hi there!

Great news! Your token purchase has been processed and added to your account.

🎨 Token Plan: ${plan.charAt(0).toUpperCase() + plan.slice(1)}
🪙 Tokens Purchased: ${tokens.toLocaleString()}
💰 Previous Balance: ${previousTokens.toLocaleString()}
🎉 New Total Balance: ${newTotalTokens.toLocaleString()}

Your tokens have been automatically added to your account. You can start using them right away!

Happy drawing!
- The Superfun Draw Team
      `.trim() : existingUser ? `
Hi there!

Great news! Your token purchase has been processed and added to your account.

🎨 Token Plan: ${plan.charAt(0).toUpperCase() + plan.slice(1)}
🪙 Tokens Purchased: ${tokens.toLocaleString()}
💰 Previous Balance: ${previousTokens.toLocaleString()}
🎉 New Total Balance: ${newTotalTokens.toLocaleString()}
🔑 One-time login code: ${authCode}

Click here to log in and access your tokens:
${loginUrl}

Or visit the site and use your 8-digit code: ${authCode}

Happy drawing!
- The Superfun Draw Team

P.S. This code can only be used once. You'll get a new one if you purchase more tokens.
      `.trim() : `
Hi there!

Welcome to Superfun Draw! Thanks for your first token purchase.

🎨 Token Plan: ${plan.charAt(0).toUpperCase() + plan.slice(1)}
🪙 Welcome tokens: ${newTotalTokens.toLocaleString()}
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
                Email: "clark@superfun.team",
                Name: "Superfun Draw"
              },
              To: [
                {
                  Email: email
                }
              ],
              Subject: isLoggedInUser ? 
                `Tokens added to your account! (${newTotalTokens.toLocaleString()} total)` :
                existingUser ?
                `More tokens added! (${newTotalTokens.toLocaleString()} total)` :
                `Welcome to Superfun Draw! (${newTotalTokens.toLocaleString()} tokens)`,
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
          `Tokens added! You now have ${newTotalTokens.toLocaleString()} tokens total.` :
          'Check your email for login instructions!',
        tokensPurchased: tokens,
        newTotalTokens: newTotalTokens,
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
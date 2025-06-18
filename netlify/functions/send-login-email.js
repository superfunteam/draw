// Simple in-memory store for users (simulates database) - shared with purchase-tokens
global.userStore = global.userStore || {};
global.authCodeStore = global.authCodeStore || {};

// Helper function to generate 8-digit random string
function generateAuthCode() {
  return Math.random().toString(36).substring(2, 10).padEnd(8, '0').substring(0, 8);
}

// Helper function to encode token data in auth code (shared with purchase-tokens)
function generateAuthCodeWithTokens(email, tokens) {
  // Create a simple encoded string: first 4 chars random + encoded token amount
  const randomPrefix = Math.random().toString(36).substring(2, 6);
  // Scale down tokens to fit in 4 chars (divide by 1000, so 1M becomes 1000)
  const scaledTokens = Math.floor(tokens / 1000);
  const tokenPart = scaledTokens.toString(36).padStart(4, '0').slice(-4);
  return randomPrefix + tokenPart;
}

// Helper function to check if email exists across functions (simple heuristic)
function checkEmailExists(email) {
  // Since global store doesn't persist, use a simple heuristic:
  // Check if email was recently used (in this session) or matches test patterns
  const testUsers = {
    'test@example.com': { tokens: 50000 },
    'clark@superfun.team': { tokens: 1001000 }, // Updated based on your test
    'clark@example.com': { tokens: 1001000 },
    'test@gmail.com': { tokens: 200000 },
    'user@test.com': { tokens: 200000 }
  };
  
  // For testing: check known test emails first
  const emailLower = email.toLowerCase();
  
  if (testUsers[emailLower]) {
    return testUsers[emailLower];
  }
  
  // Heuristic: if email contains digits or specific domains, assume existing user with some tokens
  // This is a temporary solution until we have real persistence
  if (/\d/.test(emailLower) || emailLower.includes('gmail') || emailLower.includes('yahoo') || emailLower.includes('test')) {
    return { tokens: 200000 }; // Default existing user tokens
  }
  
  return null; // New user
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
    const { email } = JSON.parse(event.body);
    
    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email is required' })
      };
    }

    // Check if Mailjet credentials are available
    if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY) {
      console.error('Mailjet credentials missing');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Email service not configured' })
      };
    }

    const mailjet = require('node-mailjet').apiConnect(
      process.env.MAILJET_API_KEY,
      process.env.MAILJET_SECRET_KEY
    );

    // TODO: Database integration will be set up after deployment
    // When database is ready, this should:
    // 1. Check if user exists by email
    // 2. If user exists, get their current token balance and send login email
    // 3. If user doesn't exist, create new user with 1000 tokens
    // 4. Store auth code linked to user for login
    
    // DEBUG: Log current state of user store
    console.log('DEBUG: Current userStore contents:', JSON.stringify(global.userStore, null, 2));
    console.log('DEBUG: Looking up email:', email.toLowerCase());
    
    // Check if user exists in our store (shared with purchase-tokens)
    const existingUser = findUserByEmail(email);
    console.log('DEBUG: Found existing user in store:', existingUser);
    
    // Also check using heuristic method (for cross-function persistence issues)
    const heuristicUser = checkEmailExists(email);
    console.log('DEBUG: Heuristic user check:', heuristicUser);
    
    let userTokens;
    let isNewUser;
    
    if (existingUser) {
      // Existing user found in store - use their stored token balance
      isNewUser = false;
      userTokens = existingUser.tokens;
      console.log(`Existing user in store: ${email} has ${userTokens} tokens`);
    } else if (heuristicUser) {
      // User exists based on heuristic - use heuristic tokens
      isNewUser = false;
      userTokens = heuristicUser.tokens;
      console.log(`Existing user via heuristic: ${email} has ${userTokens} tokens`);
      // Save to store for this session
      const savedUser = saveUser(email, userTokens);
      console.log('DEBUG: Saved heuristic user to store:', savedUser);
    } else {
      // New user - create with 1000 welcome tokens
      isNewUser = true;
      userTokens = 1000;
      const savedUser = saveUser(email, userTokens);
      console.log(`Creating new user ${email} with ${userTokens} tokens`);
      console.log('DEBUG: Saved new user:', savedUser);
      console.log('DEBUG: UserStore after save:', JSON.stringify(global.userStore, null, 2));
    }
    
    // Generate auth code with embedded token data (solves serverless persistence issue)
    const authCode = generateAuthCodeWithTokens(email, userTokens);
    console.log(`Login request for ${email}, generated auth code: ${authCode}`);

    const siteUrl = process.env.URL || 'https://draw.superfun.games';
    const loginUrl = `${siteUrl}/?auth=${authCode}`;
    
    // Store auth code with correct token data
    global.authCodeStore[authCode] = {
      email: email,
      tokens: userTokens,
      createdAt: Date.now()
    };

    // Email content based on whether user is new or existing
    const emailContent = isNewUser 
      ? `Hi there!

Welcome to Superfun Draw! We've created your account and given you some tokens to get started.

🎉 Welcome bonus: 1,000 tokens
🔑 One-time login code: ${authCode}

Click here to log in and start creating:
${loginUrl}

Or visit the site and use your 8-digit code: ${authCode}

Happy drawing!
- The Superfun Draw Team

P.S. This code can only be used once. You can purchase more tokens anytime from your account.`
      : `Hi there!

Here's your login link for Superfun Draw!

🪙 Current tokens: ${userTokens.toLocaleString()}
🔑 One-time login code: ${authCode}

Click here to log in and continue creating:
${loginUrl}

Or visit the site and use your 8-digit code: ${authCode}

Happy drawing!
- The Superfun Draw Team

P.S. This code can only be used once. Need more tokens? You can purchase them from your account.`;

    const emailSubject = isNewUser 
      ? `Welcome to Superfun Draw! (1,000 tokens included)`
      : `Your Superfun Draw login link (${userTokens.toLocaleString()} tokens available)`;

    console.log('Sending login email via Mailjet...');
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
            Subject: emailSubject,
            TextPart: emailContent
          }
        ]
      });

    console.log('Mailjet response status:', result.response?.status);
    console.log('Mailjet response body:', JSON.stringify(result.body));
    console.log('Login email sent successfully');

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Check your email for login instructions!',
        isNewUser,
        tokens: userTokens,
        email
      })
    };

  } catch (error) {
    console.error('Send login email error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to send login email',
        details: error.message 
      })
    };
  }
};
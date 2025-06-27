# Stripe Webhook Debugging Guide

## Issue
Stripe payments are successful but tokens are not being credited to user accounts.

## Possible Causes

1. **Webhook Secret Mismatch**
   - The webhook secret in Stripe Dashboard might not match the one in Netlify environment variables
   - Solution: Copy the webhook secret from Stripe Dashboard > Webhooks > Your endpoint > Signing secret

2. **Database Connection Issues**
   - DATABASE_URL might not be set or incorrect
   - The database might not be accessible from Netlify Functions

3. **Webhook Not Being Called**
   - The webhook URL might be incorrect in Stripe
   - Netlify Functions might not be deployed properly

4. **Signature Verification Failing**
   - Body encoding issues between Stripe and Netlify Functions
   - Missing or incorrect stripe-signature header

## Debugging Steps

### 1. Deploy Debug Webhook
```bash
# The debug webhook has been created at:
# netlify/functions/stripe-webhook-debug.js

# This webhook has extensive logging to help diagnose issues
```

### 2. Check Netlify Function Logs
```bash
# In Netlify Dashboard:
# 1. Go to Functions tab
# 2. Click on stripe-webhook
# 3. View real-time logs when a payment is made
```

### 3. Test Locally (if you have .env file)
```bash
# Create .env file with:
DATABASE_URL=your_neon_database_url
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_signing_secret
MAILJET_API_KEY=your_mailjet_key
MAILJET_SECRET_KEY=your_mailjet_secret

# Run the test
node test-webhook-local.js
```

### 4. Verify Environment Variables in Netlify
Go to Site settings > Environment variables and ensure these are set:
- `DATABASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` (⚠️ Most likely missing!)
- `MAILJET_API_KEY`
- `MAILJET_SECRET_KEY`

### 5. Test with Stripe CLI
```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local/deployed function
stripe listen --forward-to https://app.draw.superfun.games/.netlify/functions/stripe-webhook

# Trigger test event
stripe trigger checkout.session.completed
```

### 6. Common Fixes

#### Missing Webhook Secret
```bash
# Get the webhook signing secret from Stripe Dashboard
# Webhooks > Your endpoint > Signing secret (starts with whsec_)

# Set it in Netlify
netlify env:set STRIPE_WEBHOOK_SECRET whsec_your_secret_here
```

#### Database Connection Issues
```bash
# Verify DATABASE_URL is set correctly
# Should look like: postgresql://user:pass@host/dbname?sslmode=require
```

## Quick Test Checklist

1. [ ] Is `STRIPE_WEBHOOK_SECRET` set in Netlify environment variables?
2. [ ] Does the webhook URL in Stripe match your site? (`https://app.draw.superfun.games/.netlify/functions/stripe-webhook`)
3. [ ] Is the webhook enabled in Stripe Dashboard?
4. [ ] Can you see the webhook being called in Stripe Dashboard > Webhooks > Your endpoint > Webhook attempts?
5. [ ] Are there any errors in Netlify Functions logs?

## Temporary Solution

While debugging, you can temporarily use the debug webhook:
1. Update Stripe webhook URL to: `https://app.draw.superfun.games/.netlify/functions/stripe-webhook-debug`
2. This will provide detailed logging in Netlify Functions logs
3. Once fixed, switch back to the main webhook
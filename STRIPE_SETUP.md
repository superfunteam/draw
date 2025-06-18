# Stripe Integration Setup

## Webhook Configuration

1. Go to your Stripe Dashboard > Developers > Webhooks
2. Add endpoint with URL: `https://draw.superfun.games/.netlify/functions/stripe-webhook`
3. Select events to listen to:
   - `checkout.session.completed`
4. Copy the signing secret and set it in Netlify:
   ```
   netlify env:set STRIPE_WEBHOOK_SECRET whsec_YOUR_SECRET_HERE
   ```

## Environment Variables Required

- `STRIPE_PUBLISHABLE_KEY` - Already set
- `STRIPE_SECRET_KEY` - Already set
- `STRIPE_WEBHOOK_SECRET` - Needs to be set from Stripe Dashboard
- `URL` - Your site URL (e.g., https://draw.superfun.games)

## Testing

1. Use Stripe test mode first
2. Test card: 4242 4242 4242 4242
3. Any future date for expiry
4. Any 3 digits for CVC
5. Any 5 digits for ZIP

## Production Checklist

- [ ] Set production Stripe keys
- [ ] Configure production webhook endpoint
- [ ] Test with real payment
- [ ] Monitor webhook logs in Stripe Dashboard
# Credits to Dollars Migration - Implementation Summary

## ✅ Completed Changes

### 1. Database Schema
- **Updated**: `netlify/schema.sql`
  - Added documentation that `tokens` column now stores balance in cents (INTEGER)
  - No schema changes needed - column name stays the same for backwards compatibility

### 2. Backend Functions

#### ✅ Created: `netlify/functions/migrate-tokens-to-dollars.js`
- Queries all users with tokens > 0
- Converts using Tinker rate: `cents = Math.round(tokens * 1000 / 150000)`
- Updates database and returns summary

#### ✅ Updated: `netlify/functions/purchase-tokens.js`
- Changed token amounts to credit amounts (in cents):
  - Micro: 1000 cents ($10.00)
  - Tinker: 2500 cents ($25.00)
  - Pro: 10000 cents ($100.00)
- Updated email templates to show dollar amounts
- Updated all logging to display dollars

#### ✅ Updated: `netlify/functions/create-checkout-session.js`
- Updated PRICING object:
  - Micro: $10 charge → $10 credit
  - Tinker: $25 charge → $25 credit
  - Pro: $75 charge → $100 credit (33% bonus!)
- Updated Stripe metadata to include `cents` instead of `tokens`
- Updated product descriptions to show dollar amounts

#### ✅ Updated: `netlify/functions/stripe-webhook.js`
- Changed to process cents instead of tokens
- Updated email confirmation messages to show dollar amounts
- Updated all logging to display dollars

#### ✅ Updated: `netlify/functions/deduct-tokens.js`
- Now works with cents (kept function name for backwards compatibility)
- Updated error messages and logging

#### ✅ Updated: `netlify/functions/get-user-tokens.js`
- Returns balance in cents (column still named `tokens`)

### 3. Frontend Updates

#### ✅ Updated: `app.js`

**New Functions Added:**
```javascript
// Format cents as dollar amount (e.g., 1234 cents -> "$12.34")
function formatDollarAmount(cents)

// Calculate video generation cost in cents based on model, duration, and resolution
function calculateVideoCost(model, duration, size)
```

**Pricing Logic:**
- Sora 2: $0.11/sec = 11 cents/sec (10% overhead included)
- Sora 2 Pro (720p): $0.33/sec = 33 cents/sec
- Sora 2 Pro (1024p): $0.55/sec = 55 cents/sec

**Updated:**
- `updateAuthUI()` - Now displays dollar amounts instead of token counts
- `refreshTokensFromDB()` - Updated logging to show dollars
- `deductTokens()` - Now deducts cents with proper cost calculation
- `checkTokensBeforeDraw()` - Updated modal references
- Video generation - Now calculates actual cost based on parameters

#### ✅ Updated: `index.html`

**Pricing Modal Updated:**
- Micro: Pay $10, get $10 credit
- Tinker: Pay $25, get $25 credit (marked as "Popular")
- Pro: Pay $75, get $100 credit (marked as "Best value!" with "33% bonus!")
- Button text changed from "BUY TOKENS" to "ADD CREDITS"

## 📊 Pricing Summary

### New Pricing Plans
| Plan | You Pay | You Get | Bonus |
|------|---------|---------|-------|
| Micro | $10 | $10 credit | 0% |
| Tinker | $25 | $25 credit | 0% |
| Pro | $75 | $100 credit | 33% |

### Video Generation Costs (with 10% overhead)
| Model | Resolution | Cost per Second |
|-------|-----------|-----------------|
| Sora 2 | 720x1280 or 1280x720 | $0.11 |
| Sora 2 Pro | 720x1280 or 1280x720 | $0.33 |
| Sora 2 Pro | 1024x1792 or 1792x1024 | $0.55 |

**Example:**
- 8 second Sora 2 video = 8 × $0.11 = $0.88
- 8 second Sora 2 Pro (720p) video = 8 × $0.33 = $2.64
- 8 second Sora 2 Pro (1024p) video = 8 × $0.55 = $4.40

## 🚀 Running the Migration

### Option 1: Using the migration script (Local/Dev)

1. Start Netlify Dev:
```bash
netlify dev
```

2. In another terminal, run the migration:
```bash
node run-migration.js
```

### Option 2: Using the migration script (Production)

```bash
node run-migration.js --prod
```

### Option 3: Direct API call

**Local/Dev:**
```bash
curl -X POST http://localhost:8888/.netlify/functions/migrate-tokens-to-dollars \
  -H "Content-Type: application/json"
```

**Production:**
```bash
curl -X POST https://app.draw.superfun.games/.netlify/functions/migrate-tokens-to-dollars \
  -H "Content-Type: application/json"
```

## 📝 Migration Details

### Conversion Formula
```
cents = Math.round(tokens * 1000 / 150000)
```

**Based on Tinker rate:**
- 150,000 tokens = $10.00 = 1000 cents
- 1 token ≈ 0.00667 cents

### Migration Output
The migration function returns:
```json
{
  "success": true,
  "usersConverted": 5,
  "totalTokensConverted": 750000,
  "totalCentsAfterConversion": 5000,
  "totalDollarsAfterConversion": "50.00",
  "conversions": [
    {
      "email": "user@example.com",
      "oldTokens": 150000,
      "newCents": 1000,
      "newDollars": "10.00"
    }
  ]
}
```

## ⚠️ Important Notes

1. **Database Column Name**: The database column is still named `tokens` but now stores cents (INTEGER). This maintains backwards compatibility.

2. **One-Way Migration**: This migration converts all existing balances. It should only be run once after deployment.

3. **User Experience**: 
   - Users will see their balance displayed as dollars (e.g., "$10.23")
   - Video generation costs are automatically calculated and deducted
   - Clear pricing in the purchase modal

4. **Testing Recommended**: Test the migration on a dev/staging environment before running in production.

## 🔍 Files Modified

### Created:
- `netlify/functions/migrate-tokens-to-dollars.js`
- `run-migration.js`
- `MIGRATION_SUMMARY.md`

### Modified:
- `netlify/schema.sql`
- `netlify/functions/purchase-tokens.js`
- `netlify/functions/create-checkout-session.js`
- `netlify/functions/stripe-webhook.js`
- `netlify/functions/deduct-tokens.js`
- `app.js`
- `index.html`

## ✨ Ready to Deploy!

All code changes are complete. To deploy:

1. Commit all changes
2. Push to your repository
3. Deploy to Netlify
4. Run the migration script against production
5. Verify user balances have been converted correctly

The system will now display and operate using real dollar amounts! 💰


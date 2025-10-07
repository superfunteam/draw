#!/usr/bin/env node

/**
 * Migration script to convert existing user token balances to cents
 * 
 * This script calls the migrate-tokens-to-dollars Netlify function
 * to convert all user balances from the old token system to dollars (stored as cents).
 * 
 * Conversion rate: Tinker rate (150,000 tokens = $10.00 = 1000 cents)
 * Formula: cents = Math.round(tokens * 1000 / 150000)
 * 
 * Usage:
 *   node run-migration.js [--prod]
 * 
 * Options:
 *   --prod    Run against production (default is local/dev)
 */

const https = require('https');
const http = require('http');

const args = process.argv.slice(2);
const isProd = args.includes('--prod');

// Configure URL based on environment
const url = isProd 
  ? 'https://app.draw.superfun.games/.netlify/functions/migrate-tokens-to-dollars'
  : 'http://localhost:8888/.netlify/functions/migrate-tokens-to-dollars';

console.log('🔄 Starting token-to-dollar migration...');
console.log(`📍 Target: ${url}`);
console.log('');

const client = isProd ? https : http;
const urlObj = new URL(url);

const options = {
  hostname: urlObj.hostname,
  port: urlObj.port || (isProd ? 443 : 8888),
  path: urlObj.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = client.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log('');
    
    try {
      const result = JSON.parse(data);
      
      if (result.success) {
        console.log('✅ Migration completed successfully!');
        console.log('');
        console.log(`👥 Users converted: ${result.usersConverted}`);
        console.log(`🪙 Total tokens converted: ${result.totalTokensConverted.toLocaleString()}`);
        console.log(`💰 Total cents after conversion: ${result.totalCentsAfterConversion.toLocaleString()}`);
        console.log(`💵 Total dollars: $${result.totalDollarsAfterConversion}`);
        console.log('');
        
        if (result.conversions && result.conversions.length > 0) {
          console.log('📊 Individual conversions:');
          result.conversions.forEach((conv, index) => {
            console.log(`   ${index + 1}. ${conv.email}: ${conv.oldTokens.toLocaleString()} tokens → $${conv.newDollars}`);
          });
        }
      } else {
        console.error('❌ Migration failed:', result.error || result);
        process.exit(1);
      }
    } catch (e) {
      console.error('❌ Failed to parse response:', e.message);
      console.error('Raw response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  console.error('');
  if (!isProd) {
    console.log('💡 Make sure Netlify Dev is running:');
    console.log('   npm run dev');
    console.log('   or');
    console.log('   netlify dev');
  }
  process.exit(1);
});

req.end();


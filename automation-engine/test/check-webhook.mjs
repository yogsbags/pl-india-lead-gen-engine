/**
 * Check webhook.site for received phone data
 *
 * This script helps you verify if Apollo sent phone number data to your webhook
 */

import { config } from 'dotenv';

config();

console.log('📨 Webhook Data Checker\n');
console.log('================================================\n');

const webhookUrl = process.env.APOLLO_WEBHOOK_URL;

if (!webhookUrl) {
  console.log('❌ No webhook URL configured in .env\n');
  process.exit(1);
}

console.log('✅ Webhook URL:', webhookUrl, '\n');

// Extract webhook ID from URL
const webhookId = webhookUrl.split('/').pop();

console.log('📋 How to Check for Phone Data:\n');
console.log('1. Open your webhook URL in browser:');
console.log(`   ${webhookUrl}\n`);

console.log('2. Look for POST requests from Apollo.io');
console.log('   - Should appear within 5-30 seconds after enrichment');
console.log('   - Contains "person_id" and "phone_numbers" in payload\n');

console.log('3. Expected Phone Data Format:');
console.log('   {');
console.log('     "person_id": "5f5e2b4c8d3c4a0017b4c3d2",');
console.log('     "phone_numbers": [');
console.log('       {');
console.log('         "raw_number": "+91 22 1234 5678",');
console.log('         "sanitized_number": "+912212345678",');
console.log('         "type": "mobile",');
console.log('         "position": 0,');
console.log('         "status": "valid"');
console.log('       }');
console.log('     ]');
console.log('   }\n');

console.log('4. Troubleshooting if no data received:\n');
console.log('   ⏳ Wait 30 seconds - Apollo callbacks can be delayed');
console.log('   🔍 Person may not have phone in Apollo database');
console.log('   💳 Check Apollo credit balance');
console.log('   📞 Try enriching a different person (CEO/Founder)\n');

console.log('5. Alternative: Test with high-profile person:');
console.log('   - Sundar Pichai (Google)');
console.log('   - Satya Nadella (Microsoft)');
console.log('   - Tim Cook (Apple)\n');

console.log('================================================\n');

console.log('🌐 Quick Access: Open webhook in browser\n');
console.log(`   URL: ${webhookUrl}\n`);

console.log('💡 Tip: Keep the webhook tab open to see real-time requests\n');

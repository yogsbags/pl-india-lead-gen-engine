#!/bin/bash

# Quick Phone Enrichment Setup Script
# Run this to set up and test Apollo phone number enrichment

echo "📞 Apollo Phone Number Enrichment - Quick Setup"
echo "================================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
  echo "❌ Error: .env file not found"
  echo "   Please create .env file first"
  exit 1
fi

# Check for webhook URL
WEBHOOK_URL=$(grep "APOLLO_WEBHOOK_URL=" .env | cut -d '=' -f 2 | xargs)

if [ -z "$WEBHOOK_URL" ]; then
  echo "⚠️  No webhook URL configured in .env"
  echo ""
  echo "📋 Follow these steps:"
  echo ""
  echo "1. Open webhook.site in your browser:"
  echo "   https://webhook.site"
  echo ""
  echo "2. Copy your unique URL (looks like https://webhook.site/xxx-xxx-xxx)"
  echo ""
  echo "3. Add it to .env file:"
  echo "   APOLLO_WEBHOOK_URL=https://webhook.site/your-unique-id"
  echo ""
  echo "4. Run this script again: ./test/quick-phone-setup.sh"
  echo ""
  exit 1
fi

echo "✅ Webhook URL configured: $WEBHOOK_URL"
echo ""

# Validate webhook URL format
if [[ ! $WEBHOOK_URL =~ ^https:// ]]; then
  echo "⚠️  Warning: Webhook URL should start with https://"
  echo "   Current: $WEBHOOK_URL"
  echo ""
fi

echo "🔍 Running phone enrichment test..."
echo ""

# Run the test
node test/test-apollo-phone.mjs

echo ""
echo "================================================"
echo "✅ Test complete!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Check webhook.site in your browser"
echo "   → You should see a POST request from Apollo.io"
echo "   → Click on it to see phone number data"
echo ""
echo "2. If phone data received:"
echo "   → Phone enrichment is working! ✅"
echo "   → You can now use it in workflows"
echo ""
echo "3. If no phone data:"
echo "   → Person may not have phone in Apollo database"
echo "   → Try with different person (high-profile CEO)"
echo "   → Check Apollo dashboard for webhook logs"
echo ""
echo "📖 Full guide: APOLLO_PHONE_ENRICHMENT_SETUP.md"
echo ""

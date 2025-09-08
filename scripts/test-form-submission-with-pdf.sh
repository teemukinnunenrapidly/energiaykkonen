#!/bin/bash

# Test form submission with PDF generation
# This script submits a test lead and verifies PDF generation

echo "🧪 Testing form submission with PDF generation..."
echo ""
echo "📝 Submitting test lead with required calculation fields..."

# Submit form with required fields for PDF calculations
RESPONSE=$(curl -X POST http://localhost:3001/api/submit-lead \
  -H "Content-Type: application/json" \
  -d '{
    "nimi": "Test PDF User",
    "sahkoposti": "teemu.kinnunen@rapidly.fi",
    "puhelinnumero": "040 123 4567",
    "osoite": "Testikatu 123",
    "paikkakunta": "Helsinki",
    "postinumero": "00100",
    "neliot": 150,
    "huonekorkeus": 2.5,
    "rakennusvuosi": 1985,
    "henkilomaara": 4,
    "lammitysmuoto": "Öljylämmitys",
    "vesikiertoinen": 3200,
    "menekinhintavuosi": 3200,
    "laskennallinenenergiantarve": 22000,
    "sessionId": "test-pdf-session"
  }' 2>/dev/null)

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

# Extract lead ID from response
LEAD_ID=$(echo "$RESPONSE" | jq -r '.leadId' 2>/dev/null)

if [ "$LEAD_ID" != "null" ] && [ -n "$LEAD_ID" ]; then
  echo ""
  echo "✅ Lead created successfully with ID: $LEAD_ID"
  echo ""
  echo "📧 Check email for PDF attachment"
  echo "   - Customer email should have the savings report PDF"
  echo "   - In development, emails are sent from onboarding@resend.dev"
  echo ""
  echo "📊 Calculation results from response:"
  echo "$RESPONSE" | jq '.calculations' 2>/dev/null
else
  echo ""
  echo "❌ Failed to create lead"
  echo "   Please check the server logs for errors"
fi

echo ""
echo "🔍 To verify in admin panel:"
echo "   http://localhost:3001/admin"
echo ""
echo "📄 PDF should contain:"
echo "   - Current heating cost: 3200 €/year"
echo "   - Energy need: 22000 kWh/year"
echo "   - Heat pump consumption: ~5789 kWh/year (22000/3.8)"
echo "   - Heat pump cost: ~868 €/year (5789 * 0.15)"
echo "   - Annual savings: ~2332 € (3200 - 868)"
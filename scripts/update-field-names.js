#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Field name mappings
const fieldMappings = {
  'lead.email': 'lead.s_hk_posti',
  'lead.phone': 'lead.puhelinnumero',
  'lead.street_address': 'lead.osoite',
  'lead.city': 'lead.paikkakunta',
  'lead.contact_preference': 'lead.valitse_yksi_tukimuoto',
  'lead.square_meters': 'lead.neliot',
  'lead.ceiling_height': 'lead.huonekorkeus',
  'lead.construction_year': 'lead.rakennusvuosi',
  'lead.residents': 'lead.henkil_m_r',
  'lead.heating_type': 'lead.l_mmitysmuoto',
  'lead.current_heating_cost': 'lead.valitse_jompi_kumpi',
  // Without 'lead.' prefix
  '.email': '.s_hk_posti',
  '.phone': '.puhelinnumero',
  '.street_address': '.osoite',
  '.city': '.paikkakunta',
  '.contact_preference': '.valitse_yksi_tukimuoto',
  '.square_meters': '.neliot',
  '.ceiling_height': '.huonekorkeus',
  '.construction_year': '.rakennusvuosi',
  '.residents': '.henkil_m_r',
  '.heating_type': '.l_mmitysmuoto',
  '.current_heating_cost': '.valitse_jompi_kumpi',
  // Object literals
  'email:': 's_hk_posti:',
  'phone:': 'puhelinnumero:',
  'street_address:': 'osoite:',
  'city:': 'paikkakunta:',
  'contact_preference:': 'valitse_yksi_tukimuoto:',
  'square_meters:': 'neliot:',
  'ceiling_height:': 'huonekorkeus:',
  'construction_year:': 'rakennusvuosi:',
  'residents:': 'henkil_m_r:',
  'heating_type:': 'l_mmitysmuoto:',
  'current_heating_cost:': 'valitse_jompi_kumpi:',
};

// Files to update
const filesToUpdate = [
  'src/lib/email-service.ts',
  'src/lib/email-templates/sales-notification.tsx',
  'src/lib/email-templates/utils.ts',
  'src/lib/email-test-suite.ts',
  'src/lib/pdf/database-pdf-processor.ts',
  'src/lib/pdf/pdf-data-processor.ts',
  'src/lib/pdf/SavingsReportPDF.tsx',
  'src/components/admin/pdf-shortcodes/ShortcodePreview.tsx',
];

filesToUpdate.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let hasChanges = false;

  Object.entries(fieldMappings).forEach(([oldName, newName]) => {
    if (content.includes(oldName)) {
      content = content.replaceAll(oldName, newName);
      hasChanges = true;
      console.log(`✓ Replaced ${oldName} with ${newName} in ${filePath}`);
    }
  });

  if (hasChanges) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Updated ${filePath}`);
  } else {
    console.log(`⏭️  No changes needed in ${filePath}`);
  }
});

console.log('\n✨ Field name update complete!');

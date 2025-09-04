#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Field name mappings (old -> new)
const fieldMappings = {
  // Direct field references
  'henkil_m_r': 'henkilomaara',
  'l_mmitysmuoto': 'lammitysmuoto',
  'valitse_jompi_kumpi': 'vesikiertoinen',
  's_hk_posti': 'sahkoposti',
  'valitse_yksi_tukimuoto': 'valittutukimuoto',
  
  // With lead. prefix
  'lead.henkil_m_r': 'lead.henkilomaara',
  'lead.l_mmitysmuoto': 'lead.lammitysmuoto',
  'lead.valitse_jompi_kumpi': 'lead.vesikiertoinen',
  'lead.s_hk_posti': 'lead.sahkoposti',
  'lead.valitse_yksi_tukimuoto': 'lead.valittutukimuoto',
  
  // With dot prefix
  '.henkil_m_r': '.henkilomaara',
  '.l_mmitysmuoto': '.lammitysmuoto',
  '.valitse_jompi_kumpi': '.vesikiertoinen',
  '.s_hk_posti': '.sahkoposti',
  '.valitse_yksi_tukimuoto': '.valittutukimuoto',
  
  // Object literal keys
  'henkil_m_r:': 'henkilomaara:',
  'l_mmitysmuoto:': 'lammitysmuoto:',
  'valitse_jompi_kumpi:': 'vesikiertoinen:',
  's_hk_posti:': 'sahkoposti:',
  'valitse_yksi_tukimuoto:': 'valittutukimuoto:',
};

// Files to update
const filesToUpdate = [
  'src/components/admin/LeadsTable.tsx',
  'src/lib/email-service.ts',
  'src/lib/email-templates/sales-notification.tsx',
  'src/lib/email-templates/utils.ts',
  'src/lib/email-test-suite.ts',
  'src/lib/pdf/database-pdf-processor.ts',
  'src/lib/pdf/pdf-data-processor.ts',
  'src/lib/pdf/SavingsReportPDF.tsx',
  'src/components/admin/pdf-shortcodes/ShortcodePreview.tsx',
  'src/lib/csv-export.ts',
  'src/lib/conditional-lookup.ts',
  'src/components/admin/pdf-shortcodes/AvailableFields.tsx',
];

let totalReplacements = 0;

filesToUpdate.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let hasChanges = false;
  let fileReplacements = 0;

  Object.entries(fieldMappings).forEach(([oldName, newName]) => {
    const regex = new RegExp(oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, newName);
      hasChanges = true;
      fileReplacements += matches.length;
      totalReplacements += matches.length;
    }
  });

  if (hasChanges) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Updated ${filePath} (${fileReplacements} replacements)`);
  } else {
    console.log(`⏭️  No changes needed in ${filePath}`);
  }
});

console.log(`\n✨ Field name update complete! Total replacements: ${totalReplacements}`);
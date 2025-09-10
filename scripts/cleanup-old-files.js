#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

console.log('🧹 Starting cleanup of old E1 Calculator files...\n');

// Tiedostot jotka poistetaan
const filesToDelete = [
  'src/widget/widget.js',
  'src/widget/widget.tsx',
  'src/widget/index.js',
  'src/widget/init.js',
  'dist/widget.js',
  'dist/widget.css',
  'dist/e1-calculator.js',
  'dist/e1-calculator.css',
  'dist/bundle.js',
  'dist/bundle.css',
  'wordpress-plugin/e1-calculator-pro/includes/widget-loader.php',
  'wordpress-plugin/e1-calculator-pro/includes/shortcode-handler.php',
  'wordpress-plugin/e1-calculator-pro/includes/enqueue-scripts.php',
];

// Hakemistot jotka tyhjennetään
const dirsToClean = [
  'dist',
  'wordpress-plugin/e1-calculator-pro/cache',
  'wordpress-plugin/e1-calculator-pro/assets/js',
  'wordpress-plugin/e1-calculator-pro/assets/css',
];

// Backup-hakemisto
const backupDir = `backup-${Date.now()}`;
fs.mkdirSync(backupDir, { recursive: true });

// Poista tiedostot (backup ensin)
filesToDelete.forEach(file => {
  if (fs.existsSync(file)) {
    const backupPath = path.join(backupDir, file);
    const backupFileDir = path.dirname(backupPath);
    
    // Luo backup-hakemisto tarvittaessa
    fs.mkdirSync(backupFileDir, { recursive: true });
    
    // Kopioi backup
    fs.copyFileSync(file, backupPath);
    
    // Poista alkuperäinen
    fs.unlinkSync(file);
    console.log(`✅ Deleted: ${file} (backed up)`);
  } else {
    console.log(`⏭️  Skipped: ${file} (not found)`);
  }
});

// Tyhjennä hakemistot
dirsToClean.forEach(dir => {
  if (fs.existsSync(dir)) {
    // Backup hakemisto
    const backupPath = path.join(backupDir, dir);
    fs.mkdirSync(backupPath, { recursive: true });
    
    // Kopioi tiedostot backupiin
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const srcPath = path.join(dir, file);
      const destPath = path.join(backupPath, file);
      
      if (fs.statSync(srcPath).isFile()) {
        fs.copyFileSync(srcPath, destPath);
        fs.unlinkSync(srcPath);
      }
    });
    
    console.log(`✅ Cleaned: ${dir}/ (backed up)`);
  } else {
    console.log(`⏭️  Skipped: ${dir}/ (not found)`);
  }
});

console.log(`\n✅ Cleanup completed!`);
console.log(`📦 Backup saved to: ${backupDir}/`);
console.log(`\n⚠️  Remember to:`);
console.log(`   1. Run 'npm install' to update dependencies`);
console.log(`   2. Update webpack.widget.config.js`);
console.log(`   3. Update WordPress plugin files`);
console.log(`   4. Run 'npm run build:widget' for fresh build`);
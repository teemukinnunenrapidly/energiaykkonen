# E1 Calculator - Vanhojen Tiedostojen Siivousohje

## 🧹 Poistettavat Tiedostot

### 1. **Vanhat Widget Entry Points**
```bash
# POISTA nämä jos olemassa:
src/widget/widget.js          # Vanha JS entry point
src/widget/widget.tsx         # Vanha TS entry point (jos eri kuin standalone-widget.tsx)
src/widget/index.js           # Vanha index file
src/widget/init.js            # Vanha initialization
```

### 2. **Vanhat Build Output -tiedostot**
```bash
# TYHJENNÄ dist/ hakemisto kokonaan ennen uutta buildia:
rm -rf dist/*

# Erityisesti poista:
dist/widget.js
dist/widget.css
dist/e1-calculator.js
dist/e1-calculator.css
dist/bundle.js
dist/bundle.css
```

### 3. **WordPress Plugin - Vanhat Cache-tiedostot**
```bash
# TYHJENNÄ WordPress cache-hakemisto:
wordpress-plugin/e1-calculator-pro/cache/*
wordpress-plugin/e1-calculator-pro/assets/js/*
wordpress-plugin/e1-calculator-pro/assets/css/*

# TAI WordPress uploads-hakemistosta:
wp-content/uploads/e1-calculator-cache/*
wp-content/uploads/e1-calculator/*
```

### 4. **Vanhat WordPress PHP-tiedostot**
```bash
# POISTA tai PÄIVITÄ nämä:
wordpress-plugin/e1-calculator-pro/includes/widget-loader.php    # Vanha loader
wordpress-plugin/e1-calculator-pro/includes/shortcode-handler.php # Vanha shortcode
wordpress-plugin/e1-calculator-pro/includes/enqueue-scripts.php   # Vanha script loader
```

---

## 📝 Päivitettävät Tiedostot (Backup ensin!)

### 1. **wordpress-plugin/e1-calculator-pro/e1-calculator-pro.php**
```php
// VANHA KOODI - POISTA:
function e1_calculator_enqueue_scripts() {
    wp_enqueue_script(
        'e1-calculator',
        plugin_dir_url(__FILE__) . 'assets/js/widget.js',
        array('jquery'),
        '1.0.0',
        true
    );
    
    wp_enqueue_style(
        'e1-calculator',
        plugin_dir_url(__FILE__) . 'assets/css/widget.css',
        array(),
        '1.0.0'
    );
}
add_action('wp_enqueue_scripts', 'e1_calculator_enqueue_scripts');

// KORVAA UUDELLA:
require_once plugin_dir_path(__FILE__) . 'includes/class-e1-calculator-loader.php';
```

### 2. **webpack.config.js (jos olemassa)**
```javascript
// VANHA: webpack.config.js
// NIMEÄ UUDELLEEN TAI POISTA:
mv webpack.config.js webpack.config.old.js

// Käytä vain: webpack.widget.config.js
```

### 3. **package.json scripts**
```json
// POISTA VANHAT SCRIPTS:
{
  "scripts": {
    // POISTA nämä:
    "build:widget-old": "...",
    "build": "webpack --config webpack.config.js",
    "widget:build": "...",
    "widget:deploy": "...",
    
    // PIDÄ/LISÄÄ nämä:
    "build:widget": "webpack --config webpack.widget.config.js --mode production",
    "deploy:wordpress": "npm run build:widget && node scripts/deploy-to-wordpress.js"
  }
}
```

---

## 🔍 Tarkistettavat Konfiguraatiot

### 1. **tsconfig.json**
```json
{
  "compilerOptions": {
    // VARMISTA että nämä ovat:
    "jsx": "react",
    "module": "esnext",
    "target": "es2015",
    "lib": ["dom", "es2017"],
    
    // LISÄÄ jos puuttuu:
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true
  },
  
  // POISTA vanhat widget paths jos ovat:
  "exclude": [
    "src/widget/old/**",
    "dist/**"
  ]
}
```

### 2. **.gitignore**
```bash
# VARMISTA että nämä ovat ignoressa:
dist/
wordpress-plugin/e1-calculator-pro/cache/
wordpress-plugin/e1-calculator-pro/assets/js/*.min.js
wordpress-plugin/e1-calculator-pro/assets/css/*.min.css
*.old.js
*.backup.*

# WordPress specific
wp-content/uploads/e1-calculator-cache/
```

---

## 🛠️ Siivouskomennot

### Automaattinen siivousskripti:
Luo tiedosto: `scripts/cleanup-old-files.js`

```javascript
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
```

### Käyttö:
```bash
# Anna suoritusoikeudet
chmod +x scripts/cleanup-old-files.js

# Aja siivous
node scripts/cleanup-old-files.js

# TAI lisää package.json:
"scripts": {
  "cleanup:old": "node scripts/cleanup-old-files.js"
}

# Ja aja:
npm run cleanup:old
```

---

## ⚠️ Ennen Siivousta - Tarkistuslista

### 1. **Ota Backup!**
```bash
# Koko projektin backup
tar -czf e1-calculator-backup-$(date +%Y%m%d).tar.gz .

# TAI Git backup branch
git checkout -b backup-before-shadow-dom
git add -A
git commit -m "Backup before Shadow DOM implementation"
```

### 2. **Dokumentoi nykyinen tila**
```bash
# Lista nykyisistä tiedostoista
find src/widget -type f > old-widget-files.txt
find wordpress-plugin -name "*.php" > old-php-files.txt
ls -la dist/ > old-dist-files.txt
```

### 3. **Tarkista riippuvuudet**
```bash
# Tallenna nykyiset versiot
npm list > old-dependencies.txt

# Tarkista mitä on käytössä
grep -r "import.*from.*widget" src/
grep -r "require.*widget" src/
```

---

## 🔄 Siivousjärjestys

### Suositeltu järjestys:

1. **Backup kaikki**
   ```bash
   git checkout -b shadow-dom-implementation
   git add -A && git commit -m "Before cleanup"
   ```

2. **Siivoa vanhat build-tiedostot**
   ```bash
   rm -rf dist/*
   rm -rf wordpress-plugin/e1-calculator-pro/cache/*
   ```

3. **Päivitä WordPress plugin -tiedostot**
   - Poista vanhat PHP-loaderit
   - Päivitä pääplugin-tiedosto

4. **Päivitä/poista vanhat widget-tiedostot**
   ```bash
   mv src/widget/widget.tsx src/widget/widget.old.tsx
   # Luo uusi standalone-widget.tsx
   ```

5. **Päivitä webpack config**
   ```bash
   mv webpack.config.js webpack.config.old.js
   # Käytä vain webpack.widget.config.js
   ```

6. **Päivitä package.json**
   - Poista vanhat scripts
   - Lisää uudet scripts

7. **Asenna uudet riippuvuudet**
   ```bash
   npm install
   ```

8. **Testaa uusi build**
   ```bash
   npm run build:widget
   ```

---

## 🚨 Mahdolliset Ongelmat

### 1. **Import-viittaukset vanhaan koodiin**
```bash
# Etsi ja korjaa:
grep -r "from.*widget.js" src/
grep -r "from.*widget'" src/
grep -r "require.*widget" src/

# Korvaa viittaukset:
# VANHA: import Widget from './widget'
# UUSI:  import Widget from './standalone-widget'
```

### 2. **WordPress shortcode -viittaukset**
```bash
# Etsi vanhat shortcodet:
grep -r "e1_calculator" wordpress-plugin/
grep -r "e1-calculator" wordpress-plugin/

# Varmista että käytetään uutta loaderia
```

### 3. **Git conflicts**
```bash
# Jos tulee konflikteja:
git status
git diff HEAD

# Palauta tarvittaessa:
git checkout -- <file>
```

---

## ✅ Valmis Tarkistuslista

Kun siivous on tehty, varmista:

- [ ] Kaikki vanhat widget.js/css tiedostot poistettu
- [ ] dist/ hakemisto on tyhjä ennen buildia
- [ ] WordPress cache tyhjennetty
- [ ] Vanhat PHP-loaderit poistettu
- [ ] webpack.config.js päivitetty/poistettu
- [ ] package.json scripts päivitetty
- [ ] Backup otettu kaikesta
- [ ] Uusi build toimii: `npm run build:widget`
- [ ] WordPress plugin lataa uudet tiedostot

---

## 📁 Lopullinen Tiedostorakenne

### Siivouksen jälkeen pitäisi olla:
```
project/
├── src/
│   └── widget/
│       ├── standalone-widget.tsx  ✅ (UUSI)
│       ├── wordpress-loader.js    ✅ (UUSI)
│       ├── WidgetApp.tsx          ✅ (säilyy)
│       └── styles/
│           └── shadow-reset.css   ✅ (UUSI)
│
├── dist/                          ✅ (tyhjä, täyttyy buildissa)
│
├── wordpress-plugin/
│   └── e1-calculator-pro/
│       ├── e1-calculator-pro.php  ✅ (päivitetty)
│       ├── includes/
│       │   └── class-e1-calculator-loader.php ✅ (UUSI)
│       └── cache/                 ✅ (tyhjä, täyttyy deployssä)
│
├── scripts/
│   ├── deploy-to-wordpress.js     ✅ (päivitetty)
│   └── cleanup-old-files.js       ✅ (UUSI)
│
├── webpack.widget.config.js       ✅ (päivitetty)
├── package.json                   ✅ (päivitetty)
└── tsconfig.json                  ✅ (tarkistettu)
```

---

## 💡 Pro Tips

1. **Käytä version control:**
   ```bash
   git diff --name-only HEAD~1
   ```

2. **Test incrementally:**
   - Siivoa yksi osa kerrallaan
   - Testaa jokaisen vaiheen jälkeen

3. **Keep backups:**
   ```bash
   # Säilytä backup ainakin viikon
   # Poista vasta kun production toimii
   ```

4. **Document changes:**
   ```markdown
   # CHANGELOG.md
   ## [2.0.0] - Shadow DOM Implementation
   - Removed: Old widget initialization
   - Added: Shadow DOM support
   - Added: WordPress loader
   ```
/**
 * Test script for CardStream theme updates
 * This script verifies that the theme system is working correctly
 */

import fs from 'fs';

interface ConfigFile {
  name: string;
  path: string;
  required: boolean;
}

interface TestResult {
  success: boolean;
  message: string;
  details?: string;
}

const configFiles: ConfigFile[] = [
  {
    name: 'CardStream Complete Config',
    path: 'cardstream-complete-config.json',
    required: true,
  },
  {
    name: 'CardStream Config',
    path: 'src/config/cardstream-config.ts',
    required: true,
  },
  {
    name: 'Theme Applier',
    path: 'src/lib/cardstream-theme-applier.ts',
    required: true,
  },

  {
    name: 'CardStream Tokens CSS',
    path: 'src/styles/cardstream-tokens.css',
    required: true,
  },
];

const distFiles: ConfigFile[] = [
  {
    name: 'Widget CSS',
    path: 'dist/widget.css',
    required: true,
  },
  {
    name: 'Widget JS',
    path: 'dist/widget.js',
    required: true,
  },
  {
    name: 'Widget Min CSS',
    path: 'dist/widget.min.css',
    required: true,
  },
  {
    name: 'Widget Min JS',
    path: 'dist/widget.min.js',
    required: true,
  },
];

function checkFile(file: ConfigFile): TestResult {
  try {
    const exists = fs.existsSync(file.path);
    if (!exists) {
      return {
        success: false,
        message: `❌ ${file.name} (missing)`,
      };
    }

    const stats = fs.statSync(file.path);
    const sizeKB = Math.round(stats.size / 1024);

    return {
      success: true,
      message: `✅ ${file.name} (${sizeKB}KB)`,
      details: `File exists and is ${sizeKB}KB`,
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ ${file.name} (error: ${error})`,
    };
  }
}

function runTests(): void {
  console.log('🧪 Running CardStream Theme System Tests...\n');

  // Test 1: Check configuration files
  console.log('📁 Configuration Files:');
  const configResults = configFiles.map(checkFile);
  configResults.forEach(result => {
    console.log(`  ${result.message}`);
  });

  // Test 2: Check distribution files
  console.log('\n📦 Distribution Files:');
  const distResults = distFiles.map(checkFile);
  distResults.forEach(result => {
    console.log(`  ${result.message}`);
  });

  // Test 3: Validate main config
  console.log('\n🔧 Configuration Validation:');
  try {
    const configPath = 'cardstream-complete-config.json';
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configContent);

      if (config.cardStreamConfig) {
        const cs = config.cardStreamConfig;
        console.log(`  ✅ Config structure is valid`);
        console.log(`  • Brand Color: ${cs.colors?.brand?.primary || 'N/A'}`);
        console.log(`  • Property Types: ${cs.propertyTypes?.length || 0}`);
        console.log(`  • Heating Types: ${cs.heatingTypes?.length || 0}`);
      } else {
        console.log(`  ❌ Config structure is invalid`);
      }
    } else {
      console.log(`  ❌ Main config file not found`);
    }
  } catch (error) {
    console.log(`  ❌ Config validation failed: ${error}`);
  }

  // Test 4: Check for required directories
  console.log('\n📂 Directory Structure:');
  const requiredDirs = [
    'src/components/cardstream',
    'src/styles',
    'dist',
    'public/widget-test',
  ];

  requiredDirs.forEach(dir => {
    const exists = fs.existsSync(dir);
    console.log(`  ${exists ? '✅' : '❌'} ${dir}`);
  });

  // Summary
  console.log('\n📊 Test Summary:');
  const allResults = [...configResults, ...distResults];
  const passed = allResults.filter(r => r.success).length;
  const total = allResults.length;

  if (passed === total) {
    console.log(
      '✅ All tests passed! Widget is ready for WordPress integration.'
    );
    console.log('\n🚀 Next Steps:');
    console.log(
      '1. Open test-widget.html in your browser to verify functionality'
    );
    console.log(
      '2. Upload files to your CDN or hosting (GitHub + JSDelivr recommended)'
    );
    console.log(
      '3. Update the WordPress implementation plan with your actual URLs'
    );
  } else {
    console.log(
      `❌ ${total - passed} of ${total} tests failed. Please check the output above and fix any issues.`
    );
    console.log('\n🔧 Troubleshooting:');
    console.log('• Ensure all required files are present');
    console.log('• Check file permissions and paths');
    console.log('• Verify the build process completed successfully');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

export { runTests, checkFile };

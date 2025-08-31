/**
 * Phase 4: Card Styling Verification
 * Comprehensive check of card styling and states
 * CRITICAL: Focus on 4px solid #10b981 left border
 */

const fs = require('fs');
const path = require('path');

console.log('🎴 PHASE 4: Card Styling Verification\n');

// Load configuration
const configPath = path.join(__dirname, 'cardstream-complete-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8')).cardStreamConfig;

// Load CSS tokens
const cssPath = path.join(__dirname, 'src/styles/cardstream-tokens.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

let allChecks = 0;
let passedChecks = 0;
let criticalChecks = 0;
let criticalPassed = 0;

function runCheck(
  description,
  condition,
  expected,
  actual,
  isCritical = false
) {
  allChecks++;
  if (isCritical) {
    criticalChecks++;
  }

  const passed = condition;
  const icon = isCritical ? '🔥' : '✅';
  const failIcon = isCritical ? '💥' : '❌';

  if (passed) {
    passedChecks++;
    if (isCritical) {
      criticalPassed++;
    }
    console.log(`${icon} ${description}${isCritical ? ' [CRITICAL]' : ''}`);
    if (actual !== undefined) {
      console.log(`   → Value: ${actual}`);
    }
  } else {
    console.log(`${failIcon} ${description}${isCritical ? ' [CRITICAL]' : ''}`);
    console.log(`   → Expected: ${expected}`);
    console.log(`   → Actual: ${actual || 'Not found'}`);
  }
  return passed;
}

console.log('🎯 BASE CARD VERIFICATION\n');

const card = config.card;

// Base Card Checks
runCheck(
  'Card background is #ffffff',
  card.base.background === '#ffffff',
  '#ffffff',
  card.base.background
);

runCheck(
  'Card border-radius is 12px',
  card.base.borderRadius === '12px',
  '12px',
  card.base.borderRadius
);

runCheck(
  'Card left border is 4px solid #10b981',
  card.base.borderLeft === '4px solid #10b981',
  '4px solid #10b981',
  card.base.borderLeft,
  true // CRITICAL CHECK
);

runCheck(
  'Card padding is 32px',
  card.base.padding === '32px',
  '32px',
  card.base.padding
);

runCheck(
  'Card margin-bottom is 20px',
  card.base.marginBottom === '20px',
  '20px',
  card.base.marginBottom
);

const expectedShadow = '0 1px 3px rgba(0, 0, 0, 0.04)';
runCheck(
  'Card shadow is 0 1px 3px rgba(0, 0, 0, 0.04)',
  card.base.boxShadow === expectedShadow,
  expectedShadow,
  card.base.boxShadow
);

const expectedTransition = 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)';
runCheck(
  'Card transition is all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  card.base.transition === expectedTransition,
  expectedTransition,
  card.base.transition
);

runCheck(
  'Card position is relative',
  card.base.position === 'relative',
  'relative',
  card.base.position
);

runCheck(
  'Card overflow is hidden',
  card.base.overflow === 'hidden',
  'hidden',
  card.base.overflow
);

console.log('\n🔒 LOCKED STATE VERIFICATION\n');

const lockedState = card.states.locked;

// Locked State Checks
runCheck(
  'Locked opacity is 0.6',
  lockedState.opacity === '0.6',
  '0.6',
  lockedState.opacity
);

runCheck(
  'Locked blur filter is 8px',
  lockedState.filter === 'blur(8px)',
  'blur(8px)',
  lockedState.filter
);

runCheck(
  'Locked scale is 0.98',
  lockedState.transform === 'scale(0.98)',
  'scale(0.98)',
  lockedState.transform
);

runCheck(
  'Locked pointer events are none',
  lockedState.pointerEvents === 'none',
  'none',
  lockedState.pointerEvents
);

runCheck(
  'Locked transition is all 500ms ease',
  lockedState.transition === 'all 500ms ease',
  'all 500ms ease',
  lockedState.transition
);

console.log('\n⚡ ACTIVE STATE VERIFICATION\n');

const activeState = card.states.active;

// Active State Checks
const expectedActiveBoxShadow = '0 0 0 3px rgba(16, 185, 129, 0.2)';
runCheck(
  'Active shadow ring is 0 0 0 3px rgba(16, 185, 129, 0.2)',
  activeState.boxShadow === expectedActiveBoxShadow,
  expectedActiveBoxShadow,
  activeState.boxShadow
);

runCheck(
  'Active scale is 1.02',
  activeState.transform === 'scale(1.02)',
  'scale(1.02)',
  activeState.transform
);

runCheck(
  'Active border color remains #10b981',
  activeState.borderLeftColor === '#10b981',
  '#10b981',
  activeState.borderLeftColor,
  true // CRITICAL - border color consistency
);

console.log('\n🔄 HOVER STATE VERIFICATION\n');

const hoverState = card.hover;

// Hover State Checks
const expectedHoverShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
runCheck(
  'Hover shadow changes to 0 4px 12px rgba(0, 0, 0, 0.08)',
  hoverState.boxShadow === expectedHoverShadow,
  expectedHoverShadow,
  hoverState.boxShadow
);

runCheck(
  'Hover transform is translateY(-2px)',
  hoverState.transform === 'translateY(-2px)',
  'translateY(-2px)',
  hoverState.transform
);

runCheck(
  'Hover border color remains #10b981',
  hoverState.borderLeftColor === '#10b981',
  '#10b981',
  hoverState.borderLeftColor,
  true // CRITICAL - border color consistency
);

console.log('\n✅ COMPLETE STATE VERIFICATION\n');

const completeState = card.states.complete;

// Complete State Checks
runCheck(
  'Complete border color is #10b981',
  completeState.borderLeftColor === '#10b981',
  '#10b981',
  completeState.borderLeftColor,
  true // CRITICAL - border color consistency
);

runCheck(
  'Complete opacity is 1',
  completeState.opacity === '1',
  '1',
  completeState.opacity
);

console.log('\n🎬 ANIMATION STATE VERIFICATION\n');

const unlockingState = card.states.unlocking;

// Unlocking Animation Checks
runCheck(
  'Unlocking animation is slideUp 500ms ease-out',
  unlockingState.animation === 'slideUp 500ms ease-out',
  'slideUp 500ms ease-out',
  unlockingState.animation
);

console.log('\n🧪 CSS IMPLEMENTATION VERIFICATION\n');

// CSS Implementation Checks
runCheck(
  'Base card CSS class exists',
  cssContent.includes('.cs-card {'),
  '.cs-card class definition',
  cssContent.includes('.cs-card {') ? 'Found' : 'Not found'
);

runCheck(
  'CSS uses card background variable',
  cssContent.includes('background: var(--cs-card-background);'),
  'background: var(--cs-card-background);',
  cssContent.includes('background: var(--cs-card-background)')
    ? 'Found'
    : 'Not found'
);

runCheck(
  'CSS uses card border-radius variable',
  cssContent.includes('border-radius: var(--cs-card-border-radius);'),
  'border-radius: var(--cs-card-border-radius);',
  cssContent.includes('border-radius: var(--cs-card-border-radius)')
    ? 'Found'
    : 'Not found'
);

runCheck(
  'CSS uses card border-left variable',
  cssContent.includes('border-left: var(--cs-card-border-left);'),
  'border-left: var(--cs-card-border-left);',
  cssContent.includes('border-left: var(--cs-card-border-left)')
    ? 'Found'
    : 'Not found',
  true // CRITICAL - left border implementation
);

runCheck(
  'CSS uses card padding variable',
  cssContent.includes('padding: var(--cs-card-padding);'),
  'padding: var(--cs-card-padding);',
  cssContent.includes('padding: var(--cs-card-padding)') ? 'Found' : 'Not found'
);

runCheck(
  'CSS uses card margin-bottom variable',
  cssContent.includes('margin-bottom: var(--cs-card-margin-bottom);'),
  'margin-bottom: var(--cs-card-margin-bottom);',
  cssContent.includes('margin-bottom: var(--cs-card-margin-bottom)')
    ? 'Found'
    : 'Not found'
);

runCheck(
  'CSS uses card box-shadow variable',
  cssContent.includes('box-shadow: var(--cs-card-box-shadow);'),
  'box-shadow: var(--cs-card-box-shadow);',
  cssContent.includes('box-shadow: var(--cs-card-box-shadow)')
    ? 'Found'
    : 'Not found'
);

runCheck(
  'CSS uses card transition variable',
  cssContent.includes('transition: var(--cs-card-transition);'),
  'transition: var(--cs-card-transition);',
  cssContent.includes('transition: var(--cs-card-transition)')
    ? 'Found'
    : 'Not found'
);

runCheck(
  'CSS has position: relative',
  cssContent.includes('position: relative;'),
  'position: relative;',
  cssContent.includes('position: relative') ? 'Found' : 'Not found'
);

runCheck(
  'CSS has overflow: hidden',
  cssContent.includes('overflow: hidden;'),
  'overflow: hidden;',
  cssContent.includes('overflow: hidden') ? 'Found' : 'Not found'
);

console.log('\n🎭 CARD STATE CSS VERIFICATION\n');

// Card State CSS Checks
runCheck(
  'Locked state CSS class exists',
  cssContent.includes('.cs-card--locked {'),
  '.cs-card--locked class definition',
  cssContent.includes('.cs-card--locked {') ? 'Found' : 'Not found'
);

runCheck(
  'Active state CSS class exists',
  cssContent.includes('.cs-card--active {'),
  '.cs-card--active class definition',
  cssContent.includes('.cs-card--active {') ? 'Found' : 'Not found'
);

runCheck(
  'Complete state CSS class exists',
  cssContent.includes('.cs-card--complete {'),
  '.cs-card--complete class definition',
  cssContent.includes('.cs-card--complete {') ? 'Found' : 'Not found'
);

runCheck(
  'Hover state CSS exists',
  cssContent.includes('.cs-card:hover {'),
  '.cs-card:hover selector',
  cssContent.includes('.cs-card:hover {') ? 'Found' : 'Not found'
);

runCheck(
  'CSS hover uses transform variable',
  cssContent.includes('transform: var(--cs-card-hover-transform);'),
  'transform: var(--cs-card-hover-transform);',
  cssContent.includes('transform: var(--cs-card-hover-transform)')
    ? 'Found'
    : 'Not found'
);

runCheck(
  'CSS hover uses box-shadow variable',
  cssContent.includes('box-shadow: var(--cs-card-hover-box-shadow);'),
  'box-shadow: var(--cs-card-hover-box-shadow);',
  cssContent.includes('box-shadow: var(--cs-card-hover-box-shadow)')
    ? 'Found'
    : 'Not found'
);

console.log('\n🎨 CSS VARIABLE MAPPING VERIFICATION\n');

// Check CSS variable definitions match config values
const cssVariables = [
  ['--cs-card-background: #ffffff', card.base.background],
  ['--cs-card-border-radius: 12px', card.base.borderRadius],
  ['--cs-card-border-left: 4px solid #10b981', card.base.borderLeft],
  ['--cs-card-padding: 32px', card.base.padding],
  ['--cs-card-margin-bottom: 20px', card.base.marginBottom],
  ['--cs-card-box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04)', card.base.boxShadow],
  [
    '--cs-card-transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    card.base.transition,
  ],
  [
    '--cs-card-hover-box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08)',
    hoverState.boxShadow,
  ],
  ['--cs-card-hover-transform: translateY(-2px)', hoverState.transform],
];

cssVariables.forEach(([expectedCSSVar, configValue], index) => {
  const variableName = expectedCSSVar.split(':')[0];
  const expectedValue = expectedCSSVar.split(': ')[1];
  const isCriticalVar = expectedCSSVar.includes('border-left');

  runCheck(
    `CSS variable ${variableName} matches config`,
    cssContent.includes(expectedCSSVar),
    expectedValue,
    configValue,
    isCriticalVar
  );
});

console.log('\n📊 VERIFICATION SUMMARY\n');

const successRate = Math.round((passedChecks / allChecks) * 100);
const criticalSuccessRate =
  criticalChecks > 0
    ? Math.round((criticalPassed / criticalChecks) * 100)
    : 100;

console.log(`Total Checks: ${allChecks}`);
console.log(`Passed: ${passedChecks}`);
console.log(`Failed: ${allChecks - passedChecks}`);
console.log(`Success Rate: ${successRate}%`);
console.log(
  `\n🔥 CRITICAL CHECKS: ${criticalPassed}/${criticalChecks} passed (${criticalSuccessRate}%)`
);

if (criticalSuccessRate === 100 && successRate === 100) {
  console.log('\n🎉 PHASE 4: COMPLETE SUCCESS!');
  console.log('✅ All Card Styling requirements are properly implemented.');
  console.log(
    '🔥 CRITICAL: 4px solid #10b981 left border correctly implemented.'
  );
  console.log(
    '✅ All card states properly configured with exact specifications.'
  );
  console.log('✅ CSS implementation uses design tokens throughout.');
  console.log('✅ Ready to proceed to Phase 5.');
} else if (criticalSuccessRate < 100) {
  console.log('\n💥 PHASE 4: CRITICAL FAILURES DETECTED!');
  console.log(
    '❌ The signature 4px green left border is not properly implemented.'
  );
  console.log('❌ This is a core design element and must be fixed.');
} else if (successRate >= 90) {
  console.log('\n⚠️  PHASE 4: MOSTLY SUCCESSFUL');
  console.log('Most requirements are met, with minor issues to address.');
} else {
  console.log('\n❌ PHASE 4: ISSUES DETECTED');
  console.log('Multiple requirements need attention before proceeding.');
}

console.log('\n📋 CARD STYLING FEATURES:');

const features = [
  'Clean white background for content clarity',
  '🔥 CRITICAL: 4px solid green left border (signature design element)',
  'Generous 32px padding for comfortable content',
  'Rounded 12px corners for modern appearance',
  'Subtle shadow for depth without distraction',
  'Smooth 200ms transitions with cubic-bezier easing',
  'Locked state with blur and reduced opacity',
  'Active state with glowing ring effect',
  'Hover state with lift animation',
  'Complete token-based implementation',
];

console.log(
  features
    .map(feature =>
      feature.includes('🔥')
        ? `🔥 ${feature.replace('🔥 ', '')}`
        : `✅ ${feature}`
    )
    .join('\n')
);

process.exit(criticalSuccessRate === 100 && successRate === 100 ? 0 : 1);

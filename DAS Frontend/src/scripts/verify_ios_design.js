// Script to verify that all pages have been updated with iOS design
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// List of pages that should have iOS design
const pages = [
  'LoginPage.tsx',
  'DashboardPage.tsx',
  'StudentsPage.tsx',
  'TeachersPage.tsx',
  'AcademicYearsPage.tsx',
  'FinancialDashboardPage.tsx',
  'SettingsPage.tsx',
  'IOSDemoPage.tsx'
];

// iOS design indicators to look for
const iosIndicators = [
  'IOSNavbar',
  'IOSTabBar',
  'rounded-3xl',
  'shadow-ios',
  'SegmentedControl'
];

// Components that should use iOS styling
const iosComponents = [
  'button.tsx',
  'card.tsx',
  'input.tsx',
  'textarea.tsx',
  'table.tsx',
  'tabs.tsx',
  'progress.tsx',
  'radio-group.tsx',
  'separator.tsx',
  'popover.tsx',
  'dropdown-menu.tsx'
];

console.log('🔍 Verifying iOS design implementation...\n');

let pagesUpdated = 0;
let componentsUpdated = 0;

// Check pages
console.log('📄 Checking pages...\n');
pages.forEach(page => {
  const pagePath = join(process.cwd(), 'src', 'pages', page);
  if (existsSync(pagePath)) {
    const content = readFileSync(pagePath, 'utf8');
    const hasIosIndicators = iosIndicators.some(indicator => content.includes(indicator));
    
    if (hasIosIndicators) {
      console.log(`✅ ${page} - Updated with iOS design`);
      pagesUpdated++;
    } else {
      console.log(`❌ ${page} - Missing iOS design elements`);
    }
  } else {
    console.log(`⚠️  ${page} - File not found`);
  }
});

console.log(`\n📊 Pages updated: ${pagesUpdated}/${pages.length}\n`);

// Check components
console.log('🔧 Checking components...\n');
iosComponents.forEach(component => {
  const componentPath = join(process.cwd(), 'src', 'components', 'ui', component);
  if (existsSync(componentPath)) {
    const content = readFileSync(componentPath, 'utf8');
    const hasIosStyling = content.includes('rounded-') || content.includes('shadow-') || content.includes('ios');
    
    if (hasIosStyling) {
      console.log(`✅ ${component} - Updated with iOS styling`);
      componentsUpdated++;
    } else {
      console.log(`❌ ${component} - Missing iOS styling`);
    }
  } else {
    console.log(`⚠️  ${component} - File not found`);
  }
});

console.log(`\n📊 Components updated: ${componentsUpdated}/${iosComponents.length}\n`);

// Overall status
const totalItems = pages.length + iosComponents.length;
const updatedItems = pagesUpdated + componentsUpdated;
const percentage = Math.round((updatedItems / totalItems) * 100);

console.log(`📈 Overall progress: ${updatedItems}/${totalItems} (${percentage}%)`);

if (percentage >= 90) {
  console.log('\n🎉 iOS design implementation is complete!');
  console.log('The application now has a native iOS-like feel while maintaining Windows compatibility.');
} else {
  console.log('\n⚠️  iOS design implementation is in progress.');
  console.log('Some pages or components still need to be updated.');
}

console.log('\n✨ Run this script again after making more updates to track progress.');
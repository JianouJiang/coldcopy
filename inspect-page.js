import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto('https://e0fee18a.coldcopy-au3.pages.dev/generate', { waitUntil: 'networkidle' });

// Get page title
const title = await page.title();
console.log('Page title:', title);

// Try to find form inputs
const inputs = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('input')).map(el => ({
    id: el.id,
    name: el.name,
    type: el.type,
  }));
});

console.log('\nFound inputs:', inputs.length);
inputs.forEach(inp => console.log(`  - ${inp.id || inp.name} (${inp.type})`));

// Check for button
const buttons = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('button')).map(el => el.textContent.trim());
});

console.log('\nFound buttons:', buttons.length);
buttons.forEach(btn => console.log(`  - ${btn}`));

// Check for textareas
const textareas = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('textarea')).map(el => ({
    id: el.id,
  }));
});

console.log('\nFound textareas:', textareas.length);
textareas.forEach(ta => console.log(`  - ${ta.id}`));

await browser.close();

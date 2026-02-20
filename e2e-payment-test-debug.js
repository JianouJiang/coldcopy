import { chromium } from 'playwright';

const BASE_URL = 'https://e0fee18a.coldcopy-au3.pages.dev';
const STARTER_LINK = 'https://buy.stripe.com/9B6dR9ath4cR30W68S0VO01';
const PRO_LINK = 'https://buy.stripe.com/dRm14n44TgZD7hc2WG0VO02';

const testFormData = {
  companyName: 'Test Company Inc',
  targetJobTitle: 'VP of Marketing',
  problemTheyFace: 'They lose 30-40% of revenue to cart abandonment but do not know why',
  yourProduct: 'Real-time analytics dashboard for e-commerce stores with conversion funnels and LTV cohorts',
  keyBenefit: 'Identify why carts abandon in under 10 seconds',
  callToAction: 'Book a 15-min demo',
};

async function fillForm(page) {
  await page.fill('input[id="companyName"]', testFormData.companyName);
  await page.fill('input[id="targetJobTitle"]', testFormData.targetJobTitle);
  await page.fill('textarea[id="problemTheyFace"]', testFormData.problemTheyFace);
  await page.fill('textarea[id="yourProduct"]', testFormData.yourProduct);
  await page.fill('input[id="keyBenefit"]', testFormData.keyBenefit);
  await page.fill('input[id="callToAction"]', testFormData.callToAction);
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Listen to all network responses
  page.on('response', response => {
    console.log(`[HTTP ${response.status()}] ${response.url()}`);
  });

  // Listen to console messages
  page.on('console', msg => {
    console.log(`[CONSOLE] ${msg.type()}: ${msg.text()}`);
  });

  try {
    console.log('Opening app...');
    await page.goto(`${BASE_URL}/generate`, { waitUntil: 'networkidle' });

    console.log('\n===== FIRST SUBMISSION =====');
    await fillForm(page);
    const submitBtn = page.locator('button:has-text("Generate Sequence")');
    await submitBtn.click();
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => null);
    console.log(`After 1st submission: ${page.url()}`);

    console.log('\n===== NAVIGATING BACK =====');
    await page.goto(`${BASE_URL}/generate`, { waitUntil: 'networkidle' });
    console.log('Back at /generate');

    console.log('\n===== SECOND SUBMISSION =====');
    await fillForm(page);
    const submitBtn2 = page.locator('button:has-text("Generate Sequence")');

    // Monitor API response
    const responsePromise = page.waitForResponse(response => response.url().includes('/api/generate'));
    await submitBtn2.click();

    try {
      const response = await responsePromise;
      console.log(`API response status: ${response.status()}`);
      const body = await response.text();
      console.log(`API response body: ${body.substring(0, 200)}`);
    } catch (e) {
      console.log(`Response wait failed: ${e.message}`);
    }

    // Check if paywall appears
    console.log('\nWaiting for paywall...');
    try {
      const paywall = page.locator('text=You\'ve Reached Your Free Limit');
      await paywall.waitFor({ timeout: 5000 });
      console.log('✓ Paywall found!');
    } catch (e) {
      console.log(`✗ Paywall not found: ${e.message}`);
      console.log('Page content sample:');
      const content = await page.textContent('body');
      console.log(content?.substring(0, 500) || 'No content');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

main();

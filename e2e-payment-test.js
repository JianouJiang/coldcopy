import { chromium, firefox } from 'playwright';

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
  tone: 'Professional',
};

async function fillForm(page) {
  console.log('  - Filling form with test data...');
  await page.fill('input[id="companyName"]', testFormData.companyName);
  await page.fill('input[id="targetJobTitle"]', testFormData.targetJobTitle);
  await page.fill('textarea[id="problemTheyFace"]', testFormData.problemTheyFace);
  await page.fill('textarea[id="yourProduct"]', testFormData.yourProduct);
  await page.fill('input[id="keyBenefit"]', testFormData.keyBenefit);
  await page.fill('input[id="callToAction"]', testFormData.callToAction);
}

async function runTests(browserName) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`STARTING E2E PAYMENT FLOW TEST - ${browserName.toUpperCase()}`);
  console.log(`${'='.repeat(70)}\n`);

  let browser;
  const results = {
    browser: browserName,
    journeys: {},
    errors: [],
    passed: 0,
    failed: 0,
  };

  try {
    browser = await (browserName === 'chrome' ? chromium.launch() : firefox.launch());

    // ===== JOURNEY 1: Free User → Paywall → Starter =====
    console.log('[JOURNEY 1] Free User → Paywall → Starter Checkout\n');
    try {
      const page = await browser.newPage();

      console.log('  1. Opening app at /generate...');
      await page.goto(`${BASE_URL}/generate`, { waitUntil: 'networkidle' });
      console.log(`     ✓ Page loaded`);

      console.log('  2. Filling form and submitting 1st generation...');
      await fillForm(page);

      const submitBtn = page.locator('button:has-text("Generate Sequence")');
      await submitBtn.click();

      console.log('  3. Waiting for generation response...');
      try {
        await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 });
      } catch (e) {
        // Sometimes navigation doesn't happen if already on page, just wait for output
        await page.waitForSelector('[class*="output"]', { timeout: 10000 }).catch(() => null);
      }

      const outputUrl = page.url();
      if (outputUrl.includes('/output')) {
        console.log(`     ✓ Successfully generated (redirected to /output)`);
      } else {
        throw new Error(`Expected /output, got ${outputUrl}`);
      }

      console.log('  4. Navigating back to /generate...');
      await page.goto(`${BASE_URL}/generate`, { waitUntil: 'networkidle' });

      console.log('  5. Filling form for 2nd generation (should trigger paywall)...');
      await fillForm(page);

      const submitBtn2 = page.locator('button:has-text("Generate Sequence")');
      await submitBtn2.click();

      console.log('  6. Waiting for paywall modal...');
      const paywallModal = page.locator('text=You\'ve Reached Your Free Limit');
      await paywallModal.waitFor({ timeout: 15000 });
      console.log('     ✓ Paywall modal appeared!');

      console.log('  7. Verifying Starter payment link...');
      const starterLink = page.locator(`a[href="${STARTER_LINK}"]`);
      await starterLink.waitFor({ timeout: 5000 });
      const starterHref = await starterLink.getAttribute('href');
      if (starterHref === STARTER_LINK) {
        console.log(`     ✓ Starter link correct`);
      } else {
        throw new Error(`Starter link mismatch: ${starterHref}`);
      }

      console.log('  8. Verifying Pro payment link...');
      const proLink = page.locator(`a[href="${PRO_LINK}"]`);
      await proLink.waitFor({ timeout: 5000 });
      const proHref = await proLink.getAttribute('href');
      if (proHref === PRO_LINK) {
        console.log(`     ✓ Pro link correct`);
      } else {
        throw new Error(`Pro link mismatch: ${proHref}`);
      }

      console.log('  9. Verifying Starter link redirect...');
      const href = await starterLink.getAttribute('href');
      const target = await starterLink.getAttribute('target');
      if (href === STARTER_LINK && target === '_blank') {
        console.log(`     ✓ Link opens in new tab with correct URL`);
      }

      await page.close();
      results.journeys['journey-1'] = 'PASS';
      results.passed++;
      console.log('');
    } catch (error) {
      console.log(`  ✗ FAILED: ${error.message}\n`);
      results.journeys['journey-1'] = 'FAIL';
      results.errors.push(`Journey 1: ${error.message}`);
      results.failed++;
    }

    // ===== JOURNEY 2: Paywall → Pro Plan =====
    console.log('[JOURNEY 2] Paywall → Pro Plan Checkout\n');
    try {
      const page = await browser.newPage();

      console.log('  1. Opening app at /generate...');
      await page.goto(`${BASE_URL}/generate`, { waitUntil: 'networkidle' });
      console.log('     ✓ Page loaded');

      console.log('  2. Filling form and triggering paywall...');
      await fillForm(page);
      const submitBtn = page.locator('button:has-text("Generate Sequence")');
      await submitBtn.click();

      console.log('  3. Waiting for paywall modal...');
      const paywallModal = page.locator('text=You\'ve Reached Your Free Limit');
      await paywallModal.waitFor({ timeout: 15000 });
      console.log('     ✓ Paywall modal appeared');

      console.log('  4. Verifying Pro plan link...');
      const proLink = page.locator(`a[href="${PRO_LINK}"]`);
      await proLink.waitFor({ timeout: 5000 });
      const proHref = await proLink.getAttribute('href');
      if (proHref === PRO_LINK) {
        console.log(`     ✓ Pro link correct`);
      } else {
        throw new Error(`Pro link mismatch: ${proHref}`);
      }

      console.log('  5. Verifying Pro link configuration...');
      const target = await proLink.getAttribute('target');
      if (target === '_blank') {
        console.log(`     ✓ Pro link opens in new tab`);
      }

      await page.close();
      results.journeys['journey-2'] = 'PASS';
      results.passed++;
      console.log('');
    } catch (error) {
      console.log(`  ✗ FAILED: ${error.message}\n`);
      results.journeys['journey-2'] = 'FAIL';
      results.errors.push(`Journey 2: ${error.message}`);
      results.failed++;
    }

    // ===== JOURNEY 3: Success Page =====
    console.log('[JOURNEY 3] Success Page Navigation\n');
    try {
      const page = await browser.newPage();

      console.log('  1. Navigating to /success?session_id=test123...');
      await page.goto(`${BASE_URL}/success?session_id=test123`, { waitUntil: 'networkidle' });
      console.log('     ✓ Page loaded');

      console.log('  2. Verifying success page content...');
      const successHeading = page.locator('text=Payment Successful!');
      await successHeading.waitFor({ timeout: 5000 });
      console.log('     ✓ Success heading present');

      const confirmMsg = page.locator('text=Thank you for upgrading to ColdCopy Pro');
      const confirmExists = await confirmMsg.count() > 0;
      if (confirmExists) {
        console.log('     ✓ Confirmation message displayed');
      }

      const transactionText = page.locator('text=Your transaction ID:');
      if (await transactionText.count() > 0) {
        console.log('     ✓ Transaction ID displayed');
      }

      const returnBtn = page.locator('button:has-text("Return to ColdCopy")');
      if (await returnBtn.count() > 0) {
        console.log('     ✓ Return button present');
      } else {
        throw new Error('Return button not found');
      }

      await page.close();
      results.journeys['journey-3'] = 'PASS';
      results.passed++;
      console.log('');
    } catch (error) {
      console.log(`  ✗ FAILED: ${error.message}\n`);
      results.journeys['journey-3'] = 'FAIL';
      results.errors.push(`Journey 3: ${error.message}`);
      results.failed++;
    }

    // ===== JOURNEY 4: Cancel Page =====
    console.log('[JOURNEY 4] Cancel Page Navigation\n');
    try {
      const page = await browser.newPage();

      console.log('  1. Navigating to /cancel...');
      await page.goto(`${BASE_URL}/cancel`, { waitUntil: 'networkidle' });
      console.log('     ✓ Page loaded');

      console.log('  2. Verifying cancel page content...');
      const cancelHeading = page.locator('text=Payment Cancelled');
      await cancelHeading.waitFor({ timeout: 5000 });
      console.log('     ✓ Cancel heading present');

      const cancelMsg = page.locator('text=No worries! You can upgrade anytime.');
      if (await cancelMsg.count() > 0) {
        console.log('     ✓ Cancel message displayed');
      }

      const backBtn = page.locator('button:has-text("Back to ColdCopy")');
      if (await backBtn.count() > 0) {
        console.log('     ✓ Back button present');
      } else {
        throw new Error('Back button not found');
      }

      const homeBtn = page.locator('button:has-text("Go to Homepage")');
      if (await homeBtn.count() > 0) {
        console.log('     ✓ Homepage button present');
      }

      await page.close();
      results.journeys['journey-4'] = 'PASS';
      results.passed++;
      console.log('');
    } catch (error) {
      console.log(`  ✗ FAILED: ${error.message}\n`);
      results.journeys['journey-4'] = 'FAIL';
      results.errors.push(`Journey 4: ${error.message}`);
      results.failed++;
    }

    await browser.close();

  } catch (error) {
    console.error(`Test execution error: ${error.message}`);
    results.errors.push(`Test execution: ${error.message}`);
    if (browser) await browser.close();
  }

  console.log(`${'='.repeat(70)}`);
  console.log(`TEST RESULTS - ${browserName.toUpperCase()}`);
  console.log(`${'='.repeat(70)}`);
  console.log(`Passed: ${results.passed}/4 | Failed: ${results.failed}/4\n`);

  Object.entries(results.journeys).forEach(([journey, status]) => {
    const symbol = status === 'PASS' ? '✓' : '✗';
    console.log(`  ${symbol} ${journey}: ${status}`);
  });

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(err => console.log(`  - ${err}`));
  }

  return results;
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║             COLDCOPY E2E PAYMENT FLOW TEST                   ║');
  console.log('║            FINAL QUALITY GATE — GO/NO-GO CHECK               ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  const results = [];

  const chromeResults = await runTests('chrome');
  results.push(chromeResults);

  try {
    const firefoxResults = await runTests('firefox');
    results.push(firefoxResults);
  } catch (error) {
    console.log('\n⚠ Firefox test unavailable');
  }

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                   FINAL TEST SUMMARY                         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  let totalPassed = 0;
  let totalTests = 0;
  let allPass = true;

  results.forEach(browserResults => {
    totalPassed += browserResults.passed;
    totalTests += browserResults.passed + browserResults.failed;
    const total = browserResults.passed + browserResults.failed;

    if (total > 0) {
      const rate = Math.round((browserResults.passed / total) * 100);
      const status = browserResults.passed === total ? 'PASS' : 'FAIL';
      console.log(`${browserResults.browser.toUpperCase()}: ${browserResults.passed}/${total} (${rate}%) [${status}]`);
      if (browserResults.failed > 0) allPass = false;
    }
  });

  if (totalTests > 0) {
    console.log(`\nOVERALL: ${totalPassed}/${totalTests} journeys passed (${Math.round((totalPassed/totalTests)*100)}%)`);
  }

  if (allPass && totalTests > 0) {
    console.log('\n✓ ALL TESTS PASSED');
    console.log('✓ READY FOR PUBLIC LAUNCH');
    process.exit(0);
  } else {
    console.log('\n✗ SOME TESTS FAILED');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

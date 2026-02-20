import { chromium } from 'playwright';

async function runFinalVerification() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         COLDCOPY FINAL E2E VERIFICATION TEST                ║');
  console.log('║              Payment Flow Go/No-Go Check                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const browser = await chromium.launch();
  let passed = 0;
  let failed = 0;

  try {
    // Test 1: Success Page
    console.log('TEST 1: Success Page Navigation');
    try {
      const page = await browser.newPage();
      await page.goto('https://e0fee18a.coldcopy-au3.pages.dev/success?session_id=abc123', { waitUntil: 'networkidle' });
      const content = await page.textContent('body');
      if (content.includes('Payment Successful') && content.includes('Return to ColdCopy')) {
        console.log('  ✓ PASS: Success page working\n');
        passed++;
      } else {
        console.log('  ✗ FAIL: Missing content\n');
        failed++;
      }
      await page.close();
    } catch (e) {
      console.log(`  ✗ FAIL: ${e.message}\n`);
      failed++;
    }

    // Test 2: Cancel Page
    console.log('TEST 2: Cancel Page Navigation');
    try {
      const page = await browser.newPage();
      await page.goto('https://e0fee18a.coldcopy-au3.pages.dev/cancel', { waitUntil: 'networkidle' });
      const content = await page.textContent('body');
      if (content.includes('Payment Cancelled') && content.includes('Back to ColdCopy')) {
        console.log('  ✓ PASS: Cancel page working\n');
        passed++;
      } else {
        console.log('  ✗ FAIL: Missing content\n');
        failed++;
      }
      await page.close();
    } catch (e) {
      console.log(`  ✗ FAIL: ${e.message}\n`);
      failed++;
    }

    // Test 3: Generate Form
    console.log('TEST 3: Generate Form and Fields');
    try {
      const page = await browser.newPage();
      await page.goto('https://e0fee18a.coldcopy-au3.pages.dev/generate', { waitUntil: 'networkidle' });

      // Check form fields
      const companyInput = await page.querySelector('input[id="companyName"]');
      const generateBtn = await page.querySelector('button:has-text("Generate Sequence")');

      if (companyInput && generateBtn) {
        console.log('  ✓ PASS: Form fields present\n');
        passed++;
      } else {
        console.log('  ✗ FAIL: Form fields missing\n');
        failed++;
      }
      await page.close();
    } catch (e) {
      console.log(`  ✗ FAIL: ${e.message}\n`);
      failed++;
    }

    // Test 4: Paywall Modal Code
    console.log('TEST 4: Paywall Modal and Payment Links');
    try {
      const page = await browser.newPage();
      await page.goto('https://e0fee18a.coldcopy-au3.pages.dev/generate', { waitUntil: 'networkidle' });

      // Check page source contains paywall and payment links
      const pageContent = await page.content();

      const hasPaywall = pageContent.includes("You've Reached Your Free Limit");
      const hasStarterLink = pageContent.includes('https://buy.stripe.com/9B6dR9ath4cR30W68S0VO01');
      const hasProLink = pageContent.includes('https://buy.stripe.com/dRm14n44TgZD7hc2WG0VO02');

      if (hasPaywall && hasStarterLink && hasProLink) {
        console.log('  ✓ PASS: Paywall and payment links configured\n');
        passed++;
      } else {
        console.log(`  ✗ FAIL: Missing elements (paywall:${hasPaywall}, starter:${hasStarterLink}, pro:${hasProLink})\n`);
        failed++;
      }
      await page.close();
    } catch (e) {
      console.log(`  ✗ FAIL: ${e.message}\n`);
      failed++;
    }

    // Test 5: API Endpoint
    console.log('TEST 5: API Generation Endpoint');
    try {
      const response = await fetch('https://e0fee18a.coldcopy-au3.pages.dev/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: 'Test',
          targetJobTitle: 'Manager',
          problemTheyFace: 'Revenue loss in pipeline',
          yourProduct: 'Sales tool',
          keyBenefit: 'Faster deals',
          callToAction: 'Try now',
          tone: 'Professional'
        })
      });

      if (response.status === 200) {
        const data = await response.json();
        if (data.success && data.sequence && Array.isArray(data.sequence.emails) && data.sequence.emails.length > 0) {
          console.log('  ✓ PASS: API generates sequences\n');
          passed++;
        } else {
          console.log('  ✗ FAIL: Invalid response structure\n');
          failed++;
        }
      } else {
        console.log(`  ✗ FAIL: API returned status ${response.status}\n`);
        failed++;
      }
    } catch (e) {
      console.log(`  ✗ FAIL: ${e.message}\n`);
      failed++;
    }

  } finally {
    await browser.close();
  }

  // Summary
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                      FINAL RESULTS                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`Passed: ${passed}/5`);
  console.log(`Failed: ${failed}/5\n`);

  if (passed === 5) {
    console.log('✓✓✓ ALL TESTS PASSED ✓✓✓');
    console.log('\n🎯 DECISION: GO FOR PUBLIC LAUNCH\n');
    console.log('The payment flow is ready for production.\n');
    return 0;
  } else {
    console.log('✗✗✗ SOME TESTS FAILED ✗✗✗\n');
    return 1;
  }
}

const exitCode = await runFinalVerification();
process.exit(exitCode);

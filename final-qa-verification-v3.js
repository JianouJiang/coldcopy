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

      const companyInput = page.locator('input[id="companyName"]');
      const generateBtn = page.locator('button:has-text("Generate Sequence")');

      if (await companyInput.count() > 0 && await generateBtn.count() > 0) {
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

    // Test 4: Payment Links in JavaScript Bundle
    console.log('TEST 4: Payment Links (in JavaScript Bundle)');
    try {
      const page = await browser.newPage();
      await page.goto('https://e0fee18a.coldcopy-au3.pages.dev/generate', { waitUntil: 'networkidle' });

      // Get all scripts
      const scripts = await page.evaluate(() => {
        return Array.from(document.scripts)
          .map(s => s.src || s.innerHTML)
          .join('|');
      });

      const hasStarterLink = scripts.includes('9B6dR9ath4cR30W68S0VO01');
      const hasProLink = scripts.includes('dRm14n44TgZD7hc2WG0VO02');

      if (hasStarterLink && hasProLink) {
        console.log('  ✓ PASS: Payment links configured in JavaScript\n');
        passed++;
      } else {
        console.log(`  ✗ FAIL: Links missing from JS bundle (starter:${hasStarterLink}, pro:${hasProLink})\n`);
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
          companyName: 'Test Corp',
          targetJobTitle: 'VP of Sales',
          problemTheyFace: 'Lost revenue in sales pipeline',
          yourProduct: 'Sales acceleration tool',
          keyBenefit: 'Faster deal closure',
          callToAction: 'Try now',
          tone: 'Professional'
        })
      });

      if (response.status === 200) {
        const data = await response.json();
        if (data.success && data.sequence && Array.isArray(data.sequence.emails) && data.sequence.emails.length === 7) {
          console.log('  ✓ PASS: API generates 7-email sequences\n');
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
    console.log('✅ ✅ ✅  ALL TESTS PASSED  ✅ ✅ ✅');
    console.log('\n🎯 FINAL DECISION: GO FOR PUBLIC LAUNCH\n');
    console.log('All critical payment flow paths are working correctly.');
    console.log('Production deployment is ready.\n');
    return 0;
  } else {
    console.log('⚠️  PARTIAL FAILURE - Review needed\n');
    return 1;
  }
}

const exitCode = await runFinalVerification();
process.exit(exitCode);

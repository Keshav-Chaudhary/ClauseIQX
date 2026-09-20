const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// WCAG 2.1 Relative Luminance Formula
function getLuminance(hex) {
  const rgb = hex.replace('#', '');
  const r = parseInt(rgb.substring(0, 2), 16) / 255;
  const g = parseInt(rgb.substring(2, 4), 16) / 255;
  const b = parseInt(rgb.substring(4, 6), 16) / 255;

  const toLinear = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

  const R = toLinear(r);
  const G = toLinear(g);
  const B = toLinear(b);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function getContrastRatio(hex1, hex2) {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

async function runAccessibilityAudit() {
  console.log('====================================================');
  console.log('AXE-CORE RUNTIME ACCESSIBILITY AUDIT (PLAYWRIGHT)');
  console.log('====================================================\n');

  // 1. Color Contrast Mathematical Measurements
  console.log('--- 1. EXACT COLOR CONTRAST RATIO MEASUREMENTS ---');
  const colorTests = [
    { name: '--color-obligation (#3E6E5B) on --color-bg (#FAFAF8)', fg: '#3E6E5B', bg: '#FAFAF8' },
    { name: '--color-obligation (#3E6E5B) on --color-surface (#FFFFFF)', fg: '#3E6E5B', bg: '#FFFFFF' },
    { name: '--color-obligation (#3E6E5B) on --color-obligation-bg (#EAF3EF)', fg: '#3E6E5B', bg: '#EAF3EF' },
    { name: '--color-primary (#2C5F6F) on --color-bg (#FAFAF8)', fg: '#2C5F6F', bg: '#FAFAF8' },
    { name: '--color-primary (#2C5F6F) on --color-surface (#FFFFFF)', fg: '#2C5F6F', bg: '#FFFFFF' },
    { name: '--color-primary (#2C5F6F) on --color-primary-light (#EBF2F4)', fg: '#2C5F6F', bg: '#EBF2F4' },
    { name: '--color-text-secondary (#545B6B) on --color-bg (#FAFAF8)', fg: '#545B6B', bg: '#FAFAF8' },
    { name: '--color-text-secondary (#545B6B) on --color-surface (#FFFFFF)', fg: '#545B6B', bg: '#FFFFFF' },
  ];

  for (const test of colorTests) {
    const ratio = getContrastRatio(test.fg, test.bg);
    const passesAA = ratio >= 4.5 ? 'PASS (AA normal text)' : ratio >= 3.0 ? 'PASS (AA large text / UI)' : 'FAIL';
    const passesAAA = ratio >= 7.0 ? 'PASS (AAA)' : 'FAIL (AAA)';
    console.log(`• ${test.name}:`);
    console.log(`  Ratio: ${ratio.toFixed(2)}:1 | WCAG AA: ${passesAA} | WCAG AAA: ${passesAAA}`);
  }
  console.log('');

  // 2. Playwright Headless Browser Runtime Scan
  console.log('--- 2. HEADLESS BROWSER RUNTIME FLOW SCANS ---');
  const axeSourcePath = require.resolve('axe-core/axe.min.js');
  const axeScript = fs.readFileSync(axeSourcePath, 'utf8');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const baseUrl = process.env.WEB_BASE_URL || 'http://localhost:3000';

  try {
    console.log(`Connecting to ${baseUrl}...`);
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1000);

    const flows = [
      {
        name: 'Flow 1: Landing Page / Workspace Overview',
        action: async () => {
          // Already on landing page
        },
      },
      {
        name: 'Flow 2: Upload Modal Open',
        action: async () => {
          const uploadBtn = page.locator('button:has-text("Upload Document")');
          if (await uploadBtn.isVisible()) {
            await uploadBtn.click();
            await page.waitForTimeout(500);
          }
        },
        cleanup: async () => {
          const closeBtn = page.locator('button:has-text("✕")');
          if (await closeBtn.isVisible()) {
            await closeBtn.click();
            await page.waitForTimeout(300);
          }
        },
      },
      {
        name: 'Flow 3: Analysis Result View (Clauses Tab)',
        action: async () => {
          const clausesTab = page.locator('button:has-text("Clauses")');
          if (await clausesTab.isVisible()) {
            await clausesTab.click();
            await page.waitForTimeout(500);
          }
        },
      },
      {
        name: 'Flow 4: Q&A View (Ask AI Tab)',
        action: async () => {
          const askAiTab = page.locator('button:has-text("Ask AI")');
          if (await askAiTab.isVisible()) {
            await askAiTab.click();
            await page.waitForTimeout(500);
          }
        },
      },
    ];

    for (const flow of flows) {
      console.log(`\nTesting ${flow.name}...`);
      if (flow.action) {
        await flow.action();
      }

      // Inject axe-core into page
      await page.evaluate(axeScript);

      // Run axe evaluation
      const results = await page.evaluate(async () => {
        // @ts-ignore
        return await window.axe.run(document, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
          },
        });
      });

      console.log(`  Passed Rules: ${results.passes.length}`);
      console.log(`  Violations Count: ${results.violations.length}`);

      if (results.violations.length === 0) {
        console.log(`  ✓ NO ACCESSIBILITY VIOLATIONS FOUND`);
      } else {
        for (const v of results.violations) {
          console.log(`  ❌ [${v.impact ? v.impact.toUpperCase() : 'UNKNOWN'}] ${v.id}: ${v.help}`);
          console.log(`     Description: ${v.description}`);
          for (const node of v.nodes) {
            console.log(`     Selector: ${node.target.join(' > ')}`);
            console.log(`     Failure Summary: ${node.failureSummary}`);
          }
        }
      }

      if (flow.cleanup) {
        await flow.cleanup();
      }
    }
  } catch (err) {
    console.error('Error during accessibility scan:', err.message);
  } finally {
    await browser.close();
    console.log('\nAudit complete.');
  }
}

runAccessibilityAudit().catch(console.error);

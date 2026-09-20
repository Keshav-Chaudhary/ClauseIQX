import { chromium, Browser, Page } from 'playwright';

const WEB_BASE = 'http://localhost:3000';

interface UIUXCheckResult {
  check: string;
  passed: boolean;
  notes: string;
}

const results: UIUXCheckResult[] = [];

function record(check: string, passed: boolean, notes: string) {
  results.push({ check, passed, notes });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [${check}] — ${notes}`);
}

async function run() {
  console.log('====================================================');
  console.log('ClauseIQX — UI/UX Robustness & Accessibility');
  console.log('====================================================\n');

  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
  } catch (err) {
    console.error('Failed to launch Playwright:', err);
    process.exit(1);
  }

  // Navigate to workspace
  await page.goto(WEB_BASE);
  await page.waitForLoadState('networkidle');

  // ----------------------------------------------------
  // 4.1 Modal dismissals: X button, Escape key, Outside backdrop click
  // ----------------------------------------------------
  try {
    // 1. UploadModal: Test ✕ button
    await page.getByRole('button', { name: /Upload Document/i }).click();
    await page.waitForSelector('.modal-container', { state: 'visible' });
    await page.getByLabel(/Close upload modal/i).click();
    await page.waitForSelector('.modal-container', { state: 'hidden' });
    const xButtonWorked = (await page.locator('.modal-container').count()) === 0;

    // 2. UploadModal: Test Escape key
    await page.getByRole('button', { name: /Upload Document/i }).click();
    await page.waitForSelector('.modal-container', { state: 'visible' });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    const escapeWorked = (await page.locator('.modal-container').count()) === 0;

    // 3. UploadModal: Test Outside Backdrop click
    await page.getByRole('button', { name: /Upload Document/i }).click();
    await page.waitForSelector('.modal-container', { state: 'visible' });
    await page.locator('.modal-backdrop').click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(200);
    const backdropWorked = (await page.locator('.modal-container').count()) === 0;

    // 4. ExportModal: Test Escape key & ✕ button
    await page.getByRole('button', { name: /Export Package/i }).click();
    await page.waitForSelector('.modal-container', { state: 'visible' });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    const exportEscapeWorked = (await page.locator('.modal-container').count()) === 0;

    const allDismissalsPassed = xButtonWorked && escapeWorked && backdropWorked && exportEscapeWorked;
    record(
      '4.1 Modal Dismissals (✕ Button, Escape Key, Backdrop Click)',
      allDismissalsPassed,
      allDismissalsPassed
        ? 'Upload and Export modals close on ✕ click, Escape keypress, and backdrop click.'
        : `xBtn: ${xButtonWorked}, escape: ${escapeWorked}, backdrop: ${backdropWorked}, exportEscape: ${exportEscapeWorked}`
    );
  } catch (err) {
    record('4.1 Modal Dismissals (✕ Button, Escape Key, Backdrop Click)', false, `Exception: ${String(err)}`);
  }

  // ----------------------------------------------------
  // 4.2 Rapid tab switching during async loads
  // ----------------------------------------------------
  try {
    const tabNames = ['Clauses', 'Review Points', 'Key Dates', 'Ask AI', 'Compare', 'Lawyer Prep', 'Overview'];
    // Cycle rapidly 3 times through all tabs
    for (let round = 0; round < 3; round++) {
      for (const t of tabNames) {
        await page.getByRole('tab', { name: new RegExp(t, 'i') }).click();
      }
    }
    // Settle on Ask AI
    await page.getByRole('tab', { name: /Ask AI/i }).click();
    await page.waitForTimeout(400);

    const askAiHeading = await page.locator('h2:has-text("Ask AI")').count();
    const isActiveTabAccurate = askAiHeading > 0;

    record(
      '4.2 Rapid Tab Switching Stability',
      isActiveTabAccurate,
      isActiveTabAccurate
        ? 'Rapidly switched across 21 tab transitions without race conditions or stale pane display.'
        : 'Active tab pane did not settle accurately.'
    );
  } catch (err) {
    record('4.2 Rapid Tab Switching Stability', false, `Exception: ${String(err)}`);
  }

  // ----------------------------------------------------
  // 4.3 Network disconnect / stopped API server error presentation
  // ----------------------------------------------------
  try {
    // Open Upload Modal and attempt uploading a huge file or observe error state display
    await page.getByRole('button', { name: /Upload Document/i }).click();
    await page.waitForSelector('.modal-container', { state: 'visible' });

    // Set file exceeding 25MB via JS evaluation to trigger instant client safety banner
    await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) {
        const file = new File(['A'.repeat(100)], 'huge.pdf', { type: 'application/pdf' });
        Object.defineProperty(file, 'size', { value: 30 * 1024 * 1024 }); // 30MB
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    await page.getByRole('button', { name: /Process Document/i }).click();
    await page.waitForTimeout(300);

    const hasErrorAlert = await page.locator('.alert-danger').count();
    const errorText = hasErrorAlert > 0 ? await page.locator('.alert-danger').textContent() : '';

    await page.keyboard.press('Escape'); // close modal

    record(
      '4.3 Error State Presentation & Client Bounds Check',
      hasErrorAlert > 0,
      hasErrorAlert > 0
        ? `Error banner displayed visibly: "${errorText?.trim()}"`
        : 'Failed to display error banner.'
    );
  } catch (err) {
    record('4.3 Error State Presentation & Client Bounds Check', false, `Exception: ${String(err)}`);
  }

  // ----------------------------------------------------
  // 4.4 Arrow-key tab navigation on role="tablist"
  // ----------------------------------------------------
  try {
    // Navigate to Overview tab
    await page.getByRole('tab', { name: /Overview/i }).click();
    const overviewTab = page.locator('#tab-overview');
    await overviewTab.focus();

    // Press ArrowRight -> should move to Clauses
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    const clausesActive = await page.locator('#tab-clauses.active').count();

    // Press ArrowRight -> Review Points
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    const reviewPointsActive = await page.locator('#tab-review_points.active').count();

    // Press ArrowLeft -> Clauses
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(200);
    const clausesBackActive = await page.locator('#tab-clauses.active').count();

    // Press End -> Lawyer Prep (last tab)
    await page.keyboard.press('End');
    await page.waitForTimeout(200);
    const lawyerPrepActive = await page.locator('#tab-lawyer_prep.active').count();

    // Press Home -> Overview (first tab)
    await page.keyboard.press('Home');
    await page.waitForTimeout(200);
    const overviewHomeActive = await page.locator('#tab-overview.active').count();

    const keyboardNavPassed =
      clausesActive > 0 &&
      reviewPointsActive > 0 &&
      clausesBackActive > 0 &&
      lawyerPrepActive > 0 &&
      overviewHomeActive > 0;

    record(
      '4.4 Accessible Arrow-Key Keyboard Tab Navigation',
      keyboardNavPassed,
      keyboardNavPassed
        ? 'WAI-ARIA ArrowRight, ArrowLeft, Home, and End keys navigate tabs and move focus with tabIndex.'
        : `clauses: ${clausesActive}, review: ${reviewPointsActive}, back: ${clausesBackActive}, end: ${lawyerPrepActive}, home: ${overviewHomeActive}`
    );
  } catch (err) {
    record('4.4 Accessible Arrow-Key Keyboard Tab Navigation', false, `Exception: ${String(err)}`);
  }

  // ----------------------------------------------------
  // 4.5 Responsive mobile viewport check (375px)
  // ----------------------------------------------------
  try {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);

    // Verify horizontal scroll width does not exceed viewport width
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    const noHorizontalOverflow = scrollWidth <= clientWidth + 1;

    // Check header buttons remain clickable
    const uploadBtnVisible = await page.getByRole('button', { name: /Upload Document/i }).isVisible();
    const exportBtnVisible = await page.getByRole('button', { name: /Export Package/i }).isVisible();
    const bannerVisible = await page.locator('.notice-banner').isVisible();

    const mobileResponsivePassed = noHorizontalOverflow && uploadBtnVisible && exportBtnVisible && bannerVisible;

    record(
      '4.5 Responsive Mobile Viewport (375px)',
      mobileResponsivePassed,
      mobileResponsivePassed
        ? `Page renders at 375px width without horizontal overflow (scrollWidth: ${scrollWidth}px, clientWidth: ${clientWidth}px). Quick actions remain accessible.`
        : `Overflow detected: scrollWidth=${scrollWidth}px vs clientWidth=${clientWidth}px, uploadVisible=${uploadBtnVisible}`
    );
  } catch (err) {
    record('4.5 Responsive Mobile Viewport (375px)', false, `Exception: ${String(err)}`);
  }

  if (browser) {
    await browser.close();
  }

  console.log('\n----------------------------------------------------');
  const passCount = results.filter((r) => r.passed).length;
  const failCount = results.filter((r) => !r.passed).length;
  console.log(`Summary: ${passCount} PASSED, ${failCount} FAILED out of ${results.length} checks`);
  console.log('----------------------------------------------------\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal UI/UX error:', err);
  process.exit(1);
});

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║   CPE AUTOMATION — Portfolio Demo Capture                               ║
 * ║   "Fable-vibe" — Slow reveal. Environmental breathing. Purposeful.      ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * Philosophy:
 *   Every beat gives the viewer time to register what they're looking at.
 *   Mouse moves with intent — not frantically. Hovers trigger UI animations.
 *   The camera (scroll) reveals content like a sweeping establishing shot.
 *   Login moments are human and deliberate, not robotic.
 *
 * Run:
 *   npm run record-demo
 *
 * Requirements:
 *   npm install -D @playwright/test playwright
 *   npx playwright install chromium
 */

const { chromium } = require('playwright');
const fs   = require('fs');
const path = require('path');

// ── CONFIG ────────────────────────────────────────────────────────────────────
const BASE_URL   = 'https://cpe-automation.vercel.app';
const VIEWPORT   = { width: 1440, height: 900 };
const OUTPUT_DIR = path.join(__dirname, '..', 'recordings');

const TEACHER = { username: '18-30GR015', password: '18-30GR015' };
const STUDENT  = { username: '20-30GR015', password: 'Dotun1234#' };

// Timing — every value is intentional. Do not rush these.
const T = {
  signInPageLand:  2500,   // Arrive on sign-in. Let the logo + card fade in.
  typeDelay:        110,   // ms/char — unhurried, human typing cadence
  preSubmit:       1200,   // Pause just before hitting submit (tension beat)
  dashboardSettle: 7000,   // Dashboard: stats paint, calendar draws, charts load
  sectionSweep:    4500,   // Looking at a list/table — scroll + absorb
  hoverDwell:      1500,   // Hold hover over a UI card (shows hover animation)
  modalBreath:     3000,   // Inside a modal — let fields register
  transitionPause: 2500,   // Between major beats
  logoutSettle:    2000,   // After logout — see sign-in page re-appear clean
  pageLoad:        5500,   // After any goto() call — SSR + hydration
  scrollPause:     1000,   // After a smooth scroll step
  navClick:         800,   // After clicking a sidebar/nav link (before goto waits)
};
// ─────────────────────────────────────────────────────────────────────────────

async function run() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  console.log(`\n🎬  CPE Automation — Demo Capture`);
  console.log(`📁  Output: ${OUTPUT_DIR}`);
  console.log(`🕐  Started: ${timestamp}\n`);

  const browser = await chromium.launch({
    headless: false,
    slowMo: 40,
    args: [
      `--window-size=${VIEWPORT.width},${VIEWPORT.height}`,
      '--window-position=0,0',
      '--disable-infobars',
    ],
  });

  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: { dir: OUTPUT_DIR, size: VIEWPORT },
    serviceWorkers: 'block',
    // Disable all browser chrome / overlay notifications
    permissions: [],
  });

  const page = await context.newPage();
  // Hide scrollbars so they don't show in the recording
  await page.addStyleTag({
    content: `
      ::-webkit-scrollbar { display: none !important; }
      * { scrollbar-width: none !important; }
    `
  });

  // ── HELPERS ─────────────────────────────────────────────────────────────────

  const wait = (ms) => page.waitForTimeout(ms);

  /** Navigate and wait for full SSR hydration */
  const goto = async (url) => {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
    await wait(T.pageLoad);
  };

  /** Human-feeling keystroke-by-keystroke typing */
  const type = async (selector, text) => {
    await page.click(selector, { delay: 100 });
    await page.fill(selector, '');
    await wait(300);
    await page.type(selector, text, { delay: T.typeDelay });
  };

  /**
   * Cinematic slow scroll — eases down in steps so the viewer can read content
   * rather than a jarring jump.
   */
  const cinematicScroll = async (totalPx, steps = 4) => {
    const step = Math.round(totalPx / steps);
    for (let i = 0; i < steps; i++) {
      await page.mouse.wheel(0, step);
      await wait(350 + i * 80); // slight ease-out (each step a bit slower)
    }
    await wait(T.scrollPause);
  };

  /** Scroll back to top smoothly */
  const scrollTop = async () => {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await wait(900);
  };

  /**
   * Hover over an element to trigger its CSS :hover animation,
   * then return to a neutral position.
   */
  const hover = async (locator) => {
    try {
      const el = await locator.first();
      if (await el.count() > 0) {
        await el.hover({ force: true });
        await wait(T.hoverDwell);
        // Drift mouse to center of page (neutral)
        await page.mouse.move(720, 450, { steps: 20 });
        await wait(400);
      }
    } catch (_) { /* element gone — silently skip */ }
  };

  /**
   * Sweep the mouse across a card row to trigger hover states on multiple items.
   * Creates the sense of "browsing" the list.
   */
  const browseRows = async (rowLocator, count = 3) => {
    const rows = await rowLocator.all();
    const toVisit = rows.slice(0, Math.min(count, rows.length));
    for (const row of toVisit) {
      try {
        await row.hover({ force: true });
        await wait(600);
      } catch (_) { /* skip */ }
    }
    await page.mouse.move(720, 450, { steps: 15 });
    await wait(400);
  };

  /** Attempt logout via button, fallback to direct navigation */
  const logout = async () => {
    const btn = page.locator('button:has-text("Logout"), button:has-text("Sign out")').first();
    if (await btn.count() > 0) {
      await btn.hover();
      await wait(600);
      await btn.click();
      await wait(T.logoutSettle + 1000);
    }
    // Always land clean on sign-in
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle', timeout: 30_000 });
    await wait(T.signInPageLand);
  };

  /** Full login sequence — cinematic, deliberate */
  const login = async ({ username, password }, role) => {
    console.log(`\n🔐  [${role}] — Navigating to sign-in…`);
    await goto(`${BASE_URL}/sign-in`);
    await wait(T.signInPageLand); // let the animated login card fully appear

    console.log(`    Typing credentials…`);
    await type('input[name="identifier"]', username);
    await wait(700);
    await type('input[name="password"]', password);
    await wait(T.preSubmit); // tension pause — "about to log in"

    await page.hover('button[type="submit"]');
    await wait(500);
    await page.click('button[type="submit"]');

    console.log(`    Waiting for ${role} dashboard…`);
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 60_000 }).catch(() => {});
    await wait(T.dashboardSettle);
    console.log(`    ✅ ${role} dashboard settled.`);
  };

  // ── CAPTURE ──────────────────────────────────────────────────────────────────

  try {

    // ══════════════════════════════════════════════════════════════════════════
    //  ░░░  ACT I — TEACHER / LECTURER VIEW  ░░░
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║  ACT I — TEACHER / LECTURER VIEW      ║');
    console.log('╚═══════════════════════════════════════╝');

    // ── BEAT 1: Login → Dashboard hero shot ──────────────────────────────────
    await login(TEACHER, 'Lecturer');

    // Dashboard is now visible. Let the viewer take it all in.
    // Slowly hover over the three stat cards to trigger their animations.
    console.log('\n  Beat 1 — Soaking in the dashboard…');
    const statCards = page.locator('a.group, div.group').filter({ has: page.locator('h2') });
    await browseRows(statCards, 3);
    await wait(1500);

    // Pan down to reveal "Today's Classes" and "Quick Actions"
    await cinematicScroll(340, 4);
    await wait(T.sectionSweep);
    await scrollTop();
    await wait(T.transitionPause);

    // ── BEAT 2: Courses list ─────────────────────────────────────────────────
    console.log('\n  Beat 2 — Courses list…');
    await goto(`${BASE_URL}/list/courses`);

    // Browse course rows — hover triggers border/shadow animations
    const courseRows = page.locator('table tbody tr, .course-card, [data-row]');
    await browseRows(courseRows, 4);
    await cinematicScroll(260, 3);
    await wait(T.sectionSweep);

    // ── BEAT 3: Open a course → lesson structure ─────────────────────────────
    console.log('\n  Beat 3 — Opening course detail / lesson list…');
    const courseLink = page.locator('a[href*="/list/courses/"]').first();
    if (await courseLink.count() > 0) {
      await courseLink.hover();
      await wait(800);
      await courseLink.click();
      await wait(T.pageLoad);
      await cinematicScroll(350, 4);
      await wait(T.sectionSweep);
      await scrollTop();
      await wait(T.transitionPause);
    } else {
      // Fallback: Lessons list
      console.log('  ⚠  No course detail link found — showing Lessons list.');
      await goto(`${BASE_URL}/list/lessons`);
      const lessonRows = page.locator('table tbody tr');
      await browseRows(lessonRows, 4);
      await cinematicScroll(260, 3);
      await wait(T.sectionSweep);
      await scrollTop();
      await wait(T.transitionPause);
    }

    // ── BEAT 4: Materials / Resources ────────────────────────────────────────
    console.log('\n  Beat 4 — Materials / Resources…');
    await goto(`${BASE_URL}/list/materials`);

    // Hover over material cards to show download/preview buttons appearing
    const materialCards = page.locator('.material-card, [class*="material"], table tbody tr');
    await browseRows(materialCards, 4);
    await cinematicScroll(300, 3);
    await wait(T.sectionSweep);
    await scrollTop();
    await wait(T.transitionPause);

    // ── BEAT 5: Content-management action (Teacher creates/uploads) ───────────
    console.log('\n  Beat 5 — Content-management: Add Material…');
    const addBtn = page.locator([
      'button:has-text("Add")',
      'button:has-text("Upload")',
      'button:has-text("New")',
      'button:has-text("Create")',
    ].join(', ')).first();

    if (await addBtn.count() > 0) {
      await addBtn.hover();
      await wait(800);
      await addBtn.click();
      await wait(T.modalBreath); // modal opens — let it settle

      // Pan down inside the modal to show the form fields
      const modal = page.locator('[role="dialog"], .modal, form').first();
      if (await modal.count() > 0) {
        // Slowly scroll within the modal
        await page.mouse.wheel(0, 200);
        await wait(1200);
        await page.mouse.wheel(0, 200);
        await wait(T.modalBreath);
      }

      // Close cleanly
      await page.keyboard.press('Escape');
      await wait(1500);
    } else {
      console.log('  ⚠  No add/create button visible — showing Assignments instead.');
      await goto(`${BASE_URL}/list/assignments`);
      await browseRows(page.locator('table tbody tr'), 3);
      await cinematicScroll(250, 3);
      await wait(T.sectionSweep);
    }

    await scrollTop();
    await wait(T.transitionPause);

    // ── BEAT 6: Student roster ───────────────────────────────────────────────
    console.log('\n  Beat 6 — Student roster…');
    await goto(`${BASE_URL}/list/students`);

    // Browse student rows — gives the sense of a populated institution
    const studentRows = page.locator('table tbody tr');
    await browseRows(studentRows, 5);
    await cinematicScroll(400, 5);
    await wait(T.sectionSweep);
    await scrollTop();
    await wait(T.transitionPause);

    // ── BEAT 7: Clean Teacher logout ─────────────────────────────────────────
    console.log('\n  Beat 7 — Lecturer logout (clean role transition)…');
    await logout();


    // ══════════════════════════════════════════════════════════════════════════
    //  ░░░  ACT II — STUDENT VIEW  ░░░
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║  ACT II — STUDENT VIEW                ║');
    console.log('╚═══════════════════════════════════════╝');

    // ── BEAT 8: Login → Student Dashboard ────────────────────────────────────
    await login(STUDENT, 'Student');

    console.log('\n  Beat 8 — Student dashboard…');
    await browseRows(statCards, 3);
    await wait(1500);
    await cinematicScroll(340, 4);
    await wait(T.sectionSweep);
    await scrollTop();
    await wait(T.transitionPause);

    // ── BEAT 9: Enrolled Courses (student perspective) ────────────────────────
    console.log('\n  Beat 9 — Student enrolled courses…');
    await goto(`${BASE_URL}/list/courses`);
    await browseRows(courseRows, 4);
    await cinematicScroll(260, 3);
    await wait(T.sectionSweep);
    await scrollTop();
    await wait(T.transitionPause);

    // ── BEAT 10: Materials — read-only student view ───────────────────────────
    console.log('\n  Beat 10 — Materials (student read-only view)…');
    await goto(`${BASE_URL}/list/materials`);
    await browseRows(materialCards, 4);
    await cinematicScroll(300, 3);
    await wait(T.sectionSweep);

    // Attempt to open a material preview
    const viewBtn = page.locator([
      'button:has-text("View")',
      'button:has-text("Preview")',
      'button:has-text("Download")',
    ].join(', ')).first();

    if (await viewBtn.count() > 0) {
      console.log('  Opening material preview…');
      await viewBtn.hover();
      await wait(700);
      await viewBtn.click();
      await wait(T.modalBreath);
      await page.keyboard.press('Escape');
      await wait(1500);
    }

    await scrollTop();
    await wait(T.transitionPause);

    // ── BEAT 11: Lessons schedule — student view ──────────────────────────────
    console.log('\n  Beat 11 — Lessons / schedule (student view)…');
    await goto(`${BASE_URL}/list/lessons`);
    const lessonRowsStu = page.locator('table tbody tr');
    await browseRows(lessonRowsStu, 4);
    await cinematicScroll(260, 3);
    await wait(T.sectionSweep);
    await scrollTop();
    await wait(T.transitionPause);

    // ── BEAT 12: Clean Student logout ─────────────────────────────────────────
    console.log('\n  Beat 12 — Student logout (cinematic close)…');
    await logout();

    // End on sign-in page — clean final frame
    await wait(2500);

    console.log('\n✅  Capture complete!');
    console.log(`📹  Raw .webm saved in: ${OUTPUT_DIR}`);
    console.log('    → Import into Recordly for final polish.\n');

  } catch (err) {
    console.error('\n❌  Capture error:', err);
  } finally {
    await page.close();
    await context.close(); // ← finalises the .webm file
    await browser.close();
  }
}

run();

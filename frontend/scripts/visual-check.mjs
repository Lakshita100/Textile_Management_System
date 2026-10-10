/**
 * Visual verification helper.
 *
 * Builds must already exist (`npm run build`). Starts a preview server, takes
 * screenshots at the breakpoints required by the design spec, and reports any
 * horizontal overflow.
 *
 * Usage: npm run visual-check
 */
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}`;
const WIDTHS = [1440, 1280, 1024, 768, 390, 360];
const OUT_DIR = path.resolve('visual-check-output');

async function waitForServer(url, timeoutMs = 30000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Preview server did not start at ${url}`);
}

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  stdio: 'ignore',
  shell: true,
});

try {
  await waitForServer(BASE_URL);
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const report = [];

  for (const width of WIDTHS) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      deviceScaleFactor: 1,
    });
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      document
        .querySelectorAll('.reveal')
        .forEach((node) => node.classList.add('is-visible'));
    });
    await page.waitForTimeout(250);

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth - doc.clientWidth;
    });
    report.push({ width, overflow });

    if (width === 1440 || width === 390) {
      await page.screenshot({
        path: path.join(OUT_DIR, `hero-${width}.png`),
      });
      await page.screenshot({
        path: path.join(OUT_DIR, `full-${width}.png`),
        fullPage: true,
      });
    }

    if (width === 1440) {
      const dashboard = page.locator('#dashboard');
      await dashboard.scrollIntoViewIfNeeded();
      await page.waitForTimeout(250);
      await page.screenshot({
        path: path.join(OUT_DIR, 'dashboard-1440.png'),
      });
    }

    if (width === 390) {
      await page.getByRole('button', { name: 'Open menu' }).click();
      await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(OUT_DIR, 'mobile-menu-390.png') });
    }

    await page.close();
  }

  await browser.close();
  console.log(JSON.stringify(report, null, 2));
} finally {
  server.kill();
}

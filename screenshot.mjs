import puppeteer from 'puppeteer';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const screenshotsDir = join(__dirname, 'temporary screenshots');

if (!existsSync(screenshotsDir)) {
  mkdirSync(screenshotsDir, { recursive: true });
}

function getNextN() {
  const files = existsSync(screenshotsDir)
    ? readdirSync(screenshotsDir).filter(f => f.endsWith('.png'))
    : [];
  const nums = files.map(f => parseInt(f.match(/^screenshot-(\d+)/)?.[1] ?? '0')).filter(n => !isNaN(n));
  return nums.length ? Math.max(...nums) + 1 : 1;
}

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] ? `-${process.argv[3]}` : '';
const n = getNextN();
const filename = `screenshot-${n}${label}.png`;
const outPath = join(screenshotsDir, filename);

const browser = await puppeteer.launch({
  headless: true,
  executablePath: 'C:/Users/marij/.cache/puppeteer/chrome/win64-148.0.7778.167/chrome-win64/chrome.exe',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 1500));

// Scroll through to trigger IntersectionObserver, then force all animations visible
const totalHeight = await page.evaluate(() => document.body.scrollHeight);
let sy = 0;
while (sy < totalHeight) { sy += 600; await page.evaluate(y => window.scrollTo(0, y), sy); await new Promise(r => setTimeout(r, 80)); }
await page.evaluate(() => {
  window.scrollTo(0, 0);
  document.querySelectorAll('.fade-up').forEach(el => el.classList.add('vis'));
});
await new Promise(r => setTimeout(r, 600));

await page.screenshot({ path: outPath, fullPage: true });
await browser.close();

console.log(`Screenshot saved: temporary screenshots/${filename}`);

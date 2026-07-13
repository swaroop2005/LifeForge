const puppeteer = require('puppeteer');
(async () => {
  const [,, url, out, height] = process.argv;
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: parseInt(height || '900') });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: out, fullPage: process.env.FULLPAGE === '1' });
  await browser.close();
  console.log('saved', out);
})();

const puppeteer = require('puppeteer');
(async () => {
  const [,, email, pass, route, out, clickText] = process.argv;
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const res = await fetch('http://localhost:8000/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pass })
  }).then(r => r.json());
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await page.evaluate((token, role, name) => {
    localStorage.setItem('vt_token', token);
    localStorage.setItem('vt_role', role);
    localStorage.setItem('vt_name', name);
  }, res.access_token, res.role, email.split('@')[0]);
  await page.goto('http://localhost:5173' + route, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));
  if (clickText) {
    await page.evaluate(t => {
      const el = [...document.querySelectorAll('button, a')].find(e => e.textContent.trim().includes(t));
      if (el) el.click();
    }, clickText);
    await new Promise(r => setTimeout(r, 1500));
  }
  await page.screenshot({ path: out, fullPage: true });
  await browser.close();
  console.log('saved', out);
})();

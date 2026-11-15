const assert = require('node:assert/strict');
const {chromium} = require('playwright-core');

(async () => {
  const browser = await chromium.launch({headless: true, executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox']});
  try {
    for (const width of [320, 360]) {
      const page = await browser.newPage({viewport:{width, height:568}});
      await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:8765/') ? route.continue() : route.abort());
      await page.goto('http://127.0.0.1:8765/index.html');
      await page.locator('#burger').click();
      assert.equal(await page.locator('#burger').getAttribute('aria-expanded'), 'true');
      await page.locator('#navLinks a[href="android-app.html"]').click();
      assert.match(page.url(), /android-app\.html$/);
      assert.equal(await page.locator('a.android-download').getAttribute('href'), 'https://github.com/numb-netizen/Temp/releases/download/android-v1.3-beta/HSC-2027-v1.3-beta-debug.apk');
      assert.ok(await page.locator('text=পরীক্ষামূলক debug APK').count());
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `horizontal overflow at ${width}`);
      await page.close();
    }
    const webView = 'Mozilla/5.0 (Linux; Android 13; Pixel; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.0.0 Mobile Safari/537.36';
    for (const [userAgent, isOurApp] of [[webView, false], [webView + ' HSC2027App', true]]) {
      const page = await browser.newPage({viewport:{width:360, height:640}, userAgent});
      await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:8765/') ? route.continue() : route.abort());
      for (const name of ['index.html', 'dabi.html', 'science.html', 'tracker.html', 'android-app.html', 'student-group.html']) {
        await page.goto('http://127.0.0.1:8765/' + name);
        await page.locator('#burger').click();
        assert.equal(await page.locator('#navLinks a[href="android-app.html"]').isVisible(), !isOurApp, `nav ${name}: ${userAgent}`);
        assert.equal(await page.locator('footer a[href="android-app.html"]').isVisible(), !isOurApp, `footer ${name}: ${userAgent}`);
        assert.ok(await page.locator('#navLinks a[href="dabi.html"]').isVisible());
      }
      await page.close();
    }
    for (const width of [320, 360, 1201]) {
      const page = await browser.newPage({viewport:{width, height:720}});
      await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:8765/') ? route.continue() : route.abort());
      await page.goto('http://127.0.0.1:8765/index.html');
      await page.locator('a[href="student-group.html"]').click();
      assert.equal(await page.locator('#student-step').isVisible(), true);
      assert.equal(await page.locator('#choice-step').isVisible(), false);
      assert.equal(await page.locator('#group-join').getAttribute('href'), null);
      await page.locator('#student-no').click();
      assert.equal(await page.locator('#not-student-step').isVisible(), true);
      assert.equal(await page.locator('#group-join').isVisible(), false);
      await page.locator('#not-student-step .group-back').click();
      await page.locator('#student-yes').click();
      assert.equal(await page.locator('#choice-step').isVisible(), true);
      await page.locator('#choose-girl').click();
      assert.equal(await page.locator('#girl-step').isVisible(), true);
      assert.equal(await page.locator('#group-join').getAttribute('href'), null);
      await page.locator('#girl-step .group-back').click();
      await page.locator('#choose-boy').click();
      assert.equal(await page.locator('#group-join').isVisible(), true);
      assert.equal(await page.locator('#group-join').getAttribute('href'), 'https://chat.whatsapp.com/KPdaTIjQNo93DEeFTldweN?s=sw&p=a&iam=2');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `group page overflow at ${width}`);
      await page.locator('#boy-step .group-back').click();
      assert.equal(await page.locator('#group-join').getAttribute('href'), null);
      await page.close();
    }
    for (const width of [1201, 1440]) {
      const page = await browser.newPage({viewport:{width, height:900}});
      await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:8765/') ? route.continue() : route.abort());
      await page.goto('http://127.0.0.1:8765/index.html');
      const result = await page.evaluate(() => {
        const brand = document.querySelector('nav .brand').getBoundingClientRect();
        const links = document.querySelector('#navLinks').getBoundingClientRect();
        const cta = document.querySelector('.nav-cta').getBoundingClientRect();
        return {noOverlap: brand.right <= links.left && links.right <= cta.left, fits: cta.right <= innerWidth};
      });
      assert.ok(result.noOverlap && result.fits, `desktop nav overflow at ${width}: ${JSON.stringify(result)}`);
      assert.ok(await page.locator('#navLinks a[href="android-app.html"]').isVisible());
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });

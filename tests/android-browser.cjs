const assert = require('node:assert/strict');
const {chromium} = require('playwright-core');

(async () => {
  const browser = await chromium.launch({headless: true, executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox']});
  try {
    {
      const page = await browser.newPage();
      const response = await page.goto('http://127.0.0.1:8765/googleb7da7b15e33059e0.html');
      assert.equal(response.status(), 200);
      assert.equal(await response.text(), 'google-site-verification: googleb7da7b15e33059e0.html');
      const bing = await page.goto('http://127.0.0.1:8765/BingSiteAuth.xml');
      assert.equal(bing.status(), 200);
      assert.equal(await bing.text(), '<?xml version="1.0"?>\n<users>\n\t<user>76A0C77A1435B5695135852A5F05F622</user>\n</users>');
      await page.close();
    }
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
      for (const name of ['index.html', 'dabi.html', 'science.html', 'tracker.html', 'android-app.html', 'student-group.html', 'teachers.html']) {
        await page.goto('http://127.0.0.1:8765/' + name);
        await page.locator('#burger').click();
        assert.equal(await page.locator('#navLinks a[href="android-app.html"]').isVisible(), !isOurApp, `nav ${name}: ${userAgent}`);
        assert.equal(await page.locator('footer a[href="android-app.html"]').isVisible(), !isOurApp, `footer ${name}: ${userAgent}`);
        assert.equal(await page.locator('#navLinks a[href="dabi.html"]').count(), 0);
      }
      await page.close();
    }
    {
      const page = await browser.newPage();
      await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:8765/') ? route.continue() : route.abort());
      await page.goto('http://127.0.0.1:8765/dabi.html');
      assert.match(await page.title(), /পেজটি সরানো হয়েছে/);
      assert.equal(await page.locator('#support-form').count(), 0);
      await page.close();
    }
    for (const width of [320, 360, 1201]) {
      const page = await browser.newPage({viewport:{width, height:720}});
      await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:8765/') ? route.continue() : route.abort());
      await page.goto('http://127.0.0.1:8765/index.html');
      await page.locator('a[href="student-group.html"]').click();
      await page.locator('#student-step').waitFor({state:'visible'});
      assert.equal(await page.locator('#student-step').isVisible(), true);
      assert.equal(await page.locator('#choice-step').isVisible(), false);
      assert.equal(await page.locator('#group-join').getAttribute('href'), null);
      assert.equal(await page.locator('#group-join-old').getAttribute('href'), null);
      await page.locator('#student-no').click();
      assert.equal(await page.locator('#not-student-step').isVisible(), true);
      assert.equal(await page.locator('#group-join').isVisible(), false);
      await page.locator('#not-student-step .group-back').click();
      await page.locator('#student-yes').click();
      assert.equal(await page.locator('#choice-step').isVisible(), true);
      await page.locator('#choose-girl').click();
      assert.equal(await page.locator('#girl-step').isVisible(), true);
      assert.equal(await page.locator('#group-join').getAttribute('href'), null);
      assert.equal(await page.locator('#group-join-old').getAttribute('href'), null);
      await page.locator('#girl-step .group-back').click();
      await page.locator('#choose-boy').click();
      assert.equal(await page.locator('#group-join').isVisible(), true);
      assert.equal(await page.locator('#group-join-old').isVisible(), true);
      assert.equal(await page.locator('#group-join-old').getAttribute('href'), 'https://chat.whatsapp.com/KPdaTIjQNo93DEeFTldweN?s=sw&p=a&iam=2');
      assert.equal(await page.locator('#group-join').getAttribute('href'), 'https://chat.whatsapp.com/Kj4T6Y3BpDJD3j3K7kB0Yu');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `group page overflow at ${width}`);
      await page.locator('#boy-step .group-back').click();
      assert.equal(await page.locator('#group-join').getAttribute('href'), null);
      assert.equal(await page.locator('#group-join-old').getAttribute('href'), null);
      await page.close();
    }
    for (const width of [320, 360, 1201]) {
      const page = await browser.newPage({viewport:{width, height:720}});
      await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:8765/') ? route.continue() : route.abort());
      await page.goto('http://127.0.0.1:8765/index.html');
      await page.locator('a[href="teachers.html"]').click();
      await page.locator('#teacher-principal').waitFor({state:'visible'});
      const card = page.locator('#teacher-principal');
      const number = card.locator('a[href="tel:01712612992"]');
      assert.equal(await number.isVisible(), false);
      await card.locator('summary').click();
      assert.equal(await number.isVisible(), true);
      await card.locator('summary').click();
      assert.equal(await number.isVisible(), false);
      const council = page.locator('.council-card').first();
      assert.equal(await council.locator('a').isVisible(), false);
      await council.locator('summary').click();
      assert.equal(await council.locator('a').isVisible(), true);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `teachers overflow at ${width}`);
      await page.close();
    }
    for (const width of [320, 360, 1201]) {
      const page = await browser.newPage({viewport:{width, height:720}});
      await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:8765/') ? route.continue() : route.abort());
      for (const name of ['college-info.html', 'college-routine.html', 'honours-info.html', 'hsc-2027-routine.html']) {
        await page.goto('http://127.0.0.1:8765/index.html');
        await page.locator(`a[href="${name}"]`).first().click();
        assert.match(page.url(), new RegExp(name.replace('.', '\.') + '$'));
        for (const details of await page.locator('.booklet-source').all()) {
          await details.locator('summary').click();
          const image = details.locator('img');
          await image.scrollIntoViewIfNeeded();
          await page.waitForFunction(img => img.complete && img.naturalWidth > 0, await image.elementHandle());
          assert.equal(await image.isVisible(), true);
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${name} overflow at ${width}`);
      }
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

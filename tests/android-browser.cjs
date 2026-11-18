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
    for (const width of [360, 1440]) {
      const page = await browser.newPage({viewport:{width,height:800}});
      await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:8765/') ? route.continue() : route.abort());
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      for (const name of ['science','arts','commerce','tracker','bangla','bangla-2','english','english-2','ict','physics','chemistry','math','biology','economics','sociology','civics','history','accounting','business','finance','marketing']) {
        await page.goto('http://127.0.0.1:8765/' + name + '.html');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `syllabus overflow ${name} ${width}`);
      }
      assert.deepEqual(errors, [], `syllabus script errors at ${width}`);
      await page.close();
    }
    // Existing chapter keys remain usable across the tracker and subject page.
    {
      const page = await browser.newPage({viewport:{width:360,height:720}});
      await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:8765/') ? route.continue() : route.abort());
      await page.goto('http://127.0.0.1:8765/physics.html');
      await page.evaluate(() => localStorage.setItem('hsc2027:physics:0', '1'));
      await page.reload();
      let item = page.locator('.chap[data-subject="physics"][data-chapter="0"]');
      assert.equal(await item.getAttribute('role'), 'checkbox');
      assert.equal(await item.getAttribute('aria-checked'), 'true');
      await item.focus();
      await page.keyboard.press('Space');
      assert.equal(await item.getAttribute('aria-checked'), 'false');
      await page.keyboard.press('Enter');
      assert.equal(await item.getAttribute('aria-checked'), 'true');
      await page.goto('http://127.0.0.1:8765/tracker.html');
      item = page.locator('.chap[data-subject="physics"][data-chapter="0"]');
      assert.equal(await item.getAttribute('aria-checked'), 'true');
      assert.equal(await page.evaluate(() => localStorage.getItem('hsc2027:physics:0')), '1');
      for (const name of ['bangla-2.html','english-2.html']) {
        await page.goto('http://127.0.0.1:8765/' + name);
        assert.ok(await page.getByText('তালিকা এখনো প্রকাশের জন্য যাচাই করা হয়নি।').count());
        assert.equal(await page.locator('.chap').count(), 0);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      }
      await page.close();
    }
    // Feedback is in normal page flow, not the navigation or a floating overlay.
    // Intercept submissions so tests never create an issue.
    for (const width of [320, 360, 768, 1201, 1440]) {
      const page = await browser.newPage({viewport:{width, height:720}});
      let feedbackStatus = 429;
      await page.context().route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.origin === 'http://127.0.0.1:8765') return route.continue();
        if (url.origin === 'https://cciwbmtmlrlgpgewiaqk.supabase.co' && url.pathname === '/functions/v1/feedback/submit') return route.fulfill({status:feedbackStatus, contentType:'application/json', headers:{'access-control-allow-origin':'*'}, body:feedbackStatus === 202 ? '{"accepted":true}' : '{"error":"rate_limit"}'});
        return route.abort();
      });
      await page.goto('http://127.0.0.1:8765/index.html');
      assert.equal(await page.locator('nav a[href="feedback.html"]').count(), 0);
      assert.equal(await page.locator('footer a[href="feedback.html"]').count(), 1);
      const invite = page.locator('.feedback-invite');
      assert.equal(await invite.isVisible(), true);
      const layout = await page.evaluate(() => {
        const box = document.querySelector('.feedback-invite').getBoundingClientRect();
        const before = document.querySelector('.marquee').getBoundingClientRect();
        const after = document.querySelector('.feedback-invite').nextElementSibling.getBoundingClientRect();
        return {normal: getComputedStyle(document.querySelector('.feedback-invite')).position === 'static',
          noOverlap: before.bottom <= box.top && box.bottom <= after.top,
          scrollFits: document.documentElement.scrollWidth <= innerWidth};
      });
      assert.ok(layout.normal && layout.noOverlap && layout.scrollFits, `feedback layout ${width}: ${JSON.stringify(layout)}`);
      await page.locator('.feedback-banner-link').click();
      assert.match(page.url(), /feedback\.html$/);
      await page.locator('.feedback-form button').waitFor({state:'visible'});
      await page.locator('#feedback-title-input').fill('ট্র্যাকারের সমস্যা');
      await page.locator('#feedback-body').fill('পেজটি খোলে না & আমি সাহায্য চাই।');
      await page.locator('.feedback-form button').click();
      await page.getByRole('status').getByText('এক ঘণ্টা পরে আবার চেষ্টা করো', {exact:false}).waitFor();
      assert.equal(await page.locator('#feedback-body').inputValue(), 'পেজটি খোলে না & আমি সাহায্য চাই।');
      feedbackStatus = 202;
      const [request] = await Promise.all([
        page.waitForRequest(req => req.url().endsWith('/functions/v1/feedback/submit') && req.method() === 'POST'),
        page.locator('.feedback-form button').click()
      ]);
      assert.deepEqual(request.postDataJSON(), {title:'ট্র্যাকারের সমস্যা', body:'পেজটি খোলে না & আমি সাহায্য চাই।'});
      await page.getByRole('status').getByText('তোমার মতামত গ্রহণ করা হয়েছে।', {exact:false}).waitFor();
      assert.equal(await page.locator('#feedback-body').inputValue(), '');
      await page.locator('.theme-toggle').click();
      assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.close();
    }
    // Without JavaScript, the button is disabled rather than claiming success.
    {
      const page = await browser.newPage({javaScriptEnabled:false, viewport:{width:360,height:720}});
      await page.goto('http://127.0.0.1:8765/feedback.html');
      assert.equal(await page.locator('.feedback-form button').isDisabled(), true);
      assert.equal(await page.locator('noscript a[href="https://github.com/numb-netizen/Temp/issues/new"]').count(), 1);
      await page.close();
    }
    // Theme stays usable beside the menu on narrow screens and across pages.
    for (const width of [320, 360, 1201, 1440]) {
      const page = await browser.newPage({viewport:{width, height:720}});
      await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:8765/') ? route.continue() : route.abort());
      await page.goto('http://127.0.0.1:8765/index.html');
      const toggle = page.locator('.theme-toggle');
      assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
      assert.equal(await toggle.getAttribute('aria-pressed'), 'false');
      await toggle.focus();
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
      assert.equal(await toggle.getAttribute('aria-pressed'), 'true');
      assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), 'rgb(244, 249, 246)');
      if (width <= 1200) {
        await page.locator('#burger').click();
        assert.equal(await page.locator('#burger').getAttribute('aria-expanded'), 'true');
        await page.locator('#navLinks a[href="science.html"]').click();
        await page.locator('.theme-toggle').waitFor({state:'visible'});
        assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
      }
      await page.goto('http://127.0.0.1:8765/teachers.html');
      assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
      await page.reload();
      assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
      for (const name of ['student-group.html', 'android-app.html', 'tracker.html', 'college-info.html', 'index.html']) {
        await page.goto('http://127.0.0.1:8765/' + name);
        assert.equal(await page.locator('html').getAttribute('data-theme'), 'light', name);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `theme overflow ${name} ${width}`);
      }
      await page.locator('.theme-toggle').click();
      assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
      await page.reload();
      assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
      await page.close();
    }
    {
      const page = await browser.newPage();
      await page.addInitScript(() => Object.defineProperty(window, 'localStorage', {get() {throw new Error('blocked');}}));
      await page.goto('http://127.0.0.1:8765/index.html');
      assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
      await page.locator('.theme-toggle').click();
      assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
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
    for (const width of [320, 360, 1201]) {
      for (const reducedMotion of ['reduce', 'no-preference']) {
        const page = await browser.newPage({viewport:{width, height:720}, reducedMotion});
        await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:8765/') ? route.continue() : route.abort());
        await page.goto('http://127.0.0.1:8765/index.html');
        assert.equal(await page.locator('.hero-spark').count(), reducedMotion === 'reduce' ? 0 : (width < 600 ? 7 : 12));
        assert.equal(await page.locator('.hero-sparkles').getAttribute('aria-hidden'), 'true');
        assert.equal(await page.locator('.hero-sparkles').evaluate(el => getComputedStyle(el).pointerEvents), 'none');
        assert.equal(await page.locator('.hero-orbits').getAttribute('aria-hidden'), 'true');
        assert.equal(await page.locator('.hero-orbits').evaluate(el => getComputedStyle(el).pointerEvents), 'none');
        assert.equal(await page.locator('.hero-ambient').getAttribute('aria-hidden'), 'true');
        assert.equal(await page.locator('.hero-ambient').evaluate(el => getComputedStyle(el).pointerEvents), 'none');
        const ambientSelectors = ['.aurora-one', '.ambient-trace', '.comet-one'];
        const ambientNames = () => Promise.all(ambientSelectors.map(selector => page.locator(selector).evaluate(el => getComputedStyle(el).animationName)));
        const effectSelectors = ['.orbit-one', '.hero .grad', '.cd-card', '.dabi-teaser[data-motion="bob"] .dabi-teaser-icon', '.dabi-teaser[data-motion="pulse"] .dabi-teaser-icon'];
        const effectNames = () => Promise.all(effectSelectors.map(selector => page.locator(selector).first().evaluate(el => getComputedStyle(el).animationName)));
        if (reducedMotion === 'reduce') {
          assert.equal(await page.locator('.hero-ambient').isVisible(), false);
          assert.deepEqual(await ambientNames(), ambientSelectors.map(() => 'none'));
          assert.deepEqual(await effectNames(), effectSelectors.map(() => 'none'));
          assert.equal(await page.locator('.hero-orbits').isVisible(), false);
          assert.equal(await page.locator('h2.title').first().evaluate(el => getComputedStyle(el).animationName), 'none');
          assert.equal(await page.locator('.motion-toggle').isVisible(), false);
          assert.equal(await page.locator('.marquee-track').evaluate(el => getComputedStyle(el).animationName), 'none');
          assert.equal(await page.locator('.reveal').first().evaluate(el => getComputedStyle(el).opacity), '1');
        } else {
          assert.equal(await page.locator('.hero-ambient').isVisible(), true);
          assert.deepEqual(await ambientNames(), ['aurora-drift', 'trace-flow', 'comet-pass']);
          assert.deepEqual(await effectNames(), ['orbit-spin', 'color-flow', 'card-glow', 'icon-bob', 'icon-pulse']);
          await page.locator('.motion-toggle').click();
          assert.equal(await page.locator('.hero-ambient').isVisible(), false);
          assert.deepEqual(await ambientNames(), ambientSelectors.map(() => 'none'));
          assert.deepEqual(await effectNames(), effectSelectors.map(() => 'none'));
          assert.equal(await page.locator('.hero-orbits').isVisible(), false);
          assert.equal(await page.locator('.motion-toggle').textContent(), 'অ্যানিমেশন চালু');
          assert.equal(await page.locator('.marquee-track').evaluate(el => getComputedStyle(el).animationName), 'none');
          assert.equal(await page.locator('h2.title').first().evaluate(el => getComputedStyle(el).animationName), 'none');
          await page.goto('http://127.0.0.1:8765/commerce.html');
          assert.equal(await page.locator('h1').evaluate(el => getComputedStyle(el).animationName), 'none');
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `commerce overflow at ${width}`);
          await page.goto('http://127.0.0.1:8765/index.html');
          await page.reload();
          assert.equal(await page.locator('.motion-toggle').textContent(), 'অ্যানিমেশন চালু');
          await page.locator('.motion-toggle').click();
          assert.equal(await page.locator('.motion-toggle').textContent(), 'অ্যানিমেশন বন্ধ');
          assert.deepEqual(await effectNames(), ['orbit-spin', 'color-flow', 'card-glow', 'icon-bob', 'icon-pulse']);
          assert.equal(await page.locator('.hero-ambient').isVisible(), true);
          assert.deepEqual(await ambientNames(), ['aurora-drift', 'trace-flow', 'comet-pass']);
          assert.equal(await page.locator('h2.title').first().evaluate(el => getComputedStyle(el).animationName), 'heading-color-flow');
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `motion home overflow at ${width}`);
        await page.locator('a[href="student-group.html"]').click();
        assert.match(page.url(), /student-group\.html$/);
        await page.close();
      }
    }
    for (const width of [1201, 1440]) {
      const page = await browser.newPage({viewport:{width, height:900}});
      await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:8765/') ? route.continue() : route.abort());
      await page.goto('http://127.0.0.1:8765/index.html');
      const result = await page.evaluate(() => {
        const brand = document.querySelector('nav .brand').getBoundingClientRect();
        const links = document.querySelector('#navLinks').getBoundingClientRect();
        const toggle = document.querySelector('.theme-toggle').getBoundingClientRect();
        return {noOverlap: brand.right <= links.left && links.right <= toggle.left, fits: toggle.right <= innerWidth};
      });
      assert.ok(result.noOverlap && result.fits, `desktop nav overflow at ${width}: ${JSON.stringify(result)}`);
      assert.ok(await page.locator('#navLinks a[href="android-app.html"]').isVisible());
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });

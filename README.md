# HSC 2027 — চুনারুঘাট সরকারি কলেজ 🎓

চুনারুঘাট সরকারি কলেজের HSC ব্যাচ ২০২৭-এর শিক্ষার্থীদের জন্য তৈরি স্টাডি প্ল্যাটফর্ম।

**সাইটের মূল ঠিকানা:** https://hsc2027.de5.net/

## ওয়েবসাইটের কাঠামো (Hierarchical / Tree Structure)

```
🏫 চুনারুঘাট সরকারি কলেজ (Home)
├── 🔬 বিজ্ঞান বিভাগ (science.html)
│   ├── পদার্থবিজ্ঞান, রসায়ন, উচ্চতর গণিত, জীববিজ্ঞান, ICT, বাংলা, English
├── 📖 মানবিক বিভাগ (arts.html)
│   └── বাংলা, English, ICT, সমাজবিজ্ঞান, পৌরনীতি, অর্থনীতি, ইতিহাস
├── 💼 ব্যবসায় শিক্ষা (commerce.html)
│   └── হিসাববিজ্ঞান, ব্যবসায় উদ্যোগ, ফিন্যান্স, মার্কেটিং, অর্থনীতি, বাংলা, English, ICT, বাংলাদেশ ও বিশ্বপরিচয়
├── 💬 শিক্ষার্থী গ্রুপ (student-group.html) — যোগ দেওয়ার তথ্য
├── 👩‍🏫 শিক্ষক পরিচিতি (teachers.html) — সরবরাহ করা বইয়ের নাম, পদবি ও যোগাযোগ
├── 🎥 অনলাইন ক্লাস (classes.html) — ইন্টারনেট থেকে পাওয়া ফ্রি ক্লাস
├── ✅ অধ্যায় ট্র্যাকার (tracker.html)
└── 🕐 স্টাডি রুটিন (routine.html)
```

## ফিচারসমূহ

- ⏳ পরীক্ষার লাইভ কাউন্টডাউন (২৫ জুন ২০২৭)
- 🌳 বইয়ের মতো Tree Structure ডায়াগ্রাম হোম পেজে
- 📚 বিষয়পেজ — নির্বাচিত প্রস্তুতির চেকলিস্ট; বাংলা ২য় পত্রে দেওয়া ছবিভিত্তিক নির্বাচিত প্রস্তুতি; পূর্ণ তালিকা যাচাই বাকি
- ✅ অধ্যায় ট্র্যাকার — অগ্রগতি ব্রাউজারে অটো-সেভ হয়
- 🎥 অনলাইন ক্লাস — 10 Minute School, Shikho ও সাবজেক্টভিত্তিক YouTube ক্লাস
- 🕐 দৈনন্দিন স্টাডি রুটিন
- 💬 শিক্ষার্থী গ্রুপ — নিজের দেওয়া উত্তরের ভিত্তিতে গ্রুপের তথ্য দেখা যায়; পরিচয় যাচাই করা হয় না।

## GitHub Pages ও কাস্টম ডোমেইন সেটআপ

এই রিপোর `.github/workflows/pages.yml` শুধু `site/` ফোল্ডারকে সাইটের root হিসেবে প্রকাশ করে। প্রথমে workflow-টি `main` ব্রাঞ্চে মার্জ করতে হবে।

1. রিপো → **Settings → Pages → Build and deployment** → Source হিসেবে **GitHub Actions** বেছে নিন। GitHub Pages ব্রাঞ্চ থেকে প্রকাশের ক্ষেত্রে `/site` ফোল্ডার বেছে নেওয়ার সুবিধা নেই।
2. **Actions → Deploy HSC site to GitHub Pages → Run workflow** থেকে `main` ব্রাঞ্চে workflow চালান এবং সফল হওয়া পর্যন্ত অপেক্ষা করুন। `main`-এ পরবর্তী push-এ এটিও নিজে চলবে।
3. **Settings → Pages → Custom domain**-এ `hsc2027.de5.net` লিখে Save করুন। ডোমেইনটি আপনার নিয়ন্ত্রণে থাকতে হবে; সম্ভব হলে GitHub account settings থেকে domain verification করুন।
4. আপনার ডোমেইন/DNS প্রদানকারীর প্যানেলে `hsc2027.de5.net`-এর জন্য একটি **CNAME** রেকর্ড তৈরি করুন, যার target `numb-netizen.github.io` (URL বা `/Temp/site/` নয়)। যদি DNS zone হয় `de5.net`, host হবে `hsc2027`; আর যদি zone নিজেই `hsc2027.de5.net` হয়, host সাধারণত `@`। একই hostname-এ বিরোধপূর্ণ রেকর্ড থাকলে DNS প্রদানকারীর নির্দেশনা অনুসারে সরান।
5. DNS check পাস হলে **Enforce HTTPS** চালু করুন। DNS পরিবর্তন ও সার্টিফিকেট তৈরি হতে কিছু সময় লাগতে পারে। তারপর https://hsc2027.de5.net/ দেখুন।

GitHub Actions deployment-এর পর কাস্টম ডোমেইন ছাড়া ডিফল্ট project URL-এ সাইটের root হবে `https://numb-netizen.github.io/Temp/`, আগের `/Temp/site/` নয়। `site/CNAME` ফাইল একা ডোমেইনের DNS বা Pages সেটিংস পরিবর্তন করে না।

## সার্চ ইঞ্জিন sitemap

সাইটের `sitemap.xml`-এ প্রকাশ্য ও প্রাসঙ্গিক পেজগুলোর মূল HTTPS ডোমেইনের URL আছে; `robots.txt` সার্চ ইঞ্জিনকে সেটির অবস্থান জানায়। প্রতিটি পাবলিক পেজে আলাদা বিবরণ ও sitemap-এর সঙ্গে মেলে এমন canonical URL আছে। হোমপেজে WebSite structured data এবং শেয়ারের জন্য Open Graph তথ্যও আছে। সরানো আবেদন ও ভুল তালিকা এবং পুরোনো ভূগোল compatibility পেজে `noindex` আছে; পুরোনো URL ও ডেটা/অগ্রগতি না মুছে সেগুলো sitemap থেকে বাদ রাখা হয়েছে।

`node scripts/generate-sitemap.cjs` চালালে sitemap নতুন করে তৈরি হয়; Pages deployment-এও এটি স্বয়ংক্রিয়ভাবে চলে। `node scripts/generate-sitemap.cjs --check` দিয়ে জমা দেওয়া তালিকা যাচাই করা যায়। সাইটের জন্য ফাইল থাকা মানেই কোনো Search Console বা Bing অ্যাকাউন্টে মালিকানা যাচাই বা sitemap জমা হয়েছে এমন নয়।

### Google ও Bing-এ নিবন্ধন

1. [Google Search Console](https://search.google.com/search-console/) খুলে নিজের Google অ্যাকাউন্টে **Add property → URL prefix**-এ `https://hsc2027.de5.net/` দিন। HTML-file পদ্ধতিতে আপনার অ্যাকাউন্টের জন্য দেওয়া ফাইল লাগবে। রিপোতে থাকা `googleb7da7b15e33059e0.html` কেবল যে অ্যাকাউন্টের জন্য ইস্যু হয়েছে সেটির যাচাইয়ে কাজে লাগবে; অন্য অ্যাকাউন্টের জন্য আলাদা ফাইল লাগতে পারে। নির্দেশনা: [Google ownership verification](https://support.google.com/webmasters/answer/9008080)।
2. মালিকানা যাচাই হলে **Sitemaps**-এ `https://hsc2027.de5.net/sitemap.xml` জমা দিন। **URL inspection** দিয়ে হোমপেজ পরীক্ষা ও প্রয়োজনে indexing request করা যায়। জমা দেওয়া সফল ও index হওয়া আলাদা বিষয়।
3. [Bing Webmaster Tools](https://www.bing.com/webmasters/) থেকে সাইট যোগ ও যাচাই করুন, অথবা আগে যাচাই করা Search Console property [import করুন](https://blogs.bing.com/webmaster/2019/9/Import-sites-from-Search-Console-to-Bing-Webmaster-Tools/)। এরপর Sitemaps-এ একই URL জমা দিন। আগের `BingSiteAuth.xml` ফাইলও নির্দিষ্ট যাচাইয়ের জন্য; অ্যাকাউন্টে যাচাই সম্পন্ন হয়েছে কি না নিজে দেখুন।
4. নতুন পেজ যোগ করলে নির্ভুল বিষয়ভিত্তিক title ও description, canonical এবং হোম থেকে সাধারণ HTML লিংক দিন; `node --test tests/seo.test.cjs` ও sitemap check চালান। যাচাই ফাইল নিজের অ্যাকাউন্ট অনুযায়ী না বদলে সরাবেন না।

সার্চ ইঞ্জিন নিজস্ব সময়ে crawl/index করে এবং title/snippet নিজে বেছে নিতে পারে; sitemap, structured data বা indexing request থেকে ranking বা নির্দিষ্ট সময়ে উপস্থিতির নিশ্চয়তা নেই। HSC 2027-এর পূর্ণ সিলেবাস এখনো যাচাইকৃত নয়।

## লোকাল প্রিভিউ

```bash
cd site && python3 -m http.server 8000
# http://localhost:8000
```

## স্টাডি সাইটের লোগো

`site/assets/study-logo.png` এই শিক্ষার্থী-ভিত্তিক সাইটের জন্য AI দিয়ে তৈরি একটি নতুন লোগো। পুরোনো কলেজ লোগোর বই, আলো ও পাতার ধারণা থেকে অনুপ্রাণিত হলেও এটি কলেজের আনুষ্ঠানিক প্রতীক নয়।

## সরানো আবেদন পেজের পুরোনো ডেটা

আবেদন পেজ সরানো হয়েছে; পুরোনো `dabi.html`-এ শুধু অপসারণের নোটিশ থাকে যাতে Android-এর আগের বান্ডল করা কপি আপডেটে প্রতিস্থাপিত হয়। বিদ্যমান Supabase ডেটা বা অনুমতি পরিবর্তন করা হয়নি: `dabi_public_supporters` টেবিলের প্রকাশ্য নামগুলো আগের মতো পাবলিক API দিয়ে পড়া এবং নতুন রেকর্ড জমা দেওয়া সম্ভব; রোল নম্বর পাবলিক API থেকে পড়া যায় না। ডেটা বা API অনুমতি সরাতে আলাদা সিদ্ধান্ত ও পদক্ষেপ প্রয়োজন। SQL স্কিমা `supabase/migrations/`-এ আছে।

## Android অ্যাপ

সাইটের মেনুর **অ্যাপ ডাউনলোড** (`android-app.html`) পেজ থেকে beta APK ও ইনস্টলের নির্দেশনা পাওয়া যায়। `android/` হলো Android WebView অ্যাপের সোর্স। Android 1.3 থেকে সাইটের একটি সম্পূর্ণ কপি অ্যাপের সঙ্গে থাকে; বিষয়, রুটিন, টাইমার ও ট্র্যাকার অফলাইনে চলে। ইন্টারনেট থাকলে যাচাই করা নতুন সাইটের কপি প্রস্তুত হয় এবং ব্যবহারকারী চাইলে তা চালু করতে পারেন। অনলাইন ভিডিও এবং WhatsApp-এ ইন্টারনেট লাগে। Android System WebView প্রয়োজন। WhatsApp, YouTube ও বাইরের লিংক অন্য অ্যাপ বা ব্রাউজারে খোলে। পড়ার ট্র্যাকার ও অন্যান্য ব্রাউজার-সংরক্ষিত তথ্য অ্যাপের নিজস্ব WebView-তে থাকে; ফোনের ব্রাউজার বা অন্য ডিভাইসের সঙ্গে স্বয়ংক্রিয়ভাবে মেলে না।

Android Studio-তে `android/` খুলে বা JDK 17 ও Android SDK 35 দিয়ে `cd android && ./gradlew testDebugUnitTest assembleDebug` চালিয়ে debug APK বানানো যায়। GitHub-এর **Build Android app** workflow-ও ৩০ দিনের জন্য APK artifact তৈরি করে। Debug APK পরীক্ষার জন্য, Play Store-এ প্রকাশের জন্য নয়; স্থায়ী বিতরণ বা আপডেটের জন্য নিজের সুরক্ষিত signing key দিয়ে release APK/AAB তৈরি করতে হবে। বিভিন্ন workflow run-এর debug key আলাদা হতে পারে, তাই আগের debug APK-এর উপর সরাসরি update নাও হতে পারে। Uninstall করলে অ্যাপের স্থানীয় tracker data মুছে যায়। কোনো keystore বা password রিপোতে রাখবেন না।

### পরীক্ষামূলক Android release ও package

GitHub Releases-এর `android-v1.1-beta`-তে পরীক্ষামূলক **debug-signed** APK প্রকাশের workflow `.github/workflows/publish-android-beta.yml`। এটি আগে পরীক্ষিত main build artifact-টিই ব্যবহার করে; নতুন debug key তৈরি করে না। APK ও `SHA256SUMS.txt` সাধারণ ডাউনলোডের জন্য Releases-এ রাখা হয়। Packages-এ একই APK OCI artifact হিসেবে রাখা হয়; এটি ডেভেলপারদের `oras` দিয়ে pull করার জন্য, ফোনে সরাসরি ইনস্টল করার সাধারণ পথ নয়। নতুন GitHub container package ডিফল্টে private হতে পারে; জনসাধারণের জন্য দেখতে হলে মালিককে package settings থেকে visibility পরীক্ষা করতে হবে।

Debug key নিরাপদ স্থায়ী release key নয়; নতুন signing key দিয়ে তৈরি APK পূর্বেরটির ওপর আপডেট নাও হতে পারে। চূড়ান্ত বিতরণের আগে মালিকের নিয়ন্ত্রণে নিরাপদ release signing key ও repository secrets সেট করতে হবে; key বা password কখনো রিপোতে রাখতে হবে না।

Android 1.2 beta থেকে আমাদের WebView একটি সাধারণ User-Agent চিহ্ন পাঠায়, যার ভিত্তিতে সাইটে শুধু এই অ্যাপের মেনু ও ফুটারে অ্যাপ ডাউনলোড লিংক লুকানো হয়। অন্য WebView ও সাধারণ ব্রাউজারে লিংক থাকে। এটি নিরাপত্তা বা পরিচয় যাচাই নয়। পুরোনো 1.1 APK-তে চিহ্ন নেই, তাই সেখানে লিংক আগের মতো দেখা যাবে। 1.2 পরীক্ষামূলক APK debug key দিয়ে সই করা; আলাদা key হলে আগেরটির ওপর আপডেট নাও হতে পারে।

### অফলাইন সাইট ও আপডেট

Pages workflow প্রতিবার deploy করার সময় `scripts/offline-manifest.cjs` দিয়ে ফাইলের SHA-256 তালিকা তৈরি করে। Android অ্যাপ শুধু মূল HTTPS সাইট থেকে ওই তালিকা ও ফাইল ডাউনলোড করে; সম্পূর্ণ সেটের আকার ও প্রতিটি hash যাচাইয়ের পরই ব্যবহারকারীকে নতুন তথ্য চালু করার বোতাম দেখায়। সংযোগ বা যাচাই ব্যর্থ হলে পুরোনো সম্পূর্ণ কপি চালু থাকে। অন্তর্নির্মিত এবং হালনাগাদ পেজ একই `https://hsc2027.de5.net` origin ব্যবহার করে, যাতে একই ইনস্টলেশনের স্থানীয় tracker storage থাকে; কোনো গোপন key অ্যাপে রাখা হয় না। অ্যাপের ভিন্ন signing key হলে পুরোনো অ্যাপ আনইনস্টল করতে হতে পারে, যা তার স্থানীয় ট্র্যাকার ডেটা মুছে দেয়।

## Windows ও Linux ডেস্কটপ অ্যাপ (beta)

`desktop/` ফোল্ডারে Electron-এর মাধ্যমে একই ওয়েবসাইটের একটি offline snapshot প্যাকেজ করা হয়। Windows x64-এর জন্য NSIS installer এবং Linux x86_64-এর জন্য AppImage তৈরি হয়। ব্যবহারকারীর tracker তথ্য অ্যাপের নিজস্ব স্থানীয় storage-এ থাকে; ওয়েবসাইট বা অন্য ডিভাইসের সঙ্গে সিঙ্ক হয় না। সাইট পরিবর্তিত হলে নতুন অ্যাপ build দরকার; automatic update নেই। ভিডিও, বাইরের ওয়েব লিংক, WhatsApp ও Google Fonts-এর জন্য ইন্টারনেট প্রয়োজন।

```bash
cd desktop
npm ci
npm start
npm run dist:linux  # Linux-এ
npm run dist:win    # Windows-এ
```

Linux AppImage-এ `chmod +x <file>.AppImage` করে চালাতে হয়; কিছু distribution-এ FUSE লাগতে পারে। Windows build unsigned, তাই SmartScreen সতর্ক করতে পারে। শুধু বিশ্বস্ত উৎস থেকে ডাউনলোড করে প্রকাশিত SHA-256 মিলিয়ে নিন। ইনস্টলার স্থানীয় app data মুছে দেয় না, কিন্তু ব্যবহারকারী নিজে app data সরালে tracker হারাবে। `desktop.yml` CI দুই OS-এ offline navigation ও tracker পরীক্ষার পর installer তৈরি করে; প্রয়োজনে workflow dispatch দিয়ে beta release প্রকাশ করা যায়।

### বিশ্বস্ত Windows code signing (প্রস্তুত ব্যবস্থা)

বর্তমান প্রকাশিত Windows beta এখনো **unsigned**; শুধু workflow যোগ হলেই এটি signed হয় না। একটি Windows-এ বিশ্বাসযোগ্য **code-signing certificate**, তার private key-সহ password-protected PFX এবং certificate-এর SHA-1 thumbprint প্রয়োজন। এটি কেবল এমন certificate/provider-এর জন্য যেটি নীতিমালা মেনে PFX export অনুমতি দেয়; অনেক বর্তমান CA certificate-এর private key hardware token বা cloud HSM-এ non-exportable থাকে। সেক্ষেত্রে ওই provider-এর supported HSM/cloud signing integration আলাদাভাবে তৈরি করতে হবে; key export করতে বাধ্য করা যাবে না। Linux AppImage এই Windows Authenticode প্রক্রিয়ায় signed হয় না।

1. GitHub repository Settings → Environments-এ `windows-signing` environment আগে তৈরি করুন, deployment শুধু `main`-এ সীমিত করুন এবং সম্ভব হলে required reviewer অনুমোদন দিন। Secrets-এ শুধু environment-এর মাধ্যমে access দিন। Branch protection ও বিশ্বস্ত maintainer review চালু রাখুন।
2. ওই environment-এর secrets হিসেবে `WINDOWS_SIGNING_PFX_BASE64` (সম্পূর্ণ PFX-এর single-line base64) ও `WINDOWS_SIGNING_PFX_PASSWORD` দিন। Environment variable `WINDOWS_SIGNING_CERT_SHA1`-এ ঠিক ৪০টি hex অক্ষরের public certificate thumbprint দিন। কখনো certificate, private key, password বা secret-এর মান চ্যাট, লগ বা Git-এ দেবেন না। Repository/environment পরিচালনার অনুমতি শুধু বিশ্বস্ত ব্যক্তিদের দিন।
3. Actions → **Sign Windows desktop beta** workflow `main` থেকে চালান। সাইনিং শুধু ওই protected environment-এ চলে। Secrets না থাকলে, PFX/ thumbprint না মিললে, signature বিশ্বস্ত না হলে বা timestamp না থাকলে build ব্যর্থ হয়। Installer ও bundled app দুটির স্বাক্ষর যাচাই এবং offline smoke test পাস করার পরেই artifact তৈরি হবে। প্রথমে publish না করে artifact পরীক্ষা করুন।
4. প্রকাশ করতে workflow-তে `publish_signed_beta` নির্বাচন করলে আলাদা prerelease `desktop-v0.1.0-signed-beta` তৈরি হবে; বিদ্যমান unsigned release পরিবর্তিত হয় না। Tag আগে থেকে থাকলে workflow সেটি overwrite করে না। Signature থাকা মানেই SmartScreen-এর কোনো সতর্কতা থাকবে, এমন নিশ্চয়তা নেই।

CI-তে আলাদা temporary self-signed certificate দিয়ে signing পথ পরীক্ষা হয়; সেটি অবিশ্বস্ত, শুধু পরীক্ষার জন্য এবং কোনো release artifact-এ যায় না। Secret থাকা job-এ CI dependencies-ও key ব্যবহারের সুযোগ পায়; সেই কারণে workflow, lockfile ও dependencies বদল সর্বদা review করুন।

### Lightweight desktop beta

`desktop-lite/` হলো আলাদা Lite সংস্করণ: Windows x64-এ WebView2 এবং Linux-এ system WebKitGTK ব্যবহার করে, Electron-এর browser bundle নয়। Windows ZIP পুরো extract করে চালাতে হয়; Microsoft **.NET 10 Desktop Runtime x64** ও **Edge WebView2 Runtime** আগে থেকে না থাকলে আলাদা ইনস্টল করতে হবে। অ্যাপ unsigned, SmartScreen সতর্ক করতে পারে। Linux `.deb` Ubuntu/Debian ও WebKitGTK 4.1-এর জন্য, সিস্টেম dependencies ইনস্টল করতে হতে পারে; এটি সব distribution-এর AppImage বিকল্প নয়। Dependencies ডাউনলোড/ইনস্টল করতে ইন্টারনেট ও অতিরিক্ত জায়গা লাগতে পারে।

দুটোতেই bundled snapshot ও local tracker অফলাইনে কাজ করে; ভিডিও/বাইরের লিংক ও ফন্ট অনলাইন। Lite, পুরোনো Electron অ্যাপ ও ব্রাউজারের tracker storage আলাদা এবং automatic migration/sync নেই; আগের ডেটা দরকার হলে পুরোনো অ্যাপ বা তার data মুছবেন না। নতুন site snapshot পেতে নতুন build দরকার। একটি স্থির loopback port (Windows 19828 / Linux 19829) কেবল স্থানীয় পৃষ্ঠার জন্য ব্যবহৃত হয়; একই সময়ে একাধিক instance বা port দখল থাকলে অ্যাপ চালু হবে না।

Windows build: `dotnet publish desktop-lite/windows/HscLite.csproj -c Release -r win-x64 --self-contained false -p:PublishSingleFile=true`, তারপর output-এর পাশে `site` কপি করতে হবে। Linux: `desktop-lite/linux/build-deb.sh`, তারপর `sudo apt install ./desktop-lite/dist/HSC-2027-Lite-0.2.1-beta-linux.deb`। `.github/workflows/desktop-lite.yml` প্যাকেজকৃত apps-এ offline tracker/theme smoke test চালায় ও manual dispatch-এ beta release ও SHA-256 প্রকাশ করে। Linux CI-তে sandbox disable কেবল headless test-এর জন্য; বিতরণকৃত অ্যাপ sandbox বন্ধ করে না।

### মতামত ও নিরাপত্তা রিপোর্ট

হোমপেজের **মতামত জানাও** অংশ বা যেকোনো পেজের ফুটারের লিংক থেকে ফর্ম খোলে। বিষয় ও বিবরণ পাঠালে GitHub লগইন ছাড়াই মতামত গ্রহণের চেষ্টা করে। গ্রহণের নিশ্চিত বার্তা মানে এটি Supabase-এর private `feedback_queue`-তে রাখা হয়েছে, Issue ইতিমধ্যে তৈরি হয়েছে এমন নয়। `feedback-issues.yml` সাধারণত প্রতি পাঁচ মিনিটে সারি থেকে সর্বোচ্চ পাঁচটি প্রকাশ্য GitHub Issue তৈরি করে; GitHub Actions বিলম্বিত বা বন্ধ থাকলে বেশি সময় লাগতে পারে। ব্যর্থ হলে লেখাটি ফর্মে থাকে; সংযোগ বিচ্ছিন্ন হলে সার্ভারে গৃহীত হয়েছে কি না নিশ্চিত নাও হতে পারে, তাই পুনরায় পাঠালে দ্বিগুণ হতে পারে। ইন্টারনেট ও JavaScript প্রয়োজন। পুরোনো offline app-এ পরিবর্তন পেতে নতুন build দরকার।

Issue ও তার বিষয়বস্তু **সবার জন্য প্রকাশ্য** হবে; ব্যক্তিগত বা সংবেদনশীল তথ্য দেবেন না। নিরাপত্তা রিপোর্ট এখানে নয়। অপব্যবহার সীমিত করতে সারিতে সর্বোচ্চ পাঁচটি মতামত প্রতি ঘণ্টায় গ্রহণ করা হয়; এটি সম্পূর্ণ স্প্যাম প্রতিরোধ নয় এবং সবার জন্য একই সীমা। ব্যবহার পূর্ণ হলে অপেক্ষা করতে হবে। Supabase টেবিলে anon/authenticated-এর পড়া বা সরাসরি লেখার অনুমতি নেই; Edge Function কেবল GitHub Actions-এর যাচাইকৃত নির্দিষ্ট main workflow-এর স্বল্পমেয়াদি OIDC পরিচয়ে সারি পড়া ও চিহ্নিত করার অনুমতি দেয়। GitHub token ব্রাউজার বা Supabase-এ রাখা হয় না। সারির রেকর্ড স্বয়ংক্রিয়ভাবে মুছে ফেলা হয় না; প্রকল্পের প্রশাসককে নিয়মিত পর্যবেক্ষণ ও উপযুক্ত retention পরিচালনা করতে হবে। GitHub Actions বন্ধ বা permission ব্যর্থ হলে সারি জমে থাকবে—Actions-এর `Deliver site feedback to GitHub Issues` workflow পর্যবেক্ষণ করুন; ব্যর্থ রান সফলভাবে পুনরায় চালানো যায়। স্থিতিশীল ID দিয়ে পূর্বে তৈরি Issue খুঁজে পুনরাবৃত্তি কমানো হয়।

নিরাপত্তা দুর্বলতা পাবলিক Issue-তে না লিখে [গোপন GitHub vulnerability report](https://github.com/numb-netizen/Temp/security/advisories/new) ব্যবহার করুন। বিস্তারিত [SECURITY.md](SECURITY.md)-এ।

### MCQ প্রশ্নব্যাংক (প্রস্তুতি পর্যায়)

ভবিষ্যতের লাইভ MCQ পরীক্ষার জন্য প্রশ্ন বিষয় ও অধ্যায় আলাদা করে Google Sheet (লেখা ও শিক্ষকের যাচাই) এবং Supabase-এর আলাদা "mcq exam" প্রকল্প (`mcq_questions`; দর্শক কেবল যাচাই করা প্রশ্ন পড়তে পারে) উভয় জায়গায় রাখা হয়। প্রথম ব্যাচের প্রশ্নগুলো অযাচাইকৃত AI খসড়া; শিক্ষকের যাচাই ছাড়া সাইটে আসবে না। যাচাই ও সিঙ্কের নিয়ম: [MCQ প্রশ্নব্যাংক](docs/mcq-bank.md)।

### HSC 2027 পাঠ্যসূচি যাচাইয়ের অবস্থা

সাইটের অধ্যায় চেকলিস্ট এখনো বাছাই করা পুরোনো প্রস্তুতির বিষয়, পূর্ণ বা যাচাইকৃত HSC 2027 সিলেবাস নয়। বিদ্যমান পত্রের লেবেলগুলিও পরীক্ষা বাকি; ট্র্যাকারের শতাংশ কেবল দৃশ্যমান পুরোনো তালিকার জন্য। বাংলা ২য় পত্রে ব্যবহারকারীর দেওয়া সূচির ছবির নির্বাচিত বিষয় ও শুধু সেগুলোর অগ্রগতি দেখানো হয়; ছবিগুলো সরকারি পূর্ণ পাঠ্যসূচির প্রমাণ নয়। ইংরেজি ২য় পত্রে যাচাই শেষ না হওয়া পর্যন্ত অনুমানভিত্তিক তালিকা বা শতাংশ দেখানো হয় না। ২০২৫–২৬ শিক্ষাবর্ষের অফিসিয়াল সূত্র, বিষয়ভিত্তিক ঘাটতি ও নিরাপদ key migration-এর পরিকল্পনা: [পাঠ্যসূচি যাচাই প্রতিবেদন](docs/syllabus-verification.md)।

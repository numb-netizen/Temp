# HSC 2027 — চুনারুঘাট সরকারি কলেজ 🎓

চুনারুঘাট সরকারি কলেজের HSC ব্যাচ ২০২৭-এর শিক্ষার্থীদের জন্য তৈরি স্টাডি প্ল্যাটফর্ম।

**🌐 Live Website:** https://hsc2027.de5.net/ (কাস্টম ডোমেইন)
**ব্যাকআপ URL:** https://numb-netizen.github.io/Temp/

## ওয়েবসাইটের কাঠামো (Hierarchical / Tree Structure)

```
🏫 চুনারুঘাট সরকারি কলেজ (Home)
├── 🔬 বিজ্ঞান বিভাগ (science.html)
│   ├── পদার্থবিজ্ঞান, রসায়ন, উচ্চতর গণিত, জীববিজ্ঞান, ICT, বাংলা, English
├── 📖 মানবিক বিভাগ (arts.html)
│   └── বাংলা, English, বাংলাদেশ ও বিশ্বপরিচয়, পৌরনীতি, অর্থনীতি, ভূগোল
├── 💼 ব্যবসায় শিক্ষা (commerce.html)
│   └── হিসাববিজ্ঞান, ব্যবসায় উদ্যোগ, ফিন্যান্স, মার্কেটিং, অর্থনীতি...
├── 🎥 অনলাইন ক্লাস (classes.html) — ইন্টারনেট থেকে পাওয়া ফ্রি ক্লাস
├── ✅ অধ্যায় ট্র্যাকার (tracker.html)
└── 🕐 স্টাডি রুটিন (routine.html)
```

## ফিচারসমূহ

- ⏳ পরীক্ষার লাইভ কাউন্টডাউন (২৫ জুন ২০২৭)
- 🌳 বইয়ের মতো Tree Structure ডায়াগ্রাম হোম পেজে
- 📚 ১৫টি সাবজেক্ট পেজ — প্রতিটিতে অধ্যায়ভিত্তিক চেকলিস্ট
- ✅ অধ্যায় ট্র্যাকার — অগ্রগতি ব্রাউজারে অটো-সেভ হয়
- 🎥 অনলাইন ক্লাস — 10 Minute School, Shikho ও সাবজেক্টভিত্তিক YouTube ক্লাস
- 🕐 দৈনন্দিন স্টাডি রুটিন

## GitHub Pages সেটআপ

1. রিপো → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `arena/bc575e3a-temp`, Folder: `/site` → **Save**
4. Custom domain: `hsc2027.de5.net` → **Save**

## কাস্টম ডোমেইন: hsc2027.de5.net

ডোমেইনটি DNSHE (de5.net) থেকে ফ্রি নেওয়া। DNS সেটআপ:

1. **DNSHE প্যানেলে** (dnshe.com) → Manage domains → `hsc2027.de5.net` → DNS Records
2. CNAME রেকর্ড যোগ করুন:
   - Host: `@` → Value: `numb-netizen.github.io`
   - Host: `www` → Value: `numb-netizen.github.io`
3. GitHub → Settings → Pages → **Custom domain**: `hsc2027.de5.net` → Save

> ⚠️ DNSHE ফ্রি ডোমেইন প্রতি ১৮০ দিনে একবার রিনিউ করতে হয়।

## লোকাল প্রিভিউ

```bash
cd site && python3 -m http.server 8000
# http://localhost:8000
```

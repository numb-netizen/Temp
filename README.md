# HSC 2027 — Study Website 🎓

HSC 2027 ব্যাচের শিক্ষার্থীদের জন্য তৈরি একটি সম্পূর্ণ স্টাডি প্ল্যাটফর্ম।

**🌐 Live Website:** https://hsc2027.de5.net/ (কাস্টম ডোমেইন)
**ব্যাকআপ URL:** https://numb-netizen.github.io/Temp/

## ফিচারসমূহ

- ⏳ পরীক্ষার লাইভ কাউন্টডাউন (২৫ জুন ২০২৭)
- 📚 বিভাগভিত্তিক সাবজেক্ট (বিজ্ঞান · মানবিক · ব্যবসায় শিক্ষা)
- ✅ অধ্যায় ট্র্যাকার — অগ্রগতি ব্রাউজারে অটো-সেভ হয়
- 🕐 দৈনন্দিন স্টাডি রুটিন
- 📥 নোটস, MCQ ব্যাংক, সাজেশন ও মডেল টেস্ট
- ❓ সাধারণ জিজ্ঞাসা (FAQ)

## GitHub Pages সেটআপ

সাইটটি GitHub Pages দিয়ে হোস্ট করা হয়। চালু করতে:

1. রিপো → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `arena/bc575e3a-temp`, Folder: `/site` → **Save**
4. কয়েক মিনিট পর সাইট লাইভ হবে: https://numb-netizen.github.io/Temp/

## কাস্টম ডোমেইন: hsc2027.de5.net

ডোমেইনটি DNSHE (de5.net) থেকে ফ্রি নেওয়া। কানেক্ট করতে:

1. **DNSHE প্যানেলে** (dnshe.com) → Manage domains → `hsc2027.de5.net` → DNS Records
2. নিচের CNAME রেকর্ডগুলো যোগ করুন:
   - Host: `@` → Value: `numb-netizen.github.io`
   - Host: `www` → Value: `numb-netizen.github.io`
3. **GitHub** → Settings → Pages → **Custom domain**: `hsc2027.de5.net` → Save
4. DNS প্রোপাগেট হতে কয়েক ঘণ্টা লাগতে পারে; এরপর HTTPS অটোমেটিক চালু হবে

> ⚠️ DNSHE ফ্রি ডোমেইন প্রতি ১৮০ দিনে একবার রিনিউ করতে হয় — মেয়াদ শেষের আগেই রিনিউ করে রাখুন।

## লোকাল প্রিভিউ

```bash
cd site && python3 -m http.server 8000
# http://localhost:8000
```

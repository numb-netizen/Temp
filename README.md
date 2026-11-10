# HSC 2027 — Study Website 🎓

HSC 2027 ব্যাচের শিক্ষার্থীদের জন্য তৈরি একটি সম্পূর্ণ স্টাডি প্ল্যাটফর্ম।

**🌐 Live Website:** https://numb-netizen.github.io/Temp/

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

## কাস্টম ডোমেইন (ঐচ্ছিক)

নিজের ডোমেইন (যেমন `hsc2027.com`) ব্যবহার করতে চাইলে:

1. যেকোনো রেজিস্ট্রার থেকে ডোমেইন কিনুন (Cloudflare, Namecheap, Porkbun ইত্যাদি)
2. Settings → Pages → **Custom domain**-এ ডোমেইনটি লিখুন
3. ডোমেইন প্রোভাইডারের DNS-এ CNAME রেকর্ড যোগ করুন: `www` → `numb-netizen.github.io`
4. HTTPS এনফোর্সমেন্ট চালু করুন

## লোকাল প্রিভিউ

```bash
cd site && python3 -m http.server 8000
# http://localhost:8000
```

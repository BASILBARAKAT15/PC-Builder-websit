<<<<<<< HEAD
# 🖥️ PC Builder — Setup Guide

## الخطوات لتشغيل المشروع

### 1. جيب مفتاح Gemini API (مجاني)

1. افتح **[aistudio.google.com/apikey](https://aistudio.google.com/apikey)**
2. سجل دخول بحساب Google
3. اضغط **Create API Key**
4. انسخ المفتاح

> ✅ مجاني بالكامل — بدون بطاقة — 15 طلب بالدقيقة

---

### 2. جهز السيرفر

```bash
cd server
cp .env.example .env
```

افتح ملف `.env` والصق المفتاح:

```
GEMINI_API_KEY=AIzaSy...your_key_here
```

---

### 3. شغل المشروع

```bash
cd server
npm install
npm start
```

افتح المتصفح: **http://localhost:3000**

---

### 4. جرب الـ AI Compatibility

1. روح على **Builder**
2. اختر قطعتين أو أكثر (مثلاً CPU + Motherboard)
3. اضغط **🤖 AI Compatibility Check**
4. الـ AI رح يحلل التوافق ويعطيك تقرير مفصل

---

## البنية

```
webProject/
├── server/           ← السيرفر (Node.js + Express)
│   ├── server.js     ← يستقبل الطلبات ويبعثها لـ Gemini
│   ├── .env          ← مفتاح الـ API (سري!)
│   └── package.json
├── HTMLPage/         ← صفحات الموقع
├── CSSPage/          ← الستايلات
├── Js/               ← الجافاسكريبت
│   └── compatibility.js  ← يبعث لـ /api/compatibility
├── Image/            ← الصور
└── admin/            ← لوحة التحكم
```

## كيف يشتغل؟

```
[المتصفح] → POST /api/compatibility → [السيرفر] → Gemini API → [رد JSON] → [عرض النتيجة]
```

المفتاح محفوظ بالسيرفر فقط — ما حد بقدر يشوفه من المتصفح.
=======
"# BASILBARAKAT15-Chatting-Between-Peers" 
"# BASILBARAKAT15-Chatting-Between-Peers" 
>>>>>>> 99f77d612da4f2605b19b938d059c1f79c49f8a3

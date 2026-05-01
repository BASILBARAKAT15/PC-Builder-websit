# الإصلاحات المطبّقة — PC Builder

## الجولة الأولى: الأمان والبنية (13 إصلاحاً)

### 🔴 الحرجة
1. **تزوير أسعار الطلبات** — `api/orders/place.php` يتحقق من السعر في DB (اختُبر: RTX 4090 بـ $0.01 → حُفظت $1599)
2. **المنتجات المفقودة** — أُضيف 44 منتجاً إلى `seed_products.sql` (الإجمالي 83 في 10 فئات)
3. **تضارب تسمية الفئات** — dropdown في admin يتطابق مع products-sync
4. **XSS في 5 مواضع** — utils.js (showNotification, navbar, showUserMenu, viewOrders, openQuickView)
5. **placeholder hash** — حُذف من schema.sql

### 🟠 المتوسطة
6. **رسالة DB failed** — الآن تُسجّل السبب في error_log
7. **utils.js مكرر** — حُذف من checkout.html
8. **login returnToCheckout** — يذهب لـ checkout ويُمسح المفتاح
9. **seed_admin.php** — لم يعد يكشف كلمة السر
10. **wishlist sync** — يدمج بدل الاستبدال
11. **coupon 404→400** — إصلاح دلالي
12. **كوبون غير صالح** — يُرفض بدل التجاهل
13. **عرض عناوين الشحن** — عمود جديد في admin/orders

---

## الجولة الثانية: الميزات والسلوك (10 إصلاحات)

### الحرجة
1. **Proceed to Checkout / Clear Cart لا يعملان**
   - **السبب**: الدالتان `checkout()` و `clearCart()` كانتا غير موجودتين
   - **الحل**: أُضيفتا إلى `Js/Cart.js`. `checkout()` يتحقق من session قبل الذهاب لـ checkout

2. **إضافة المنتجات للأدمن — مواصفات كاملة حسب النوع**
   - **الحل**: عمود `specs TEXT` (JSON) في جدول products. ملف migration: `api/migration_add_specs.sql`
   - Admin UI: عند اختيار الفئة تظهر حقول مواصفات محددة (CPU: Cores/Threads/Clock/..., GPU: VRAM/Memory Type/..., إلخ)
   - الحقول الفارغة تُتجاهل — الأدمن يملأ ما يعرفه فقط
   - `products/add.php` + `products/list.php` يتعاملان مع JSON
   - أُضيفت صورة ورقم مخزون كحقول مستقلة

3. **products-sync ينسخ المواصفات للبطاقات المولّدة**
   - البطاقات الجديدة من DB لها `data-specs` بنفس تنسيق البطاقات الأصلية → quickview و compare يعرضانها بنفس الطريقة

4. **المفضلة — صفحة مستقلة + رابط navbar**
   - `HTMLPage/wishlist.html` جديدة: عرض مفصّل، أزرار Add to Cart و Remove و Clear All
   - رابط ❤️ في navbar بجانب Cart مع badge يظهر عدد العناصر
   - `updateWishlistBadge()` تُستدعى عند كل تغيير

5. **Customize يعيد للقسم الصحيح**
   - استخدام URL hash `#components`
   - `Build.js` يفتح قسم المكونات تلقائياً إذا كان `#components` في URL
   - عُدّل 7 ملفات JS لصفحات الفئات + `products-sync.js`

6. **Compare يعرض كل المواصفات (ليس فقط السعر)**
   - **السبب الأصلي**: الكود كان يعمل صحيحاً، لكن بطاقات prebuilt لم تكن تحوي `data-specs`
   - **الحل**: Python script أضاف `data-specs` إلى كل الـ 16 بطاقة في `prebuilt.html` تلقائياً. الآن المقارنة تعرض Processor, GPU, Memory, Storage, Display, Refresh Rate... إلخ

7. **بطاقات Pre-Built كبيرة**
   - الـ `ul` مقصّر إلى 2 نقاط رئيسية (Processor + GPU للـ PCs، Display + Refresh للـ TVs)
   - المواصفات الكاملة تظهر في Quick View و Compare
   - CSS محدّث: padding أقل، فونت أصغر، الصور 130px بدل 150px

8. **Contact footer متداخل**
   - `contact.css`: أُضيف CSS للـ `.footer-content` (4-column grid)، `.footer-section`، `.footer-bottom`
   - Responsive: 4 أعمدة على الديسكتوب، عمودين على التابلت، واحد على الموبايل

---

## الملفات المعدّلة/المضافة في هذه الجولة

### مضافة
- `HTMLPage/wishlist.html` — صفحة المفضلة المستقلة
- `api/migration_add_specs.sql` — لمن عنده DB قديم

### معدّلة
- `api/schema.sql` — عمود specs
- `api/products/add.php` — يستقبل specs
- `api/products/list.php` — يرجع specs كـ JSON
- `Js/api.js` — API.products.add يقبل specs
- `Js/Cart.js` — أُضيف checkout() + clearCart()
- `Js/Build.js` — يفتح components section مع `#components`
- `Js/utils.js` — navbar (❤️ link + badge), updateWishlistBadge()
- `Js/products-sync.js` — يضع data-specs في البطاقات
- `Js/Coolingsystem.js, GraphicsCard.js, Memory.js, Motherboard.js, PowerSupply.js, Storage.js, processor.js` — redirect لـ `build.html#components`
- `admin/admin.js` — SPEC_TEMPLATES + onCategoryChange() + addProduct() محدّث
- `admin/products.html` — حقول ديناميكية + صورة + مخزون
- `HTMLPage/prebuilt.html` — data-specs لكل 16 بطاقة + `ul` مقصّر
- `CSSPage/prebuilt.css` — بطاقات أصغر
- `CSSPage/contact.css` — footer grid layout

---

## للتشغيل على DB موجود مسبقاً

إذا عندك DB من نسخة سابقة، شغّل في phpMyAdmin:
```sql
-- استخدم ملف api/migration_add_specs.sql — يضيف عمود specs فقط
```

إذا DB جديد: خطوات الإعداد الأصلية (schema.sql → wishlist_schema.sql → seed_products.sql → seed_admin.php).

---

## الجولة الثالثة: إصلاحات متابعة (3 مشاكل)

### 1. زرّان Compare يظهران على البطاقات الأصلية
- **السبب**: `addCompareButtons` كان يُستدعى مرتين — مرة من `processor.js` (وأخواتها) على DOMContentLoaded، ومرة ثانية من `products-sync.js` بعد إضافة البطاقات الجديدة. الاستدعاء الثاني كان يضيف زراً آخر لكل بطاقة أصلية.
- **الحل**: جعلت كل دوال الـ init في `utils.js` **idempotent** — تتحقق من وجود الزر قبل إضافته:
  - `addCompareButtons` — يتخطى البطاقة لو عندها `.compare-btn`
  - `addWishlistButtons` — يتخطى البطاقة لو عندها `.wishlist-btn`
  - `enableQuickView` — يتخطى البطاقة لو عندها `.quick-view-btn`
  - `enableImageZoom` — يتخطى الصورة إذا `data-zoomEnabled=1`
- **الاختبار**: JSDoM أثبت أن الاستدعاء الأول والثاني كلاهما ينتج 2 أزرار (ليس 4)

### 2. كبسة Quick View لا تظهر على المنتجات المضافة من الأدمن
- **السبب**: `products-sync.js` كان يعيد تشغيل 6 دوال init بعد إضافة البطاقات الجديدة، لكن `enableQuickView` **لم تكن** من ضمنها
- **الحل**: أضفت `enableQuickView` إلى قائمة إعادة التشغيل

### 3. موضع زر Quick View خاطئ (فوق أزرار الشراء والمقارنة)
- **السبب**: CSS كان يضع الزر عند `bottom: 70px` — ومع تقليص حجم البطاقات، صار يتداخل مع زري Buy و Compare
- **الحل**:
  - CSS: نقلت الزر إلى `top: 12px; left: 12px` (ركن علوي يسار البطاقة، في منطقة الصورة)
  - JS: الزر يُضاف **بعد `<img>` مباشرة** في DOM (بدلاً من `appendChild` الذي يجعله آخر عنصر)
  - أضفت `pointer-events: none` (و `auto` عند hover) لمنع تعارض النقر مع الصورة

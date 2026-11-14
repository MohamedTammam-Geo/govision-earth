# تحديث موقع Govision Earth على GitHub

## الأفضل: تحديث المستودع الحالي دون حذفه

المستودع الحالي: https://github.com/MohamedTammam-Geo/govision-earth

1. احفظ نسخة احتياطية من المستودع الحالي: **Code → Download ZIP**.
2. فك ضغط **Govision_Earth_Atlas_v3.zip** على جهازك.
3. افتح صفحة الرفع: https://github.com/MohamedTammam-Geo/govision-earth/upload/main
4. افتح مجلد المشروع الجديد، وحدد *محتوياته* بالكامل: `assets`, `data`, `docs`, `scripts`, `index.html`, `README.md`, `LICENSE`, `.gitignore`.
5. اسحب العناصر من **Windows File Explorer** إلى GitHub، وليس من نافذة `Choose your files`.
6. راجع أن `index.html` في جذر المستودع وأن `assets/css/site.css` و`assets/js/site.js` و`data/app_data.json` وملفات الخرائط تظهر في مساراتها الصحيحة.
7. اختر **Commit directly to the main branch** واكتب `Upgrade Govision Earth: animated radar timeline and swipe` ثم **Commit changes**.
8. افتح https://mohamedtammam-geo.github.io/govision-earth/ ثم استخدم `Ctrl + Shift + R` لتحديث الملفات المخزنة في المتصفح.

**لا تحتاج لحذف المستودع.** الحفاظ عليه يبقي رابط الموقع ورابط NASA دون تغيير. قد تبقى ملفات قديمة غير مستخدمة في المستودع؛ لا تؤثر على تشغيل الموقع الجديد ويمكن تنظيفها لاحقًا.

## تنظيف الملفات القديمة (اختياري)

بعد التأكد من عمل الموقع الجديد، يمكن إزالة الملفات القديمة غير المستخدمة مثل `assets/js/app.js` و`assets/css/styles.css` عبر واجهة GitHub، ملفًا ملفًا، مع Commit للتعديلات. لا تحذف المجلد `assets/maps` أو `data` أو `docs` كاملًا.

## إذا أردت حذف المستودع بالكامل

من **Settings → General → Danger Zone → Delete this repository**، ستحتاج كتابة الاسم الكامل للتأكيد. هذه عملية مدمرة وتحذف تاريخ التعديلات؛ لا أنصح بها للمشروع الحالي. إعادة إنشاء مستودع بالاسم نفسه ممكنة لاحقًا، لكن ذلك ليس تحديثًا عاديًا وقد يؤثر مؤقتًا في رابط الموقع.

## الوظائف الجديدة بعد التحديث

- في أعلى الموقع تتغير صورة GIF عبر 6 سبتمبر و30 سبتمبر و12 أكتوبر.
- أعلى الخريطة، جرّب Single ثم Side by side ثم Swipe واسحب المؤشر، ثم GIF للتشغيل أو الإيقاف.
- في الرسم الزمني اختر All four لعرض المسارات الأربعة على رسم واحد.
- جرّب Light/Dark والوضعين Satellite/Streets.

إذا بقي شكل قديم، استخدم Ctrl + Shift + R بعد نجاح GitHub Pages deployment.

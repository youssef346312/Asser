# دليل النشر على Railway - AsserCoin Platform

## لماذا Railway أفضل من Render؟
✅ أسرع في النشر (3-5 دقائق)
✅ إعداد قاعدة البيانات تلقائي
✅ متغيرات البيئة أسهل
✅ مراقبة أفضل للأخطاء
✅ استقرار أكثر

## الخطوات المفصلة:

### 1. إنشاء حساب Railway
- اذهب إلى: https://railway.app
- اضغط "Login"
- سجل دخول باستخدام GitHub
- اربط حسابك مع GitHub

### 2. إنشاء مشروع جديد
- اضغط "New Project"
- اختر "Deploy from GitHub repo"
- اختر المستودع: `youssef34631/Asser`
- اضغط "Deploy Now"

### 3. إضافة قاعدة البيانات
- في نفس المشروع، اضغط "New"
- اختر "Database"
- اختر "PostgreSQL"
- سيتم إنشاؤها تلقائياً وربطها

### 4. إعداد متغيرات البيئة
في تبويب "Variables":

```
NODE_ENV=production
JWT_SECRET=AsserCoin2025SecretKeyForJWTTokenSecurity
EMAIL_USER=asserplatform@gmail.com
EMAIL_PASS=dfij uzch cwtz plpi
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=asserplatform@gmail.com
SMTP_PASS=dfij uzch cwtz plpi
```

ملاحظة: DATABASE_URL يُضاف تلقائياً من قاعدة البيانات

### 5. إعداد قاعدة البيانات
بعد نجاح النشر:
- اذهب لتبويب "Data" في قاعدة البيانات
- أو استخدم "Query" tab
- نفذ الأمر: يتم تلقائياً من خلال Drizzle

### 6. الوصول للتطبيق
- ستحصل على رابط مثل: `https://asser-production.up.railway.app`
- التطبيق يعمل 24/7 بدون انقطاع
- سرعة استجابة ممتازة

## الميزات الإضافية:
- Metrics مراقبة الأداء
- Logs مراقبة السجلات
- One-click rollback للعودة للإصدار السابق
- Custom domains مجاني

## خطة التسعير:
- $5 شهرياً لاستخدام عادي
- أول $5 مجاني كل شهر
- أفضل من Render للمشاريع الجدية

المشروع جاهز 100% للنشر على Railway!
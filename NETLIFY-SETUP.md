# إعداد منصة أسير على Netlify

## الخطوات المطلوبة:

### 1. ربط GitHub مع Netlify
- سجل دخول إلى https://netlify.com
- اختر "New site from Git"
- اربط GitHub واختر مستودع `youssef34631/Asser`

### 2. إعدادات البناء في Netlify:
```
Build command: npm run build
Publish directory: dist
Functions directory: netlify/functions
```

### 3. متغيرات البيئة المطلوبة:
أضف هذه المتغيرات في Site Settings > Environment Variables:

```
NODE_ENV=production
DATABASE_URL=[رابط قاعدة البيانات - من Neon أو Supabase]
JWT_SECRET=AsserCoin2025SecretKeyForJWTTokenSecurity
EMAIL_USER=asserplatform@gmail.com
EMAIL_PASS=dfij uzch cwtz plpi
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=asserplatform@gmail.com
SMTP_PASS=dfij uzch cwtz plpi
```

### 4. قاعدة البيانات:
يمكنك استخدام:
- **Neon Database** (مجاني): https://neon.tech
- **Supabase** (مجاني): https://supabase.com
- **PlanetScale** (مجاني): https://planetscale.com

### 5. بعد النشر:
- ستحصل على رابط مثل: `https://asser-platform.netlify.app`
- تشغيل أمر إعداد قاعدة البيانات: `npm run db:push`

## مميزات Netlify:
✅ نشر تلقائي من Git
✅ HTTPS مجاني
✅ CDN عالمي
✅ Serverless Functions
✅ استقرار عالي
✅ دومين مخصص مجاني

## ملاحظات:
- الخطة المجانية: 100GB bandwidth شهرياً
- Functions: 125,000 استدعاء شهرياً
- Build time: 300 دقيقة شهرياً
# Echoes of Exploration

## التشغيل
- ارفع **كل** الملفات إلى GitHub في المجلد الرئيسي (بلا مجلدات)، ثم فعّل Pages.
- لا تفتح index.html مباشرة من ذاكرة الهاتف: المجسّمات الحقيقية تحتاج خادمًا (مثل GitHub Pages).

## المجسّمات
- مجسّمات ناسا الحقيقية (model_*.glb): Apollo LM، Viking، Mars Exploration Rover، InSight، Ingenuity، Curiosity.
- بقية القطع مجسّمات مبنية بالكود، وتُستبدل بنموذج حقيقي عند إضافة ملف GLB:
  1. حمّل ملف GLB من https://nasa3d.arc.nasa.gov وارفعه بجانب index.html.
  2. في atlas.js ابحث عن `const GLB={` وأضف سطرًا مثل: `lrv15:'model_lrv.glb'`.
  3. اختياري: أضف جملة في `GLBNOTE` لوصف النموذج.

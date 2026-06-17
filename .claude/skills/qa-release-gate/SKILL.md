---
name: qa-release-gate
description: Enforce Blumark24 OS quality gates before release or PR. Use for lint/build validation, scope review, file-change summaries, regression risk, and preventing merges before verification.
---

# qa-release-gate

## الهدف
فرض بوابة جودة واضحة قبل التسليم أو الدمج في Blumark24 OS، مع التحقق من النطاق، lint/build، والمخاطر.

## متى تستخدمها
- قبل إنهاء أي تعديل برمجي.
- عند إعداد تقرير PR أو مراجعة جاهزية الدمج.
- عند التأكد من أن الملفات المعدلة ضمن الطلب فقط.

## حدود الصلاحية
- لا تنشئ PR أو commit أو push إلا بطلب صريح.
- لا تعدل التصميم أو RTL أو الهوية دون طلب.
- لا تعدل Supabase/RLS/migrations دون طلب صريح.
- لا تستخدم بيانات وهمية.
- لا تستخدم localStorage للبيانات التجارية أو الحساسة.

## قواعد Blumark24 OS الخاصة
- التدفق المعتمد: Owner -> Organization -> Settings -> Administrative Structure -> Employees -> Roles & Permissions -> Operational Modules -> Virtual Office -> AI.
- أي PR يجب أن يذكر الملفات المعدلة وسبب التعديل ونتيجة lint/build.
- يجب حماية السوق السعودي واللغة العربية أولًا.
- يجب ربط الميزات بالمنشأة والصلاحيات والباقات عند الحاجة.
- أي تعديل يجب أن يكون صغيرًا ومحدود النطاق.
- لا تسمح بدمج تغيير يكسر حالات فارغة صادقة أو يعرض بيانات وهمية.

## قائمة فحص قبل التعديل
- حدد النطاق والملفات المسموح تعديلها.
- افحص git status قبل البدء.
- راجع هل يلزم lint/build أو اختبار محدد.
- تأكد من عدم وجود قيود تمنع تعديل ملفات معينة.
- تحقق من عدم الحاجة إلى PR/commit/push.

## قائمة فحص بعد التعديل
- افحص git diff وgit status.
- شغل lint/build إذا طلب المستخدم أو إذا كان التعديل برمجيًا.
- تحقق من أن الملفات المعدلة ضمن النطاق.
- راجع النصوص العربية وRTL عند الواجهة.
- اكتب تقريرًا مختصرًا قابلًا للمراجعة.

## مخرجات التقرير المطلوبة من Claude Code
- الملفات المعدلة.
- سبب كل تعديل.
- نتيجة lint/build أو سبب عدم تشغيلها.
- نتيجة git status --short عند الحاجة.
- قرار الجاهزية أو المخاطر المتبقية.

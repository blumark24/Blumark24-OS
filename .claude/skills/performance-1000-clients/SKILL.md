---
name: performance-1000-clients
description: Review Blumark24 OS performance, scalability, and load discipline for serving 1000 clients. Use for rendering cost, unnecessary fetching, caching boundaries, bundle size, and tenant-scale workflows.
---

# performance-1000-clients

## الهدف
تحسين أداء Blumark24 OS وقابليته لخدمة 1000 عميل مع تقليل التحميل غير الضروري والحفاظ على تجربة عربية مؤسسية مستقرة.

## متى تستخدمها
- عند تعديل صفحات أو مكونات كثيفة البيانات.
- عند مراجعة fetching أو re-rendering أو bundle size.
- عند تقييم أثر ميزة على عدة منشآت أو عدد كبير من المستخدمين.

## حدود الصلاحية
- لا تغير التصميم أو RTL أو الهوية دون طلب.
- لا تعدل Supabase/RLS/migrations إلا بطلب صريح.
- لا تستخدم بيانات وهمية لقياس أو عرض الأداء.
- لا تستخدم localStorage للبيانات الحساسة أو التجارية.
- اجعل أي تحسين صغيرًا ومحدود النطاق.

## قواعد Blumark24 OS الخاصة
- التدفق المعتمد: Owner -> Organization -> Settings -> Administrative Structure -> Employees -> Roles & Permissions -> Operational Modules -> Virtual Office -> AI.
- الأداء يجب أن يحترم عزل المنشآت والصلاحيات.
- لا تحمل بيانات خارج نطاق المنشأة أو الباقة.
- الحالات الفارغة يجب أن تكون حقيقية وخفيفة.
- اللغة العربية وRTL والهوية البصرية يجب أن تبقى محمية.
- AI والمكتب الافتراضي لا يجب أن يفرضا تحميلًا غير ضروري.

## قائمة فحص قبل التعديل
- حدد مصدر الحمل: render، fetch، compute، bundle، أو state.
- تحقق من حجم البيانات ونطاق المنشأة.
- راجع memoization وpagination وlazy loading حيث يلزم.
- تأكد من عدم إنشاء طلبات مكررة.
- تأكد من عدم توسيع النطاق خارج الملف المطلوب.

## قائمة فحص بعد التعديل
- شغل lint/build عند تعديل كود.
- راجع أن السلوك لم يتغير وظيفيًا دون قصد.
- تحقق من تقليل التحميل أو منع التكرار.
- تأكد من عدم كسر RTL أو التصميم.
- وثق أثر الأداء المتوقع وحدوده.

## مخرجات التقرير المطلوبة من Claude Code
- الملفات المعدلة.
- عنق الزجاجة أو الحمل الذي عولج.
- أثر التعديل على 1000 عميل.
- نتيجة lint/build.
- مخاطر الأداء المتبقية.

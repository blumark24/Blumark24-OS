---
name: data-storage-architecture
description: Guide Blumark24 OS data storage decisions, tenant-bound data, sensitive-data handling, and avoiding localStorage for business data. Use when working with persistence, caching, client state, or data ownership.
---

# data-storage-architecture

## الهدف
ضبط بنية التخزين والبيانات في Blumark24 OS، ومنع تخزين البيانات الحساسة أو التجارية في أماكن غير مناسبة، وربط البيانات دائمًا بالمنشأة.

## متى تستخدمها
- عند إضافة أو تعديل تخزين بيانات.
- عند مراجعة client state أو caching أو persistence.
- عند منع استخدام localStorage للبيانات التجارية أو الحساسة.

## حدود الصلاحية
- لا تعدل Supabase أو RLS أو migrations إلا بطلب صريح.
- ممنوع localStorage للبيانات التجارية أو الحساسة.
- ممنوع بيانات وهمية أو seed غير حقيقي في واجهة تشغيلية.
- لا تغيّر التصميم أو RTL أو الهوية بلا طلب.
- أي تعديل يجب أن يكون صغيرًا ومحدود النطاق.

## قواعد Blumark24 OS الخاصة
- التدفق المعتمد: Owner -> Organization -> Settings -> Administrative Structure -> Employees -> Roles & Permissions -> Operational Modules -> Virtual Office -> AI.
- كل سجل تشغيلي يجب أن يرتبط بالمنشأة عند الحاجة.
- البيانات يجب أن تحترم الصلاحيات والباقات.
- السوق السعودي واللغة العربية أولًا في عرض البيانات.
- لا تجعل cache أو state يتجاوز مصدر الحقيقة.
- حماية RTL والهوية واجبة في أي عرض بيانات.

## قائمة فحص قبل التعديل
- حدد مصدر الحقيقة ومكان التخزين المناسب.
- تحقق من ارتباط البيانات بالمنشأة.
- تحقق من حساسية البيانات وحاجتها للتشفير أو تقييد الوصول.
- راجع استخدام localStorage/sessionStorage.
- تأكد من أن التغيير لا يحتاج migration غير مصرح.

## قائمة فحص بعد التعديل
- تحقق من عدم تخزين بيانات حساسة محليًا.
- شغل lint/build عند تعديل الكود.
- راجع مسارات القراءة والكتابة والصلاحيات.
- تأكد من عدم إدخال بيانات وهمية.
- وثق مصدر الحقيقة وأي cache مستخدم.

## مخرجات التقرير المطلوبة من Claude Code
- الملفات المعدلة.
- مصدر الحقيقة للبيانات.
- طريقة ربط البيانات بالمنشأة والصلاحيات.
- أي localStorage تمت إزالته أو تجنبه.
- نتيجة lint/build.

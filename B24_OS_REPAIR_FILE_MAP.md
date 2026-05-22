# Blumark24 OS — Repair File Map

| الملف | الحالة | نوع المشكلة | المطلوب عمله | الأولوية |
|---|---|---|---|---|
| package.json | يحتاج تعديل | scripts ناقصة | إضافة type-check/test scripts وCI-friendly tasks | P0 |
| src/lib/supabaseClient.ts | خطير | throw blocking build | init آمن + رسائل تشخيص + env strategy | P0 |
| supabase/migrations/* | يحتاج إعادة تنظيم | تعارض/تكرار ترقيم | baseline migration موحد + cleanup plan | P0 |
| src/hooks/useData.ts | يحتاج إعادة تنظيم | ملف ضخم / coupling | تفكيك حسب domain hooks | P1 |
| src/contexts/AuthContext.tsx | يحتاج تعديل بسيط | حالات edge auth | تحسين handling + tests | P1 |
| src/contexts/PermissionsContext.tsx | يحتاج تعديل بسيط | اتساق role mapping | harden + e2e matrix | P1 |
| src/app/api/admin/create-user/route.ts | خطير | endpoint حساس | rate limit + audit + strict validation | P1 |
| src/app/api/admin/update-user/route.ts | خطير | endpoint حساس | نفس أعلاه | P1 |
| src/app/api/admin/delete-user/route.ts | خطير | endpoint حساس | نفس أعلاه | P1 |
| src/app/reports/page.tsx | يحتاج تعديل بسيط | export readiness | validate export outputs + error handling | P2 |
| src/app/automation/page.tsx | يحتاج تعديل | حقيقي/تجريبي مختلط | ربط triggers/actions/logs backend | P2 |
| src/lib/mockData.ts | مكرر/تجريبي | mock artifact | إزالة أو عزل مع منع الاستيراد | P1 |
| README.md | ناقص | توثيق | إنشاء دليل تشغيل/بنية/بيئة/نشر | P0 |
| .env.example | ناقص | بيئة | إنشاء قالب env رسمي | P0 |
| src/app/layout.tsx | تعديل بسيط | lint warning fonts | تحسين استراتيجية الخطوط | P3 |

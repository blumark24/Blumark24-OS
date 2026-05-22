# Blumark24 OS — QA Test Plan

## 1) Test Scenarios
- Smoke: auth + dashboard + navigation.
- Module smoke: employees/tasks/clients/finance/reports/automation/settings.

## 2) Auth Tests
- login valid/invalid.
- logout + session clear.
- reset password flow.
- protected route redirect.

## 3) Permission Tests
- role matrix لكل دور متوقع.
- UI button visibility حسب الصلاحية.
- API rejection عند محاولة غير مصرح بها.

## 4) CRUD Tests
- لكل وحدة: create/read/update/delete + validation + error state.
- delete confirmation mandatory.

## 5) Supabase Persistence Tests
- إدخال سجل ثم التأكد من وجوده في DB.
- تحديث/حذف والتحقق من الانعكاس الفوري.

## 6) Refresh Persistence Tests
- بعد كل عملية CRUD: refresh page -> البيانات صحيحة.
- لا فقدان حالة أساسية.

## 7) Responsive Tests
- Desktop/Laptop/Tablet/Mobile.
- sidebar/header/modals/tables overflow.

## 8) RTL Tests
- اتجاه النص/الأيقونات/المحاذاة.
- سلامة ترتيب العناصر داخل الجداول والنماذج.

## 9) Security Tests
- unauthorized API access.
- role bypass attempts.
- RLS row-level verification.
- env leak checks.

## 10) Build Tests
- lint pass.
- type-check pass.
- production build pass with env.

## 11) Deployment Tests
- preview deployment sanity.
- production env validation.
- post-deploy smoke tests.

## 12) Acceptance Criteria
- لا أخطاء حرجة في build/runtime.
- جميع CRUD الأساسية تعمل وتستمر بعد refresh.
- auth/permissions تعمل end-to-end.
- لا mockData/localStorage في البيانات الأساسية.
- التصميم ثابت بدون تغيير.

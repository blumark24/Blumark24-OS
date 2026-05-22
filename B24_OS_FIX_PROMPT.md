# Blumark24 OS — Fix Prompt (Operational)

أنت الآن مهندس إصلاح شامل لمشروع Blumark24 OS. نفّذ الإصلاح **بدون تغيير التصميم أو الألوان أو layout**.

## 1) قواعد صارمة
1. لا تغيّر الهوية البصرية.
2. لا تستخدم mockData.
3. لا تستخدم localStorage/sessionStorage لبيانات النظام الأساسية.
4. كل البيانات من/إلى Supabase.
5. أي زر CRUD يجب أن يملك: validation + loading + success/error toast + permission check.
6. لا تعتمد على UI gating فقط؛ backend guard إلزامي.

## 2) ترتيب الإصلاح
1. **Stability:** إصلاح build/env/scripts.
2. **Supabase:** توحيد migrations + RLS matrix.
3. **Auth/Permissions:** توحيد RBAC database-first.
4. **CRUD:** إصلاح كل وحدة على حدة.
5. **Automation/Reports:** تحويل أي سلوك وهمي إلى backend.
6. **QA:** lint/type-check/build/e2e + تقرير نهائي.

## 3) ملفات رئيسية للعمل
- `package.json`
- `src/lib/supabaseClient.ts`
- `src/hooks/useData.ts`
- `src/contexts/AuthContext.tsx`
- `src/contexts/PermissionsContext.tsx`
- `src/app/api/admin/*`
- `src/app/api/automation/*`
- `supabase/migrations/*`
- `src/app/*` (employees/tasks/clients/finance/reports/automation/settings)

## 4) Supabase integration المطلوب
- إضافة `.env.example` يتضمن:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server only)
- منع أي service key على client.
- اعتماد typed DB access إن أمكن.
- توحيد أخطاء Supabase برسائل عربية مفهومة.

## 5) Auth & Permissions
- تفعيل حراسة middleware للمسارات الحساسة.
- فرض الصلاحيات داخل API routes قبل أي write.
- اعتماد roles + role_permissions من DB فقط.
- إضافة اختبارات role matrix (super_admin, board, manager, employee, accountant, viewer).

## 6) إزالة mock/local persistence
- إلغاء أي imports من `mockData` نهائياً.
- منع localStorage/sessionStorage لبيانات CRUD.
- التأكد أن البيانات تبقى بعد refresh من Supabase فقط.

## 7) CRUD الحقيقي
لكل وحدة:
- schema validation (zod أو بديل).
- create/read/update/delete فعلي.
- optimistic UI آمن + rollback عند الفشل.
- confirmation للحذف.
- loading/error/empty states.

## 8) الأزرار
- جرد كل زر وتأكيد سلوكه الفعلي.
- ربط أزرار (إضافة/تعديل/حذف/حفظ/إلغاء/تصدير/طباعة/بحث/فلترة).
- إضافة permission guard لكل زر حساس.

## 9) اختبارات إلزامية
- `npm run lint`
- `npm run type-check`
- `npm run build`
- `npm run test` + `npm run test:e2e` إن تم إعدادها
- اختبارات refresh persistence
- اختبارات unauthorized access

## 10) شرط عدم كسر التصميم
- أي PR يجب يتضمن دليل أن التصميم لم يتغير (screenshots/visual notes).
- يمنع تغيير CSS tokens الأساسية.

## 11) مخرجات التسليم
1. كود مصلح.
2. تقرير QA نهائي.
3. جدول قبل/بعد للمشاكل الحرجة.
4. قائمة المخاطر المتبقية.

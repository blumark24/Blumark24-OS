# تقرير تدقيق تشغيلي — `/org` (PR #165)

**التاريخ:** 2026-05-23  
**الفرع:** `cursor/premium-workspace-ambient-3511`  
**الحكم:** `/org` **قسم تشغيلي جزئي** — مجلس الإدارة والموظفون مربوطان بـ Supabase؛ الوحدات التنظيمية (وكالة/إدارة/قسم/فريق) **ليست جداول إنتاج** بعد.

---

## 1. مصدر البيانات لكل طبقة

| الطبقة | المصدر الحالي | Production؟ | ملاحظات |
|--------|---------------|-------------|---------|
| **مجلس الإدارة** | `public.board_members` + `organization_id` + RLS (015) | ✅ نعم | CRUD عبر `src/lib/db.ts` + `useBoardMembers` |
| **الوكالة / الإدارة / القسم / الفريق** | `activities.description` ببادئة `ORG_STRUCTURE_JSON:` + `localStorage` (`blumark-org-structure:{orgId}`) | ❌ لا | ليست `org_units`؛ JSON في سجل نشاط |
| **الموظفون** | `public.employees` — حقل نصي `department` | ⚠️ جزئي | الربط باسم قسم وليس `FK` لوحدة |
| **الباقة** | `TenantWorkspaceContext` / `plan_slug` | ✅ للواجهة | حدود UI في `orgPackageLimits.ts` |
| **الصلاحيات** | `PermissionsContext` + `role_permissions` | ✅ | `organization_manager` لديه `manage_board` |

---

## 2. ما يُحفظ فعلياً vs Preview

### يُحفظ في Supabase (حقيقي)
- إضافة/تعديل/حذف **عضو مجلس** → `board_members` (مع `organization_id` من `current_org_id()`).
- **نقل موظف** → `UPDATE employees SET department = ?` عبر `assignEmployeeDepartment()` — **فقط** إن سمحت RLS (انظر §6).

### مسودة هيكل (غير Production للوحدات)
- إضافة وكالة/إدارة/قسم/فريق يدوياً → `INSERT activities` + مرآة `localStorage`.
- **تطبيق الاقتراح الذكي للوحدات** → نفس المسار (بعد التعديل: **معاينة فقط** حتى اعتماد `org_units`).

### Preview / محلي فقط
- **اقتراح ذكي** لإنشاء وكالة/إدارة بأسماء افتراضية → أُزيل (لا بيانات وهمية).
- **الفرق (teams)** المقترحة تلقائياً من عدد الموظفين → معطّلة في الاقتراح حتى جدول وحدات.
- `localStorage` → **نسخة احتياطية UI** لكل `orgId`؛ ليست مصدر حقيقة عند وجود Supabase.

---

## 3. هل `activities + ORG_STRUCTURE_JSON` كافٍ للإنتاج؟

**لا.**

| المشكلة | التأثير |
|---------|---------|
| ليس جدول أعمال | لا FK، لا تكامل مع CRM/Tasks/تقارير |
| سجل جديد عند كل حفظ | تاريخ غير مُنظَّم؛ صعوبة queries |
| ازدواجية مع `employees.department` | قسم في JSON قد لا يطابق نص الموظف |
| لا `org_unit_members` | لا ربط موظف↔وحدة بمعرّف ثابت |
| فلترة التحميل | RLS على `activities` يحمي القراءة؛ الاعتماد على «آخر سجل» هش |

### Migration مقترحة (بدون تطبيق — تحتاج موافقة)

```sql
-- 021_org_structure_production.sql (مقترح)
CREATE TABLE public.org_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('agency','management','department','team')),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.org_units(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.org_unit_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  org_unit_id UUID NOT NULL REFERENCES public.org_units(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  role_in_unit TEXT,
  UNIQUE (org_unit_id, employee_id)
);

-- employees: optional org_unit_id FK + keep department as denormalized label
-- RLS: organization_id = current_org_id() لكل الجداول
-- employees UPDATE: organization_manager ضمن نفس المنشأة
```

---

## 4. مصفوفة الباقات (سلوك UI + بيانات)

| الباقة | المسار المطلوب | `orgPackageLimits` | وكالة في DB | إدارة في DB |
|--------|----------------|-------------------|-------------|-------------|
| **basic** | مجلس → قسم → موظف | 0 / 0 / 3 | مخفية | مخفية |
| **growth** | مجلس → إدارة → قسم → موظف | 0 / 5 / 15 | مخفية | مسموحة |
| **advanced** | مجلس → وكالة → إدارة → قسم → موظف | 5 / 20 / 50 | مسموحة | مسموحة |

الموظفون دائماً من `employees`؛ التعيين يحدّث `department` (نص).

---

## 5. عزل المستأجر (Tenant isolation)

| عنصر | الحالة |
|------|--------|
| `board_members` | ✅ `.eq("organization_id", orgId)` + RLS |
| `employees` | ✅ `withOrganizationScope` + RLS 020 (SELECT بالمنشأة) |
| `activities` (هيكل) | ✅ RLS SELECT/INSERT بـ `current_org_id()` + trigger `set_org_id` |
| `localStorage` | ✅ مفتاح `blumark-org-structure:{uuid}` — لا تسريب بين عملاء على نفس المتصفح إذا تبدّل الحساب (يُحمّل من Supabase أولاً) |
| Blumark الداخلي | ✅ `isInternal` تنبيه فقط؛ البيانات من `organizationId` الجلسة |
| وكالة الهجوم/الدفاع | ✅ `filterNavRoutes` + `canAccessAgencyCommandRoute` — أدوار داخلية فقط |

---

## 6. `organization_manager` — ما يستطيع؟

| العملية | UI | RLS / DB |
|---------|-----|----------|
| CRUD مجلس الإدارة | ✅ | ✅ (015 `board_members: org *`) |
| حفظ هيكل JSON | ✅ | ✅ INSERT `activities` إن وُجد `organization_id` |
| نقل موظف (UPDATE `employees`) | ✅ زر | ❌ **020**: UPDATE فقط `super_admin` أو `is_owner()` |
| حذف/إضافة موظف | صفحة `/employees` | ❌ INSERT/DELETE نفس القيد |

### إصلاح RLS minimal مقترح (بدون تطبيق)

```sql
CREATE POLICY "employees: org manager update" ON public.employees FOR UPDATE
  USING (
    organization_id = public.current_org_id()
    AND public.get_my_role() = 'organization_manager'
  )
  WITH CHECK (organization_id = public.current_org_id());
```

---

## 7. ربط `/org` ببقية المنصة (Audit فقط — بدون تغيير CRM/Tasks/Automation)

| وحدة | الربط الحالي | كيف يصبح `/org` مصدر سياق |
|------|--------------|---------------------------|
| **الموظفون** | `employees.department` نص حر | `org_unit_id` + عرض هيكل موحّد |
| **الصلاحيات** | `profiles.role` منفصل عن الهيكل | أدوار مرتبطة بـ `org_unit_members.role_in_unit` |
| **المهام** | `assigned_to` → `employees.id` | تصفية مهام حسب `org_unit` للمسند |
| **التقارير** | تجميع dashboard بـ `department` | تقارير بـ `org_units` hierarchy |
| **الداشبورد** | `employees.map(e => e.department)` | KPIs حسب شجرة المنشأة |

---

## 8. توصيات تنفيذ (بعد موافقة Migration)

1. اعتماد `org_units` + ترحيل من آخر `ORG_STRUCTURE_JSON`.
2. سياسة UPDATE للموظفين لـ `organization_manager`.
3. ربط التعيين بـ `org_unit_id` بدل اسم نصي فقط.
4. إبقاء الوضع الذكي: اقتراح من بيانات حقيقية فقط؛ التطبيق يكتب `org_units`.

---

## 9. Validation (آخر تشغيل)

```
npm run lint     ✅
npx tsc --noEmit ✅
npm run build    ✅
```

**Preview:** `https://blumark24-os-git-cursor-premium-workspace-a-d5fd42-blumark24-os.vercel.app/org`

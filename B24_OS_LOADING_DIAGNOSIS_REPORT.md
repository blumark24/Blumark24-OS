# B24 OS Loading Diagnosis Report

**Date:** 2026-05-17  
**Scope:** تشخيص فقط بدون أي تعديل على كود الإنتاج.

## 1) الملفات المسؤولة عن الـ loading

### A) Auth loading (مصدر شاشة التحميل الرئيسية)
- `AuthProvider` يبدأ بـ `loading=true` ثم يستدعي `supabase.auth.getSession()`.
- يوجد fallback timeout بعد 10 ثوانٍ فقط لفك الحظر (`setLoading(false)`)، وهذا يعني أن أي بطء في Supabase Session أو profile queries قد يسبب شاشة تحميل محسوسة حتى 10 ثوانٍ.
- بعد وجود session، يتم استدعاء `buildUser()` الذي ينفذ:
  1. Query على `profiles` عبر email.
  2. وإذا لم يجد، Query ثانية عبر id.
  3. ثم Query ثالثة اختيارية لجلب `avatar_url, force_password_change`.
- بالتالي مسار الدخول الواحد قد ينفذ 2–3 استعلامات متسلسلة قبل إزالة `loading`.

### B) PageGuard loading
- `PageGuard` يعرض spinner كامل الشاشة عندما `loading` من AuthContext يساوي true.
- أي تأخير في AuthContext ينعكس فورًا على كل الصفحات المحمية.

### C) Data loading في الصفحات
- Hooks مثل `useClients/useEmployees/useTasks` مبنية على `useAsyncData` وتبدأ بـ `loading=true` لكل hook.
- كل hook ينفذ fetch مستقل عند mount.
- هذا يعني أن الصفحة التي تجمع أكثر من hook (مثل tasks) تقوم بتحميلات متوازية/متعددة وتزيد الإحساس بالثقل.

## 2) فحص AuthContext / Providers

## AuthContext
- سبب بطء محتمل: `buildUser` يعتمد استعلامات متسلسلة متعددة على `profiles` قبل إنهاء loading.
- يوجد `onAuthStateChange` يستدعي `buildUser` كذلك عند تغيّر الحالة؛ مفيد لكنه يزيد عدد النداءات عند الأحداث المتكررة.
- redirect logic موجود بعد انتهاء loading:
  - غير مسجل + صفحة خاصة → `/auth?redirect=...`
  - مسجل داخل `/auth` → `/`
  - `forcePasswordChange` → `/settings?tab=account`

## Providers في `app/layout.tsx`
- ترتيب providers عميق: Toast → Auth → Permissions → Notifications → Messages.
- `PermissionsProvider` يعتمد على `user?.id` ويقوم بجلب:
  - `getAllProfiles()`
  - `role_permissions`
- هذا لا يسبب spinner auth مباشرة، لكنه يزيد ضغط الاستعلامات مباشرة بعد تسجيل الدخول.

## 3) فحص Sidebar
- Sidebar يعتمد على `authLoading` + `usePermissions`.
- أثناء `authLoading` يعرض كل عناصر التنقل (قرار UX مقصود)؛ لا يوجد loop هنا.
- لكن Sidebar + Header + Layout كلها تنتظر عمليًا اكتمال auth في الصفحات المحمية عبر PageGuard، فيظهر التأخير كأنه من الواجهة رغم أن المصدر غالبًا auth/data.

## 4) فحص صفحات dashboard / clients / employees / tasks

## الصفحة الرئيسية (`/`)
- تستخدم عدة hooks بيانات (clients/tasks/transactions/employees/activities…)، ما يسبب burst من requests عند الدخول.
- هذا مرشح قوي للشعور بالثقل حتى لو لا يوجد خطأ منطقي.

## `/clients`
- `useClients` + `useEmployees` في نفس الصفحة.
- كل عملية insert/update/delete تعمل `refetch` (soft-timeout) + يوجد realtime channel يطلق `refetch` أيضًا.
- في حالات كتابة كثيفة قد يحدث تكرار fetch.

## `/employees`
- `useEmployees` مع إجراءات create/update/delete.
- بعد create يوجد optimistic update ثم refetch background؛ جيد UX لكنه ما يزال يضيف load إضافي.

## `/tasks`
- تستخدم `useTasks` + `useClients` + `useEmployees` معًا.
- هذه الصفحة مرشحة لثقل أعلى من غيرها بسبب تعدد المصادر.

## 5) هل توجد queries ثقيلة أو redirect loops؟

## Redirect loops
- **لم يظهر loop واضح** من قراءة المنطق.
- الشروط في AuthContext متبادلة بشكل منطقي، وتعتمد على `loading=false` أولًا.

## Queries ثقيلة/متكررة
- نعم، توجد **كثافة استعلامات** أكثر من Query واحد في نقاط حرجة:
  1. `buildUser` multi-step على كل session/auth change.
  2. الصفحة الرئيسية والـ tasks تحمل عدة جداول معًا.
  3. realtime subscriptions مع refetch قد تضاعف النداءات عند كثرة الأحداث.
- الكود يحتوي تعليقًا صريحًا في `useData` أنه تم تقييد refetch على `SIGNED_IN` فقط لتفادي storm من `TOKEN_REFRESHED` (تحسين جيد ومؤشر أن المشكلة كانت موجودة سابقًا).

## 6) نتائج الأوامر المطلوبة

- `npm run lint`: نجح، مع warning وحيد متعلق custom font في `src/app/layout.tsx`.
- `npx tsc --noEmit`: نجح بدون أخطاء TypeScript.
- `npm run build`: فشل في البيئة الحالية بسبب غياب Supabase env vars (`Supabase environment variables are not set`) مع أخطاء prerender متعددة، إضافة لتحذير تحميل Google Fonts.

## الخلاصة التشخيصية

الأقرب أن سبب شاشة loading الطويلة وثقل النظام ناتج من **تراكم زمن auth bootstrap + تعدد الاستعلامات المتزامنة بعد تسجيل الجلسة**، وليس من redirect loop.

أكبر نقاط التأثير:
1. `AuthContext.buildUser` (عدة queries متسلسلة قبل فك loading).
2. `PageGuard` يعكس تأخير auth مباشرة كـ full-screen spinner.
3. الصفحات الثقيلة (`/` و`/tasks`) تشغل عدة hooks/queries معًا.
4. Providers الإضافية بعد auth تضيف fetches مبكرة (`PermissionsProvider`).

> لم يتم إجراء أي تعديل على الكود أو الـ routing أو auth أو dashboard أو Supabase أو التصميم.

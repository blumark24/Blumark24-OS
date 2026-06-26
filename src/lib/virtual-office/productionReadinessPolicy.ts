export type ProductionReadinessStatus = "pass" | "warn" | "fail";

export type ProductionReadinessKey =
  | "tenant_isolation"
  | "scoped_data"
  | "fake_data_blocked"
  | "rls_required"
  | "realtime_disabled"
  | "media_disabled"
  | "package_governance"
  | "observability"
  | "capacity_planning";

export interface ProductionReadinessInput {
  tenantIsolationVerified?: boolean;
  scopedDataVerified?: boolean;
  fakeDataBlocked?: boolean;
  rlsRequired?: boolean;
  realtimeDisabled?: boolean;
  mediaDisabled?: boolean;
  packageGovernanceReady?: boolean;
  observabilityReady?: boolean;
  capacityTargetClients?: number | null;
}

export interface ProductionReadinessCheck {
  key: ProductionReadinessKey;
  status: ProductionReadinessStatus;
  title: string;
  detail: string;
  actionLabel: string;
}

export interface ProductionReadinessResult {
  score: number;
  status: ProductionReadinessStatus;
  targetClients: number;
  passedCount: number;
  warningCount: number;
  failedCount: number;
  checks: ProductionReadinessCheck[];
}

function safeTarget(value: number | null | undefined): number {
  return Number.isFinite(value) ? Math.max(0, Number(value)) : 1000;
}

function check(
  key: ProductionReadinessKey,
  status: ProductionReadinessStatus,
  title: string,
  detail: string,
  actionLabel: string,
): ProductionReadinessCheck {
  return { key, status, title, detail, actionLabel };
}

function boolStatus(value: boolean | undefined, fallback: ProductionReadinessStatus = "warn"): ProductionReadinessStatus {
  if (value === true) return "pass";
  if (value === false) return "fail";
  return fallback;
}

export function resolveProductionReadinessPolicy(
  input: ProductionReadinessInput = {},
): ProductionReadinessResult {
  const targetClients = safeTarget(input.capacityTargetClients);
  const capacityStatus: ProductionReadinessStatus = targetClients >= 1000 ? "pass" : targetClients >= 250 ? "warn" : "fail";

  const checks: ProductionReadinessCheck[] = [
    check(
      "tenant_isolation",
      boolStatus(input.tenantIsolationVerified),
      "عزل المنشآت",
      "كل منشأة يجب أن ترى نطاقها التشغيلي فقط قبل التوسع.",
      "مراجعة العزل",
    ),
    check(
      "scoped_data",
      boolStatus(input.scopedDataVerified),
      "البيانات المقيدة",
      "كل مخرجات المكتب الافتراضي يجب أن تعتمد على بيانات scoped فقط.",
      "فحص النطاق",
    ),
    check(
      "fake_data_blocked",
      boolStatus(input.fakeDataBlocked),
      "منع البيانات الوهمية",
      "لا يجب عرض موظفين أو ملفات أو حضور أو تقارير وهمية في الإنتاج.",
      "فحص البيانات",
    ),
    check(
      "rls_required",
      boolStatus(input.rlsRequired),
      "RLS إلزامي",
      "أي ربط إنتاجي مع Supabase يجب أن يمر عبر سياسات RLS مناسبة.",
      "مراجعة RLS",
    ),
    check(
      "realtime_disabled",
      input.realtimeDisabled === false ? "fail" : "pass",
      "Realtime تحت التحكم",
      "المكتب الافتراضي لا يفعل realtime قبل مرحلة موافقة وفحص منفصلة.",
      "إبقاء معطل",
    ),
    check(
      "media_disabled",
      input.mediaDisabled === false ? "fail" : "pass",
      "الصوت والفيديو معطلان",
      "لا يتم تفعيل صوت أو فيديو أو WebRTC قبل مرحلة موافقة صريحة.",
      "إبقاء معطل",
    ),
    check(
      "package_governance",
      boolStatus(input.packageGovernanceReady),
      "حوكمة الباقات",
      "قدرات المقر الافتراضي يجب أن تكون مقيدة بالباقة والدور.",
      "مراجعة الباقات",
    ),
    check(
      "observability",
      boolStatus(input.observabilityReady, "warn"),
      "المراقبة التشغيلية",
      "قبل 1000 عميل يجب تجهيز قياس الأداء والأخطاء وتجربة المستخدم.",
      "تجهيز المراقبة",
    ),
    check(
      "capacity_planning",
      capacityStatus,
      "خطة تحمل العملاء",
      `هدف الجاهزية الحالي ${targetClients} عميل.`,
      "اعتماد الخطة",
    ),
  ];

  const passedCount = checks.filter((entry) => entry.status === "pass").length;
  const warningCount = checks.filter((entry) => entry.status === "warn").length;
  const failedCount = checks.filter((entry) => entry.status === "fail").length;
  const score = Math.round((passedCount / checks.length) * 100);
  const status: ProductionReadinessStatus = failedCount > 0 ? "fail" : warningCount > 0 ? "warn" : "pass";

  return {
    score,
    status,
    targetClients,
    passedCount,
    warningCount,
    failedCount,
    checks,
  };
}

export function isProductionReadyForClientTarget(input: ProductionReadinessInput = {}): boolean {
  return resolveProductionReadinessPolicy(input).status === "pass";
}

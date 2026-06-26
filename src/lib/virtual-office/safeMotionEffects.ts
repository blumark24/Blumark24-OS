export type SafeMotionEffectMode = "off" | "safe" | "polished";
export type SafeMotionEffectSurface = "office_chip" | "office_panel" | "meeting_badge";
export type SafeMotionEffectStatus = "disabled" | "safe" | "blocked";

export interface SafeMotionEffectInput {
  mode?: SafeMotionEffectMode;
  surface?: SafeMotionEffectSurface;
  reducedMotion?: boolean;
  mobile?: boolean;
  preservesCoordinates?: boolean;
  heavyEffectRequested?: boolean;
}

export interface SafeMotionEffectResult {
  status: SafeMotionEffectStatus;
  surface: SafeMotionEffectSurface;
  mode: SafeMotionEffectMode;
  label: string;
  detail: string;
  durationMs: number;
  glowOpacity: number;
  canAnimateTransform: boolean;
  canAnimateShadow: boolean;
  preservesCoordinates: boolean;
  blockedReason: string | null;
}

const DEFAULT_SURFACE: SafeMotionEffectSurface = "office_chip";

function clampOpacity(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function resolveSafeMotionEffect(input: SafeMotionEffectInput = {}): SafeMotionEffectResult {
  const mode = input.mode ?? "safe";
  const surface = input.surface ?? DEFAULT_SURFACE;
  const preservesCoordinates = input.preservesCoordinates !== false;

  if (mode === "off" || input.reducedMotion === true) {
    return {
      status: "disabled",
      surface,
      mode: input.reducedMotion ? "off" : mode,
      label: "الحركة مخففة",
      detail: "تم تعطيل المؤثرات احتراماً لتفضيل تقليل الحركة.",
      durationMs: 0,
      glowOpacity: 0,
      canAnimateTransform: false,
      canAnimateShadow: false,
      preservesCoordinates,
      blockedReason: null,
    };
  }

  if (!preservesCoordinates) {
    return {
      status: "blocked",
      surface,
      mode,
      label: "الحركة محظورة",
      detail: "أي حركة تغيّر الإحداثيات أو تحرك نقاط المكاتب غير مسموحة.",
      durationMs: 0,
      glowOpacity: 0,
      canAnimateTransform: false,
      canAnimateShadow: false,
      preservesCoordinates: false,
      blockedReason: "coordinate_drift",
    };
  }

  if (input.heavyEffectRequested) {
    return {
      status: "blocked",
      surface,
      mode,
      label: "المؤثر ثقيل",
      detail: "المؤثرات الثقيلة مؤجلة حتى ينجح اختبار الأداء على الجوال.",
      durationMs: 0,
      glowOpacity: 0,
      canAnimateTransform: false,
      canAnimateShadow: false,
      preservesCoordinates,
      blockedReason: "heavy_effect",
    };
  }

  const polished = mode === "polished" && input.mobile !== true;
  const durationMs = polished ? 220 : input.mobile ? 120 : 160;
  const glowOpacity = clampOpacity(polished ? 0.32 : input.mobile ? 0.12 : 0.2);

  return {
    status: "safe",
    surface,
    mode,
    label: polished ? "مؤثر احترافي آمن" : "مؤثر آمن",
    detail: polished
      ? "مسموح بمؤثر خفيف لا يغيّر إحداثيات المكاتب ولا يخفي نقاط الضغط."
      : "مسموح بحركة خفيفة مع ثبات الخريطة والإحداثيات.",
    durationMs,
    glowOpacity,
    canAnimateTransform: false,
    canAnimateShadow: true,
    preservesCoordinates,
    blockedReason: null,
  };
}

export function canUseSafeMotionEffect(input: SafeMotionEffectInput = {}): boolean {
  return resolveSafeMotionEffect(input).status === "safe";
}

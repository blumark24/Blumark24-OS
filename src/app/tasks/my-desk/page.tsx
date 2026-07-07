"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity,
  Bell,
  Building2,
  CalendarDays,
  ChevronLeft,
  FileText,
  HelpCircle,
  Home,
  LayoutGrid,
  MessageSquare,
  MoreHorizontal,
  PenTool,
  Play,
  Search,
  Send,
  Users,
} from "lucide-react";
import PageGuard from "@/components/ui/PageGuard";
import { useTasks } from "@/hooks/useData";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import type { Task, TaskStatus } from "@/types";
import "./twin-desk.css";

const STATUS_LABEL: Record<TaskStatus, string> = {
  جديدة: "جديدة",
  قيد_التنفيذ: "قيد التنفيذ",
  بانتظار_المراجعة: "بانتظار اعتماد",
  مكتملة: "مكتملة",
  متأخرة: "متأخرة",
};

function isOverdue(dueDate: string, status: TaskStatus) {
  return status !== "مكتملة" && new Date(dueDate) < new Date();
}

function daysUntil(dueDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dueDate);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

/** Progress derived from task status (no fabricated per-task percentages). */
function statusProgress(status: TaskStatus | undefined) {
  if (!status) return 0;
  switch (status) {
    case "مكتملة":
      return 100;
    case "بانتظار_المراجعة":
      return 75;
    case "قيد_التنفيذ":
      return 50;
    default:
      return 20;
  }
}

/** Truthful relative deadline text — no fake ticking clock. */
function dueRelative(dueDate: string | undefined, status: TaskStatus | undefined) {
  if (!dueDate) return { big: "بلا موعد", sub: "لم يُحدَّد موعد للمهمة" };
  if (status === "مكتملة") return { big: "مكتملة", sub: "تم الإنجاز" };
  const d = daysUntil(dueDate);
  if (Number.isNaN(d)) return { big: "تاريخ غير صالح", sub: "يرجى التحقق من تاريخ الاستحقاق" };
  if (d < 0) return { big: `متأخرة ${Math.abs(d)} يوم`, sub: "يُصعَّد إلى المسؤول المباشر" };
  if (d === 0) return { big: "ينتهي اليوم", sub: "قبل نهاية الدوام" };
  if (d === 1) return { big: "غداً", sub: "خلال يوم واحد" };
  return { big: `خلال ${d} يوم`, sub: "ضمن المهلة الحالية" };
}

function ProgressRing({ value, size = 64, stroke = 6 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(100, Math.max(0, value)) / 100);
  return (
    <div className="pring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#00D9FF"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ filter: "drop-shadow(0 0 6px rgba(0,217,255,.6))" }}
        />
      </svg>
      <span className="pv" style={{ fontSize: size < 70 ? 13 : 16 }}>
        {Math.round(value)}%
      </span>
    </div>
  );
}

function PressureGauge({ value }: { value: number }) {
  const semi = Math.PI * 70; // ~219.9
  const dash = (semi * Math.min(100, Math.max(0, value))) / 100;
  return (
    <div className="gauge">
      <svg viewBox="0 0 170 96" role="img" aria-label={`ضغط العمل ${value} بالمئة`}>
        <defs>
          <linearGradient id="twinGauge" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#FFB454" />
            <stop offset="1" stopColor="#FF6B6B" />
          </linearGradient>
        </defs>
        <path d="M15 88 A70 70 0 0 1 155 88" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="12" strokeLinecap="round" />
        <path
          d="M15 88 A70 70 0 0 1 155 88"
          fill="none"
          stroke="url(#twinGauge)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${dash} 400`}
          style={{ filter: "drop-shadow(0 0 8px rgba(255,150,90,.5))" }}
        />
      </svg>
      <div className="gv">{value}%</div>
    </div>
  );
}

export default function MyTwinDeskPage() {
  const { data: tasks, loading, update } = useTasks();
  const { user } = useAuth();
  const toast = useToast();
  const [savingAction, setSavingAction] = useState<string | null>(null);

  const insight = useMemo(() => {
    const active = tasks.filter((task) => task.status !== "مكتملة");
    const late = active.filter((task) => task.status === "متأخرة" || isOverdue(task.dueDate, task.status));
    const review = active.filter((task) => task.status === "بانتظار_المراجعة");
    const done = tasks.filter((task) => task.status === "مكتملة");
    const doing = active.filter((task) => task.status === "قيد_التنفيذ");
    const urgent = active.filter((task) => task.priority === "عاجلة");
    const dueSoon = active.filter((task) => {
      const diff = daysUntil(task.dueDate);
      return diff >= 0 && diff <= 2;
    });
    const focusTask: Task | null =
      late[0] ??
      active.find((task) => task.priority === "عاجلة" || task.priority === "عالية") ??
      dueSoon[0] ??
      active[0] ??
      null;
    const others = active.filter((task) => task.id !== focusTask?.id).slice(0, 3);
    return { active, late, review, done, doing, urgent, dueSoon, focusTask, others };
  }, [tasks]);

  const focus = insight.focusTask;
  const employeeName = user?.name?.trim() || user?.email?.split("@")[0] || focus?.assigneeName || "الموظف";
  const initial = employeeName.charAt(0);
  const department = user?.department?.trim() || "قسم التصميم";
  const roleLabel = user?.role?.trim() || "عضو الفريق";

  const activeCount = insight.active.length;
  const pressurePct = Math.min(99, activeCount * 13);
  const pressureLabel = activeCount >= 6 ? "ضغط مرتفع" : activeCount >= 3 ? "ضغط متوسط" : "طبيعي";
  const progress = statusProgress(focus?.status);
  const eta = dueRelative(focus?.dueDate, focus?.status);

  const changeStatus = async (status: TaskStatus, message: string) => {
    if (!focus) return;
    setSavingAction(status);
    try {
      await update(focus.id, { status });
      toast.success(message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تحديث المهمة");
    } finally {
      setSavingAction(null);
    }
  };

  const busy = !focus || !!savingAction;

  if (loading) {
    return (
      <PageGuard permission="manage_tasks">
        <div className="twindesk" dir="rtl" style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
          <div style={{ textAlign: "center" }}>
            <svg width={50} height={50} viewBox="0 0 50 50" className="animate-spin" style={{ margin: "0 auto 16px" }}>
              <circle cx={25} cy={25} r={20} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={4} />
              <circle cx={25} cy={25} r={20} fill="none" stroke="#00D9FF" strokeWidth={4} strokeLinecap="round" strokeDasharray="30 150" />
            </svg>
            <p style={{ color: "var(--muted)", fontSize: 14, fontWeight: 700 }}>جارٍ تحميل مكتبك الذكي…</p>
          </div>
        </div>
      </PageGuard>
    );
  }

  // ---- shared pieces reused across desktop & mobile ----
  const radarPanel = (
    <>
      <div className="p-title">
        رادار التنبيهات الذكي <span className="en">ALERT RADAR</span>
      </div>
      <div className="radar-wrap">
        <div className="radar">
          <span className="r-ring a" />
          <span className="r-ring b" />
          <span className="r-ring c" />
          <span className="r-x" />
          <span className="r-y" />
          <span className="sweep" />
          {insight.late.length > 0 && <span className="blip d" style={{ top: "34%", insetInlineStart: "26%" }} />}
          {insight.dueSoon.length > 0 && <span className="blip w" style={{ top: "56%", insetInlineStart: "66%" }} />}
          {insight.review.length > 0 && <span className="blip v" style={{ top: "68%", insetInlineStart: "38%" }} />}
          {activeCount > 0 && <span className="blip i" style={{ top: "24%", insetInlineStart: "58%" }} />}
        </div>
      </div>
      <div className="alerts">
        <div className="alert d">
          <span className="led" />
          <span>
            <span className="a1">مهمة متأخرة</span>
            <br />
            <span className="a2">{insight.late[0]?.title ?? "لا مهام متأخرة"}</span>
          </span>
          <span className="a-eta">{insight.late.length}</span>
        </div>
        <div className="alert w">
          <span className="led" />
          <span>
            <span className="a1">قريبة من الموعد</span>
            <br />
            <span className="a2">خلال يومين أو أقل</span>
          </span>
          <span className="a-eta">{insight.dueSoon.length}</span>
        </div>
        <div className="alert v">
          <span className="led" />
          <span>
            <span className="a1">بانتظار اعتماد</span>
            <br />
            <span className="a2">تحتاج قرار المسؤول</span>
          </span>
          <span className="a-eta">{insight.review.length}</span>
        </div>
        <div className="alert i">
          <span className="led" />
          <span>
            <span className="a1">مهام نشطة</span>
            <br />
            <span className="a2">قيد المتابعة الآن</span>
          </span>
          <span className="a-eta">{activeCount}</span>
        </div>
      </div>
      <div className="gauge-card">
        <div className="p-title" style={{ justifyContent: "center" }}>
          مؤشر ضغط العمل
        </div>
        <PressureGauge value={pressurePct} />
        <div className="gauge-l1">{pressureLabel}</div>
        <div className="gauge-l2">لديك {activeCount} مهام نشطة</div>
      </div>
    </>
  );

  const statsRow = (
    <div className="stats4">
      <div className="stat d">
        <div className="sv">{insight.urgent.length}</div>
        <div className="sl">عاجلة</div>
      </div>
      <div className="stat b">
        <div className="sv">{insight.doing.length}</div>
        <div className="sl">قيد التنفيذ</div>
      </div>
      <div className="stat v">
        <div className="sv">{insight.review.length}</div>
        <div className="sl">بانتظار اعتماد</div>
      </div>
      <div className="stat s">
        <div className="sv">{insight.done.length}</div>
        <div className="sl">مكتملة</div>
      </div>
    </div>
  );

  const miniMap = (
    <div className="map-stage">
      <div className="map-plane">
        <div className="mz hi">
          <span className="grid" />
          <span className="floorlite" />
          <span className="pin" />
          <span className="tag">
            <span className="zl">قسم التصميم</span>
            <span className="zs">ضغط مرتفع</span>
          </span>
        </div>
        <div className="mz ok">
          <span className="grid" />
          <span className="floorlite" />
          <span className="pin" />
          <span className="tag">
            <span className="zl">قسم المحتوى</span>
            <span className="zs">طبيعي</span>
          </span>
        </div>
        <div className="mz ok">
          <span className="grid" />
          <span className="floorlite" />
          <span className="pin" />
          <span className="tag">
            <span className="zl">قسم الطباعة</span>
            <span className="zs">طبيعي</span>
          </span>
        </div>
        <div className="mz md">
          <span className="grid" />
          <span className="floorlite" />
          <span className="pin" />
          <span className="tag">
            <span className="zl">قسم التسويق</span>
            <span className="zs">ضغط متوسط</span>
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <PageGuard permission="manage_tasks">
      <div className="twindesk" dir="rtl">
        {/* ============================= DESKTOP ============================= */}
        <div className="deskframe">
          {/* command bar */}
          <header className="cmdbar">
            <div className="logo">
              <span className="orb">B</span>
              <span>
                <span className="t1">Blumark24 OS</span>
                <br />
                <span className="t2">DIGITAL TWIN INTELLIGENCE</span>
              </span>
            </div>
            <div className="greet">
              <div className="g1">مرحباً {employeeName}</div>
              <div className="g2">
                {department} · {roleLabel}
              </div>
            </div>
            <div className="cmd-actions">
              <Link href="/tasks" className="back-btn">
                <ChevronLeft size={14} /> رجوع للمهام
              </Link>
              <span className="icon-btn">
                <Search />
              </span>
              <span className="icon-btn">
                <Bell />
                {insight.late.length > 0 ? <span className="bdg">{insight.late.length}</span> : null}
              </span>
              <span className="icon-btn">
                <MessageSquare />
                {insight.review.length > 0 ? <span className="bdg">{insight.review.length}</span> : null}
              </span>
              <span className="icon-btn">
                <Activity />
              </span>
            </div>
            <div className="cmd-user">
              <span className="av">
                {initial}
                <i />
              </span>
              <span>
                <span className="n1">{employeeName}</span>
                <br />
                <span className="n2">{roleLabel}</span>
              </span>
            </div>
          </header>

          {/* main three-column grid */}
          <div className="f-main">
            <aside className="panel">{radarPanel}</aside>

            {/* cinematic scene (hero) */}
            <div className="scene">
              <div className="room">
                <div className="wall" />
                <div className="vlines" />
                <div className="sidelight l" />
                <div className="sidelight r" />
                <span className="ceil am" />
                <span className="ceil cy" />
                <div className="floor" />
                <div className="floorpool" />
                <span className="fring r1" />
                <span className="fring r3" />
                <span className="fring r2" />
              </div>

              <div className="scene-title">
                <div className="t1">مكتبي الذكـي</div>
                <div className="t2">MY TWIN DESK</div>
              </div>
              <div className="zone-sign zl">
                <div className="z1">إدارة الطباعة والنشر</div>
                <div className="z2">الطابق الثاني</div>
              </div>
              <div className="zone-sign zr">
                <div className="z1">{department}</div>
                <div className="z2">مكتب {employeeName} · {pressureLabel}</div>
              </div>

              <div className="shelf">
                <span className="row" style={{ top: "26%" }} />
                <span className="row" style={{ top: "52%" }} />
                <span className="row" style={{ top: "78%" }} />
                <span className="box" style={{ left: 14, top: "8%", width: 38, height: 14 }} />
                <span className="box" style={{ left: 60, top: "8%", width: 46, height: 14 }} />
                <span className="box" style={{ left: 20, top: "34%", width: 60, height: 14 }} />
                <span className="box" style={{ left: 16, top: "60%", width: 40, height: 14 }} />
                <span className="box" style={{ left: 62, top: "60%", width: 44, height: 14 }} />
              </div>
              <div className="screenwall">
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>

              <div className="set">
                <div className="monitor">
                  <div className="b">B</div>
                  <div className="bm">BLUMARK24 · DIGITAL TWIN OFFICE</div>
                  <div className="scan" />
                  <span className="stand" />
                </div>
                <div className="chair">
                  <div className="cbk" />
                  <div className="cst" />
                  <div className="cpo" />
                  <div className="cbase" />
                </div>
                <div className="desk" />
                <div className="desk-chip">
                  <i /> {employeeName} · نشط الآن
                </div>
              </div>

              <div className="holo">
                <div className="head" />
                <div className="body" />
                <div className="disc" />
              </div>

              <span className="particle" style={{ width: 3, height: 3, top: "36%", left: "20%" }} />
              <span className="particle" style={{ width: 2, height: 2, top: "28%", left: "72%", animationDelay: "2.2s" }} />
              <span className="particle" style={{ width: 3, height: 3, top: "50%", left: "82%", animationDelay: "4s" }} />
              <span className="particle" style={{ width: 2, height: 2, top: "56%", left: "12%", animationDelay: "5.5s" }} />

              <span className="explore-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                  <path d="M2 10a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3h-3.5l-1.8-2h-3.4l-1.8 2H5a3 3 0 0 1-3-3z" />
                </svg>{" "}
                استكشاف المكتب الافتراضي
              </span>
              <div className="fog" />
              <div className="vig" />
            </div>

            {/* today tasks + next task */}
            <aside className="panel">
              <div className="p-title">
                مهامي اليوم <span style={{ fontSize: 12, color: "var(--muted)" }}>{loading ? "—" : `${activeCount} مهام`}</span>
              </div>
              {statsRow}

              {focus ? (
                <div className="next-task">
                  <div className="nt-head">
                    <span className={`badge ${focus.priority === "عاجلة" ? "d" : "b"}`}>
                      <span className="led" /> {focus.priority}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--ice)", fontWeight: 800 }}>{STATUS_LABEL[focus.status]}</span>
                  </div>
                  <div className="nt-title">{focus.title}</div>
                  <div className="nt-due">
                    {eta.big}
                    {focus.clientName ? ` · ${focus.clientName}` : ""}
                  </div>
                  <div className="nt-mid">
                    <div className="esc-box">
                      <div className="e1">الوقت المتبقي قبل التصعيد</div>
                      <div className="e2">{eta.big}</div>
                      <div className="e3">{eta.sub}</div>
                    </div>
                    <ProgressRing value={progress} size={64} stroke={6} />
                  </div>
                  <div className="nt-actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={busy}
                      onClick={() => changeStatus("قيد_التنفيذ", "تم بدء العمل على المهمة")}
                    >
                      <Play size={16} /> ابدأ العمل
                    </button>
                    <div className="row2">
                      <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => toast.info("تم تسجيل طلب المساعدة.")}>
                        <HelpCircle size={15} /> أحتاج مساعدة
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled={busy}
                        onClick={() => changeStatus("بانتظار_المراجعة", "تم إرسال المهمة للمراجعة")}
                      >
                        <Send size={15} /> للمراجعة
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="next-task">
                  <div className="nt-title">لا توجد مهام نشطة اليوم</div>
                  <div className="nt-due">مكتبك الذكي جاهز — ستظهر مهامك القادمة هنا فور إسنادها.</div>
                </div>
              )}

              {insight.others.length > 0 ? (
                <>
                  <div className="subhead">المهام الأخرى</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {insight.others.map((task) => (
                      <div key={task.id} className="mini-task">
                        <span className="badge v" style={{ fontSize: 9 }}>
                          {STATUS_LABEL[task.status]}
                        </span>
                        <span>
                          <span className="mt1">{task.title}</span>
                          <br />
                          <span className="mt2">
                            {task.priority} · {task.dueDate}
                          </span>
                        </span>
                        <span className="arr">‹</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </aside>
          </div>

          {/* bottom strip: task path · escalation · mini map */}
          <div className="f-bottom">
            <div className="panel">
              <div className="p-title">
                مسار المهمة في الهيكل الإداري <span className="en">TASK PATH</span>
              </div>
              <div className="pathflow">
                <div className="pnode done">
                  <span className="pc">
                    <Users size={17} />
                  </span>
                  <span className="pl">مجلس الإدارة</span>
                  <span className="ps">أعلى مستوى</span>
                </div>
                <span className="plink" />
                <div className="pnode done">
                  <span className="pc">
                    <LayoutGrid size={16} />
                  </span>
                  <span className="pl">وكالة التشغيل</span>
                  <span className="ps">المستوى الثاني</span>
                </div>
                <span className="plink" />
                <div className="pnode done">
                  <span className="pc">
                    <Building2 size={16} />
                  </span>
                  <span className="pl">إدارة الطباعة والنشر</span>
                  <span className="ps">المستوى الثالث</span>
                </div>
                <span className="plink" />
                <div className="pnode now">
                  <span className="pc">
                    <PenTool size={16} />
                  </span>
                  <span className="pl">{department}</span>
                  <span className="ps">المستوى الرابع</span>
                </div>
                <span className="plink" />
                <div className="pnode now">
                  <span className="pc">{initial}</span>
                  <span className="pl">{employeeName}</span>
                  <span className="ps">المستوى الخامس</span>
                </div>
                <span className="plink" />
                <div className="pnode">
                  <span className="pc">
                    <FileText size={15} />
                  </span>
                  <span className="pl">المهمة</span>
                  <span className="ps">{focus?.title ?? "—"}</span>
                </div>
              </div>
              <div className="pathbar">
                <span style={{ fontSize: 10.5, color: "var(--muted)", fontWeight: 700 }}>تقدّم المهمة في المسار</span>
                <span className="track">
                  <span className="fill" style={{ width: `${progress}%` }} />
                </span>
                <b>{progress}%</b>
              </div>
            </div>

            <div className="panel esc-panel">
              <div className="p-title" style={{ justifyContent: "center" }}>
                مؤقت التصعيد <span className="en">ESCALATION</span>
              </div>
              <div className="e1">التصعيد التالي إلى المسؤول المباشر</div>
              <div className="e2">{eta.big}</div>
              <div className="e3">عند تجاوز موعد المهمة دون تحديث</div>
            </div>

            <div className="panel map-panel">
              <div className="p-title">
                خريطة المكتب الافتراضي <span className="en">TWIN OFFICE MAP · معاينة</span>
              </div>
              {miniMap}
            </div>
          </div>

          {/* bottom nav */}
          <nav className="f-nav">
            <Link href="/dashboard" className="navb">
              <Home /> الرئيسية
            </Link>
            <span className="navb on">
              <LayoutGrid /> المهام
            </span>
            <span className="nav-orb">B</span>
            <span className="navb">
              <CalendarDays /> التقويم
            </span>
            <span className="navb">
              <FileText /> الملاحظات
            </span>
            <span className="navb">
              <MoreHorizontal /> المزيد
            </span>
          </nav>
        </div>

        {/* ============================= MOBILE ============================= */}
        <div className="mobframe">
          <div className="m-top">
            <span className="orb">B</span>
            <span>
              <span className="t1">مكتبي الذكي</span>
              <br />
              <span className="t2">MY TWIN DESK</span>
            </span>
            <span className="spacer" />
            <span className="icon-btn">
              <Bell />
              {insight.late.length > 0 ? <span className="bdg">{insight.late.length}</span> : null}
            </span>
            <span className="av" style={{ position: "relative", width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(160deg,#2C4A78,#122340)", border: "2px solid rgba(125,220,255,.35)", display: "grid", placeItems: "center", fontWeight: 900, fontSize: 13, color: "var(--ice)" }}>
              {initial}
            </span>
          </div>

          <div className="m-hero">
            <div className="ht">
              <span>
                <span className="h1">مرحباً {employeeName}</span>
                <br />
                <span className="h2">{department}</span>
              </span>
              <span className="badge w">
                <span className="led" /> {pressureLabel} {pressurePct}%
              </span>
            </div>
            <div className="m-floor" />
            <div className="m-rays" />
            <span className="fring r1" />
            <span className="fring r2" />
            <div className="m-chair" />
            <div className="m-mon">B</div>
            <div className="m-desk" />
            <span className="explore-btn" style={{ bottom: 12, padding: "8px 16px", fontSize: 10.5 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" width={13} height={13}>
                <path d="M2 10a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3h-3.5l-1.8-2h-3.4l-1.8 2H5a3 3 0 0 1-3-3z" />
              </svg>{" "}
              استكشاف المكتب
            </span>
            <div className="m-vig" />
          </div>

          <div className="m-q">
            وش أسوي الآن؟ <span className="en">WHAT&apos;S NEXT</span>
          </div>

          {focus ? (
            <div className="m-next">
              <div className="nt-head">
                <span className={`badge ${focus.priority === "عاجلة" ? "d" : "b"}`}>
                  <span className="led" /> {focus.priority}
                </span>
                <span style={{ fontSize: 9.5, color: "var(--muted)" }}>{eta.big}</span>
              </div>
              <div className="nt-title">{focus.title}</div>
              <div className="nt-mid" style={{ marginTop: 10 }}>
                <div className="esc-box">
                  <div className="e1">المتبقي قبل التصعيد</div>
                  <div className="e2">{eta.big}</div>
                </div>
                <ProgressRing value={progress} size={62} stroke={6} />
              </div>
              <div className="nt-actions" style={{ marginTop: 11 }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ height: 46, fontSize: 14 }}
                  disabled={busy}
                  onClick={() => changeStatus("قيد_التنفيذ", "تم بدء العمل على المهمة")}
                >
                  <Play size={16} /> ابدأ العمل
                </button>
                <div className="row2">
                  <button type="button" className="btn btn-secondary" style={{ height: 38, fontSize: 11.5 }} disabled={busy} onClick={() => toast.info("تم تسجيل طلب المساعدة.")}>
                    أحتاج مساعدة
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ height: 38, fontSize: 11.5 }}
                    disabled={busy}
                    onClick={() => changeStatus("بانتظار_المراجعة", "تم إرسال المهمة للمراجعة")}
                  >
                    للمراجعة
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="m-next">
              <div className="nt-title">لا توجد مهام نشطة اليوم</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>ستظهر مهمتك القادمة هنا فور إسنادها.</div>
            </div>
          )}

          <div className="m-stats">
            <div className="stat d">
              <div className="sv">{insight.urgent.length}</div>
              <div className="sl">عاجلة</div>
            </div>
            <div className="stat b">
              <div className="sv">{insight.doing.length}</div>
              <div className="sl">قيد التنفيذ</div>
            </div>
            <div className="stat v">
              <div className="sv">{insight.review.length}</div>
              <div className="sl">اعتماد</div>
            </div>
            <div className="stat s">
              <div className="sv">{insight.done.length}</div>
              <div className="sl">مكتملة</div>
            </div>
          </div>

          <div className="m-row">
            <div className="m-radar-card">
              <div className="radar">
                <span className="r-ring a" />
                <span className="r-ring b" />
                <span className="r-ring c" />
                <span className="sweep" />
                {insight.late.length > 0 && <span className="blip d" style={{ top: "32%", insetInlineStart: "30%" }} />}
                {insight.review.length > 0 && <span className="blip v" style={{ top: "62%", insetInlineStart: "58%" }} />}
              </div>
            </div>
            <div className="m-alerts">
              <div className="alert d">
                <span className="led" />
                <span>
                  <span className="a1">مهام متأخرة</span>
                  <br />
                  <span className="a2">{insight.late.length} تحتاج إجراء</span>
                </span>
              </div>
              <div className="alert i">
                <span className="led" />
                <span>
                  <span className="a1">بانتظار اعتماد</span>
                  <br />
                  <span className="a2">{insight.review.length} مهمة</span>
                </span>
              </div>
            </div>
          </div>

          <div className="m-map">
            <div className="p-title" style={{ fontSize: 11.5 }}>
              خريطة المكتب الافتراضي <span className="en">معاينة</span>
            </div>
            {miniMap}
          </div>

          <nav className="m-nav">
            <Link href="/dashboard" className="navb">
              <Home /> الرئيسية
            </Link>
            <Link href="/tasks" className="navb on">
              <LayoutGrid /> المهام
            </Link>
            <span className="nav-orb">B</span>
            <span className="navb">
              <CalendarDays /> التقويم
            </span>
            <span className="navb">
              <MoreHorizontal /> المزيد
            </span>
          </nav>
        </div>
      </div>
    </PageGuard>
  );
}

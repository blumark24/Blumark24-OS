"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  ChevronLeft,
  CircleHelp,
  ClipboardList,
  Home,
  LayoutGrid,
  MessageSquare,
  MoreHorizontal,
  Play,
  Send,
} from "lucide-react";
import PageGuard from "@/components/ui/PageGuard";
import { useToast } from "@/contexts/ToastContext";
import { useTasks } from "@/hooks/useData";
import type { Task, TaskStatus } from "@/types";
import "./twin-desk.css";

type AlertTone = "danger" | "warn" | "decision";

type AlertItem = {
  id: string;
  label: string;
  count: number;
  tone: AlertTone;
  note: string;
};

function parseDueDate(dueDate: string | undefined) {
  if (!dueDate?.trim()) return null;
  const target = new Date(dueDate);
  return Number.isNaN(target.getTime()) ? null : target;
}

function daysUntil(dueDate: string | undefined) {
  const target = parseDueDate(dueDate);
  if (!target) return Number.NaN;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function isOverdue(task: Task) {
  const target = parseDueDate(task.dueDate);
  return task.status !== "مكتملة" && !!target && target < new Date();
}

function dueText(task: Task | null) {
  if (!task) return "لا توجد مهمة نشطة";
  if (!task.dueDate?.trim()) return "بلا موعد محدد";
  const diff = daysUntil(task.dueDate);
  if (!Number.isFinite(diff)) return "تاريخ غير صالح";
  if (task.status === "مكتملة") return "مكتملة";
  if (diff < 0) return `متأخرة ${Math.abs(diff)} يوم`;
  if (diff === 0) return "تنتهي اليوم";
  if (diff === 1) return "غداً";
  return `خلال ${diff} يوم`;
}

function statusProgress(status: TaskStatus | undefined) {
  switch (status) {
    case "مكتملة":
      return 100;
    case "بانتظار_المراجعة":
      return 75;
    case "قيد_التنفيذ":
      return 50;
    case "جديدة":
    case "متأخرة":
      return 18;
    default:
      return 0;
  }
}

function pressureLabel(activeCount: number) {
  if (activeCount >= 6) return "ضغط مرتفع";
  if (activeCount >= 3) return "ضغط متوسط";
  return "طبيعي";
}

function priorityTone(priority: Task["priority"] | undefined) {
  if (priority === "عاجلة") return "danger";
  if (priority === "عالية") return "warn";
  return "info";
}

function TwinDeskHeader({
  employeeName,
  department,
  alertCount,
}: {
  employeeName: string;
  department: string;
  alertCount: number;
}) {
  return (
    <header className="td-command">
      <div className="td-brand">
        <span className="td-logo">B</span>
        <span>
          <strong>Blumark24 OS</strong>
          <small>Digital Twin Intelligence</small>
        </span>
      </div>

      <div className="td-greeting">
        <strong>مرحباً {employeeName}</strong>
        <span>{department} · مكتبي الذكي</span>
      </div>

      <div className="td-command-actions">
        <Link href="/tasks" className="td-top-button">
          <ChevronLeft size={15} />
          رجوع للمهام
        </Link>
        <span className="td-top-button td-icon-pill">
          <Bell size={15} />
          تنبيهات
          {alertCount > 0 ? <i>{alertCount}</i> : null}
        </span>
        <span className="td-top-button td-icon-pill">
          <MessageSquare size={15} />
          دردشة
        </span>
      </div>
    </header>
  );
}

function AlertRadarPanel({ alerts, activeCount, pressure }: { alerts: AlertItem[]; activeCount: number; pressure: number }) {
  const hasAlerts = alerts.some((alert) => alert.count > 0);

  return (
    <aside className="td-panel td-radar-panel">
      <div className="td-panel-title">
        <strong>رادار التنبيهات الذكي</strong>
        <span>SMART ALERT RADAR</span>
      </div>

      <div className="td-radar">
        <span className="td-radar-ring r1" />
        <span className="td-radar-ring r2" />
        <span className="td-radar-ring r3" />
        <span className="td-radar-sweep" />
        {alerts[0]?.count > 0 ? <span className="td-blip danger" /> : null}
        {alerts[1]?.count > 0 ? <span className="td-blip warn" /> : null}
        {alerts[2]?.count > 0 ? <span className="td-blip decision" /> : null}
        {!hasAlerts ? <span className="td-radar-empty">لا تنبيهات</span> : null}
      </div>

      <div className="td-alert-list">
        {alerts.map((alert) => (
          <div className={`td-alert ${alert.tone}`} key={alert.id}>
            <span className="td-led" />
            <span>
              <strong>{alert.label}</strong>
              <small>{alert.note}</small>
            </span>
            <b>{alert.count}</b>
          </div>
        ))}
      </div>

      <WorkPressureGauge value={pressure} label={pressureLabel(activeCount)} activeCount={activeCount} />
    </aside>
  );
}

function WorkPressureGauge({ value, label, activeCount }: { value: number; label: string; activeCount: number }) {
  const radius = 27;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, value)) / 100);

  return (
    <div className="td-pressure">
      <div className="td-pressure-title">مؤشر ضغط العمل</div>
      <div className="td-pressure-body">
        <div className="td-ring">
          <svg viewBox="0 0 64 64" aria-label={`ضغط العمل ${value}%`}>
            <circle cx="32" cy="32" r={radius} />
            <circle cx="32" cy="32" r={radius} style={{ strokeDasharray: circumference, strokeDashoffset: offset }} />
          </svg>
          <strong>{value}%</strong>
        </div>
        <span>
          <strong>{label}</strong>
          <small>لديك {activeCount} مهام نشطة</small>
        </span>
      </div>
    </div>
  );
}

function CinematicOfficeScene({ employeeName, department, pressure }: { employeeName: string; department: string; pressure: string }) {
  return (
    <section className="td-scene" aria-label="مشهد المكتب الذكي السينمائي">
      <div className="td-light-rays" />
      <div className="td-back-wall">
        <div className="td-wall-glass" />
        <div className="td-screen-logo">B</div>
      </div>
      <div className="td-side-glass right" />
      <div className="td-side-glass left" />
      <div className="td-zone right">
        <span />
        {department}
      </div>
      <div className="td-zone left">
        <span />
        إدارة الطباعة والنشر
      </div>
      <div className="td-floor">
        <span className="td-floor-grid" />
        <span className="td-floor-ring main" />
        <span className="td-floor-ring back" />
        <span className="td-floor-glow" />
      </div>
      <div className="td-chair">
        <span className="seat" />
        <span className="back" />
      </div>
      <div className="td-holo">
        <span className="body" />
        <span className="shadow" />
      </div>
      <div className="td-status-chip">ACTIVE · نشط</div>
      <div className="td-desk">
        <span className="top" />
        <span className="front" />
        <span className="shadow" />
      </div>
      <div className="td-scene-caption">
        <strong>{employeeName}</strong>
        <span>{pressure}</span>
      </div>
    </section>
  );
}

function TodayTasksPanel({
  currentTask,
  urgentCount,
  doingCount,
  reviewCount,
  completedCount,
  progress,
  busy,
  onStart,
  onReview,
  onHelp,
}: {
  currentTask: Task | null;
  urgentCount: number;
  doingCount: number;
  reviewCount: number;
  completedCount: number;
  progress: number;
  busy: boolean;
  onStart: () => void;
  onReview: () => void;
  onHelp: () => void;
}) {
  return (
    <aside className="td-panel td-tasks-panel">
      <div className="td-panel-title">
        <strong>مهامي اليوم</strong>
        <span>TODAY TASKS</span>
      </div>

      <div className="td-stats-grid">
        <StatCard tone="danger" value={urgentCount} label="عاجلة" />
        <StatCard tone="info" value={doingCount} label="قيد التنفيذ" />
        <StatCard tone="decision" value={reviewCount} label="بانتظار مراجعة" />
        <StatCard tone="success" value={completedCount} label="مكتملة" />
      </div>

      <NextTaskCard
        task={currentTask}
        progress={progress}
        busy={busy}
        onStart={onStart}
        onReview={onReview}
        onHelp={onHelp}
      />
    </aside>
  );
}

function StatCard({ tone, value, label }: { tone: "danger" | "info" | "decision" | "success" | "warn"; value: number | string; label: string }) {
  return (
    <div className={`td-stat ${tone}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function NextTaskCard({
  task,
  progress,
  busy,
  onStart,
  onReview,
  onHelp,
}: {
  task: Task | null;
  progress: number;
  busy: boolean;
  onStart: () => void;
  onReview: () => void;
  onHelp: () => void;
}) {
  if (!task) {
    return (
      <div className="td-next-task empty">
        <span className="td-kicker">وش أسوي الآن؟</span>
        <strong>لا توجد مهمة نشطة الآن</strong>
        <p>عند إسناد مهمة جديدة ستظهر هنا مع الإجراء التالي مباشرة.</p>
      </div>
    );
  }

  return (
    <div className="td-next-task">
      <div className="td-next-head">
        <span className="td-kicker">المهمة القادمة</span>
        <span className={`td-status ${priorityTone(task.priority)}`}>{task.priority}</span>
      </div>
      <h2>{task.title}</h2>
      <p>
        {dueText(task)}
        {task.clientName ? ` · ${task.clientName}` : ""}
      </p>
      <div className="td-progress-row">
        <span>التقدم</span>
        <b>{progress}%</b>
      </div>
      <div className="td-progress-track">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="td-actions">
        <button type="button" className="td-primary-action" disabled={busy} onClick={onStart}>
          <Play size={15} />
          ابدأ العمل
        </button>
        <button type="button" className="td-secondary-action help" disabled={busy} onClick={onHelp}>
          <CircleHelp size={15} />
          أحتاج مساعدة
        </button>
        <button type="button" className="td-secondary-action" disabled={busy} onClick={onReview}>
          <Send size={15} />
          للمراجعة
        </button>
      </div>
    </div>
  );
}

function TaskPath({ employeeName, department, task }: { employeeName: string; department: string; task: Task | null }) {
  return (
    <section className="td-path">
      <span>PATH</span>
      <b>مجلس الإدارة</b>
      <i>←</i>
      <b>وكالة التشغيل</b>
      <i>←</i>
      <b>إدارة الطباعة والنشر</b>
      <i>←</i>
      <b>{department}</b>
      <i>←</i>
      <b>{employeeName}</b>
      <i>←</i>
      <strong>{task?.title ?? "لا توجد مهمة نشطة"}</strong>
    </section>
  );
}

function MiniOfficeMap() {
  const zones = [
    { name: "قسم التصميم", label: "ضغط مرتفع", tone: "danger" },
    { name: "قسم المحتوى", label: "طبيعي", tone: "info" },
    { name: "قسم الطباعة", label: "طبيعي", tone: "success" },
    { name: "قسم التسويق", label: "ضغط متوسط", tone: "warn" },
  ];

  return (
    <section className="td-map-panel">
      <div className="td-map-head">
        <strong>خريطة المكتب الافتراضي</strong>
        <span>PREVIEW · معاينة</span>
      </div>
      <div className="td-map-grid">
        {zones.map((zone) => (
          <div className={`td-map-zone ${zone.tone}`} key={zone.name}>
            <span>
              <b>{zone.name}</b>
              <small>{zone.label}</small>
            </span>
            <i />
          </div>
        ))}
      </div>
    </section>
  );
}

function BottomTwinNav() {
  return (
    <nav className="td-bottom-nav" aria-label="تنقل My Twin Desk">
      <Link href="/dashboard">
        <Home size={16} />
        الرئيسية
      </Link>
      <Link href="/tasks" className="on">
        <LayoutGrid size={16} />
        المهام
      </Link>
      <span className="td-nav-logo">B</span>
      <span>
        <CalendarDays size={16} />
        التقويم
      </span>
      <span>
        <ClipboardList size={16} />
        الملاحظات
      </span>
      <span>
        <MoreHorizontal size={16} />
        المزيد
      </span>
    </nav>
  );
}

export default function MyTwinDeskPage() {
  const { data: tasks, loading, update } = useTasks();
  const toast = useToast();
  const [savingAction, setSavingAction] = useState<TaskStatus | null>(null);

  const insight = useMemo(() => {
    const active = tasks.filter((task) => task.status !== "مكتملة");
    const late = active.filter((task) => task.status === "متأخرة" || isOverdue(task));
    const review = active.filter((task) => task.status === "بانتظار_المراجعة");
    const doing = active.filter((task) => task.status === "قيد_التنفيذ");
    const completed = tasks.filter((task) => task.status === "مكتملة");
    const urgent = active.filter((task) => task.priority === "عاجلة");
    const dueSoon = active.filter((task) => {
      const diff = daysUntil(task.dueDate);
      return Number.isFinite(diff) && diff >= 0 && diff <= 2;
    });
    const currentTask =
      late[0] ??
      active.find((task) => task.priority === "عاجلة" || task.priority === "عالية") ??
      dueSoon[0] ??
      doing[0] ??
      active[0] ??
      null;

    return { active, late, review, doing, completed, urgent, dueSoon, currentTask };
  }, [tasks]);

  const currentTask = insight.currentTask;
  const employeeName = currentTask?.assigneeName?.trim() || "الموظف";
  const department = "قسم التصميم";
  const progress = statusProgress(currentTask?.status);
  const activeCount = insight.active.length;
  const pressure = Math.min(99, activeCount * 13);
  const alertCount = insight.late.length + insight.dueSoon.length + insight.review.length;
  const alerts: AlertItem[] = [
    { id: "late", label: "مهمة متأخرة", count: insight.late.length, tone: "danger", note: insight.late[0]?.title ?? "لا توجد مهام متأخرة" },
    { id: "soon", label: "قريبة من الموعد", count: insight.dueSoon.length, tone: "warn", note: "خلال يومين أو أقل" },
    { id: "review", label: "بانتظار مراجعة", count: insight.review.length, tone: "decision", note: "تحتاج اعتماد المسؤول" },
  ];

  const changeStatus = async (status: TaskStatus, message: string) => {
    if (!currentTask) return;
    setSavingAction(status);
    try {
      await update(currentTask.id, { status });
      toast.success(message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تحديث المهمة");
    } finally {
      setSavingAction(null);
    }
  };

  const startWork = () => changeStatus("قيد_التنفيذ", "تم بدء العمل على المهمة");
  const sendToReview = () => changeStatus("بانتظار_المراجعة", "تم إرسال المهمة للمراجعة");
  const askForHelp = () => toast.info("تم تسجيل طلب المساعدة.");
  const busy = !currentTask || !!savingAction;

  return (
    <PageGuard permission="manage_tasks" immersive>
      <main className="twindesk" dir="rtl">
        {loading ? (
          <div className="td-loading">
            <span className="td-logo">B</span>
            <strong>جاري تحميل مكتبك الذكي...</strong>
          </div>
        ) : (
          <>
            <section className="td-desktop-shell">
              <TwinDeskHeader employeeName={employeeName} department={department} alertCount={alertCount} />

              <div className="td-main-grid">
                <AlertRadarPanel alerts={alerts} activeCount={activeCount} pressure={pressure} />
                <CinematicOfficeScene employeeName={employeeName} department={department} pressure={pressureLabel(activeCount)} />
                <TodayTasksPanel
                  currentTask={currentTask}
                  urgentCount={insight.urgent.length}
                  doingCount={insight.doing.length}
                  reviewCount={insight.review.length}
                  completedCount={insight.completed.length}
                  progress={progress}
                  busy={busy}
                  onStart={startWork}
                  onReview={sendToReview}
                  onHelp={askForHelp}
                />
              </div>

              <TaskPath employeeName={employeeName} department={department} task={currentTask} />
              <MiniOfficeMap />
              <BottomTwinNav />
            </section>

            <section className="td-mobile-shell">
              <div className="td-mobile-header">
                <span className="td-logo">B</span>
                <span>
                  <strong>مرحباً {employeeName}</strong>
                  <small>{department}</small>
                </span>
                <i />
                <span className="td-mobile-bell">
                  <Bell size={15} />
                  {alertCount > 0 ? <b>{alertCount}</b> : null}
                </span>
              </div>

              <CinematicOfficeScene employeeName={employeeName} department={department} pressure={pressureLabel(activeCount)} />

              <div className="td-mobile-question">وش أسوي الآن؟</div>

              <NextTaskCard
                task={currentTask}
                progress={progress}
                busy={busy}
                onStart={startWork}
                onReview={sendToReview}
                onHelp={askForHelp}
              />

              <div className="td-mobile-radar-row">
                <div className="td-mobile-radar">
                  <div className="td-radar mini">
                    <span className="td-radar-ring r1" />
                    <span className="td-radar-ring r2" />
                    <span className="td-radar-sweep" />
                    {alertCount > 0 ? <span className="td-blip danger" /> : <span className="td-radar-empty">هادئ</span>}
                  </div>
                </div>
                <div className="td-mobile-stats">
                  <StatCard tone="danger" value={insight.urgent.length} label="عاجلة" />
                  <StatCard tone="success" value={insight.completed.length} label="مكتملة" />
                  <StatCard tone="warn" value={`${pressure}%`} label="ضغط العمل" />
                  <StatCard tone="info" value={insight.doing.length} label="قيد التنفيذ" />
                </div>
              </div>

              <MiniOfficeMap />
              <BottomTwinNav />
            </section>
          </>
        )}
      </main>
    </PageGuard>
  );
}

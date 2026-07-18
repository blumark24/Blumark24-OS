"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode, type RefObject } from "react";
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  CheckSquare,
  ChevronLeft,
  FileText,
  Home,
  Landmark,
  LayoutGrid,
  Menu,
  MoreHorizontal,
  Play,
  Search,
  Send,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import PageGuard from "@/components/ui/PageGuard";
import { TaskWorkspace } from "@/components/tasks/TaskWorkspace";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useToast } from "@/contexts/ToastContext";
import { useTasks } from "@/hooks/useData";
import { useTaskWorkflow } from "@/hooks/useTaskWorkflow";
import { isLegacyOverdue, isTaskOverdue } from "@/lib/tasks/taskStatus";
import type { Task, TaskStatus } from "@/types";
import "./twin-desk.css";

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

function dueText(task: Task | null) {
  if (!task) return "لا توجد مهمة نشطة";
  if (!task.dueDate?.trim()) return "بلا موعد محدد";
  const diff = daysUntil(task.dueDate);
  if (!Number.isFinite(diff)) return "تاريخ غير صالح";
  const status = task.status as string;
  if (status === "مكتملة" || status === "ملغاة") return status;
  if (diff < 0) return `متأخرة ${Math.abs(diff)} يوم`;
  if (diff === 0) return "تنتهي اليوم";
  if (diff === 1) return "غدًا";
  return `خلال ${diff} يوم`;
}

function formatTaskTime(task: Task) {
  const target = parseDueDate(task.dueDate);
  if (!target) return "--:--";
  return target.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
}

function statusProgress(status: string | undefined) {
  switch (status) {
    case "مكتملة":
      return 100;
    case "بانتظار_المراجعة":
      return 75;
    case "قيد_التنفيذ":
      return 50;
    case "موقوفة":
      return 35;
    case "طلب_تعديل":
      return 60;
    case "جديدة":
    case "متأخرة":
      return 18;
    default:
      return 0;
  }
}

function workdayLabel() {
  return new Intl.DateTimeFormat("ar-SA", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
}
type DeskPanel = "tasks" | "clients" | "employees" | "organization" | "finance" | "reports" | "assistant" | "settings" | "documents";
type DeskPanelPermission = "manage_tasks" | "manage_clients" | "view_employees" | "manage_tenant_settings" | "manage_finance" | "manage_reports" | "manage_settings";
const DESK_PANEL_META: Record<DeskPanel, {
  label: string;
  href?: string;
  description: string;
  permission?: DeskPanelPermission;
}> = {
  tasks: {
    label: "المهام",
    href: "/tasks",
    description: "راجع المهام المتاحة ضمن نطاق حسابك، مع إبقاء القراءة محكومة بصلاحياتك الحالية.",
    permission: "manage_tasks",
  },
  clients: {
    label: "العملاء",
    href: "/clients",
    description: "الوصول إلى العملاء المرتبطين بمنشأتك أو نطاق إدارتك فقط.",
    permission: "manage_clients",
  },
  employees: {
    label: "الموظفون",
    href: "/employees",
    description: "عرض أعضاء النطاق المسموح به، مع احترام صلاحيات إدارة المستخدمين وRLS.",
    permission: "view_employees",
  },
  organization: {
    label: "الهيكل الإداري",
    href: "/org",
    description: "إدارة الهيكل التنظيمي داخل المنشأة الحالية عندما تسمح الصلاحيات بذلك.",
    permission: "manage_tenant_settings",
  },
  finance: {
    label: "المالية",
    href: "/finance",
    description: "الوصول إلى المؤشرات والمعاملات المالية ضمن النطاق الإداري المصرح به.",
    permission: "manage_finance",
  },
  reports: {
    label: "التقارير",
    href: "/reports",
    description: "استعراض التقارير المتاحة لحسابك دون توسيع نطاق البيانات.",
    permission: "manage_reports",
  },
  assistant: {
    label: "المساعد الذكي",
    href: "/ai",
    description: "افتح مساحة المساعد الذكي مع بقاء المحادثات والبيانات ضمن جلسة حسابك.",
  },
  settings: {
    label: "الإعدادات",
    href: "/settings",
    description: "الوصول إلى إعدادات الحساب أو المنشأة بحسب الدور والصلاحيات الحالية.",
    permission: "manage_settings",
  },
  documents: {
    label: "المستندات",
    description: "ستظهر المستندات المرتبطة بمهامك هنا عند توفر مصدر بيانات مصرح به.",
  },
};
const QUICK_PANEL_BY_PATH: Record<string, DeskPanel> = {
  "/tasks": "tasks",
  "/clients": "clients",
  "/employees": "employees",
  "/org": "organization",
  "/finance": "finance",
  "/reports": "reports",
  "/ai": "assistant",
  "/settings": "settings",
};
function panelScope(role: string | undefined, department: string) {
  const normalizedRole = role?.trim().toLowerCase();
  if (normalizedRole === "employee") return "المهام والبيانات الشخصية المسموح بها لحسابك.";
  if (normalizedRole === "manager" || normalizedRole === "department_manager" || normalizedRole === "مدير_قسم") {
    return "فريق " + (department || "إدارتك") + " والمهام الواقعة ضمن نطاقها.";
  }
  if (normalizedRole === "organization_manager" || normalizedRole === "owner" || normalizedRole === "tenant_owner") {
    return "بيانات المنشأة الحالية فقط.";
  }
  if (normalizedRole === "defense_manager" || normalizedRole === "attack_manager" || normalizedRole === "finance_manager") {
    return "النطاق الإداري المرتبط بدور " + (department || "حسابك") + ".";
  }
  return "النطاق المسموح به وفق الدور والصلاحيات وRLS.";
}

function GlassCard({ title, action, children, className }: { title: string; action?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`td-glass-card ${className ?? ""}`}>
      <div className="td-card-head">
        <strong>{title}</strong>
        {action ? <span>{action}</span> : null}
      </div>
      {children}
    </section>
  );
}

function Metric({ value, label }: { value: number | string; label: string }) {
  return (
    <span>
      <strong>{value}</strong>
      <small>{label}</small>
    </span>
  );
}

function EmptyLine({ title, note }: { title: string; note: string }) {
  return (
    <div className="td-empty-line">
      <strong>{title}</strong>
      <small>{note}</small>
    </div>
  );
}

function ExecutiveHeader({ employeeName, department, alertCount }: { employeeName: string; department: string; alertCount: number }) {
  return (
    <header className="td-command">
      <div className="td-title-block">
        <span className="td-menu-button" aria-hidden="true"><Menu size={18} /></span>
        <span>
          <strong>My Desk</strong>
          <small>مكتب تنفيذي ذكي</small>
        </span>
      </div>

      <div className="td-greeting">
        <strong>صباح الخير، {employeeName}</strong>
        <span>{department || "مساحة عملك الخاصة"}</span>
      </div>

      <div className="td-command-actions">
        <span className="td-search-pill" aria-label="البحث داخل المكتب قريبًا"><Search size={15} />البحث داخل المكتب قريبًا</span>
        <span className="td-icon-circle" aria-label="تنبيهات المهام الشخصية"><Bell size={15} />{alertCount > 0 ? <i>{alertCount}</i> : null}</span>
        <Link href="/tasks" className="td-top-button"><ChevronLeft size={15} />المهام</Link>
      </div>
    </header>
  );
}

function GreetingCard({ employeeName, department }: { employeeName: string; department: string }) {
  return (
    <section className="td-greeting-card">
      <strong>صباح الخير، {employeeName}</strong>
      <span>{workdayLabel()}</span>
      <small>{department || "مساحة عملك الخاصة"}</small>
    </section>
  );
}

function TaskCard({
  pending,
  doing,
  late,
  currentTask,
  taskLoadError,
  onRetryTasks,
  retrying,
  progress,
  startDisabled,
  submitDisabled,
  startBusy,
  submitBusy,
  workflowHint,
  onStart,
  onDone,
}: {
  pending: number;
  doing: number;
  late: number;
  currentTask: Task | null;
  taskLoadError?: boolean;
  onRetryTasks: () => void;
  retrying: boolean;
  progress: number;
  startDisabled: boolean;
  submitDisabled: boolean;
  startBusy: boolean;
  submitBusy: boolean;
  workflowHint?: string;
  onStart: () => void;
  onDone: () => void;
}) {
  return (
    <GlassCard title="مهامي" action="عرض الكل" className="td-task-card">
      <div className="td-task-metrics">
        <Metric value={pending} label="بانتظارك" />
        <Metric value={doing} label="قيد التنفيذ" />
        <Metric value={late} label="متأخرة" />
      </div>
      {taskLoadError ? (
        <div className="td-empty-line" role="alert">
          <strong>{"\u062a\u0639\u0630\u0631 \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0645\u0647\u0627\u0645"}</strong>
          <button type="button" onClick={onRetryTasks} disabled={retrying}>
            {retrying ? "\u062c\u0627\u0631\u064d \u0627\u0644\u0625\u0639\u0627\u062f\u0629" : "\u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629"}
          </button>
        </div>
      ) : currentTask ? (
        <div className="td-current-task">
          <span>الأولوية الحالية</span>
          <strong>{currentTask.title}</strong>
          <small>{dueText(currentTask)}</small>
          <div className="td-task-progress"><i style={{ width: `${progress}%` }} /></div>
          <div className="td-task-actions">
            <button type="button" disabled={startDisabled} aria-disabled={startDisabled} aria-busy={startBusy} title={workflowHint} onClick={onStart}><Play size={13} />{startBusy ? "جارٍ البدء" : "ابدأ"}</button>
            <button type="button" disabled={submitDisabled} aria-disabled={submitDisabled} aria-busy={submitBusy} onClick={onDone}><Send size={13} />{submitBusy ? "جارٍ الإرسال" : "تم"}</button>
          </div>
          {workflowHint ? <small>{workflowHint}</small> : null}
        </div>
      ) : (
        <EmptyLine title="\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0647\u0627\u0645 \u0634\u062e\u0635\u064a\u0629" note="\u0633\u062a\u0638\u0647\u0631 \u0647\u0646\u0627 \u0627\u0644\u0645\u0647\u0627\u0645 \u0627\u0644\u0645\u0633\u0646\u062f\u0629 \u0644\u0643 \u0641\u0642\u0637." />
      )}
      <Link href="/tasks" className="td-card-link">الانتقال إلى لوحة المهام <ChevronLeft size={15} /></Link>
    </GlassCard>
  );
}

function CalendarCard({ schedule }: { schedule: Task[] }) {
  return (
    <GlassCard title="تقويم اليوم" action="أقرب الاستحقاقات" className="td-calendar-card">
      {schedule.length ? (
        <div className="td-agenda-list">
          {schedule.map((task) => (
            <div className="td-agenda-item" key={task.id}>
              <time>{formatTaskTime(task)}</time>
              <span><strong>{task.title}</strong><small>{dueText(task)}</small></span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyLine title="لا توجد مواعيد مرتبطة بمهامك" note="سيظهر هنا أقرب استحقاق عند وجود مهمة مسندة لك." />
      )}
    </GlassCard>
  );
}

function AnnouncementCard({ alertCount }: { alertCount: number }) {
  return (
    <GlassCard title="الإعلانات" action="متابعة" className="td-announcement-card">
      {alertCount > 0 ? (
        <div className="td-announcement">
          <strong>لديك عناصر تحتاج الانتباه اليوم</strong>
          <p>هناك {alertCount} تنبيه مرتبط بمهامك الشخصية فقط، دون عرض بيانات أي عضو آخر.</p>
        </div>
      ) : (
        <EmptyLine title="لا توجد إعلانات تشغيلية" note="لا توجد تنبيهات مرتبطة بمهامك الآن." />
      )}
    </GlassCard>
  );
}

function QuickLink({ href, icon, label, tone }: { href: string; icon: ReactNode; label: string; tone: "blue" | "gold" | "orange" | "cyan" | "silver" | "slate" }) {
  return <Link href={href} className={`td-quick-link ${tone}`} aria-label={label}><span>{icon}</span><b>{label}</b></Link>;
}

function QuickAccessCard({ onOpen }: { onOpen: (panel: DeskPanel, trigger: HTMLElement) => void }) {
  const onQuickAccessClick = (event: MouseEvent<HTMLDivElement>) => {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>("a.td-quick-link");
    const panel = QUICK_PANEL_BY_PATH[link?.getAttribute("href") ?? ""];
    if (!link || !panel) return;
    event.preventDefault();
    onOpen(panel, link);
  };
  return (
    <GlassCard title="وصول سريع" className="td-quick-card">
      <div className="td-quick-grid" onClick={onQuickAccessClick}>
        <QuickLink href="/tasks" icon={<CheckSquare size={18} />} label="المهام" tone="blue" />
        <QuickLink href="/clients" icon={<BriefcaseBusiness size={18} />} label="العملاء" tone="cyan" />
        <QuickLink href="/employees" icon={<Users size={18} />} label="الموظفون" tone="orange" />
        <QuickLink href="/org" icon={<Building2 size={18} />} label="الهيكل الإداري" tone="gold" />
        <QuickLink href="/finance" icon={<Landmark size={18} />} label="المالية" tone="silver" />
        <QuickLink href="/reports" icon={<FileText size={18} />} label="التقارير" tone="cyan" />
        <QuickLink href="/ai" icon={<Sparkles size={18} />} label="المساعد الذكي" tone="blue" />
        <QuickLink href="/settings" icon={<Settings size={18} />} label="الإعدادات" tone="slate" />
      </div>
    </GlassCard>
  );
}

function SmartPanel({
  panel,
  task,
  scope,
  userId,
  userRole,
  workflow,
  onTaskRefresh,
  hasPermission,
  taskSummary,
  dialogRef,
  closeButtonRef,
  onClose,
}: {
  panel: DeskPanel;
  scope: string;
  hasPermission: (permission: DeskPanelPermission) => boolean;
  taskSummary: { pending: number; doing: number; late: number };
  dialogRef: RefObject<HTMLElement>;
  closeButtonRef: RefObject<HTMLButtonElement>;
  task: Task | null;
  userId?: string;
  userRole?: string;
  workflow: {
    isBusy: boolean;
    start: (taskId: string) => Promise<void>;
    submitForReview: (taskId: string, note: string) => Promise<void>;
  };
  onTaskRefresh?: () => Promise<unknown>;
  onClose: () => void;
}) {
  const meta = DESK_PANEL_META[panel];
  const allowed = !meta.permission || hasPermission(meta.permission);

  return (
    <div
      className="td-panel-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className="td-smart-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="my-desk-panel-title"
      >
        <header className="td-smart-panel-head">
          <div>
            <small>My Desk</small>
            <h2 id="my-desk-panel-title">{meta.label}</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="td-smart-panel-close"
            aria-label="????? ???????"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>

        {panel === "tasks" ? (
          <TaskWorkspace task={task} userId={userId} userRole={userRole} workflow={workflow} onTaskRefresh={onTaskRefresh} />
        ) : (
        <div className="td-smart-panel-content">
          <p>{meta.description}</p>
          <div className="td-smart-panel-scope">
            <span>?????? ??????</span>
            <strong>{scope}</strong>
          </div>
          {allowed ? (
            <p className="td-smart-panel-note">?????? ??????? ?????? ?RLS ??? ??? ?????? ?????????.</p>
          ) : (
            <p className="td-smart-panel-note restricted">?? ???? ?????? ??? ?????? ??? ????? ??? ???? ?????.</p>
          )}
        </div>
        )}

        <footer className="td-smart-panel-actions">
          {allowed && meta.href ? (
            <Link href={meta.href} className="td-smart-panel-primary" onClick={onClose}>
              ??? {meta.label}
            </Link>
          ) : null}
          <button type="button" className="td-smart-panel-secondary" onClick={onClose}>?????</button>
        </footer>
      </section>
    </div>
  );
}

function DocumentsCard() {
  return (
    <GlassCard title="المستندات" className="td-documents-card">
      <EmptyLine title="لا توجد مستندات مرتبطة بمهامك" note="لن نعرض مستندات وهمية. ستظهر الملفات هنا عند ربطها بمهامك." />
    </GlassCard>
  );
}

function ExecutiveOfficeScene() {
  return (
    <section className="td-office-scene" aria-label="مكتب Blumark24 OS التنفيذي الذكي">
      <div className="td-office-overlay" />
      <div className="td-brand-wall" aria-label="Blumark24 OS">
        <span className="td-brand-mark">B</span>
        <strong>Blumark24 OS</strong>
        <small>مكتب تنفيذي ذكي</small>
      </div>
    </section>
  );
}

function DockMoreMenu({
  open,
  onClose,
  triggerRef,
}: {
  open: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLButtonElement>;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const firstLink = menuRef.current?.querySelector<HTMLAnchorElement>("a");
    firstLink?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [open, onClose, triggerRef]);

  if (!open) return null;

  return (
    <>
      <button type="button" className="td-more-backdrop" aria-label="إغلاق قائمة المزيد" onClick={onClose} />
      <div className="td-more-menu" id="my-desk-more-menu" ref={menuRef} role="menu" aria-label="المزيد">
        <Link href="/employees" role="menuitem" onClick={onClose}>الموظفون</Link>
        <Link href="/org" role="menuitem" onClick={onClose}>الهيكل الإداري</Link>
        <Link href="/finance" role="menuitem" onClick={onClose}>المالية</Link>
        <Link href="/reports" role="menuitem" onClick={onClose}>التقارير</Link>
        <Link href="/ai" role="menuitem" onClick={onClose}>المساعد الذكي</Link>
        <Link href="/settings" role="menuitem" onClick={onClose}>الإعدادات</Link>
      </div>
    </>
  );
}

function BottomTwinNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreTriggerRef = useRef<HTMLButtonElement>(null);
  const closeMoreMenu = () => setMoreOpen(false);

  return (
    <>
      <DockMoreMenu open={moreOpen} onClose={closeMoreMenu} triggerRef={moreTriggerRef} />
      <nav className="td-bottom-nav" aria-label="تنقل My Desk">
        <Link href="/dashboard"><Home size={16} />الرئيسية</Link>
        <Link href="/tasks"><LayoutGrid size={16} />المهام</Link>
        <Link href="/tasks/my-desk" className="td-nav-logo on" aria-label="مكتبي">B</Link>
        <Link href="/clients"><BriefcaseBusiness size={16} />العملاء</Link>
        <Link href="/reports" className="td-desktop-dock-link"><FileText size={16} />التقارير</Link>
        <Link href="/settings" className="td-desktop-dock-link"><Settings size={16} />الإعدادات</Link>
        <button
          ref={moreTriggerRef}
          type="button"
          className="td-mobile-more-button"
          aria-label="المزيد"
          aria-expanded={moreOpen}
          aria-controls="my-desk-more-menu"
          onClick={() => setMoreOpen((isOpen) => !isOpen)}
        >
          <MoreHorizontal size={16} />المزيد
        </button>
      </nav>
    </>
  );
}

export default function MyTwinDeskPage() {
  const { data: tasks, loading, error: tasksError, refetch: refetchTasks } = useTasks();
  const workflow = useTaskWorkflow();
  const { user } = useAuth();
  const toast = useToast();
  const { hasPermission } = usePermissions();
  const [activePanel, setActivePanel] = useState<DeskPanel | null>(null);
  const panelTriggerRef = useRef<HTMLElement | null>(null);
  const panelDialogRef = useRef<HTMLElement>(null);
  const panelCloseButtonRef = useRef<HTMLButtonElement>(null);

  const openPanel = (panel: DeskPanel, trigger: HTMLElement) => {
    panelTriggerRef.current = trigger;
    setActivePanel(panel);
  };

  const closePanel = () => setActivePanel(null);

  useEffect(() => {
    if (!activePanel) {
      const trigger = panelTriggerRef.current;
      if (trigger) requestAnimationFrame(() => trigger.focus());
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFrame = requestAnimationFrame(() => panelCloseButtonRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActivePanel(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [activePanel]);

  const myTasks = useMemo(
    () => (user?.id ? tasks.filter((task) => task.assigneeId === user.id) : []),
    [tasks, user?.id],
  );

  const insight = useMemo(() => {
    const active = myTasks.filter((task) => !["مكتملة", "ملغاة"].includes(task.status as string));
    const late = active.filter((task) => isTaskOverdue(task) || isLegacyOverdue(task));
    const review = active.filter((task) => task.status === "بانتظار_المراجعة");
    const doing = active.filter((task) => task.status === "قيد_التنفيذ");
    const dueSoon = active.filter((task) => {
      const diff = daysUntil(task.dueDate);
      return Number.isFinite(diff) && diff >= 0 && diff <= 2;
    });
    const pending = active.filter((task) => task.status === "جديدة");
    const currentTask = late[0] ?? active.find((task) => task.priority === "عاجلة" || task.priority === "عالية") ?? dueSoon[0] ?? doing[0] ?? active[0] ?? null;
    return { late, review, doing, dueSoon, pending, currentTask };
  }, [myTasks]);

  const currentTask = insight.currentTask;
  const employeeName = user?.name?.trim() || user?.email?.split("@")[0] || "الموظف";
  const department = user?.department?.trim() || "";
  const progress = statusProgress(currentTask?.status);
  const alertCount = insight.late.length + insight.dueSoon.length + insight.review.length;
  const schedule = [currentTask, ...insight.dueSoon.filter((task) => task.id !== currentTask?.id)].filter(Boolean).slice(0, 3) as Task[];
  const scope = panelScope(user?.role, department);
  const taskSummary = { pending: insight.pending.length, doing: insight.doing.length, late: insight.late.length };

  // My Desk is intentionally personal; team management will live in a separate workspace.

  const startWork = async () => {
    if (!currentTask) return;
    try {
      await workflow.start(currentTask.id);
      toast.success("تم بدء العمل على المهمة");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر بدء المهمة");
    }
  };

  const sendDone = async () => {
    if (!currentTask) return;
    if (!window.confirm("هل تريد إرسال المهمة للمراجعة؟ ستتاح ملاحظات المراجعة بعد تفعيل سير العمل الآمن.")) return;
    const note = window.prompt("أضف ملاحظة الإرسال للمراجع");
    if (!note?.trim()) return;
    try {
      await workflow.submitForReview(currentTask.id, note.trim());
      toast.success("تم إرسال العمل للمراجعة");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر إرسال المهمة للمراجعة");
    }
  };

  const currentTaskIsLegacyOverdue = !!currentTask && isLegacyOverdue(currentTask);
  const startDisabled = !currentTask || workflow.isBusy || !workflow.capabilities.start || currentTask.status !== "جديدة" || currentTaskIsLegacyOverdue;
  const submitDisabled = !currentTask || workflow.isBusy || !workflow.capabilities.submitForReview || currentTask.status !== "قيد_التنفيذ";
  const workflowHint = currentTaskIsLegacyOverdue ? "تحتاج ترحيل آمن عبر سير العمل الجديد." : undefined;

  return (
    <PageGuard permission="manage_tasks" immersive>
      <main className="twindesk" dir="rtl">
        {loading ? (
          <div className="td-loading"><span className="td-nav-logo">B</span><strong>جاري تحميل مكتبك التنفيذي...</strong></div>
        ) : (
          <section className="td-desk-shell">
            <ExecutiveHeader employeeName={employeeName} department={department} alertCount={alertCount} />
            <div className="td-office-layout">
              <aside className="td-side-stack td-left-stack">
                <GreetingCard employeeName={employeeName} department={department} />
                <TaskCard
                  pending={insight.pending.length}
                  doing={insight.doing.length}
                  late={insight.late.length}
                  currentTask={currentTask}
                  taskLoadError={Boolean(tasksError)}
                  onRetryTasks={() => void refetchTasks()}
                  retrying={loading}
                  progress={progress}
                  startDisabled={startDisabled}
                  submitDisabled={submitDisabled}
                  startBusy={workflow.isActionPending("start")}
                  submitBusy={workflow.isActionPending("submitForReview")}
                  workflowHint={workflowHint}
                  onStart={startWork}
                  onDone={sendDone}
                />
                <CalendarCard schedule={schedule} />
              </aside>

              <ExecutiveOfficeScene />

              <aside className="td-side-stack td-right-stack">
                <AnnouncementCard alertCount={alertCount} />
                <QuickAccessCard onOpen={openPanel} />
                <DocumentsCard />
              </aside>
            </div>
            <BottomTwinNav />
            {activePanel ? (
              <SmartPanel
                panel={activePanel}
                scope={scope}
                hasPermission={hasPermission}
                taskSummary={taskSummary}
                task={currentTask}
                userId={user?.id}
                userRole={user?.role}
                workflow={workflow}
                dialogRef={panelDialogRef}
                closeButtonRef={panelCloseButtonRef}
                onTaskRefresh={refetchTasks}
                onClose={closePanel}
              />
            ) : null}
          </section>
        )}
      </main>
    </PageGuard>
  );
}

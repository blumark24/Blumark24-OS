/**
 * Lightweight dashboard copy dictionary (ar / en) — no i18n framework.
 */

export type DashboardLocale = "ar" | "en";

export type DashboardCopy = (typeof DASHBOARD_COPY)[DashboardLocale];

export const DASHBOARD_COPY = {
  ar: {
    hero: {
      welcome: "مرحباً بك 👋",
      orgLine: "لوحة قيادة منشأتك — مركز العمليات الذكي",
      noDepartment: "لم يُحدد القسم بعد",
      aiTitle: "رؤية ذكية من النظام",
      viewDetails: "عرض التفاصيل",
      chips: {
        operational: "حالة التشغيل",
        completion: "معدل الإنجاز",
        team: "أداء الفريق",
      },
      status: {
        needsAttention: "يتطلب متابعة",
        stable: "مستقر",
        excellent: "ممتاز",
        good: "جيد",
        average: "متوسط",
        none: "—",
      },
    },
    kpi: {
      live: "مباشر",
      overdue: {
        title: "المهام المتأخرة",
        insight: "تحتاج إلى متابعة فورية",
        footerUrgent: "تتطلب متابعة فورية",
        footerClear: "لا يوجد خطر حرج",
      },
      remaining: {
        title: "المهام المتبقية",
        insight: "عبء العمل الحالي",
        footer: (remaining: number, total: number) => `متبقي ${remaining} من ${total}`,
      },
      completed: {
        title: "المهام المكتملة",
        insight: "مؤشر كفاءة التنفيذ",
        footer: "معدل إنجاز مستقر اليوم",
      },
      clients: {
        title: "العملاء النشطون",
        insight: "نشاط العملاء الحالي",
        footerLatest: (name: string) => `آخر عميل: ${name}`,
        footerNone: "لا يوجد عميل جديد",
      },
    },
    insights: {
      title: "رؤى ذكية من AI",
      subtitle: "ماذا تفعل الآن؟ توصيات مبنية على بياناتك",
      viewAll: "عرض جميع الرؤى",
      overdue: (n: number) => `لديك ${n} مهمة متأخرة تحتاج متابعة فورية.`,
      remaining: (n: number) => `يوجد ${n} مهمة قيد المتابعة هذا الأسبوع.`,
      completion: (pct: number) => `نسبة الإنجاز الحالية ${pct}%.`,
      activeClients: (n: number) => `يوجد ${n} عميل نشط حالياً.`,
      activeEmployeesLabel: "موظفون نشطون:",
    },
    aiInsight: {
      overdue: (n: number) => `لديك ${n} مهمة متأخرة تتطلب متابعة فورية الآن.`,
      inProgress: (n: number, pct: number) =>
        `${n} مهمة قيد التنفيذ، ومعدل الإنجاز الحالي ${pct}%.`,
      allDone: "جميع المهام منجزة — أداء ممتاز اليوم! 🎯",
    },
    empty: {
      title: "لا توجد بيانات كافية بعد",
      subtitle: "ابدأ بإضافة أول عميل أو مهمة لتفعيل التحليلات الذكية تلقائياً",
      hint: "سيتم بناء المؤشرات تلقائياً بعد إدخال البيانات",
      activityTitle: "لا توجد نشاطات بعد",
      activitySubtitle: "ستظهر هنا تحديثات المهام والعملاء",
      activityHint: "أضف مهمة أو عميلاً لبدء السجل",
      projects: "لا توجد مشاريع بعد",
    },
    sections: {
      taskDistribution: {
        title: "توزيع المهام",
        subtitle: "ماذا يحدث في فريقك الآن؟",
        total: "مهمة",
        completed: "مكتملة",
        pending: "متبقية",
        overdue: "متأخرة",
        hints: { completed: "منجزة بنجاح", pending: "قيد المتابعة", overdue: "تحتاج إجراء" },
      },
      analytics: {
        title: "تحليل الأداء",
        subtitle: "اتجاه الإيرادات — لماذا يهم؟ لقياس نمو المنشأة",
        period: "آخر 12 شهر",
      },
      activity: {
        title: "النشاط الأخير",
        subtitle: "آخر تحركات الفريق — تابع ما يحدث لحظياً",
      },
      dept: {
        title: "أداء الفريق بالقسم",
        subtitle: "توزيع الموظفين النشطين",
        active: (n: number) => `${n} نشط`,
      },
      satisfaction: {
        title: "مؤشر نشاط العملاء",
        subtitle: "نسبة العملاء النشطين/المتعاقدين",
        excellent: "ممتاز",
        average: "متوسط",
        needsWork: "يحتاج تحسين",
        clientsLine: (active: number, total: number) =>
          `${active} من ${total} عميل نشط/متعاقد`,
      },
      summary: {
        title: "ملخص المنشأة",
        live: "مباشر",
        totalEmployees: "إجمالي الموظفين",
        activeEmployees: "الموظفون النشطون",
        totalClients: "إجمالي العملاء",
        netIncome: "صافي الدخل",
      },
      projects: {
        title: "المشاريع النشطة",
        viewAll: "عرض الكل",
        headers: ["المشروع", "العميل", "التقدم", "الميزانية", "الموعد", "الحالة"],
        inProgress: "قيد التنفيذ",
      },
      quickActions: {
        title: "اختصارات سريعة",
        subtitle: "نفّذ أهم الإجراءات بضغطة واحدة",
        create: "إنشاء سريع",
        items: {
          newTask: "مهمة جديدة",
          newClient: "عميل جديد",
          newInvoice: "فاتورة جديدة",
          newExpense: "مصروف جديد",
          newEmployee: "موظف جديد",
          newReport: "إنشاء تقرير",
        },
      },
    },
    roles: {
      orgManager: "مدير المنشأة",
      employee: "موظف",
      financeManager: "مدير مالي",
    },
    loading: "جارٍ التحميل...",
    months: [
      "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
      "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
    ],
    modal: {
      subtitle: "لوحة تنفيذية مباشرة وتفاصيل مركزة",
      details: "تفاصيل اللوحة",
      lastFive: "آخر 5 عناصر",
      noData: "لا توجد بيانات حالياً",
      close: "إغلاق",
      export: "تصدير سريع",
      share: "مشاركة تنفيذية",
      status: { critical: "حرج", done: "مكتمل", progress: "قيد التنفيذ", client: "عميل" },
    },
  },
  en: {
    hero: {
      welcome: "Welcome back 👋",
      orgLine: "Your workspace command center",
      noDepartment: "No department linked yet",
      aiTitle: "Smart system insight",
      viewDetails: "View details",
      chips: {
        operational: "Operations",
        completion: "Completion rate",
        team: "Team performance",
      },
      status: {
        needsAttention: "Needs attention",
        stable: "Stable",
        excellent: "Excellent",
        good: "Good",
        average: "Average",
        none: "—",
      },
    },
    kpi: {
      live: "Live",
      overdue: {
        title: "Overdue tasks",
        insight: "Requires immediate follow-up",
        footerUrgent: "Needs immediate action",
        footerClear: "No critical risk",
      },
      remaining: {
        title: "Remaining tasks",
        insight: "Current workload",
        footer: (remaining: number, total: number) => `${remaining} of ${total} remaining`,
      },
      completed: {
        title: "Completed tasks",
        insight: "Execution efficiency",
        footer: "Stable completion rate today",
      },
      clients: {
        title: "Active clients",
        insight: "Current client activity",
        footerLatest: (name: string) => `Latest client: ${name}`,
        footerNone: "No new client yet",
      },
    },
    insights: {
      title: "AI smart insights",
      subtitle: "What to do next — based on your live data",
      viewAll: "View all insights",
      overdue: (n: number) => `You have ${n} overdue task(s) requiring immediate follow-up.`,
      remaining: (n: number) => `${n} task(s) in progress this week.`,
      completion: (pct: number) => `Current completion rate is ${pct}%.`,
      activeClients: (n: number) => `${n} active client(s) right now.`,
      activeEmployeesLabel: "Active employees:",
    },
    aiInsight: {
      overdue: (n: number) => `You have ${n} overdue task(s) that need attention now.`,
      inProgress: (n: number, pct: number) =>
        `${n} task(s) in progress; current completion rate is ${pct}%.`,
      allDone: "All tasks complete — excellent performance today! 🎯",
    },
    empty: {
      title: "Not enough data yet",
      subtitle: "Add your first client or task to activate smart analytics",
      hint: "Metrics will build automatically after you add data",
      activityTitle: "No activity yet",
      activitySubtitle: "Task and client updates will appear here",
      activityHint: "Add a task or client to start the feed",
      projects: "No projects yet",
    },
    sections: {
      taskDistribution: {
        title: "Task distribution",
        subtitle: "What is happening in your team right now?",
        total: "tasks",
        completed: "Completed",
        pending: "Remaining",
        overdue: "Overdue",
        hints: { completed: "Done successfully", pending: "In progress", overdue: "Needs action" },
      },
      analytics: {
        title: "Performance analytics",
        subtitle: "Revenue trend — measure business growth",
        period: "Last 12 months",
      },
      activity: {
        title: "Recent activity",
        subtitle: "Latest team movements — stay in the loop",
      },
      dept: {
        title: "Team by department",
        subtitle: "Active employee distribution",
        active: (n: number) => `${n} active`,
      },
      satisfaction: {
        title: "Client activity index",
        subtitle: "Active / contracted client ratio",
        excellent: "Excellent",
        average: "Average",
        needsWork: "Needs improvement",
        clientsLine: (active: number, total: number) =>
          `${active} of ${total} active/contracted clients`,
      },
      summary: {
        title: "Workspace summary",
        live: "Live",
        totalEmployees: "Total employees",
        activeEmployees: "Active employees",
        totalClients: "Total clients",
        netIncome: "Net income",
      },
      projects: {
        title: "Active projects",
        viewAll: "View all",
        headers: ["Project", "Client", "Progress", "Budget", "Deadline", "Status"],
        inProgress: "In progress",
      },
      quickActions: {
        title: "Quick actions",
        subtitle: "Run the most important workflows in one tap",
        create: "Quick create",
        items: {
          newTask: "New task",
          newClient: "New client",
          newInvoice: "New invoice",
          newExpense: "New expense",
          newEmployee: "New employee",
          newReport: "Create report",
        },
      },
    },
    roles: {
      orgManager: "Organization manager",
      employee: "Employee",
      financeManager: "Finance manager",
    },
    loading: "Loading...",
    months: [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ],
    modal: {
      subtitle: "Live executive board with focused details",
      details: "Board details",
      lastFive: "Last 5 items",
      noData: "No data available",
      close: "Close",
      export: "Quick export",
      share: "Executive share",
      status: { critical: "Critical", done: "Done", progress: "In progress", client: "Client" },
    },
  },
} as const;

export function getDashboardCopy(locale: DashboardLocale): DashboardCopy {
  return DASHBOARD_COPY[locale];
}

export function formatDashboardDate(locale: DashboardLocale, date = new Date()): string {
  const months = DASHBOARD_COPY[locale].months;
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function tenantSafeRoleLabel(
  locale: DashboardLocale,
  role: string | null | undefined,
  rawRole: string | undefined,
  isInternal: boolean,
  internalLabels: Record<string, string>,
): string {
  const c = DASHBOARD_COPY[locale].roles;
  if (isInternal && role) return internalLabels[role] ?? rawRole ?? "—";
  if (role === "organization_manager") return c.orgManager;
  if (role === "employee") return c.employee;
  if (role === "finance_manager") return c.financeManager;
  return c.orgManager;
}

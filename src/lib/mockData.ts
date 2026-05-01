import type { Employee, Task, Client, Transaction, Project, Activity, StrategyPhase } from "@/types";

export const mockEmployees: Employee[] = [
  { id: "1", name: "أحمد محمد", email: "ahmed@blumark24.com", role: "مدير_عام", department: "الإدارة", status: "نشط", joinDate: "2023-01-15", performance: 5, phone: "0501234567", tasks: 12, completedTasks: 11 },
  { id: "2", name: "سارة أحمد", email: "sara@blumark24.com", role: "مدير_مبيعات", department: "الحملات", status: "نشط", joinDate: "2023-03-20", performance: 4, phone: "0502345678", tasks: 8, completedTasks: 7 },
  { id: "3", name: "محمد علي", email: "mali@blumark24.com", role: "موظف", department: "التصميم", status: "نشط", joinDate: "2023-06-10", performance: 4, phone: "0503456789", tasks: 15, completedTasks: 12 },
  { id: "4", name: "فاطمة خالد", email: "fatima@blumark24.com", role: "مدير_مالي", department: "المالي", status: "نشط", joinDate: "2023-02-01", performance: 5, phone: "0504567890", tasks: 6, completedTasks: 6 },
  { id: "5", name: "عمر حسن", email: "omar@blumark24.com", role: "موظف", department: "الإبداع", status: "نشط", joinDate: "2023-09-01", performance: 3, phone: "0505678901", tasks: 10, completedTasks: 7 },
  { id: "6", name: "نورة سعد", email: "noura@blumark24.com", role: "موظف", department: "خدمة العملاء", status: "نشط", joinDate: "2024-01-15", performance: 4, phone: "0506789012", tasks: 20, completedTasks: 18 },
  { id: "7", name: "خالد العمري", email: "khalid@blumark24.com", role: "موظف", department: "الهجوم", status: "غير_نشط", joinDate: "2023-11-01", performance: 3, phone: "0507890123", tasks: 5, completedTasks: 3 },
  { id: "8", name: "ريم الشهري", email: "reem@blumark24.com", role: "موظف", department: "AI Lab", status: "نشط", joinDate: "2024-03-01", performance: 5, phone: "0508901234", tasks: 7, completedTasks: 7 },
];

export const mockTasks: Task[] = [
  { id: "t1", title: "تصميم هوية بصرية لشركة الماس", description: "تصميم شعار وهوية بصرية كاملة", status: "قيد_التنفيذ", priority: "عاجلة", assigneeId: "3", assigneeName: "محمد علي", clientId: "c1", clientName: "شركة الماس", dueDate: "2024-06-15", createdAt: "2024-05-20", tags: ["تصميم", "هوية"] },
  { id: "t2", title: "حملة تسويقية لمطعم اللؤلؤ", description: "إدارة حملة السوشال ميديا", status: "بانتظار_المراجعة", priority: "عالية", assigneeId: "2", assigneeName: "سارة أحمد", clientId: "c2", clientName: "مطعم اللؤلؤ", dueDate: "2024-05-20", createdAt: "2024-05-10", tags: ["تسويق"] },
  { id: "t3", title: "تطوير تطبيق الجوال", description: "تطوير تطبيق iOS وAndroid", status: "قيد_التنفيذ", priority: "عاجلة", assigneeId: "8", assigneeName: "ريم الشهري", clientId: "c3", clientName: "مركز الرياض", dueDate: "2024-07-10", createdAt: "2024-05-01", tags: ["تطوير", "تطبيق"] },
  { id: "t4", title: "نظام إدارة العملاء", description: "بناء CRM مخصص", status: "مكتملة", priority: "عالية", assigneeId: "8", assigneeName: "ريم الشهري", clientId: "c4", clientName: "مؤسسة الإبداع", dueDate: "2024-05-10", createdAt: "2024-04-01", tags: ["تطوير"] },
  { id: "t5", title: "إعداد تقرير الأداء الشهري", description: "جمع وتحليل بيانات الأداء", status: "جديدة", priority: "متوسطة", assigneeId: "4", assigneeName: "فاطمة خالد", dueDate: "2024-06-01", createdAt: "2024-05-28", tags: ["تقرير"] },
  { id: "t6", title: "متابعة العملاء المحتملين", description: "الاتصال والمتابعة مع 20 عميل محتمل", status: "متأخرة", priority: "عالية", assigneeId: "5", assigneeName: "عمر حسن", dueDate: "2024-05-01", createdAt: "2024-04-15", tags: ["مبيعات"] },
  { id: "t7", title: "صيانة الموقع الإلكتروني", description: "تحديث وتحسين أداء الموقع", status: "جديدة", priority: "منخفضة", assigneeId: "3", assigneeName: "محمد علي", dueDate: "2024-06-30", createdAt: "2024-05-29", tags: ["تطوير"] },
];

export const mockClients: Client[] = [
  { id: "c1", name: "شركة الماس للتقنية", phone: "0501111111", businessType: "تقنية", city: "جدة", packageType: "كبيرة", contractValue: 250000, status: "نشط", accountManagerId: "2", accountManagerName: "سارة أحمد", createdAt: "2024-01-10" },
  { id: "c2", name: "مطعم اللؤلؤ", phone: "0502222222", businessType: "مطاعم", city: "مكة", packageType: "متوسطة", contractValue: 45000, status: "نشط", accountManagerId: "5", accountManagerName: "عمر حسن", createdAt: "2024-02-15" },
  { id: "c3", name: "مركز الرياض التسويقي", phone: "0503333333", businessType: "تسويق", city: "الرياض", packageType: "كبيرة", contractValue: 80000, status: "متعاقد", accountManagerId: "2", accountManagerName: "سارة أحمد", createdAt: "2024-03-01" },
  { id: "c4", name: "شركة المستقبل للاستشارات", phone: "0504444444", businessType: "استشارات", city: "جدة", packageType: "صغيرة", contractValue: 150000, status: "نشط", accountManagerId: "5", accountManagerName: "عمر حسن", createdAt: "2023-12-01" },
  { id: "c5", name: "مؤسسة الإبداع", phone: "0505555555", businessType: "إبداع", city: "الطائف", packageType: "صغيرة", contractValue: 120000, status: "متعاقد", accountManagerId: "2", accountManagerName: "سارة أحمد", createdAt: "2024-04-01" },
  { id: "c6", name: "بيت العصير السعودي", phone: "0506666666", businessType: "مشروبات", city: "مكة", packageType: "صغيرة", contractValue: 25000, status: "محتمل", accountManagerId: "5", accountManagerName: "عمر حسن", createdAt: "2024-05-20" },
  { id: "c7", name: "شركة الريادة للبناء", phone: "0507777777", businessType: "إنشاءات", city: "جدة", packageType: "كبيرة", contractValue: 500000, status: "متوقف", accountManagerId: "2", accountManagerName: "سارة أحمد", createdAt: "2023-08-01" },
];

export const mockTransactions: Transaction[] = [
  { id: "tr1", type: "دخل", amount: 250000, description: "عقد شركة الماس", category: "عقود", date: "2024-05-01", funds: { operations: 100000, savings: 25000, taxes: 25000, salaries: 50000, marketing: 50000 } },
  { id: "tr2", type: "مصروف", amount: 15000, description: "رواتب الموظفين", category: "رواتب", date: "2024-05-05" },
  { id: "tr3", type: "دخل", amount: 45000, description: "عقد مطعم اللؤلؤ", category: "عقود", date: "2024-05-10", funds: { operations: 18000, savings: 4500, taxes: 4500, salaries: 9000, marketing: 9000 } },
  { id: "tr4", type: "مصروف", amount: 8000, description: "إيجار المكتب", category: "مصاريف تشغيلية", date: "2024-05-01" },
  { id: "tr5", type: "دخل", amount: 80000, description: "مشروع مركز الرياض", category: "مشاريع", date: "2024-04-28", funds: { operations: 32000, savings: 8000, taxes: 8000, salaries: 16000, marketing: 16000 } },
  { id: "tr6", type: "مصروف", amount: 5000, description: "مصاريف التسويق", category: "تسويق", date: "2024-05-12" },
];

export const mockProjects: Project[] = [
  { id: "p1", name: "تطوير المنصة", clientName: "شركة التقنية", progress: 75, budget: 250000, deadline: "2024-06-15", status: "قيد_التنفيذ", accountManagerName: "سارة أحمد" },
  { id: "p2", name: "تصميم هوية بصرية", clientName: "مطعم اللؤلؤ", progress: 90, budget: 45000, deadline: "2024-05-20", status: "قيد_التنفيذ", accountManagerName: "عمر حسن" },
  { id: "p3", name: "حملة تسويقية", clientName: "مركز الرياض", progress: 60, budget: 80000, deadline: "2024-06-01", status: "قيد_التنفيذ", accountManagerName: "سارة أحمد" },
  { id: "p4", name: "تطبيق الجوال", clientName: "شركة المستقبل", progress: 30, budget: 150000, deadline: "2024-07-10", status: "قيد_التنفيذ", accountManagerName: "ريم الشهري" },
  { id: "p5", name: "نظام إدارة العملاء", clientName: "مؤسسة الإبداع", progress: 100, budget: 120000, deadline: "2024-05-10", status: "مكتمل", accountManagerName: "ريم الشهري" },
];

export const mockActivities: Activity[] = [
  { id: "a1", type: "employee", description: "تم إضافة عميل جديد - شركة المطلق", timestamp: "2024-05-28T10:30:00", icon: "👤" },
  { id: "a2", type: "task", description: "تم إكمال مهمة تصميم هوية بصرية", timestamp: "2024-05-28T09:05:00", icon: "✅" },
  { id: "a3", type: "finance", description: "تم استلام دفعة 50,000 SAR", timestamp: "2024-05-28T08:00:00", icon: "💰" },
  { id: "a4", type: "employee", description: "تم إضافة موظف جديد - سارة أحمد", timestamp: "2024-05-27T14:00:00", icon: "👤" },
  { id: "a5", type: "project", description: "تم تحديث المشروع - تطوير المنصة", timestamp: "2024-05-27T11:00:00", icon: "📋" },
];

export const mockSalesData = [
  { month: "يناير", current: 320000, previous: 280000 },
  { month: "فبراير", current: 380000, previous: 310000 },
  { month: "مارس", current: 420000, previous: 350000 },
  { month: "أبريل", current: 390000, previous: 380000 },
  { month: "مايو", current: 480000, previous: 400000 },
  { month: "يونيو", current: 520000, previous: 430000 },
  { month: "يوليو", current: 490000, previous: 460000 },
  { month: "أغسطس", current: 560000, previous: 480000 },
  { month: "سبتمبر", current: 610000, previous: 520000 },
  { month: "أكتوبر", current: 720000, previous: 580000 },
  { month: "نوفمبر", current: 850000, previous: 640000 },
  { month: "ديسمبر", current: 960000, previous: 720000 },
];

export const mockActiveUsersData = [
  { date: "13 مايو", users: 120 },
  { date: "15 مايو", users: 145 },
  { date: "20 مايو", users: 132 },
  { date: "22 أبريل", users: 158 },
  { date: "29 أبريل", users: 175 },
  { date: "6 مايو", users: 189 },
];

export const mockStrategyPhases: StrategyPhase[] = [
  {
    id: 1,
    title: "المرحلة الأولى: الانطلاق",
    description: "10 عملاء وتطوير المشروع الأساسي",
    progress: 100,
    budget: 50000,
    startDate: "2023-01-01",
    endDate: "2023-06-30",
    targetClients: 10,
    currentClients: 10,
    goals: ["بناء فريق العمل الأساسي", "اكتساب أول 10 عملاء", "تطوير النظام الأساسي", "إنشاء هوية العلامة التجارية"],
    status: "مكتملة",
  },
  {
    id: 2,
    title: "المرحلة الثانية: النمو",
    description: "25 عميل + توظيف + تطوير النظام",
    progress: 72,
    budget: 150000,
    startDate: "2023-07-01",
    endDate: "2024-06-30",
    targetClients: 25,
    currentClients: 18,
    goals: ["الوصول لـ25 عميل", "توظيف 5 موظفين جدد", "تطوير نظام Blumark24 OS", "تطوير خدمات الذكاء الاصطناعي"],
    status: "جارية",
  },
  {
    id: 3,
    title: "المرحلة الثالثة: التوسع",
    description: "مكتب مكة + المطاعم والمقاهي والبقالات",
    progress: 20,
    budget: 300000,
    startDate: "2024-07-01",
    endDate: "2025-03-31",
    targetClients: 60,
    currentClients: 12,
    goals: ["افتتاح مكتب في مكة", "استهداف قطاع المطاعم والمقاهي", "تطوير حلول للبقالات", "شراكات استراتيجية"],
    status: "قادمة",
  },
  {
    id: 4,
    title: "المرحلة الرابعة: التميز",
    description: "تنفيذ البراند والتجهيزات الاحترافية",
    progress: 0,
    budget: 500000,
    startDate: "2025-04-01",
    endDate: "2025-12-31",
    targetClients: 120,
    currentClients: 0,
    goals: ["إطلاق تجهيزات احترافية", "تطوير منصة SaaS", "برنامج الشراكة مع الشركاء", "الاعتراف الوطني بالعلامة"],
    status: "قادمة",
  },
  {
    id: 5,
    title: "المرحلة الخامسة: الريادة",
    description: "B2G + منصة فرص + المنافسات الحكومية",
    progress: 0,
    budget: 1000000,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    targetClients: 250,
    currentClients: 0,
    goals: ["الدخول في العقود الحكومية (B2G)", "إطلاق منصة الفرص الرقمية", "المشاركة في المنافسات الحكومية", "الانتشار الوطني الكامل"],
    status: "قادمة",
  },
];

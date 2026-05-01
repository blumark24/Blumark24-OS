export type UserRole = "مدير_عام" | "مدير_مالي" | "مدير_مبيعات" | "مدير" | "موظف";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatar?: string;
  status: "نشط" | "غير_نشط";
  joinDate: string;
  performance: number;
}

export interface Employee extends User {
  phone?: string;
  salary?: number;
  tasks?: number;
  completedTasks?: number;
}

export type TaskStatus = "جديدة" | "قيد_التنفيذ" | "بانتظار_المراجعة" | "مكتملة" | "متأخرة";
export type TaskPriority = "عاجلة" | "عالية" | "متوسطة" | "منخفضة";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  assigneeName: string;
  assigneeAvatar?: string;
  clientId?: string;
  clientName?: string;
  dueDate: string;
  createdAt: string;
  tags?: string[];
}

export type ClientStatus = "محتمل" | "متعاقد" | "نشط" | "متوقف";
export type PackageType = "صغيرة" | "متوسطة" | "كبيرة";

export interface Client {
  id: string;
  name: string;
  phone: string;
  businessType: string;
  city: string;
  packageType: PackageType;
  contractValue: number;
  status: ClientStatus;
  accountManagerId: string;
  accountManagerName: string;
  notes?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: "دخل" | "مصروف";
  amount: number;
  description: string;
  category: string;
  date: string;
  funds?: FundDistribution;
}

export interface FundDistribution {
  operations: number;
  savings: number;
  taxes: number;
  salaries: number;
  marketing: number;
}

export interface Project {
  id: string;
  name: string;
  clientName: string;
  progress: number;
  budget: number;
  deadline: string;
  status: "قيد_التنفيذ" | "مكتمل" | "متوقف";
  accountManagerName: string;
}

export interface Activity {
  id: string;
  type: "employee" | "task" | "client" | "finance" | "project";
  description: string;
  timestamp: string;
  icon?: string;
}

export interface StrategyPhase {
  id: number;
  title: string;
  description: string;
  progress: number;
  budget: number;
  startDate: string;
  endDate: string;
  targetClients: number;
  currentClients: number;
  goals: string[];
  status: "مكتملة" | "جارية" | "قادمة";
}

export interface KPI {
  label: string;
  value: string | number;
  change: number;
  changeLabel: string;
  icon: string;
  color: string;
}

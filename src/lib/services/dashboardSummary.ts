import type { SupabaseClient } from "@supabase/supabase-js";
import type { Activity, Client, Employee, Project, Task, Transaction } from "@/types";

const READ_LIMITS = {
  clients: 5,
  tasks: 5,
  transactions: 500,
  recentTransactions: 12,
  employees: 200,
  projects: 50,
  activities: 20,
} as const;

const CLIENT_COLUMNS = "id, name, phone, business_type, city, package_type, contract_value, status, account_manager_id, account_manager_name, notes, created_at, client_code";
const TASK_COLUMNS = "id, title, description, status, priority, assignee_id, assignee_name, assignee_avatar, client_id, client_name, due_date, created_at, tags, task_code";
const TRANSACTION_COLUMNS = "id, type, amount, description, category, date, funds";
const EMPLOYEE_COLUMNS = "id, name, email, role, department, status, join_date, performance, phone, tasks, completed_tasks, avatar, salary, employee_code, job_title";
const PROJECT_COLUMNS = "id, name, client_name, progress, budget, deadline, status, account_manager_name";
const ACTIVITY_COLUMNS = "id, type, description, timestamp, icon";

const CLIENT_ACTIVE = "نشط";
const CLIENT_CONTRACTED = "متعاقد";
const CLIENT_POTENTIAL = "محتمل";
const CLIENT_PAUSED = "متوقف";
const TASK_DONE = "مكتملة";
const TASK_OVERDUE = "متأخرة";
const TRANSACTION_INCOME = "دخل";
const TRANSACTION_EXPENSE = "مصروف";
const EMPLOYEE_ACTIVE = "نشط";
const PROJECT_ACTIVE = "قيد_التنفيذ";

export interface DashboardTrendPoint {
  month: string;
  current: number;
  previous: number;
}

export interface DashboardSummary {
  kpi: {
    activeClients: number;
    completedTasksPct: number;
    incompleteTasks: number;
    netProfit: number;
    overdueTasks: number;
  };
  clients: {
    total: number;
    active: number;
    potential: number;
    contracted: number;
    paused: number;
    activeOrContracted: number;
    latest: Client | null;
    latestFive: Client[];
  };
  tasks: {
    total: number;
    completed: number;
    incomplete: number;
    overdue: number;
    latestCompleted: Task | null;
    nearestDeadline: Task | null;
    mostOverdue: Task | null;
    latestFiveCompleted: Task[];
    topFiveIncomplete: Task[];
    topFiveOverdue: Task[];
  };
  finance: {
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    recentTransactions: Transaction[];
    monthlyTrend: DashboardTrendPoint[];
    bounded: boolean;
  };
  employees: {
    total: number;
    active: number;
    activeNames: string[];
    activeByDepartment: { date: string; users: number }[];
  };
  projects: {
    active: number;
    recent: Project[];
  };
  activities: Activity[];
}

function clientFromDB(row: Record<string, unknown>): Client {
  return {
    id:                 row.id              as string,
    name:               row.name            as string,
    phone:              row.phone           as string,
    businessType:       row.business_type   as string,
    city:               row.city            as string,
    packageType:        row.package_type    as Client["packageType"],
    contractValue:      row.contract_value  as number,
    status:             row.status          as Client["status"],
    accountManagerId:   row.account_manager_id   as string,
    accountManagerName: row.account_manager_name as string,
    notes:              row.notes           as string | undefined,
    createdAt:          (row.created_at     as string) ?? "",
    publicCode:         (row.client_code    as string | undefined) || undefined,
  };
}

function taskFromDB(row: Record<string, unknown>): Task {
  return {
    id:              row.id             as string,
    title:           row.title          as string,
    description:     row.description    as string | undefined,
    status:          row.status         as Task["status"],
    priority:        row.priority       as Task["priority"],
    assigneeId:      row.assignee_id    as string,
    assigneeName:    row.assignee_name  as string,
    assigneeAvatar:  row.assignee_avatar as string | undefined,
    clientId:        row.client_id      as string | undefined,
    clientName:      row.client_name    as string | undefined,
    dueDate:         row.due_date       as string,
    createdAt:       (row.created_at    as string) ?? "",
    tags:            row.tags           as string[] | undefined,
    publicCode:      (row.task_code     as string | undefined) || undefined,
  };
}

function employeeFromDB(row: Record<string, unknown>): Employee {
  return {
    id:             row.id              as string,
    name:           row.name            as string,
    email:          row.email           as string,
    role:           row.role            as Employee["role"],
    department:     row.department      as string,
    status:         row.status          as Employee["status"],
    joinDate:       row.join_date       as string,
    performance:    row.performance     as number,
    phone:          row.phone           as string | undefined,
    tasks:          row.tasks           as number | undefined,
    completedTasks: row.completed_tasks as number | undefined,
    avatar:         row.avatar          as string | undefined,
    salary:         row.salary          as number | undefined,
    publicCode:     (row.employee_code  as string | undefined) || undefined,
    jobTitle:       (row.job_title      as string | undefined) || undefined,
  };
}

function projectFromDB(row: Record<string, unknown>): Project {
  return {
    id:                  row.id                   as string,
    name:                row.name                 as string,
    clientName:          row.client_name          as string,
    progress:            row.progress             as number,
    budget:              row.budget               as number,
    deadline:            row.deadline             as string,
    status:              row.status               as Project["status"],
    accountManagerName:  row.account_manager_name as string,
  };
}

function activityFromDB(row: Record<string, unknown>): Activity {
  return {
    id:          row.id          as string,
    type:        row.type        as Activity["type"],
    description: row.description as string,
    timestamp:   row.timestamp   as string,
    icon:        row.icon        as string | undefined,
  };
}

async function countRows(
  client: SupabaseClient,
  table: string,
  apply?: (query: any) => any,
): Promise<number> {
  let query = client.from(table).select("id", { count: "exact", head: true });
  if (apply) query = apply(query);
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function readRows<T>(
  query: any,
  mapper: (row: Record<string, unknown>) => T,
): Promise<T[]> {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map(mapper);
}

function currentDateIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function buildMonthlyTrend(transactions: Transaction[]): DashboardTrendPoint[] {
  const months = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
  const byMonth: Record<number, number> = {};
  transactions
    .filter((t) => t.type === TRANSACTION_INCOME)
    .forEach((t) => {
      const m = new Date(t.date).getMonth();
      if (!isNaN(m)) byMonth[m] = (byMonth[m] ?? 0) + Number(t.amount || 0);
    });
  return months.map((month, i) => ({ month, current: byMonth[i] ?? 0, previous: 0 }));
}

function topDepartments(employees: Employee[]): { date: string; users: number }[] {
  const counts = new Map<string, number>();
  employees
    .filter((e) => e.status === EMPLOYEE_ACTIVE)
    .forEach((e) => counts.set(e.department, (counts.get(e.department) ?? 0) + 1));
  return Array.from(counts.entries())
    .slice(0, 6)
    .map(([date, users]) => ({ date, users }));
}

export async function buildDashboardSummary(client: SupabaseClient): Promise<DashboardSummary> {
  const todayIso = currentDateIso();

  const [
    totalClients,
    activeClients,
    potentialClients,
    contractedClients,
    pausedClients,
    totalTasks,
    completedTasks,
    explicitOverdueTasks,
    pastDueOpenTasks,
    totalEmployees,
    activeEmployees,
    activeProjects,
  ] = await Promise.all([
    countRows(client, "clients"),
    countRows(client, "clients", (q) => q.eq("status", CLIENT_ACTIVE)),
    countRows(client, "clients", (q) => q.eq("status", CLIENT_POTENTIAL)),
    countRows(client, "clients", (q) => q.eq("status", CLIENT_CONTRACTED)),
    countRows(client, "clients", (q) => q.eq("status", CLIENT_PAUSED)),
    countRows(client, "tasks"),
    countRows(client, "tasks", (q) => q.eq("status", TASK_DONE)),
    countRows(client, "tasks", (q) => q.eq("status", TASK_OVERDUE)),
    countRows(client, "tasks", (q) => q.neq("status", TASK_DONE).neq("status", TASK_OVERDUE).lt("due_date", todayIso)),
    countRows(client, "employees"),
    countRows(client, "employees", (q) => q.eq("status", EMPLOYEE_ACTIVE)),
    countRows(client, "projects", (q) => q.eq("status", PROJECT_ACTIVE)),
  ]);

  const [
    latestClients,
    latestCompletedTasks,
    topIncompleteTasks,
    explicitOverdueRows,
    pastDueOpenRows,
    transactions,
    recentTransactions,
    employees,
    projects,
    activities,
  ] = await Promise.all([
    readRows(
      client.from("clients").select(CLIENT_COLUMNS).order("created_at", { ascending: false }).limit(READ_LIMITS.clients),
      clientFromDB,
    ),
    readRows(
      client.from("tasks").select(TASK_COLUMNS).eq("status", TASK_DONE).order("created_at", { ascending: false }).limit(READ_LIMITS.tasks),
      taskFromDB,
    ),
    readRows(
      client.from("tasks").select(TASK_COLUMNS).neq("status", TASK_DONE).order("due_date", { ascending: true }).limit(READ_LIMITS.tasks),
      taskFromDB,
    ),
    readRows(
      client.from("tasks").select(TASK_COLUMNS).eq("status", TASK_OVERDUE).order("due_date", { ascending: true }).limit(READ_LIMITS.tasks),
      taskFromDB,
    ),
    readRows(
      client.from("tasks").select(TASK_COLUMNS).neq("status", TASK_DONE).neq("status", TASK_OVERDUE).lt("due_date", todayIso).order("due_date", { ascending: true }).limit(READ_LIMITS.tasks),
      taskFromDB,
    ),
    readRows(
      client.from("transactions").select(TRANSACTION_COLUMNS).order("created_at", { ascending: false }).limit(READ_LIMITS.transactions),
      (row) => row as unknown as Transaction,
    ),
    readRows(
      client.from("transactions").select(TRANSACTION_COLUMNS).order("created_at", { ascending: false }).limit(READ_LIMITS.recentTransactions),
      (row) => row as unknown as Transaction,
    ),
    readRows(
      client.from("employees").select(EMPLOYEE_COLUMNS).order("created_at", { ascending: false }).limit(READ_LIMITS.employees),
      employeeFromDB,
    ),
    readRows(
      client.from("projects").select(PROJECT_COLUMNS).order("deadline", { ascending: true }).limit(READ_LIMITS.projects),
      projectFromDB,
    ),
    readRows(
      client.from("activities").select(ACTIVITY_COLUMNS).order("timestamp", { ascending: false }).limit(READ_LIMITS.activities),
      activityFromDB,
    ),
  ]);

  const overdueRows = [...explicitOverdueRows, ...pastDueOpenRows]
    .sort((a, b) => (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31"))
    .slice(0, READ_LIMITS.tasks);
  const incompleteTasks = Math.max(0, totalTasks - completedTasks);
  const overdueTasks = explicitOverdueTasks + pastDueOpenTasks;
  const totalIncome = transactions
    .filter((t) => t.type === TRANSACTION_INCOME)
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalExpenses = transactions
    .filter((t) => t.type === TRANSACTION_EXPENSE)
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const completedTasksPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    kpi: {
      activeClients,
      completedTasksPct,
      incompleteTasks,
      netProfit: totalIncome - totalExpenses,
      overdueTasks,
    },
    clients: {
      total: totalClients,
      active: activeClients,
      potential: potentialClients,
      contracted: contractedClients,
      paused: pausedClients,
      activeOrContracted: activeClients + contractedClients,
      latest: latestClients[0] ?? null,
      latestFive: latestClients,
    },
    tasks: {
      total: totalTasks,
      completed: completedTasks,
      incomplete: incompleteTasks,
      overdue: overdueTasks,
      latestCompleted: latestCompletedTasks[0] ?? null,
      nearestDeadline: topIncompleteTasks[0] ?? null,
      mostOverdue: overdueRows[0] ?? null,
      latestFiveCompleted: latestCompletedTasks,
      topFiveIncomplete: topIncompleteTasks,
      topFiveOverdue: overdueRows,
    },
    finance: {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      recentTransactions,
      monthlyTrend: buildMonthlyTrend(transactions),
      bounded: transactions.length === READ_LIMITS.transactions,
    },
    employees: {
      total: totalEmployees,
      active: activeEmployees,
      activeNames: employees.filter((e) => e.status === EMPLOYEE_ACTIVE).slice(0, 3).map((e) => e.name),
      activeByDepartment: topDepartments(employees),
    },
    projects: {
      active: activeProjects,
      recent: projects,
    },
    activities,
  };
}

import { supabase } from "@/lib/supabase";
import type { DashboardMetrics } from "@/types/dashboard";

const COMPLETED = new Set(["completed", "done", "مكتملة"]);
const IN_PROGRESS = new Set(["in_progress", "قيد التنفيذ", "active"]);
const PENDING = new Set(["pending", "معلقة", "todo"]);
const ACTIVE_CLIENT = new Set(["active", "نشط", "active_client"]);
const PAID = new Set(["paid", "مدفوعة"]);

const norm = (v: unknown) => String(v ?? "").trim().toLowerCase();

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [tasksRes, clientsRes, invoicesRes, activityRes] = await Promise.all([
    supabase.from("tasks").select("id, status, due_date"),
    supabase.from("clients").select("id, status"),
    supabase.from("invoices").select("amount, status, issue_date, created_at"),
    supabase.from("activity_logs").select("id, action, entity_type, created_at").order("created_at", { ascending: false }).limit(3),
  ]);

  const tasks = tasksRes.data ?? [];
  const clients = clientsRes.data ?? [];
  const invoices = invoicesRes.data ?? [];
  const recentActivities = activityRes.data ?? [];

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  let completed = 0;
  let inProgress = 0;
  let pending = 0;
  let overdue = 0;

  for (const task of tasks) {
    const status = norm(task.status);
    const dueDate = task.due_date ? new Date(task.due_date) : null;
    const isCompleted = COMPLETED.has(status);

    if (isCompleted) completed += 1;
    if (IN_PROGRESS.has(status)) inProgress += 1;
    if (PENDING.has(status)) pending += 1;

    if (!isCompleted && dueDate && dueDate < today) overdue += 1;
  }

  const totalTasks = tasks.length;
  const remainingTasks = tasks.filter((t) => !COMPLETED.has(norm(t.status))).length;
  const completedTasksRate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

  const activeClients = clients.filter((c) => ACTIVE_CLIENT.has(norm(c.status))).length;

  const monthlySales = invoices.reduce((sum, inv) => {
    const status = norm(inv.status);
    if (!PAID.has(status)) return sum;
    const dateValue = inv.issue_date ?? inv.created_at;
    if (!dateValue) return sum;
    const d = new Date(dateValue);
    if (d.getFullYear() !== currentYear || d.getMonth() !== currentMonth) return sum;
    return sum + Number(inv.amount ?? 0);
  }, 0);

  return {
    completedTasksRate,
    activeClients,
    overdueTasks: overdue,
    remainingTasks,
    totalTasks,
    taskStatusBreakdown: { completed, inProgress, pending, overdue },
    monthlySales,
    customerSatisfaction: null,
    recentActivities,
  };
}

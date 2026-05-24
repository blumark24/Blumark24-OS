import type { Client, Task } from "@/types";

export const lifecycleStages = [
  "عميل جديد",
  "تم التواصل",
  "عرض سعر",
  "تفاوض",
  "بانتظار التوقيع",
  "متعاقد",
  "قيد التنفيذ",
  "مراجعة العميل",
  "مكتمل",
  "متوقف",
  "غير محدد",
] as const;

export const taskStages = ["لم تبدأ", "قيد التنفيذ", "تحتاج مراجعة", "متأخرة", "مكتملة"] as const;

export function mapClientStage(status?: string): (typeof lifecycleStages)[number] {
  const s = String(status ?? "").trim();
  if (!s) return "غير محدد";
  if (["محتمل", "جديد", "new", "lead"].includes(s)) return "عميل جديد";
  if (["تم التواصل", "contacted"].includes(s)) return "تم التواصل";
  if (["عرض سعر", "quotation", "proposal"].includes(s)) return "عرض سعر";
  if (["تفاوض", "negotiation"].includes(s)) return "تفاوض";
  if (["بانتظار التوقيع", "pending_signature"].includes(s)) return "بانتظار التوقيع";
  if (["متعاقد", "contracted"].includes(s)) return "متعاقد";
  if (["نشط", "active", "قيد التنفيذ"].includes(s)) return "قيد التنفيذ";
  if (["مراجعة", "مراجعة العميل", "in_review"].includes(s)) return "مراجعة العميل";
  if (["مكتمل", "completed"].includes(s)) return "مكتمل";
  if (["متوقف", "stopped", "inactive"].includes(s)) return "متوقف";
  return "غير محدد";
}

export function isTaskDelayed(status?: string, dueDate?: string): boolean {
  const s = String(status ?? "");
  if (s === "متأخرة") return true;
  if (s === "مكتملة") return false;
  if (!dueDate) return false;
  const due = new Date(dueDate).getTime();
  if (Number.isNaN(due)) return false;
  return due < Date.now();
}

export function mapTaskStage(status?: string, dueDate?: string): (typeof taskStages)[number] {
  if (isTaskDelayed(status, dueDate)) return "متأخرة";
  const s = String(status ?? "").trim();
  if (s === "قيد_التنفيذ") return "قيد التنفيذ";
  if (s === "بانتظار_المراجعة") return "تحتاج مراجعة";
  if (s === "مكتملة") return "مكتملة";
  return "لم تبدأ";
}

export function buildAgencyInsights(args: {
  delayedTasks: number;
  inExecutionClients: number;
  mostLoadedEmployee: { name: string; tasks: number } | null;
  completedTasks: number;
}): string[] {
  const { delayedTasks, inExecutionClients, mostLoadedEmployee, completedTasks } = args;
  return [
    `يوجد ${delayedTasks} مهام متأخرة تحتاج متابعة.`,
    `يوجد ${inExecutionClients} عميل قيد التنفيذ.`,
    mostLoadedEmployee
      ? `الموظف ${mostLoadedEmployee.name} لديه أعلى ضغط مهام (${mostLoadedEmployee.tasks}).`
      : "لا توجد بيانات كافية لتحديد ضغط المهام.",
    `يوجد ${completedTasks} مهمة مكتملة.`,
  ];
}

export function bucketClients(clients: Client[]) {
  const clientBuckets = lifecycleStages.reduce<Record<string, Client[]>>((acc, stage) => {
    acc[stage] = [];
    return acc;
  }, {});
  clients.forEach((client) => {
    const stage = mapClientStage(client.status);
    clientBuckets[stage].push(client);
  });
  return clientBuckets;
}

export function bucketTasks(tasks: Task[]) {
  const taskBuckets = taskStages.reduce<Record<string, Task[]>>((acc, stage) => {
    acc[stage] = [];
    return acc;
  }, {});
  tasks.forEach((task) => {
    const stage = mapTaskStage(task.status, task.dueDate);
    taskBuckets[stage].push(task);
  });
  return taskBuckets;
}

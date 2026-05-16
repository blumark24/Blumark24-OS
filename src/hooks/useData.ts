"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  getBoardMembers,
  insertBoardMember,
  updateBoardMember,
  deleteBoardMember,
  logActivity,
  createNotification,
} from "@/lib/db";
import { withTimeout, withSoftTimeout } from "@/lib/asyncHelpers";
import type { Client, Task, Transaction, Employee, Project, Activity, StrategyPhase } from "@/types";
import type { BoardMember } from "@/lib/db";

// Timeout constants (ms)
const DB_WRITE_TIMEOUT  = 12_000; // INSERT/UPDATE/DELETE operations
const DB_READ_TIMEOUT   = 15_000; // SELECT / initial fetch
const REFETCH_TIMEOUT   = 6_000;  // post-write refetch (soft — resolves on expiry)

// ─── camelCase ↔ snake_case mappers ──────────────────────────────────────────

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
  };
}

function clientToDB(item: Omit<Client, "id" | "createdAt">): Record<string, unknown> {
  return {
    name:                 item.name,
    phone:                item.phone,
    business_type:        item.businessType,
    city:                 item.city,
    package_type:         item.packageType,
    contract_value:       item.contractValue,
    status:               item.status,
    account_manager_id:   item.accountManagerId,
    account_manager_name: item.accountManagerName,
    notes:                item.notes,
  };
}

function clientUpdateToDB(changes: Partial<Client>): Record<string, unknown> {
  const map: Record<string, unknown> = {};
  if (changes.name               !== undefined) map.name                 = changes.name;
  if (changes.phone              !== undefined) map.phone                = changes.phone;
  if (changes.businessType       !== undefined) map.business_type        = changes.businessType;
  if (changes.city               !== undefined) map.city                 = changes.city;
  if (changes.packageType        !== undefined) map.package_type         = changes.packageType;
  if (changes.contractValue      !== undefined) map.contract_value       = changes.contractValue;
  if (changes.status             !== undefined) map.status               = changes.status;
  if (changes.accountManagerId   !== undefined) map.account_manager_id   = changes.accountManagerId;
  if (changes.accountManagerName !== undefined) map.account_manager_name = changes.accountManagerName;
  if (changes.notes              !== undefined) map.notes                = changes.notes;
  return map;
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
  };
}

function taskToDB(item: Omit<Task, "id" | "createdAt">): Record<string, unknown> {
  return {
    title:           item.title,
    description:     item.description,
    status:          item.status,
    priority:        item.priority,
    assignee_id:     item.assigneeId,
    assignee_name:   item.assigneeName,
    assignee_avatar: item.assigneeAvatar,
    client_id:       item.clientId,
    client_name:     item.clientName,
    due_date:        item.dueDate,
    tags:            item.tags,
  };
}

function taskUpdateToDB(changes: Partial<Task>): Record<string, unknown> {
  const map: Record<string, unknown> = {};
  if (changes.title          !== undefined) map.title           = changes.title;
  if (changes.description    !== undefined) map.description     = changes.description;
  if (changes.status         !== undefined) map.status          = changes.status;
  if (changes.priority       !== undefined) map.priority        = changes.priority;
  if (changes.assigneeId     !== undefined) map.assignee_id     = changes.assigneeId;
  if (changes.assigneeName   !== undefined) map.assignee_name   = changes.assigneeName;
  if (changes.assigneeAvatar !== undefined) map.assignee_avatar = changes.assigneeAvatar;
  if (changes.clientId       !== undefined) map.client_id       = changes.clientId;
  if (changes.clientName     !== undefined) map.client_name     = changes.clientName;
  if (changes.dueDate        !== undefined) map.due_date        = changes.dueDate;
  if (changes.tags           !== undefined) map.tags            = changes.tags;
  return map;
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
  };
}

function employeeToDB(item: Omit<Employee, "id">): Record<string, unknown> {
  return {
    name:            item.name,
    email:           item.email,
    role:            item.role,
    department:      item.department,
    status:          item.status,
    join_date:       item.joinDate,
    performance:     item.performance,
    phone:           item.phone,
    tasks:           item.tasks ?? 0,
    completed_tasks: item.completedTasks ?? 0,
    avatar:          item.avatar,
    salary:          item.salary,
  };
}

function employeeUpdateToDB(changes: Partial<Employee>): Record<string, unknown> {
  const map: Record<string, unknown> = {};
  if (changes.name           !== undefined) map.name            = changes.name;
  if (changes.email          !== undefined) map.email           = changes.email;
  if (changes.role           !== undefined) map.role            = changes.role;
  if (changes.department     !== undefined) map.department      = changes.department;
  if (changes.status         !== undefined) map.status          = changes.status;
  if (changes.joinDate       !== undefined) map.join_date       = changes.joinDate;
  if (changes.performance    !== undefined) map.performance     = changes.performance;
  if (changes.phone          !== undefined) map.phone           = changes.phone;
  if (changes.tasks          !== undefined) map.tasks           = changes.tasks;
  if (changes.completedTasks !== undefined) map.completed_tasks = changes.completedTasks;
  if (changes.avatar         !== undefined) map.avatar          = changes.avatar;
  if (changes.salary         !== undefined) map.salary          = changes.salary;
  return map;
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

// ─── Generic async hook ───────────────────────────────────────────────────────

function useAsyncData<T>(fetcher: () => Promise<T>, fallback: T) {
  const [data, setData]       = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  // Track whether at least one successful fetch has completed.
  // On the very first load we clear to fallback on error so the empty-state UI
  // shows correctly.  On subsequent refetches (e.g. after a write) we keep the
  // existing data so optimistic entries are never wiped by a transient timeout.
  const hasLoaded = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await withTimeout(fetcher(), DB_READ_TIMEOUT, "انتهت مهلة تحميل البيانات — تحقق من الاتصال");
      setData(result);
      hasLoaded.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ في تحميل البيانات");
      // Only reset to empty fallback on the very first load.
      // On refetch failures, keep existing data so optimistic UI is preserved.
      if (!hasLoaded.current) {
        setData(fallback);
      }
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  // Refetch when a session becomes available (handles the case where RLS
  // returns empty results because the component mounted before auth resolved)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) load();
    });
    return () => subscription.unsubscribe();
  }, [load]);

  return { data, setData, loading, error, refetch: load };
}

// ─── Clients ──────────────────────────────────────────────────────────────────

async function fetchClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map(clientFromDB);
}

export function useClients() {
  const result = useAsyncData<Client[]>(fetchClients, []);
  const { setData, refetch } = result;

  useEffect(() => {
    const ch = supabase
      .channel("clients-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "clients" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch]);

  const insert = useCallback(async (item: Omit<Client, "id" | "createdAt">) => {
    const { error } = await withTimeout(
      Promise.resolve(supabase.from("clients").insert([clientToDB(item)])),
      DB_WRITE_TIMEOUT, "انتهت مهلة إضافة العميل"
    );
    if (error) throw new Error(error.message);
    // Soft-timeout refetch so a slow DB doesn't block the save response
    await withSoftTimeout(refetch(), REFETCH_TIMEOUT);
    logActivity("client", `تمت إضافة عميل جديد: ${item.name}`, "👤");
    createNotification("client_followup", "عميل جديد", `تمت إضافة العميل ${item.name}`, "/clients");
  }, [refetch]);

  const update = useCallback(async (id: string, changes: Partial<Client>) => {
    const { error } = await withTimeout(
      Promise.resolve(supabase.from("clients").update(clientUpdateToDB(changes)).eq("id", id)),
      DB_WRITE_TIMEOUT, "انتهت مهلة تحديث العميل"
    );
    if (error) throw new Error(error.message);
    await withSoftTimeout(refetch(), REFETCH_TIMEOUT);
    logActivity("client", `تم تحديث بيانات العميل`, "✏️");
  }, [refetch]);

  const remove = useCallback(async (id: string) => {
    const { error } = await withTimeout(
      Promise.resolve(supabase.from("clients").delete().eq("id", id)),
      DB_WRITE_TIMEOUT, "انتهت مهلة حذف العميل"
    );
    if (error) throw new Error(error.message);
    await withSoftTimeout(refetch(), REFETCH_TIMEOUT);
    logActivity("client", `تم حذف عميل`, "🗑️");
  }, [refetch]);

  return { ...result, insert, update, remove };
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map(taskFromDB);
}

export function useTasks() {
  const result = useAsyncData<Task[]>(fetchTasks, []);
  const { refetch } = result;

  useEffect(() => {
    const ch = supabase
      .channel("tasks-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch]);

  const insert = useCallback(async (item: Omit<Task, "id" | "createdAt">) => {
    const { error } = await withTimeout(
      Promise.resolve(supabase.from("tasks").insert([taskToDB(item)])),
      DB_WRITE_TIMEOUT, "انتهت مهلة إضافة المهمة"
    );
    if (error) throw new Error(error.message);
    await withSoftTimeout(refetch(), REFETCH_TIMEOUT);
    logActivity("task", `تمت إضافة مهمة جديدة: ${item.title}`, "✅");
    createNotification("task_due", "مهمة جديدة", `تمت إضافة المهمة: ${item.title}`, "/tasks");
  }, [refetch]);

  const update = useCallback(async (id: string, changes: Partial<Task>) => {
    const { error } = await withTimeout(
      Promise.resolve(supabase.from("tasks").update(taskUpdateToDB(changes)).eq("id", id)),
      DB_WRITE_TIMEOUT, "انتهت مهلة تحديث المهمة"
    );
    if (error) throw new Error(error.message);
    await withSoftTimeout(refetch(), REFETCH_TIMEOUT);
    logActivity("task", `تم تحديث حالة المهمة${changes.status ? `: ${changes.status}` : ""}`, "🔄");
  }, [refetch]);

  const remove = useCallback(async (id: string) => {
    const { error } = await withTimeout(
      Promise.resolve(supabase.from("tasks").delete().eq("id", id)),
      DB_WRITE_TIMEOUT, "انتهت مهلة حذف المهمة"
    );
    if (error) throw new Error(error.message);
    await withSoftTimeout(refetch(), REFETCH_TIMEOUT);
    logActivity("task", `تم حذف مهمة`, "🗑️");
  }, [refetch]);

  return { ...result, insert, update, remove };
}

// ─── Transactions ─────────────────────────────────────────────────────────────

async function fetchTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Transaction[];
}

export function useTransactions() {
  const result = useAsyncData<Transaction[]>(fetchTransactions, []);
  const { refetch } = result;

  useEffect(() => {
    const ch = supabase
      .channel("transactions-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch]);

  const insert = useCallback(async (item: Omit<Transaction, "id">) => {
    const { error } = await withTimeout(
      Promise.resolve(supabase.from("transactions").insert([item])),
      DB_WRITE_TIMEOUT, "انتهت مهلة إضافة المعاملة"
    );
    if (error) throw new Error(error.message);
    await withSoftTimeout(refetch(), REFETCH_TIMEOUT);
    logActivity("finance", `${item.type === "دخل" ? "دخل" : "مصروف"} جديد: ${item.description} (${item.amount} SAR)`, item.type === "دخل" ? "💰" : "💸");
    createNotification("invoice_due", "معاملة مالية جديدة", `${item.type}: ${item.description} — ${item.amount} SAR`, "/finance");
  }, [refetch]);

  const update = useCallback(async (id: string, changes: Partial<Omit<Transaction, "id">>) => {
    const { error } = await withTimeout(
      Promise.resolve(supabase.from("transactions").update(changes).eq("id", id)),
      DB_WRITE_TIMEOUT, "انتهت مهلة تحديث المعاملة"
    );
    if (error) throw new Error(error.message);
    await withSoftTimeout(refetch(), REFETCH_TIMEOUT);
    logActivity("finance", "تم تحديث معاملة مالية", "✏️");
  }, [refetch]);

  const remove = useCallback(async (id: string) => {
    const { error } = await withTimeout(
      Promise.resolve(supabase.from("transactions").delete().eq("id", id)),
      DB_WRITE_TIMEOUT, "انتهت مهلة حذف المعاملة"
    );
    if (error) throw new Error(error.message);
    await withSoftTimeout(refetch(), REFETCH_TIMEOUT);
    logActivity("finance", "تم حذف معاملة مالية", "🗑️");
  }, [refetch]);

  return { ...result, insert, update, remove };
}

// ─── Employees ────────────────────────────────────────────────────────────────

async function fetchEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map(employeeFromDB);
}

export function useEmployees() {
  const result = useAsyncData<Employee[]>(fetchEmployees, []);
  const { refetch } = result;

  useEffect(() => {
    const ch = supabase
      .channel("employees-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "employees" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch]);

  const insert = useCallback(async (item: Omit<Employee, "id">) => {
    const { error } = await withTimeout(
      Promise.resolve(supabase.from("employees").insert([employeeToDB(item)])),
      DB_WRITE_TIMEOUT, "انتهت مهلة إضافة الموظف"
    );
    if (error) throw new Error(error.message);
    await withSoftTimeout(refetch(), REFETCH_TIMEOUT);
    logActivity("employee", `تمت إضافة موظف جديد: ${item.name}`, "👥");
  }, [refetch]);

  const update = useCallback(async (id: string, changes: Partial<Employee>) => {
    const { error } = await withTimeout(
      Promise.resolve(supabase.from("employees").update(employeeUpdateToDB(changes)).eq("id", id)),
      DB_WRITE_TIMEOUT, "انتهت مهلة تحديث الموظف"
    );
    if (error) throw new Error(error.message);
    await withSoftTimeout(refetch(), REFETCH_TIMEOUT);
    logActivity("employee", "تم تحديث بيانات موظف", "✏️");
  }, [refetch]);

  const remove = useCallback(async (id: string) => {
    const { error } = await withTimeout(
      Promise.resolve(supabase.from("employees").delete().eq("id", id)),
      DB_WRITE_TIMEOUT, "انتهت مهلة حذف الموظف"
    );
    if (error) throw new Error(error.message);
    await withSoftTimeout(refetch(), REFETCH_TIMEOUT);
    logActivity("employee", "تم حذف موظف", "🗑️");
  }, [refetch]);

  return { ...result, insert, update, remove };
}

// ─── Projects ─────────────────────────────────────────────────────────────────

async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("deadline", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map(projectFromDB);
}

export function useProjects() {
  return useAsyncData<Project[]>(fetchProjects, []);
}

// ─── Activities ───────────────────────────────────────────────────────────────

async function fetchActivities(): Promise<Activity[]> {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(10);
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map(activityFromDB);
}

export function useActivities() {
  return useAsyncData<Activity[]>(fetchActivities, []);
}

// ─── Board Members ────────────────────────────────────────────────────────────

export function useBoardMembers() {
  const result = useAsyncData<BoardMember[]>(getBoardMembers, []);
  const { refetch } = result;

  useEffect(() => {
    const ch = supabase
      .channel("board-members-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "board_members" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch]);

  const insert = useCallback(async (item: Omit<BoardMember, "id">) => {
    const newMember = await withTimeout(insertBoardMember(item), DB_WRITE_TIMEOUT, "انتهت مهلة إضافة عضو مجلس الإدارة");
    await withSoftTimeout(refetch(), REFETCH_TIMEOUT);
    logActivity("employee", `تمت إضافة عضو مجلس: ${item.name}`, "🏛️");
    return newMember;
  }, [refetch]);

  const update = useCallback(async (id: string, changes: Partial<Omit<BoardMember, "id">>) => {
    await withTimeout(updateBoardMember(id, changes), DB_WRITE_TIMEOUT, "انتهت مهلة تحديث عضو مجلس الإدارة");
    await withSoftTimeout(refetch(), REFETCH_TIMEOUT);
  }, [refetch]);

  const remove = useCallback(async (id: string) => {
    await withTimeout(deleteBoardMember(id), DB_WRITE_TIMEOUT, "انتهت مهلة حذف عضو مجلس الإدارة");
    await withSoftTimeout(refetch(), REFETCH_TIMEOUT);
  }, [refetch]);

  return { ...result, insert, update, remove };
}

// ─── Strategy Phases ─────────────────────────────────────────────────────────

function strategyPhaseFromDB(row: Record<string, unknown>): StrategyPhase {
  return {
    id:             row.id              as number,
    title:          row.title           as string,
    description:    row.description     as string,
    progress:       row.progress        as number,
    budget:         row.budget          as number,
    startDate:      row.start_date      as string,
    endDate:        row.end_date        as string,
    targetClients:  row.target_clients  as number,
    currentClients: row.current_clients as number,
    goals:          (row.goals          as string[]) ?? [],
    status:         row.status          as StrategyPhase["status"],
  };
}

function strategyPhaseUpdateToDB(changes: Partial<StrategyPhase>): Record<string, unknown> {
  const map: Record<string, unknown> = {};
  if (changes.title          !== undefined) map.title           = changes.title;
  if (changes.description    !== undefined) map.description     = changes.description;
  if (changes.progress       !== undefined) map.progress        = changes.progress;
  if (changes.budget         !== undefined) map.budget          = changes.budget;
  if (changes.startDate      !== undefined) map.start_date      = changes.startDate;
  if (changes.endDate        !== undefined) map.end_date        = changes.endDate;
  if (changes.targetClients  !== undefined) map.target_clients  = changes.targetClients;
  if (changes.currentClients !== undefined) map.current_clients = changes.currentClients;
  if (changes.goals          !== undefined) map.goals           = changes.goals;
  if (changes.status         !== undefined) map.status          = changes.status;
  map.updated_at = new Date().toISOString();
  return map;
}

async function fetchStrategyPhases(): Promise<StrategyPhase[]> {
  // Try ordering by sort_order; fall back to id if column doesn't exist yet
  const { data, error } = await supabase
    .from("strategy_phases")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    if (error.message.includes("sort_order")) {
      const { data: fallback, error: fallbackError } = await supabase
        .from("strategy_phases")
        .select("*")
        .order("id", { ascending: true });
      if (fallbackError) throw new Error(fallbackError.message);
      return ((fallback ?? []) as Record<string, unknown>[]).map(strategyPhaseFromDB);
    }
    throw new Error(error.message);
  }
  return ((data ?? []) as Record<string, unknown>[]).map(strategyPhaseFromDB);
}

export function useStrategyPhases() {
  const result = useAsyncData<StrategyPhase[]>(fetchStrategyPhases, []);
  const { refetch } = result;

  useEffect(() => {
    const ch = supabase
      .channel("strategy-phases-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "strategy_phases" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch]);

  const update = useCallback(async (id: number, changes: Partial<StrategyPhase>) => {
    const { error } = await withTimeout(
      Promise.resolve(supabase.from("strategy_phases").update(strategyPhaseUpdateToDB(changes)).eq("id", id)),
      DB_WRITE_TIMEOUT, "انتهت مهلة تحديث المرحلة"
    );
    if (error) throw new Error(error.message);
    await withSoftTimeout(refetch(), REFETCH_TIMEOUT);
  }, [refetch]);

  return { ...result, update };
}

// ─── Dashboard KPI ────────────────────────────────────────────────────────────

export interface DashboardKPI {
  activeClients: number;
  completedTasksPct: number;
  incompleteTasks: number;
  netProfit: number;
}

export function useDashboardKPI() {
  const [kpi, setKpi]         = useState<DashboardKPI>({ activeClients: 0, completedTasksPct: 0, incompleteTasks: 0, netProfit: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const compute = useCallback(async () => {
    try {
      const [clients, tasks, transactions] = await Promise.all([
        fetchClients(),
        fetchTasks(),
        fetchTransactions(),
      ]);

      const activeClients     = clients.filter((c) => c.status === "نشط").length;
      const completed         = tasks.filter((t) => t.status === "مكتملة").length;
      const completedTasksPct = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
      const incompleteTasks   = tasks.filter((t) => t.status !== "مكتملة").length;
      const totalIncome       = transactions.filter((t) => t.type === "دخل").reduce((s, t) => s + t.amount, 0);
      const totalExpense      = transactions.filter((t) => t.type === "مصروف").reduce((s, t) => s + t.amount, 0);

      setKpi({ activeClients, completedTasksPct, incompleteTasks, netProfit: totalIncome - totalExpense });
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { compute(); }, [compute]);

  useEffect(() => {
    const ch = supabase
      .channel("kpi-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "clients" },      () => compute())
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" },        () => compute())
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => compute())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [compute]);

  return { kpi, loading, error };
}

// ─── Automations ──────────────────────────────────────────────────────────────

export interface AutomationRecord {
  id:        string;
  title:     string;
  enabled:   boolean;
  lastRun:   string | null;
  runCount:  number;
}

function automationFromDB(row: Record<string, unknown>): AutomationRecord {
  return {
    id:       row.id       as string,
    title:    row.title    as string,
    enabled:  row.enabled  as boolean,
    lastRun:  row.last_run as string | null,
    runCount: row.run_count as number,
  };
}

async function fetchAutomations(): Promise<AutomationRecord[]> {
  const { data, error } = await supabase
    .from("automations")
    .select("*")
    .order("id");
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map(automationFromDB);
}

export function useAutomations() {
  const result = useAsyncData<AutomationRecord[]>(fetchAutomations, []);
  const { refetch } = result;

  useEffect(() => {
    const ch = supabase
      .channel("automations-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "automations" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch]);

  const toggle = useCallback(async (id: string, enabled: boolean) => {
    const { error } = await withTimeout(
      Promise.resolve(supabase.from("automations").update({ enabled, updated_at: new Date().toISOString() }).eq("id", id)),
      DB_WRITE_TIMEOUT, "انتهت مهلة تحديث الأتمتة"
    );
    if (error) throw new Error(error.message);
    await withSoftTimeout(refetch(), REFETCH_TIMEOUT);
  }, [refetch]);

  const updateRunStats = useCallback(async (id: string, currentCount: number, logEntry: { rule_title: string; result: string; status: "success" | "warning" | "error" }) => {
    const { error } = await withTimeout(
      Promise.resolve(supabase.from("automations").update({
        last_run: new Date().toISOString(),
        run_count: currentCount + 1,
        updated_at: new Date().toISOString(),
      }).eq("id", id)),
      DB_WRITE_TIMEOUT, "انتهت مهلة تسجيل الأتمتة"
    );
    if (error) throw new Error(error.message);
    // Log entry is fire-and-forget — don't block on it
    supabase.from("automation_logs").insert([{
      rule_id:    id,
      rule_title: logEntry.rule_title,
      result:     logEntry.result,
      status:     logEntry.status,
    }]);
    await withSoftTimeout(refetch(), REFETCH_TIMEOUT);
  }, [refetch]);

  return { ...result, toggle, updateRunStats };
}

// ─── Automation Logs ──────────────────────────────────────────────────────────

export interface AutomationLog {
  id:        string;
  ruleId:    string;
  ruleTitle: string;
  result:    string;
  status:    "success" | "warning" | "error";
  createdAt: string;
}

async function fetchAutomationLogs(): Promise<AutomationLog[]> {
  const { data, error } = await supabase
    .from("automation_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    id:        row.id         as string,
    ruleId:    row.rule_id    as string,
    ruleTitle: row.rule_title as string,
    result:    row.result     as string,
    status:    row.status     as "success" | "warning" | "error",
    createdAt: row.created_at as string,
  }));
}

export function useAutomationLogs() {
  const result = useAsyncData<AutomationLog[]>(fetchAutomationLogs, []);
  const { refetch } = result;

  useEffect(() => {
    const ch = supabase
      .channel("auto-logs-rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "automation_logs" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch]);

  return result;
}

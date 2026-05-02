"use client";

import { useState, useEffect, useCallback } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import {
  mockClients,
  mockTasks,
  mockTransactions,
  mockEmployees,
  mockProjects,
  mockActivities,
} from "@/lib/mockData";
import {
  getBoardMembers,
  insertBoardMember,
  updateBoardMember,
  deleteBoardMember,
  DEFAULT_BOARD,
} from "@/lib/db";
import type { Client, Task, Transaction, Employee, Project, Activity } from "@/types";
import type { BoardMember } from "@/lib/db";

// ─── camelCase ↔ snake_case mappers ──────────────────────────────────────────

// Client
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
    created_at:           new Date().toISOString(),
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

// Task
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
    created_at:      new Date().toISOString(),
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

// Employee
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

// Project
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

// Activity
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
  const [data, setData]     = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ في تحميل البيانات");
      setData(fallback);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  return { data, setData, loading, error, refetch: load };
}

// ─── Clients ──────────────────────────────────────────────────────────────────

async function fetchClients(): Promise<Client[]> {
  if (!isSupabaseConfigured) {
    await new Promise((r) => setTimeout(r, 300));
    return mockClients;
  }
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map(clientFromDB);
}

export function useClients() {
  const result = useAsyncData<Client[]>(fetchClients, isSupabaseConfigured ? [] : mockClients);
  const { setData, refetch } = result;

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const ch = supabase
      .channel("clients-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "clients" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch]);

  const insert = useCallback(async (item: Omit<Client, "id" | "createdAt">) => {
    if (!isSupabaseConfigured) {
      setData((prev) => [{ id: String(Date.now()), createdAt: new Date().toISOString(), ...item }, ...prev]);
      return;
    }
    const { error } = await supabase.from("clients").insert([clientToDB(item)]);
    if (error) throw new Error(error.message);
    await refetch();
  }, [setData, refetch]);

  const update = useCallback(async (id: string, changes: Partial<Client>) => {
    if (!isSupabaseConfigured) {
      setData((prev) => prev.map((c) => c.id === id ? { ...c, ...changes } : c));
      return;
    }
    const { error } = await supabase.from("clients").update(clientUpdateToDB(changes)).eq("id", id);
    if (error) throw new Error(error.message);
    await refetch();
  }, [setData, refetch]);

  const remove = useCallback(async (id: string) => {
    if (!isSupabaseConfigured) {
      setData((prev) => prev.filter((c) => c.id !== id));
      return;
    }
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await refetch();
  }, [setData, refetch]);

  return { ...result, insert, update, remove };
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

async function fetchTasks(): Promise<Task[]> {
  if (!isSupabaseConfigured) {
    await new Promise((r) => setTimeout(r, 300));
    return mockTasks;
  }
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map(taskFromDB);
}

export function useTasks() {
  const result = useAsyncData<Task[]>(fetchTasks, isSupabaseConfigured ? [] : mockTasks);
  const { setData, refetch } = result;

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const ch = supabase
      .channel("tasks-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch]);

  const insert = useCallback(async (item: Omit<Task, "id" | "createdAt">) => {
    if (!isSupabaseConfigured) {
      setData((prev) => [{ id: String(Date.now()), createdAt: new Date().toISOString(), ...item }, ...prev]);
      return;
    }
    const { error } = await supabase.from("tasks").insert([taskToDB(item)]);
    if (error) throw new Error(error.message);
    await refetch();
  }, [setData, refetch]);

  const update = useCallback(async (id: string, changes: Partial<Task>) => {
    if (!isSupabaseConfigured) {
      setData((prev) => prev.map((t) => t.id === id ? { ...t, ...changes } : t));
      return;
    }
    const { error } = await supabase.from("tasks").update(taskUpdateToDB(changes)).eq("id", id);
    if (error) throw new Error(error.message);
    await refetch();
  }, [setData, refetch]);

  const remove = useCallback(async (id: string) => {
    if (!isSupabaseConfigured) {
      setData((prev) => prev.filter((t) => t.id !== id));
      return;
    }
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await refetch();
  }, [setData, refetch]);

  return { ...result, insert, update, remove };
}

// ─── Transactions ─────────────────────────────────────────────────────────────

async function fetchTransactions(): Promise<Transaction[]> {
  if (!isSupabaseConfigured) {
    await new Promise((r) => setTimeout(r, 300));
    return mockTransactions;
  }
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  // Transaction columns all match camelCase already (type, amount, description, category, date, funds)
  return (data ?? []) as Transaction[];
}

export function useTransactions() {
  const result = useAsyncData<Transaction[]>(fetchTransactions, isSupabaseConfigured ? [] : mockTransactions);
  const { setData, refetch } = result;

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const ch = supabase
      .channel("transactions-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch]);

  const insert = useCallback(async (item: Omit<Transaction, "id">) => {
    if (!isSupabaseConfigured) {
      setData((prev) => [{ id: String(Date.now()), ...item }, ...prev]);
      return;
    }
    const { error } = await supabase.from("transactions").insert([item]);
    if (error) throw new Error(error.message);
    await refetch();
  }, [setData, refetch]);

  return { ...result, insert };
}

// ─── Employees ────────────────────────────────────────────────────────────────

async function fetchEmployees(): Promise<Employee[]> {
  if (!isSupabaseConfigured) {
    await new Promise((r) => setTimeout(r, 300));
    return mockEmployees;
  }
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map(employeeFromDB);
}

export function useEmployees() {
  const result = useAsyncData<Employee[]>(fetchEmployees, isSupabaseConfigured ? [] : mockEmployees);
  const { setData, refetch } = result;

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const ch = supabase
      .channel("employees-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "employees" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch]);

  const insert = useCallback(async (item: Omit<Employee, "id">) => {
    if (!isSupabaseConfigured) {
      setData((prev) => [{ id: String(Date.now()), ...item }, ...prev]);
      return;
    }
    const { error } = await supabase.from("employees").insert([employeeToDB(item)]);
    if (error) throw new Error(error.message);
    await refetch();
  }, [setData, refetch]);

  const update = useCallback(async (id: string, changes: Partial<Employee>) => {
    if (!isSupabaseConfigured) {
      setData((prev) => prev.map((e) => e.id === id ? { ...e, ...changes } : e));
      return;
    }
    const { error } = await supabase.from("employees").update(employeeUpdateToDB(changes)).eq("id", id);
    if (error) throw new Error(error.message);
    await refetch();
  }, [setData, refetch]);

  const remove = useCallback(async (id: string) => {
    if (!isSupabaseConfigured) {
      setData((prev) => prev.filter((e) => e.id !== id));
      return;
    }
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await refetch();
  }, [setData, refetch]);

  return { ...result, insert, update, remove };
}

// ─── Projects ─────────────────────────────────────────────────────────────────

async function fetchProjects(): Promise<Project[]> {
  if (!isSupabaseConfigured) {
    await new Promise((r) => setTimeout(r, 300));
    return mockProjects;
  }
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("deadline", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map(projectFromDB);
}

export function useProjects() {
  return useAsyncData(fetchProjects, isSupabaseConfigured ? [] : mockProjects);
}

// ─── Activities ───────────────────────────────────────────────────────────────

async function fetchActivities(): Promise<Activity[]> {
  if (!isSupabaseConfigured) {
    await new Promise((r) => setTimeout(r, 300));
    return mockActivities;
  }
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(10);
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map(activityFromDB);
}

export function useActivities() {
  return useAsyncData(fetchActivities, isSupabaseConfigured ? [] : mockActivities);
}

// ─── Board Members ────────────────────────────────────────────────────────────

export function useBoardMembers() {
  const result = useAsyncData<BoardMember[]>(getBoardMembers, DEFAULT_BOARD);
  const { setData, refetch } = result;

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const ch = supabase
      .channel("board-members-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "board_members" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch]);

  const insert = useCallback(async (item: Omit<BoardMember, "id">) => {
    if (!isSupabaseConfigured) {
      const newItem: BoardMember = { id: String(Date.now()), ...item };
      setData((prev) => [...prev, newItem]);
      return newItem;
    }
    const newMember = await insertBoardMember(item);
    await refetch();
    return newMember;
  }, [setData, refetch]);

  const update = useCallback(async (id: string, changes: Partial<Omit<BoardMember, "id">>) => {
    if (!isSupabaseConfigured) {
      setData((prev) => prev.map((m) => m.id === id ? { ...m, ...changes } : m));
      return;
    }
    await updateBoardMember(id, changes);
    await refetch();
  }, [setData, refetch]);

  const remove = useCallback(async (id: string) => {
    if (!isSupabaseConfigured) {
      setData((prev) => prev.filter((m) => m.id !== id));
      return;
    }
    await deleteBoardMember(id);
    await refetch();
  }, [setData, refetch]);

  return { ...result, insert, update, remove };
}

// ─── Dashboard KPI aggregation ────────────────────────────────────────────────

export interface DashboardKPI {
  activeClients: number;
  completedTasksPct: number;
  incompleteTasks: number;
  netProfit: number;
}

export function useDashboardKPI() {
  const [kpi, setKpi]     = useState<DashboardKPI>({ activeClients: 0, completedTasksPct: 0, incompleteTasks: 0, netProfit: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const compute = useCallback(async () => {
    try {
      const [clients, tasks, transactions] = await Promise.all([
        fetchClients(),
        fetchTasks(),
        fetchTransactions(),
      ]);

      const activeClients      = clients.filter((c) => c.status === "نشط").length;
      const completed          = tasks.filter((t) => t.status === "مكتملة").length;
      const completedTasksPct  = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
      const incompleteTasks    = tasks.filter((t) => t.status !== "مكتملة").length;
      const totalIncome        = transactions.filter((t) => t.type === "دخل").reduce((s, t) => s + t.amount, 0);
      const totalExpense       = transactions.filter((t) => t.type === "مصروف").reduce((s, t) => s + t.amount, 0);

      setKpi({ activeClients, completedTasksPct, incompleteTasks, netProfit: totalIncome - totalExpense });
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { compute(); }, [compute]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
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

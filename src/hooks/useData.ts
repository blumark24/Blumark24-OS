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

// ─── Generic async hook ───────────────────────────────────────────────────────

function useAsyncData<T>(fetcher: () => Promise<T>, fallback: T) {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    load();
  }, [load]);

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
  return (data ?? []) as Client[];
}

export function useClients() {
  const result = useAsyncData<Client[]>(fetchClients, mockClients);
  const { setData, refetch } = result;

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const channel = supabase
      .channel("clients-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "clients" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refetch]);

  const insert = useCallback(async (item: Omit<Client, "id" | "createdAt">) => {
    if (!isSupabaseConfigured) {
      const newItem: Client = { id: String(Date.now()), createdAt: new Date().toISOString(), ...item };
      setData((prev) => [newItem, ...prev]);
      return;
    }
    const { error } = await supabase.from("clients").insert([{ ...item, created_at: new Date().toISOString() }]);
    if (error) throw new Error(error.message);
    await refetch();
  }, [setData, refetch]);

  const update = useCallback(async (id: string, changes: Partial<Client>) => {
    if (!isSupabaseConfigured) {
      setData((prev) => prev.map((c) => c.id === id ? { ...c, ...changes } : c));
      return;
    }
    const { error } = await supabase.from("clients").update(changes).eq("id", id);
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
  return (data ?? []) as Task[];
}

export function useTasks() {
  const result = useAsyncData<Task[]>(fetchTasks, mockTasks);
  const { setData, refetch } = result;

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const channel = supabase
      .channel("tasks-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refetch]);

  const insert = useCallback(async (item: Omit<Task, "id" | "createdAt">) => {
    if (!isSupabaseConfigured) {
      const newItem: Task = { id: String(Date.now()), createdAt: new Date().toISOString(), ...item };
      setData((prev) => [newItem, ...prev]);
      return;
    }
    const { error } = await supabase.from("tasks").insert([{ ...item, created_at: new Date().toISOString() }]);
    if (error) throw new Error(error.message);
    await refetch();
  }, [setData, refetch]);

  const update = useCallback(async (id: string, changes: Partial<Task>) => {
    if (!isSupabaseConfigured) {
      setData((prev) => prev.map((t) => t.id === id ? { ...t, ...changes } : t));
      return;
    }
    const { error } = await supabase.from("tasks").update(changes).eq("id", id);
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
    .order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Transaction[];
}

export function useTransactions() {
  const result = useAsyncData<Transaction[]>(fetchTransactions, mockTransactions);
  const { setData, refetch } = result;

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const channel = supabase
      .channel("transactions-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refetch]);

  const insert = useCallback(async (item: Omit<Transaction, "id">) => {
    if (!isSupabaseConfigured) {
      const newItem: Transaction = { id: String(Date.now()), ...item };
      setData((prev) => [newItem, ...prev]);
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
    .order("join_date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Employee[];
}

export function useEmployees() {
  const result = useAsyncData<Employee[]>(fetchEmployees, mockEmployees);
  const { setData, refetch } = result;

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const channel = supabase
      .channel("employees-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "employees" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refetch]);

  const insert = useCallback(async (item: Omit<Employee, "id">) => {
    if (!isSupabaseConfigured) {
      const newItem: Employee = { id: String(Date.now()), ...item };
      setData((prev) => [newItem, ...prev]);
      return;
    }
    const { error } = await supabase.from("employees").insert([{ ...item, join_date: item.joinDate }]);
    if (error) throw new Error(error.message);
    await refetch();
  }, [setData, refetch]);

  const update = useCallback(async (id: string, changes: Partial<Employee>) => {
    if (!isSupabaseConfigured) {
      setData((prev) => prev.map((e) => e.id === id ? { ...e, ...changes } : e));
      return;
    }
    const { error } = await supabase.from("employees").update(changes).eq("id", id);
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
  return (data ?? []) as Project[];
}

export function useProjects() {
  return useAsyncData(fetchProjects, mockProjects);
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
  return (data ?? []) as Activity[];
}

export function useActivities() {
  return useAsyncData(fetchActivities, mockActivities);
}

// ─── Board Members ────────────────────────────────────────────────────────────

export function useBoardMembers() {
  const result = useAsyncData<BoardMember[]>(getBoardMembers, DEFAULT_BOARD);
  const { setData, refetch } = result;

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const channel = supabase
      .channel("board-members-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "board_members" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
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
  const [kpi, setKpi] = useState<DashboardKPI>({
    activeClients: 0,
    completedTasksPct: 0,
    incompleteTasks: 0,
    netProfit: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const compute = useCallback(async () => {
    try {
      const [clients, tasks, transactions] = await Promise.all([
        fetchClients(),
        fetchTasks(),
        fetchTransactions(),
      ]);

      const activeClients = clients.filter((c) => c.status === "نشط").length;
      const completedTasks = tasks.filter((t) => t.status === "مكتملة").length;
      const completedTasksPct =
        tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
      const incompleteTasks = tasks.filter((t) => t.status !== "مكتملة").length;
      const totalIncome = transactions
        .filter((t) => t.type === "دخل")
        .reduce((s, t) => s + t.amount, 0);
      const totalExpense = transactions
        .filter((t) => t.type === "مصروف")
        .reduce((s, t) => s + t.amount, 0);
      const netProfit = totalIncome - totalExpense;

      setKpi({ activeClients, completedTasksPct, incompleteTasks, netProfit });
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    compute();
  }, [compute]);

  // Realtime: recompute KPI when clients, tasks, or transactions change
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel("kpi-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "clients" }, () => compute())
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => compute())
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => compute())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [compute]);

  return { kpi, loading, error };
}

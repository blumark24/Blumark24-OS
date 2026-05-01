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
import type { Client, Task, Transaction, Employee, Project, Activity } from "@/types";

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

  return { data, loading, error, refetch: load };
}

// ─── Clients ──────────────────────────────────────────────────────────────────

async function fetchClients(): Promise<Client[]> {
  if (!isSupabaseConfigured) {
    await new Promise((r) => setTimeout(r, 500));
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
  return useAsyncData(fetchClients, mockClients);
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

async function fetchTasks(): Promise<Task[]> {
  if (!isSupabaseConfigured) {
    await new Promise((r) => setTimeout(r, 500));
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
  return useAsyncData(fetchTasks, mockTasks);
}

// ─── Transactions ─────────────────────────────────────────────────────────────

async function fetchTransactions(): Promise<Transaction[]> {
  if (!isSupabaseConfigured) {
    await new Promise((r) => setTimeout(r, 500));
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
  return useAsyncData(fetchTransactions, mockTransactions);
}

// ─── Employees ────────────────────────────────────────────────────────────────

async function fetchEmployees(): Promise<Employee[]> {
  if (!isSupabaseConfigured) {
    await new Promise((r) => setTimeout(r, 500));
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
  return useAsyncData(fetchEmployees, mockEmployees);
}

// ─── Projects ─────────────────────────────────────────────────────────────────

async function fetchProjects(): Promise<Project[]> {
  if (!isSupabaseConfigured) {
    await new Promise((r) => setTimeout(r, 500));
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
    await new Promise((r) => setTimeout(r, 500));
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

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [clients, tasks, transactions] = await Promise.all([
          fetchClients(),
          fetchTasks(),
          fetchTransactions(),
        ]);

        if (cancelled) return;

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
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "خطأ في تحميل البيانات");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { kpi, loading, error };
}

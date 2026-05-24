"use client";

import { useMemo } from "react";
import { useClients, useTasks, useEmployees } from "@/hooks/useData";
import {
  bucketClients,
  bucketTasks,
  buildAgencyInsights,
  isTaskDelayed,
} from "@/components/agency/agencyCommandUtils";

export function useAgencyCommandData() {
  const { data: clients, loading: clientsLoading } = useClients();
  const { data: tasks, loading: tasksLoading } = useTasks();
  const { data: employees, loading: employeesLoading } = useEmployees();

  const clientBuckets = useMemo(() => bucketClients(clients), [clients]);
  const taskBuckets = useMemo(() => bucketTasks(tasks), [tasks]);

  const delayedTasks = useMemo(
    () => tasks.filter((t) => isTaskDelayed(t.status, t.dueDate)),
    [tasks],
  );
  const completedTasks = useMemo(
    () => tasks.filter((t) => t.status === "مكتملة"),
    [tasks],
  );
  const inExecutionClients = clientBuckets["قيد التنفيذ"]?.length ?? 0;
  const activeEmployees = useMemo(
    () => employees.filter((e) => e.status === "نشط").length,
    [employees],
  );

  const completionRate = useMemo(() => {
    const total = tasks.length;
    return total > 0 ? Math.round((completedTasks.length / total) * 100) : 0;
  }, [tasks.length, completedTasks.length]);

  const mostLoadedEmployee = useMemo(
    () =>
      employees.reduce<{ name: string; tasks: number } | null>((best, e) => {
        const currentTasks = e.tasks ?? 0;
        if (!best || currentTasks > best.tasks) {
          return { name: e.name || "غير محدد", tasks: currentTasks };
        }
        return best;
      }, null),
    [employees],
  );

  const insights = useMemo(
    () =>
      buildAgencyInsights({
        delayedTasks: delayedTasks.length,
        inExecutionClients,
        mostLoadedEmployee,
        completedTasks: completedTasks.length,
      }),
    [delayedTasks.length, inExecutionClients, mostLoadedEmployee, completedTasks.length],
  );

  return {
    clients,
    tasks,
    employees,
    clientBuckets,
    taskBuckets,
    delayedTasks,
    completedTasks,
    inExecutionClients,
    activeEmployees,
    completionRate,
    insights,
    isLoading: clientsLoading || tasksLoading || employeesLoading,
  };
}

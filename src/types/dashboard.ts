export type DashboardMetrics = {
  completedTasksRate: number;
  activeClients: number;
  overdueTasks: number;
  remainingTasks: number;
  totalTasks: number;
  taskStatusBreakdown: {
    completed: number;
    inProgress: number;
    pending: number;
    overdue: number;
  };
  monthlySales: number;
  customerSatisfaction: number | null;
  recentActivities: Array<{
    id: string;
    action: string;
    entity_type?: string | null;
    created_at: string;
  }>;
};

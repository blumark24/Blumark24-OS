"use client";

import PageGuard from "@/components/ui/PageGuard";
import TaskWorkspace from "@/components/tasks/TaskWorkspace";

export default function TasksPage() {
  return (
    <PageGuard permission="manage_tasks">
      <TaskWorkspace />
    </PageGuard>
  );
}

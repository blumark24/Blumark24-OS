import type { Task, TaskRecurrenceRule } from "@/types";

export type TaskAutomationEvent =
  | "task_created"
  | "task_completed"
  | "task_overdue"
  | "task_assigned"
  | "status_changed"
  | "comment_added";

export interface TaskDepartment {
  id: string;
  name: string;
  color: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  body: string;
  author_id: string;
  author_name: string;
  created_at: string;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by_name: string;
  created_at: string;
}

export interface TaskAutomationTrigger {
  id: string;
  name: string;
  enabled: boolean;
  event_type: TaskAutomationEvent;
  conditions: Record<string, unknown>;
  actions: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TaskEngineSnapshot {
  comments: TaskComment[];
  attachments: TaskAttachment[];
  triggers: TaskAutomationTrigger[];
  departments: TaskDepartment[];
}

export type { Task, TaskRecurrenceRule };

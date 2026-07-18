"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Check, CheckCircle2, CircleAlert, Clipboard, Clock3, FileArchive, FileImage, FileSpreadsheet, FileText, FileType, ListChecks, LoaderCircle, MessageSquare, Paperclip, PlayCircle, RefreshCw, Send, Sparkles, Upload, UserRound, type LucideIcon } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useTaskManagement } from "@/hooks/useTaskManagement";
import { supabase } from "@/lib/supabase";
import type { Task } from "@/types";

const BUCKET = "task-workspace-files";
const SUPPORTED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
] as const;
const ACCEPT = SUPPORTED_MIME_TYPES.join(",");
const SUPPORTED_FILE_TYPES_LABEL = "PDF, PNG, JPEG, WEBP, CSV, DOCX, XLSX, PPTX";
const STATUS = {
  new: "\u062c\u062f\u064a\u062f\u0629",
  doing: "\u0642\u064a\u062f_\u0627\u0644\u062a\u0646\u0641\u064a\u0630",
  doingSpaced: "\u0642\u064a\u062f \u0627\u0644\u062a\u0646\u0641\u064a\u0630",
  review: "\u0628\u0627\u0646\u062a\u0638\u0627\u0631_\u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629",
  reviewSpaced: "\u0628\u0627\u0646\u062a\u0638\u0627\u0631 \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629",
  revision: "\u0637\u0644\u0628_\u062a\u0639\u062f\u064a\u0644",
} as const;

const STATUS_LABELS: Record<string, string> = {
  [STATUS.new]: "\u062c\u062f\u064a\u062f\u0629",
  [STATUS.doing]: "\u0642\u064a\u062f \u0627\u0644\u062a\u0646\u0641\u064a\u0630",
  [STATUS.doingSpaced]: "\u0642\u064a\u062f \u0627\u0644\u062a\u0646\u0641\u064a\u0630",
  [STATUS.review]: "\u0628\u0627\u0646\u062a\u0638\u0627\u0631 \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629",
  [STATUS.reviewSpaced]: "\u0628\u0627\u0646\u062a\u0638\u0627\u0631 \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629",
  [STATUS.revision]: "\u0637\u0644\u0628 \u062a\u0639\u062f\u064a\u0644",
  ["\u0645\u0643\u062a\u0645\u0644\u0629"]: "\u0645\u0643\u062a\u0645\u0644\u0629",
  ["\u0645\u062a\u0623\u062e\u0631\u0629"]: "\u0645\u062a\u0623\u062e\u0631\u0629",
  ["\u0645\u0648\u0642\u0648\u0641\u0629"]: "\u0645\u0648\u0642\u0648\u0641\u0629",
  ["\u0645\u0644\u063a\u0627\u0629"]: "\u0645\u0644\u063a\u0627\u0629",
};

const PRIORITIES: Record<string, string> = {
  ["\u0639\u0627\u062c\u0644\u0629"]: "\u0639\u0627\u062c\u0644\u0629",
  ["\u0639\u0627\u0644\u064a\u0629"]: "\u0639\u0627\u0644\u064a\u0629",
  ["\u0645\u062a\u0648\u0633\u0637\u0629"]: "\u0645\u062a\u0648\u0633\u0637\u0629",
  ["\u0645\u0646\u062e\u0641\u0636\u0629"]: "\u0645\u0646\u062e\u0641\u0636\u0629",
};

const PROGRESS_STEPS = [
  { status: STATUS.new, label: "\u062c\u062f\u064a\u062f\u0629" },
  { status: STATUS.doing, label: "\u062a\u0646\u0641\u064a\u0630" },
  { status: STATUS.review, label: "\u0645\u0631\u0627\u062c\u0639\u0629" },
  { status: "\u0645\u0643\u062a\u0645\u0644\u0629", label: "\u0645\u0643\u062a\u0645\u0644\u0629" },
] as const;

type Workflow = {
  isBusy: boolean;
  start: (taskId: string) => Promise<void>;
  submitForReview: (taskId: string, note: string) => Promise<void>;
};
type Attachment = {
  id: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  review_state: string;
  upload_state: string;
  created_at: string;
};
type EventRow = { id: string; event_type: string; from_status: string | null; to_status: string | null; created_at: string };
type ReviewRow = { id: string; status: string; review_number: number; submission_note: string; reviewer_note: string | null; reviewer_id: string; submitted_at: string; reviewed_at: string | null };
type TimelineRow = { id: string; title: string; detail: string; createdAt: string; kind: "event" | "review"; icon: LucideIcon };

function dateLabel(value: string | null | undefined) {
  if (!value) return "\u063a\u064a\u0631 \u0645\u062d\u062f\u062f";
  const timestamp = parseTaskDueDateInRiyadh(value);
  return timestamp === null
    ? "\u063a\u064a\u0631 \u0645\u062d\u062f\u062f"
    : new Intl.DateTimeFormat("ar-SA", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Riyadh",
    }).format(new Date(timestamp));
}

function fileSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function progressIndex(status: string) {
  if (status === STATUS.new) return 0;
  if (status === STATUS.doing || status === STATUS.doingSpaced || status === STATUS.revision) return 1;
  if (status === STATUS.review || status === STATUS.reviewSpaced) return 2;
  if (status === "\u0645\u0643\u062a\u0645\u0644\u0629") return 3;
  return 0;
}

function actionTitle(status: string) {
  if (status === STATUS.new) return "\u0642\u0628\u0648\u0644 \u0627\u0644\u0645\u0647\u0645\u0629";
  if (status === STATUS.revision) return "\u062a\u0646\u0641\u064a\u0630 \u0627\u0644\u062a\u0639\u062f\u064a\u0644\u0627\u062a";
  if (status === STATUS.doing || status === STATUS.doingSpaced) return "\u0625\u0631\u0633\u0627\u0644 \u0644\u0644\u0627\u0639\u062a\u0645\u0627\u062f";
  return "";
}

function actionIcon(status: string): LucideIcon {
  if (status === STATUS.new) return CheckCircle2;
  if (status === STATUS.revision) return RefreshCw;
  if (status === STATUS.doing || status === STATUS.doingSpaced) return Send;
  return ListChecks;
}

const RIYADH_OFFSET_MINUTES = 180;

function riyadhLocalToUtcTimestamp(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  millisecond: number,
) {
  const calendarDate = new Date(Date.UTC(year, month - 1, day));
  if (
    calendarDate.getUTCFullYear() !== year
    || calendarDate.getUTCMonth() !== month - 1
    || calendarDate.getUTCDate() !== day
  ) return null;

  return Date.UTC(year, month - 1, day, hour, minute, second, millisecond)
    - RIYADH_OFFSET_MINUTES * 60 * 1000;
}

export function parseTaskDueDateInRiyadh(dueDate: string | undefined) {
  const value = dueDate?.trim();
  if (!value) return null;

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    return riyadhLocalToUtcTimestamp(
      Number(dateOnly[1]), Number(dateOnly[2]), Number(dateOnly[3]), 23, 59, 59, 999,
    );
  }

  const localDateTime = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(value);
  if (localDateTime) {
    return riyadhLocalToUtcTimestamp(
      Number(localDateTime[1]),
      Number(localDateTime[2]),
      Number(localDateTime[3]),
      Number(localDateTime[4]),
      Number(localDateTime[5]),
      Number(localDateTime[6] ?? "0"),
      Number((localDateTime[7] ?? "0").padEnd(3, "0")),
    );
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function remainingTime(dueDate: string | undefined, now: number | null) {
  if (!dueDate) return { label: "\u0627\u0644\u0645\u0648\u0639\u062f \u063a\u064a\u0631 \u0645\u062d\u062f\u062f", tone: "muted", ratio: 0 };
  const target = parseTaskDueDateInRiyadh(dueDate);
  if (target === null || now === null) return { label: "\u062c\u0627\u0631\u064d \u062d\u0633\u0627\u0628 \u0627\u0644\u0648\u0642\u062a", tone: "muted", ratio: 0 };
  const difference = target - now;
  if (difference <= 0) return { label: "\u0645\u062a\u0623\u062e\u0631\u0629", tone: "danger", ratio: 100 };
  const minutes = Math.ceil(difference / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const rest = minutes % 60;
  const label = days > 0
    ? days + " \u064a\u0648\u0645" + (hours ? " \u0648" + hours + " \u0633\u0627\u0639\u0629" : "")
    : hours > 0
      ? hours + " \u0633\u0627\u0639\u0629" + (rest ? " \u0648" + rest + " \u062f\u0642\u064a\u0642\u0629" : "")
      : rest + " \u062f\u0642\u064a\u0642\u0629";
  return { label, tone: days < 1 ? "warning" : "calm", ratio: Math.min(96, Math.max(12, 100 - (minutes / (14 * 1440)) * 100)) };
}

function attachmentIcon(file: Pick<Attachment, "mime_type" | "original_name">): LucideIcon {
  const type = (file.mime_type + " " + file.original_name).toLowerCase();
  if (type.includes("image")) return FileImage;
  if (type.includes("sheet") || type.includes("excel") || type.endsWith(".csv")) return FileSpreadsheet;
  if (type.includes("zip") || type.includes("archive")) return FileArchive;
  if (type.includes("pdf") || type.includes("word") || type.includes("presentation")) return FileType;
  return FileText;
}

function eventIcon(event: Pick<EventRow, "event_type" | "to_status">): LucideIcon {
  const text = (event.event_type + " " + (event.to_status ?? "")).toLowerCase();
  if (text.includes("\u0645\u062a\u0623\u062e\u0631")) return CircleAlert;
  if (text.includes("\u0645\u0643\u062a\u0645\u0644") || text.includes("\u0627\u0639\u062a\u0645\u0627\u062f")) return CheckCircle2;
  if (text.includes("\u062a\u0646\u0641\u064a\u0630")) return PlayCircle;
  if (text.includes("\u0645\u0631\u0627\u062c\u0639") || text.includes("\u062a\u0639\u0644\u064a\u0642")) return MessageSquare;
  return ListChecks;
}

export interface TaskWorkspaceProps {
  task: Task | null;
  userId?: string;
  userRole?: string;
  workflow: Workflow;
  onTaskRefresh?: () => Promise<unknown>;
}

export function TaskWorkspace({ task, userId, userRole, workflow, onTaskRefresh }: TaskWorkspaceProps) {
  const toast = useToast();
  const management = useTaskManagement();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<Attachment[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [busy, setBusy] = useState<"action" | "approve" | "revision" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [assistantMessage, setAssistantMessage] = useState("\u0627\u0644\u0645\u0633\u0627\u0631 \u0645\u0647\u064a\u0623 \u0644\u0645\u0633\u0627\u0639\u062f\u062a\u0643.");

  const reload = useCallback(async () => {
    if (!task?.id) {
      setFiles([]);
      setEvents([]);
      setReviews([]);
      return;
    }
    setLoading(true);
    setError(null);
    const [fileResult, eventResult, reviewResult] = await Promise.all([
      supabase.from("task_files").select("id, original_name, mime_type, size_bytes, storage_path, review_state, upload_state, created_at").eq("task_id", task.id).order("created_at", { ascending: false }),
      supabase.from("task_events").select("id, event_type, from_status, to_status, created_at").eq("task_id", task.id).order("created_at", { ascending: false }).limit(30),
      supabase.from("task_reviews").select("id, status, review_number, submission_note, reviewer_note, reviewer_id, submitted_at, reviewed_at").eq("task_id", task.id).order("submitted_at", { ascending: false }).limit(10),
    ]);
    const queryError = fileResult.error ?? eventResult.error ?? reviewResult.error;
    if (queryError) setError("\u062a\u0639\u0630\u0631 \u062a\u062d\u0645\u064a\u0644 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u0647\u0645\u0629.");
    else {
      setFiles((fileResult.data ?? []) as Attachment[]);
      setEvents((eventResult.data ?? []) as EventRow[]);
      setReviews((reviewResult.data ?? []) as ReviewRow[]);
    }
    setLoading(false);
  }, [task?.id]);

  useEffect(() => { void reload(); }, [reload]);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, [task?.id]);

  const pendingReview = useMemo(() => reviews.find((review) => review.status === "pending") ?? null, [reviews]);
  const timeline = useMemo<TimelineRow[]>(() => {
    const eventRows = events.map((event) => ({
      id: "event-" + event.id,
      title: event.event_type,
      detail: [event.from_status && (STATUS_LABELS[event.from_status] ?? event.from_status), event.to_status && (STATUS_LABELS[event.to_status] ?? event.to_status)].filter(Boolean).join(" \u2192 "),
      createdAt: event.created_at,
      kind: "event" as const,
      icon: eventIcon(event),
    }));
    const reviewRows = reviews.flatMap((review) => {
      const rows: TimelineRow[] = [{
        id: "review-" + review.id,
        title: "\u0645\u0631\u0627\u062c\u0639\u0629 #" + review.review_number,
        detail: review.submission_note || "\u0628\u062f\u0648\u0646 \u0645\u0644\u0627\u062d\u0638\u0629",
        createdAt: review.submitted_at,
        kind: "review",
        icon: MessageSquare,
      }];
      if (review.reviewer_note) rows.push({
        id: "note-" + review.id,
        title: "\u0645\u0644\u0627\u062d\u0638\u0629 \u0627\u0644\u0645\u0631\u0627\u062c\u0639",
        detail: review.reviewer_note,
        createdAt: review.reviewed_at ?? review.submitted_at,
        kind: "review",
        icon: MessageSquare,
      });
      return rows;
    });
    return [...eventRows, ...reviewRows].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [events, reviews]);

  const assignee = Boolean(task && userId && task.assigneeId === userId);
  const reviewer = Boolean(task && userId && pendingReview?.reviewer_id === userId && ["employee", "manager", "organization_manager", "owner", "super_admin"].includes(userRole ?? ""));
  const currentStatus = task?.status as string | undefined;
  const canSubmit = assignee && (currentStatus === STATUS.doing || currentStatus === STATUS.doingSpaced);
  const canApprove = reviewer && (currentStatus === STATUS.review || currentStatus === STATUS.reviewSpaced);
  const primary = assignee ? actionTitle(currentStatus ?? "") : "";
  const progressPosition = progressIndex(currentStatus ?? "");
  const progressPercent = Math.round((progressPosition / (PROGRESS_STEPS.length - 1)) * 100);
  const remaining = remainingTime(task?.dueDate, now);
  const PrimaryIcon = actionIcon(currentStatus ?? "");

  const focusNote = () => {
    document.getElementById("workspace-task-note")?.focus();
    setAssistantMessage("\u0623\u0636\u0641 \u0645\u0644\u0627\u062d\u0638\u062a\u0643 \u062b\u0645 \u0646\u0641\u0630 \u0627\u0644\u0625\u062c\u0631\u0627\u0621.");
  };

  const refreshFromAssistant = async () => {
    setAssistantMessage("\u062c\u0627\u0631\u064d \u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0646\u0634\u0627\u0637...");
    await reload();
    setAssistantMessage("\u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0646\u0634\u0627\u0637.");
  };

  const copyTaskReference = async () => {
    try {
      await navigator.clipboard.writeText(task?.publicCode ?? task?.id ?? "");
      setAssistantMessage("\u062a\u0645 \u0646\u0633\u062e \u0631\u0642\u0645 \u0627\u0644\u0645\u0647\u0645\u0629.");
    } catch {
      setAssistantMessage("\u0644\u0645 \u064a\u062a\u0645\u0643\u0646 \u0627\u0644\u0646\u0638\u0627\u0645 \u0645\u0646 \u0627\u0644\u0646\u0633\u062e.");
    }
  };

  const openUpload = () => {
    inputRef.current?.click();
    setAssistantMessage("\u0627\u062e\u062a\u0631 \u0645\u0644\u0641\u064b\u0627 \u0645\u0646 \u062c\u0647\u0627\u0632\u0643.");
  };

  const runPrimary = async () => {
    if (!task || !primary || busy) return;
    setBusy("action");
    setError(null);
    try {
      if (task.status === STATUS.new || task.status === STATUS.revision) await workflow.start(task.id);
      else if (canSubmit) {
        if (!note.trim()) {
          setError("\u0623\u0636\u0641 \u0645\u0644\u0627\u062d\u0638\u0629 \u0627\u0644\u0625\u0631\u0633\u0627\u0644 \u0623\u0648\u0644\u0627\u064b.");
          return;
        }
        await workflow.submitForReview(task.id, note.trim());
        setNote("");
      }
      await onTaskRefresh?.();
      await reload();
      toast.success("\u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u062d\u0627\u0644\u0629 \u0627\u0644\u0645\u0647\u0645\u0629.");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "\u062a\u0639\u0630\u0631 \u062a\u0646\u0641\u064a\u0630 \u0627\u0644\u0625\u062c\u0631\u0627\u0621.");
    } finally {
      setBusy(null);
    }
  };

  const runReview = async (decision: "approve" | "revision") => {
    if (!task || !pendingReview || !canApprove || busy) return;
    const reviewerNote = note.trim();
    if (decision === "revision" && !reviewerNote) {
      setError("\u0633\u0628\u0628 \u0637\u0644\u0628 \u0627\u0644\u062a\u0639\u062f\u064a\u0644 \u0645\u0637\u0644\u0648\u0628.");
      return;
    }
    setBusy(decision);
    setError(null);
    try {
      if (decision === "approve") await management.approveTask(task.id, pendingReview.id, reviewerNote || undefined);
      else await management.requestTaskRevision(task.id, pendingReview.id, reviewerNote);
      setNote("");
      await onTaskRefresh?.();
      await reload();
      toast.success("\u062a\u0645 \u062d\u0641\u0638 \u0642\u0631\u0627\u0631 \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629.");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "\u062a\u0639\u0630\u0631 \u062d\u0641\u0638 \u0627\u0644\u0642\u0631\u0627\u0631.");
    } finally {
      setBusy(null);
    }
  };

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file || !task || !assignee || uploading) return;
    if (!(SUPPORTED_MIME_TYPES as readonly string[]).includes(file.type)) {
      setError("\u0627\u0644\u0623\u0646\u0648\u0627\u0639 \u0627\u0644\u0645\u0633\u0645\u0648\u062d\u0629: " + SUPPORTED_FILE_TYPES_LABEL + ".");
      return;
    }
    setUploading(true);
    setError(null);
    let fileId: string | null = null;
    try {
      const prepared = await supabase.rpc("prepare_task_file_upload", { p_task_id: task.id, p_original_name: file.name, p_mime_type: file.type, p_size_bytes: file.size });
      if (prepared.error) throw prepared.error;
      const payload = prepared.data as { file_id?: string; storage_path?: string };
      if (!payload.file_id || !payload.storage_path) throw new Error("FILE_NOT_READY");
      fileId = payload.file_id;
      const uploaded = await supabase.storage.from(BUCKET).upload(payload.storage_path, file, { cacheControl: "3600", contentType: file.type, upsert: false });
      if (uploaded.error) throw uploaded.error;
      const finalized = await supabase.rpc("finalize_task_file_upload", { p_file_id: fileId });
      if (finalized.error) throw finalized.error;
      await reload();
      toast.success("\u062a\u0645 \u0631\u0641\u0639 \u0627\u0644\u0645\u0644\u0641.");
    } catch {
      if (fileId) await supabase.rpc("cancel_pending_task_file_upload", { p_file_id: fileId });
      setError("\u062a\u0639\u0630\u0631 \u0631\u0641\u0639 \u0627\u0644\u0645\u0644\u0641.");
    } finally {
      setUploading(false);
    }
  };

  const openFile = async (file: Attachment) => {
    const result = await supabase.storage.from(BUCKET).createSignedUrl(file.storage_path, 300);
    if (result.error || !result.data?.signedUrl) {
      setError("\u062a\u0639\u0630\u0631 \u0641\u062a\u062d \u0627\u0644\u0645\u0644\u0641.");
      return;
    }
    window.open(result.data.signedUrl, "_blank", "noopener,noreferrer");
  };

  if (!task) return (
    <div className="td-workspace-empty">
      <FileText size={20} />
      <strong>{"\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0647\u0645\u0629 \u0645\u062d\u062f\u062f\u0629."}</strong>
      <span>{"\u0627\u062e\u062a\u0631 \u0645\u0647\u0645\u0629 \u0644\u0641\u062a\u062d \u0645\u0633\u0627\u0631 \u0627\u0644\u0639\u0645\u0644."}</span>
    </div>
  );

  return (
    <div className="td-task-workspace">
      <section className="td-workspace-section td-workspace-task-header" aria-labelledby="workspace-task-title">
        <div className="td-workspace-task-title">
          <span className="td-workspace-eyebrow">{"\u0645\u0647\u0645\u0629 #" + (task.publicCode ?? task.id.slice(0, 8))}</span>
          <h3 id="workspace-task-title">{task.title}</h3>
          <p>{task.clientName || "\u0628\u062f\u0648\u0646 \u0639\u0645\u064a\u0644 \u0645\u0631\u062a\u0628\u0637"}</p>
        </div>
        <div className="td-workspace-badges">
          <span className="td-workspace-badge priority">{PRIORITIES[task.priority] ?? task.priority}</span>
          <span className="td-workspace-badge status">{STATUS_LABELS[task.status] ?? task.status}</span>
        </div>
      </section>

      <section className="td-workspace-progress" aria-labelledby="workspace-progress-title">
        <div className="td-workspace-section-head"><h4 id="workspace-progress-title"><ListChecks size={15} />{"\u0645\u0633\u0627\u0631 \u0627\u0644\u0645\u0647\u0645\u0629"}</h4><strong>{progressPercent}%</strong></div>
        <div className="td-workspace-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent} aria-label="\u0646\u0633\u0628\u0629 \u062a\u0642\u062f\u0645 \u0627\u0644\u0645\u0647\u0645\u0629"><span style={{ width: progressPercent + "%" }} /></div>
        <ol className="td-workspace-progress-steps">{PROGRESS_STEPS.map((step, index) => <li key={step.status} className={index <= progressPosition ? "is-complete" : ""} aria-current={index === progressPosition ? "step" : undefined}><span>{index < progressPosition ? <Check size={12} /> : index === progressPosition ? <PlayCircle size={12} /> : index + 1}</span><small>{step.label}</small></li>)}</ol>
      </section>

      <section className={"td-workspace-remaining " + remaining.tone} aria-live="polite">
        <div><Clock3 size={16} /><span><strong>{"\u0627\u0644\u0648\u0642\u062a \u0627\u0644\u0645\u062a\u0628\u0642\u064a"}</strong><small>{remaining.label}</small></span></div>
        <div className="td-workspace-remaining-meter" aria-hidden="true"><span style={{ width: remaining.ratio + "%" }} /></div>
      </section>

      <section className="td-workspace-section td-workspace-details" aria-labelledby="workspace-details-title">
        <h4 id="workspace-details-title">{"\u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u0645\u0647\u0645\u0629"}</h4>
        <div className="td-workspace-detail-grid">
          <div><span>{"\u0627\u0644\u0648\u0635\u0641"}</span><strong>{task.description?.trim() || "\u0644\u0627 \u064a\u0648\u062c\u062f \u0648\u0635\u0641."}</strong></div>
          <div><span>{"\u0627\u0644\u0645\u0648\u0639\u062f \u0627\u0644\u0646\u0647\u0627\u0626\u064a"}</span><strong>{dateLabel(task.dueDate)}</strong></div>
          <div><span>{"\u0627\u0644\u0645\u0643\u0644\u0641"}</span><strong>{task.assigneeName || "\u063a\u064a\u0631 \u0645\u0639\u064a\u0646"}</strong></div>
          <div><span>{"\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0625\u0646\u0634\u0627\u0621"}</span><strong>{dateLabel(task.createdAt)}</strong></div>
        </div>
        {task.tags?.length ? <div className="td-workspace-tags">{task.tags.map((tag) => <span key={tag}>{tag}</span>)}</div> : null}
      </section>

      <section className="td-workspace-assistant" aria-labelledby="workspace-assistant-title">
        <div className="td-workspace-section-head"><h4 id="workspace-assistant-title"><Sparkles size={15} />{"\u0645\u0633\u0627\u0639\u062f \u0627\u0644\u0645\u0647\u0645\u0629"}</h4><span className="td-workspace-action-role">{"\u0625\u062c\u0631\u0627\u0621\u0627\u062a \u0633\u0631\u064a\u0639\u0629"}</span></div>
        <p className="td-workspace-assistant-message" role="status">{assistantMessage}</p>
        <div className="td-workspace-assistant-actions"><button type="button" onClick={() => void refreshFromAssistant()}><RefreshCw size={14} />{"\u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0646\u0634\u0627\u0637"}</button>{assignee ? <button type="button" onClick={openUpload}><Upload size={14} />{"\u0631\u0641\u0639 \u0645\u0631\u0641\u0642"}</button> : null}<button type="button" onClick={() => void copyTaskReference()}><Clipboard size={14} />{"\u0646\u0633\u062e \u0631\u0642\u0645 \u0627\u0644\u0645\u0647\u0645\u0629"}</button>{canSubmit || canApprove ? <button type="button" onClick={focusNote}><MessageSquare size={14} />{"\u0643\u062a\u0627\u0628\u0629 \u0645\u0644\u0627\u062d\u0638\u0629"}</button> : null}</div>
      </section>

      <section className="td-workspace-section" aria-labelledby="workspace-files-title">
        <div className="td-workspace-section-head"><h4 id="workspace-files-title"><Paperclip size={15} />{"\u0627\u0644\u0645\u0631\u0641\u0642\u0627\u062a"}</h4>{assignee ? <><input ref={inputRef} type="file" accept={ACCEPT} hidden onChange={upload} /><button type="button" className="td-workspace-ghost-button" onClick={openUpload} disabled={uploading} aria-busy={uploading}>{uploading ? <LoaderCircle className="td-spin" size={14} /> : <Upload size={14} />}{uploading ? "\u062c\u0627\u0631 \u0627\u0644\u0631\u0641\u0639" : "\u0631\u0641\u0639 \u0645\u0631\u0641\u0642"}</button></> : null}</div>
        {loading ? <p className="td-workspace-muted" role="status">{"\u062c\u0627\u0631 \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0645\u0631\u0641\u0642\u0627\u062a..."}</p> : null}
        {files.length ? <ul className="td-workspace-file-list">{files.map((file) => { const AttachmentIcon = attachmentIcon(file); return <li key={file.id}><button type="button" onClick={() => void openFile(file)} aria-label={file.original_name}><AttachmentIcon size={15} /><span><strong>{file.original_name}</strong><small>{fileSize(file.size_bytes)} {"\u00b7"} {file.review_state}</small></span></button></li>; })}</ul> : !loading ? <p className="td-workspace-muted">{"\u0644\u0627 \u0645\u0631\u0641\u0642\u0627\u062a \u062d\u0627\u0644\u064a\u0629."}</p> : null}
      </section>

      <section className="td-workspace-section" aria-labelledby="workspace-activity-title">
        <h4 id="workspace-activity-title"><Clock3 size={15} />{"\u0627\u0644\u0646\u0634\u0627\u0637 \u0648\u0627\u0644\u062a\u0639\u0644\u064a\u0642\u0627\u062a"}</h4>
        {timeline.length ? <ol className="td-workspace-timeline">{timeline.map((item) => <li key={item.id}><span className="td-workspace-timeline-dot"><item.icon size={13} /></span><div><strong>{item.title}</strong><p>{item.detail || "\u0628\u062f\u0648\u0646 \u062a\u0641\u0635\u064a\u0644"}</p><time dateTime={item.createdAt}>{dateLabel(item.createdAt)}</time></div></li>)}</ol> : <p className="td-workspace-muted">{"\u0644\u0627 \u0646\u0634\u0627\u0637 \u0645\u0633\u062c\u0644 \u0644\u0647\u0630\u0647 \u0627\u0644\u0645\u0647\u0645\u0629."}</p>}
      </section>

      <section className="td-workspace-actions" aria-labelledby="workspace-actions-title">
        <div className="td-workspace-section-head"><h4 id="workspace-actions-title"><Send size={15} />{"\u0627\u0644\u0625\u062c\u0631\u0627\u0621 \u0627\u0644\u062a\u0627\u0644\u064a"}</h4><span className="td-workspace-action-role">{canApprove ? "\u0645\u0631\u0627\u062c\u0639" : "\u0645\u0643\u0644\u0641"}</span></div>
        {error ? <p className="td-workspace-error" role="alert">{error}</p> : null}
        {canSubmit || canApprove ? <label className="td-workspace-note"><span>{canApprove ? "\u0645\u0644\u0627\u062d\u0638\u0629 \u0627\u0644\u0645\u0631\u0627\u062c\u0639" : "\u0645\u0644\u0627\u062d\u0638\u0629 \u0627\u0644\u0625\u0631\u0633\u0627\u0644"}</span><textarea id="workspace-task-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={4000} rows={3} placeholder="\u0627\u0643\u062a\u0628 \u0645\u0644\u0627\u062d\u0638\u0629" /></label> : null}
        {canApprove ? <div className="td-workspace-action-row"><button type="button" className="td-workspace-primary" onClick={() => void runReview("approve")} disabled={Boolean(busy)} aria-busy={busy === "approve"}>{busy === "approve" ? <LoaderCircle className="td-spin" size={14} /> : <Check size={14} />}{"\u0627\u0639\u062a\u0645\u0627\u062f"}</button><button type="button" className="td-workspace-secondary" onClick={() => void runReview("revision")} disabled={Boolean(busy)}>{"\u0637\u0644\u0628 \u062a\u0639\u062f\u064a\u0644"}</button></div> : primary ? <button type="button" className="td-workspace-primary td-workspace-primary-action" onClick={() => void runPrimary()} disabled={Boolean(busy) || workflow.isBusy || (canSubmit && !note.trim())} aria-busy={busy === "action" || workflow.isBusy}><PrimaryIcon size={15} />{primary}</button> : <p className="td-workspace-muted"><UserRound size={15} />{"\u0644\u0627 \u064a\u0648\u062c\u062f \u0625\u062c\u0631\u0627\u0621 \u0645\u062a\u0627\u062d \u0644\u0647\u0630\u0647 \u0627\u0644\u0645\u0647\u0645\u0629."}</p>}
      </section>
    </div>
  );
}

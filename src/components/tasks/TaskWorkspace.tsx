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
  new: "جديدة",
  doing: "قيد_التنفيذ",
  doingSpaced: "قيد التنفيذ",
  review: "بانتظار_المراجعة",
  reviewSpaced: "بانتظار المراجعة",
  revision: "طلب_تعديل",
} as const;

const STATUS_LABELS: Record<string, string> = {
  [STATUS.new]: "جديدة",
  [STATUS.doing]: "قيد التنفيذ",
  [STATUS.doingSpaced]: "قيد التنفيذ",
  [STATUS.review]: "بانتظار المراجعة",
  [STATUS.reviewSpaced]: "بانتظار المراجعة",
  [STATUS.revision]: "طلب تعديل",
  ["مكتملة"]: "مكتملة",
  ["متأخرة"]: "متأخرة",
  ["موقوفة"]: "موقوفة",
  ["ملغاة"]: "ملغاة",
};

const PRIORITIES: Record<string, string> = {
  ["عاجلة"]: "عاجلة",
  ["عالية"]: "عالية",
  ["متوسطة"]: "متوسطة",
  ["منخفضة"]: "منخفضة",
};

const PROGRESS_STEPS = [
  { status: STATUS.new, label: "جديدة" },
  { status: STATUS.doing, label: "تنفيذ" },
  { status: STATUS.review, label: "مراجعة" },
  { status: "مكتملة", label: "مكتملة" },
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
  if (!value) return "غير محدد";
  const timestamp = parseTaskDueDateInRiyadh(value);
  return timestamp === null
    ? "غير محدد"
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
  if (status === "مكتملة") return 3;
  return 0;
}

function actionTitle(status: string) {
  if (status === STATUS.new) return "قبول المهمة";
  if (status === STATUS.revision) return "تنفيذ التعديلات";
  if (status === STATUS.doing || status === STATUS.doingSpaced) return "إرسال للاعتماد";
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
  if (!dueDate) return { label: "الموعد غير محدد", tone: "muted", ratio: 0 };
  const target = parseTaskDueDateInRiyadh(dueDate);
  if (target === null || now === null) return { label: "جارٍ حساب الوقت", tone: "muted", ratio: 0 };
  const difference = target - now;
  if (difference <= 0) return { label: "متأخرة", tone: "danger", ratio: 100 };
  const minutes = Math.ceil(difference / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const rest = minutes % 60;
  const label = days > 0
    ? days + " يوم" + (hours ? " و" + hours + " ساعة" : "")
    : hours > 0
      ? hours + " ساعة" + (rest ? " و" + rest + " دقيقة" : "")
      : rest + " دقيقة";
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
  if (text.includes("متأخر")) return CircleAlert;
  if (text.includes("مكتمل") || text.includes("اعتماد")) return CheckCircle2;
  if (text.includes("تنفيذ")) return PlayCircle;
  if (text.includes("مراجع") || text.includes("تعليق")) return MessageSquare;
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
  const [assistantMessage, setAssistantMessage] = useState("المسار مهيأ لمساعدتك.");

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
    if (queryError) setError("تعذر تحميل بيانات المهمة.");
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
      detail: [event.from_status && (STATUS_LABELS[event.from_status] ?? event.from_status), event.to_status && (STATUS_LABELS[event.to_status] ?? event.to_status)].filter(Boolean).join(" → "),
      createdAt: event.created_at,
      kind: "event" as const,
      icon: eventIcon(event),
    }));
    const reviewRows = reviews.flatMap((review) => {
      const rows: TimelineRow[] = [{
        id: "review-" + review.id,
        title: "مراجعة #" + review.review_number,
        detail: review.submission_note || "بدون ملاحظة",
        createdAt: review.submitted_at,
        kind: "review",
        icon: MessageSquare,
      }];
      if (review.reviewer_note) rows.push({
        id: "note-" + review.id,
        title: "ملاحظة المراجع",
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
    setAssistantMessage("أضف ملاحظتك ثم نفذ الإجراء.");
  };

  const refreshFromAssistant = async () => {
    setAssistantMessage("جارٍ تحديث النشاط...");
    await reload();
    setAssistantMessage("تم تحديث النشاط.");
  };

  const copyTaskReference = async () => {
    try {
      await navigator.clipboard.writeText(task?.publicCode ?? task?.id ?? "");
      setAssistantMessage("تم نسخ رقم المهمة.");
    } catch {
      setAssistantMessage("لم يتمكن النظام من النسخ.");
    }
  };

  const openUpload = () => {
    inputRef.current?.click();
    setAssistantMessage("اختر ملفًا من جهازك.");
  };

  const runPrimary = async () => {
    if (!task || !primary || busy) return;
    setBusy("action");
    setError(null);
    try {
      if (currentStatus === STATUS.new || currentStatus === STATUS.revision) await workflow.start(task.id);
      else if (canSubmit) {
        if (!note.trim()) {
          setError("أضف ملاحظة الإرسال أولاً.");
          return;
        }
        await workflow.submitForReview(task.id, note.trim());
        setNote("");
      }
      await onTaskRefresh?.();
      await reload();
      toast.success("تم تحديث حالة المهمة.");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "تعذر تنفيذ الإجراء.");
    } finally {
      setBusy(null);
    }
  };

  const runReview = async (decision: "approve" | "revision") => {
    if (!task || !pendingReview || !canApprove || busy) return;
    const reviewerNote = note.trim();
    if (decision === "revision" && !reviewerNote) {
      setError("سبب طلب التعديل مطلوب.");
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
      toast.success("تم حفظ قرار المراجعة.");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "تعذر حفظ القرار.");
    } finally {
      setBusy(null);
    }
  };

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file || !task || !assignee || uploading) return;
    if (!(SUPPORTED_MIME_TYPES as readonly string[]).includes(file.type)) {
      setError("الأنواع المسموحة: " + SUPPORTED_FILE_TYPES_LABEL + ".");
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
      await onTaskRefresh?.();
      await reload();
      toast.success("تم رفع الملف.");
    } catch {
      if (fileId) await supabase.rpc("cancel_pending_task_file_upload", { p_file_id: fileId });
      setError("تعذر رفع الملف.");
    } finally {
      setUploading(false);
    }
  };

  const openFile = async (file: Attachment) => {
    const result = await supabase.storage.from(BUCKET).createSignedUrl(file.storage_path, 300);
    if (result.error || !result.data?.signedUrl) {
      setError("تعذر فتح الملف.");
      return;
    }
    window.open(result.data.signedUrl, "_blank", "noopener,noreferrer");
  };

  if (!task) return (
    <div className="td-workspace-empty">
      <FileText size={20} />
      <strong>{"لا توجد مهمة محددة."}</strong>
      <span>{"اختر مهمة لفتح مسار العمل."}</span>
    </div>
  );

  return (
    <div className="td-task-workspace">
      <section className="td-workspace-section td-workspace-task-header" aria-labelledby="workspace-task-title">
        <div className="td-workspace-task-title">
          <span className="td-workspace-eyebrow">{"مهمة #" + (task.publicCode ?? task.id.slice(0, 8))}</span>
          <h3 id="workspace-task-title">{task.title}</h3>
          <p>{task.clientName || "بدون عميل مرتبط"}</p>
        </div>
        <div className="td-workspace-badges">
          <span className="td-workspace-badge priority">{PRIORITIES[task.priority] ?? task.priority}</span>
          <span className="td-workspace-badge status">{STATUS_LABELS[task.status] ?? task.status}</span>
        </div>
      </section>

      <section className="td-workspace-progress" aria-labelledby="workspace-progress-title">
        <div className="td-workspace-section-head"><h4 id="workspace-progress-title"><ListChecks size={15} />{"مسار المهمة"}</h4><strong>{progressPercent}%</strong></div>
        <div className="td-workspace-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent} aria-label="نسبة تقدم المهمة"><span style={{ width: progressPercent + "%" }} /></div>
        <ol className="td-workspace-progress-steps">{PROGRESS_STEPS.map((step, index) => <li key={step.status} className={index <= progressPosition ? "is-complete" : ""} aria-current={index === progressPosition ? "step" : undefined}><span>{index < progressPosition ? <Check size={12} /> : index === progressPosition ? <PlayCircle size={12} /> : index + 1}</span><small>{step.label}</small></li>)}</ol>
      </section>

      <section className={"td-workspace-remaining " + remaining.tone} aria-live="polite">
        <div><Clock3 size={16} /><span><strong>{"الوقت المتبقي"}</strong><small>{remaining.label}</small></span></div>
        <div className="td-workspace-remaining-meter" aria-hidden="true"><span style={{ width: remaining.ratio + "%" }} /></div>
      </section>

      <section className="td-workspace-section td-workspace-details" aria-labelledby="workspace-details-title">
        <h4 id="workspace-details-title">{"تفاصيل المهمة"}</h4>
        <div className="td-workspace-detail-grid">
          <div><span>{"الوصف"}</span><strong>{task.description?.trim() || "لا يوجد وصف."}</strong></div>
          <div><span>{"الموعد النهائي"}</span><strong>{dateLabel(task.dueDate)}</strong></div>
          <div><span>{"المكلف"}</span><strong>{task.assigneeName || "غير معين"}</strong></div>
          <div><span>{"تاريخ الإنشاء"}</span><strong>{dateLabel(task.createdAt)}</strong></div>
        </div>
        {task.tags?.length ? <div className="td-workspace-tags">{task.tags.map((tag) => <span key={tag}>{tag}</span>)}</div> : null}
      </section>

      <section className="td-workspace-assistant" aria-labelledby="workspace-assistant-title">
        <div className="td-workspace-section-head"><h4 id="workspace-assistant-title"><Sparkles size={15} />{"مساعد المهمة"}</h4><span className="td-workspace-action-role">{"إجراءات سريعة"}</span></div>
        <p className="td-workspace-assistant-message" role="status">{assistantMessage}</p>
        <div className="td-workspace-assistant-actions"><button type="button" onClick={() => void refreshFromAssistant()}><RefreshCw size={14} />{"تحديث النشاط"}</button>{assignee ? <button type="button" onClick={openUpload}><Upload size={14} />{"رفع مرفق"}</button> : null}<button type="button" onClick={() => void copyTaskReference()}><Clipboard size={14} />{"نسخ رقم المهمة"}</button>{canSubmit || canApprove ? <button type="button" onClick={focusNote}><MessageSquare size={14} />{"كتابة ملاحظة"}</button> : null}</div>
      </section>

      <section className="td-workspace-section" aria-labelledby="workspace-files-title">
        <div className="td-workspace-section-head"><h4 id="workspace-files-title"><Paperclip size={15} />{"المرفقات"}</h4>{assignee ? <><input ref={inputRef} type="file" accept={ACCEPT} hidden onChange={upload} /><button type="button" className="td-workspace-ghost-button" onClick={openUpload} disabled={uploading} aria-busy={uploading}>{uploading ? <LoaderCircle className="td-spin" size={14} /> : <Upload size={14} />}{uploading ? "جار الرفع" : "رفع مرفق"}</button></> : null}</div>
        {loading ? <p className="td-workspace-muted" role="status">{"جار تحميل المرفقات..."}</p> : null}
        {files.length ? <ul className="td-workspace-file-list">{files.map((file) => { const AttachmentIcon = attachmentIcon(file); return <li key={file.id}><button type="button" onClick={() => void openFile(file)} aria-label={file.original_name}><AttachmentIcon size={15} /><span><strong>{file.original_name}</strong><small>{fileSize(file.size_bytes)} {"·"} {file.review_state}</small></span></button></li>; })}</ul> : !loading ? <p className="td-workspace-muted">{"لا مرفقات حالية."}</p> : null}
      </section>

      <section className="td-workspace-section" aria-labelledby="workspace-activity-title">
        <h4 id="workspace-activity-title"><Clock3 size={15} />{"النشاط والتعليقات"}</h4>
        {timeline.length ? <ol className="td-workspace-timeline">{timeline.map((item) => <li key={item.id}><span className="td-workspace-timeline-dot"><item.icon size={13} /></span><div><strong>{item.title}</strong><p>{item.detail || "بدون تفصيل"}</p><time dateTime={item.createdAt}>{dateLabel(item.createdAt)}</time></div></li>)}</ol> : <p className="td-workspace-muted">{"لا نشاط مسجل لهذه المهمة."}</p>}
      </section>

      <section className="td-workspace-actions" aria-labelledby="workspace-actions-title">
        <div className="td-workspace-section-head"><h4 id="workspace-actions-title"><Send size={15} />{"الإجراء التالي"}</h4><span className="td-workspace-action-role">{canApprove ? "مراجع" : "مكلف"}</span></div>
        {error ? <p className="td-workspace-error" role="alert">{error}</p> : null}
        {canSubmit || canApprove ? <label className="td-workspace-note"><span>{canApprove ? "ملاحظة المراجع" : "ملاحظة الإرسال"}</span><textarea id="workspace-task-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={4000} rows={3} placeholder="اكتب ملاحظة" /></label> : null}
        {canApprove ? <div className="td-workspace-action-row"><button type="button" className="td-workspace-primary" onClick={() => void runReview("approve")} disabled={Boolean(busy)} aria-busy={busy === "approve"}>{busy === "approve" ? <LoaderCircle className="td-spin" size={14} /> : <Check size={14} />}{"اعتماد"}</button><button type="button" className="td-workspace-secondary" onClick={() => void runReview("revision")} disabled={Boolean(busy)}>{"طلب تعديل"}</button></div> : primary ? <button type="button" className="td-workspace-primary td-workspace-primary-action" onClick={() => void runPrimary()} disabled={Boolean(busy) || workflow.isBusy || (canSubmit && !note.trim())} aria-busy={busy === "action" || workflow.isBusy}><PrimaryIcon size={15} />{primary}</button> : <p className="td-workspace-muted"><UserRound size={15} />{"لا يوجد إجراء متاح لهذه المهمة."}</p>}
      </section>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { X, MessageSquare, Paperclip, Repeat, Building2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getAttachmentPublicUrl } from "@/lib/tasks/db";
import type { Task } from "@/types";
import type { TaskAttachment, TaskComment, TaskEngineSnapshot } from "@/lib/tasks/types";

interface Props {
  task: Task;
  snapshot: TaskEngineSnapshot;
  departmentName?: string;
  canManage: boolean;
  authorId: string;
  authorName: string;
  onClose: () => void;
  onAddComment: (body: string) => Promise<void>;
  onUploadFile: (file: File) => Promise<void>;
  onDeleteAttachment: (att: TaskAttachment) => Promise<void>;
}

export default function TaskDetailPanel({
  task,
  snapshot,
  departmentName,
  canManage,
  authorId,
  authorName,
  onClose,
  onAddComment,
  onUploadFile,
  onDeleteAttachment,
}: Props) {
  const [comment, setComment] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const comments = snapshot.comments.filter((c) => c.task_id === task.id);
  const attachments = snapshot.attachments.filter((a) => a.task_id === task.id);
  const freq = task.recurrenceRule?.frequency;
  const freqLabel =
    freq === "daily"
      ? "يومي"
      : freq === "weekly"
        ? "أسبوعي"
        : freq === "monthly"
          ? "شهري"
          : freq
            ? freq
            : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/55" onClick={onClose} />
      <div className="relative w-full max-w-lg h-full bg-[#0a1628] border-r border-[#1e3a5f] flex flex-col">
        <div className="p-4 border-b border-[#1e3a5f] flex justify-between gap-3">
          <div>
            <h2 className="text-white font-bold text-lg">{task.title}</h2>
            <p className="text-[#8ba3c7] text-sm mt-1">
              {task.assigneeName} · {task.priority} · {task.status.replace(/_/g, " ")}
            </p>
            {departmentName && (
              <p className="text-[#22d3ee] text-xs mt-1 flex items-center gap-1">
                <Building2 size={12} />
                {departmentName}
              </p>
            )}
            {freqLabel && (
              <p className="text-amber-300 text-xs mt-1 flex items-center gap-1">
                <Repeat size={12} />
                متكررة: {freqLabel}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className="text-[#8ba3c7] p-1">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {task.description && (
            <p className="text-sm text-[#8ba3c7] whitespace-pre-wrap">{task.description}</p>
          )}
          <p className="text-xs text-[#6b87ab]">الموعد: {task.dueDate}</p>

          <section>
            <h3 className="text-white text-sm font-medium flex items-center gap-2 mb-2">
              <MessageSquare size={14} />
              التعليقات ({comments.length})
            </h3>
            <div className="space-y-2">
              {comments.map((c: TaskComment) => (
                <div key={c.id} className="glass-card p-2">
                  <p className="text-white text-sm">{c.body}</p>
                  <p className="text-[10px] text-[#6b87ab] mt-1">
                    {c.author_name} · {formatDate(c.created_at)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                className="input-dark flex-1 text-sm"
                placeholder="أضف تعليقاً..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <button
                type="button"
                className="btn-primary text-xs px-3"
                onClick={() => {
                  if (!comment.trim()) return;
                  void onAddComment(comment.trim()).then(() => setComment(""));
                }}
              >
                إرسال
              </button>
            </div>
          </section>

          <section>
            <h3 className="text-white text-sm font-medium flex items-center gap-2 mb-2">
              <Paperclip size={14} />
              المرفقات ({attachments.length})
            </h3>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onUploadFile(f);
                e.target.value = "";
              }}
            />
            {canManage && (
              <button
                type="button"
                className="btn-secondary text-xs mb-2"
                onClick={() => fileRef.current?.click()}
              >
                رفع ملف
              </button>
            )}
            <div className="space-y-2">
              {attachments.map((a) => (
                <AttachmentRow
                  key={a.id}
                  att={a}
                  canManage={canManage}
                  onDelete={() => void onDeleteAttachment(a)}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function AttachmentRow({
  att,
  canManage,
  onDelete,
}: {
  att: TaskAttachment;
  canManage: boolean;
  onDelete: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    void getAttachmentPublicUrl(att.storage_path).then(setUrl);
  }, [att.storage_path]);

  return (
    <div className="flex items-center justify-between glass-card p-2 text-sm">
      <a
        href={url ?? "#"}
        target="_blank"
        rel="noreferrer"
        className="text-[#22d3ee] truncate flex-1"
        onClick={(e) => {
          if (!url) e.preventDefault();
        }}
      >
        {att.file_name}
      </a>
      {canManage && (
        <button type="button" onClick={onDelete} className="text-red-400 text-xs mr-2">
          حذف
        </button>
      )}
    </div>
  );
}

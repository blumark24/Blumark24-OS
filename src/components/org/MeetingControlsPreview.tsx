"use client";

import type { MeetingControlsReadiness } from "@/lib/virtual-office/meetingControlsReadiness";

export interface MeetingControlsPreviewProps {
  readiness: MeetingControlsReadiness;
}

export default function MeetingControlsPreview({ readiness }: MeetingControlsPreviewProps) {
  const progressPct = Math.round((readiness.readyCount / readiness.totalCount) * 100);

  return (
    <section className={`bm-meeting-controls-preview is-${readiness.status}`} aria-label="أزرار الاجتماعات" dir="rtl">
      <div className="bm-meeting-controls-head">
        <strong>{readiness.title}</strong>
        <span>{progressPct}%</span>
      </div>

      <p>{readiness.summary}</p>

      <div className="bm-meeting-controls-grid">
        {readiness.controls.map((control) => (
          <button key={control.key} type="button" disabled title={control.disabledReason}>
            <span>{control.label}</span>
            <small>{control.detail}</small>
          </button>
        ))}
      </div>

      <em>{readiness.actionLabel}</em>

      <style>{`
        .bm-meeting-controls-preview {
          border-radius: 14px;
          border: 1px solid rgba(148,163,184,0.10);
          background: rgba(2,7,22,0.44);
          padding: 9px;
          box-shadow: 0 0 24px rgba(34,211,238,0.05);
        }
        .bm-meeting-controls-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .bm-meeting-controls-head strong {
          color: #dbeafe;
          font-size: 11px;
          font-weight: 950;
        }
        .bm-meeting-controls-head span {
          color: #22d3ee;
          font-size: 8.5px;
          font-weight: 950;
        }
        .bm-meeting-controls-preview p {
          margin: 6px 0 0;
          color: #64748b;
          font-size: 8.5px;
          font-weight: 800;
          line-height: 1.45;
        }
        .bm-meeting-controls-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 5px;
          margin-top: 8px;
        }
        .bm-meeting-controls-grid button {
          min-height: 42px;
          border-radius: 12px;
          border: 1px solid rgba(148,163,184,0.11);
          background: rgba(148,163,184,0.055);
          color: #64748b;
          padding: 6px;
          text-align: right;
          cursor: not-allowed;
        }
        .bm-meeting-controls-grid button:first-child {
          grid-column: 1 / -1;
        }
        .bm-meeting-controls-grid span {
          display: block;
          color: #8ba3c7;
          font-size: 9px;
          font-weight: 950;
        }
        .bm-meeting-controls-grid small {
          display: block;
          margin-top: 3px;
          color: #4a6a8a;
          font-size: 7.6px;
          font-weight: 750;
          line-height: 1.35;
        }
        .bm-meeting-controls-preview em {
          display: block;
          margin-top: 7px;
          color: #64748b;
          font-size: 8.5px;
          font-style: normal;
          font-weight: 900;
          text-align: center;
        }
      `}</style>
    </section>
  );
}

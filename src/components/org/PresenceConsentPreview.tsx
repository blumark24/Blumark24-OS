"use client";

import type { PresenceConsentPolicy } from "@/lib/virtual-office/presenceConsentPolicy";

export interface PresenceConsentPreviewProps {
  policy: PresenceConsentPolicy;
}

export default function PresenceConsentPreview({ policy }: PresenceConsentPreviewProps) {
  return (
    <section className={`bm-presence-consent-preview is-${policy.status}`} aria-label="معاينة موافقة الحضور" dir="rtl">
      <div className="bm-presence-consent-head">
        <strong>{policy.title}</strong>
        <span>{policy.readyCount}/{policy.totalCount}</span>
      </div>

      <p>{policy.summary}</p>

      <div className="bm-presence-consent-grid">
        {policy.items.slice(0, 4).map((item) => (
          <small key={item.key} aria-label={`${item.label}: ${item.ready ? "جاهز" : "غير جاهز"}`}>
            {item.label}
          </small>
        ))}
      </div>

      <button type="button" disabled>{policy.actionLabel}</button>

      <style>{`
        .bm-presence-consent-preview {
          border-radius: 14px;
          border: 1px solid rgba(148,163,184,0.10);
          background: rgba(2,7,22,0.44);
          padding: 9px;
          box-shadow: 0 0 24px rgba(245,158,11,0.05);
        }
        .bm-presence-consent-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .bm-presence-consent-head strong {
          color: #dbeafe;
          font-size: 11px;
          font-weight: 950;
        }
        .bm-presence-consent-head span {
          color: #f59e0b;
          font-size: 8.5px;
          font-weight: 950;
        }
        .bm-presence-consent-preview p {
          margin: 6px 0 0;
          color: #64748b;
          font-size: 8.5px;
          font-weight: 800;
          line-height: 1.45;
        }
        .bm-presence-consent-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 4px;
          margin-top: 7px;
        }
        .bm-presence-consent-grid small {
          border-radius: 999px;
          border: 1px solid rgba(245,158,11,0.12);
          background: rgba(245,158,11,0.05);
          color: #8ba3c7;
          padding: 3px 6px;
          font-size: 7.8px;
          font-weight: 850;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .bm-presence-consent-preview button {
          width: 100%;
          margin-top: 7px;
          border: 1px solid rgba(148,163,184,0.11);
          background: rgba(148,163,184,0.06);
          color: #64748b;
          border-radius: 10px;
          padding: 6px 8px;
          font-size: 8.5px;
          font-weight: 950;
          cursor: not-allowed;
        }
      `}</style>
    </section>
  );
}

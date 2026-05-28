"use client";

import { COMPANY_LABEL_AR } from "@/lib/tenant/companyDisplay";

export function CompanyNameLine({
  companyName,
  className = "text-[10px] text-[#8ba3c7] truncate mt-0.5",
}: {
  companyName: string;
  className?: string;
}) {
  return (
    <p className={className} title={`${COMPANY_LABEL_AR}: ${companyName}`}>
      <span className="text-[#6b87ab]">{COMPANY_LABEL_AR}: </span>
      <span className="text-[#a8bdd9]">{companyName}</span>
    </p>
  );
}

"use client";

import { useState } from "react";
import { X, UserPlus } from "lucide-react";
import type { Employee } from "@/types";
import type { Department, Team } from "@/lib/org/types";

interface Props {
  employees: Employee[];
  departments: Department[];
  teams: Team[];
  defaultDepartmentId?: string;
  onAssign: (input: {
    employee_id: string;
    department_id: string | null;
    team_id: string | null;
  }) => Promise<void>;
  onClose: () => void;
}

export default function AssignEmployeeModal({
  employees,
  departments,
  teams,
  defaultDepartmentId,
  onAssign,
  onClose,
}: Props) {
  const [employeeId, setEmployeeId] = useState("");
  const [departmentId, setDepartmentId] = useState(defaultDepartmentId ?? "");
  const [teamId, setTeamId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const deptTeams = teams.filter((t) => t.department_id === departmentId);

  const handleSubmit = async () => {
    if (!employeeId) {
      setError("اختر موظفاً");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onAssign({
        employee_id: employeeId,
        department_id: departmentId || null,
        team_id: teamId || null,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر ربط الموظف");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-heading font-bold flex items-center gap-2">
            <UserPlus size={18} className="text-[#22d3ee]" />
            ربط موظف
          </h3>
          <button type="button" onClick={onClose} className="text-[#8ba3c7]">
            <X size={18} />
          </button>
        </div>
        <div>
          <label className="text-xs text-[#8ba3c7] block mb-1">الموظف *</label>
          <select
            className="input-dark w-full text-sm"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          >
            <option value="">— اختر —</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} {e.email ? `(${e.email})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-[#8ba3c7] block mb-1">القسم / الإدارة</label>
          <select
            className="input-dark w-full text-sm"
            value={departmentId}
            onChange={(e) => {
              setDepartmentId(e.target.value);
              setTeamId("");
            }}
          >
            <option value="">— بدون —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        {deptTeams.length > 0 && (
          <div>
            <label className="text-xs text-[#8ba3c7] block mb-1">الفريق (اختياري)</label>
            <select
              className="input-dark w-full text-sm"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
            >
              <option value="">— بدون فريق —</option>
              {deptTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={saving}
          className="btn-primary w-full min-h-11"
        >
          حفظ الربط
        </button>
      </div>
    </div>
  );
}

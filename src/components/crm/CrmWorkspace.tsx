"use client";

import { useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { UserCircle, Kanban, AlertCircle } from "lucide-react";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useClients, useTasks } from "@/hooks/useData";
import { useCrm } from "@/hooks/useCrm";
import { useToast } from "@/contexts/ToastContext";
import { logCrmActivity } from "@/lib/crm/db";
import { fireAutomationEvent } from "@/lib/automation/client";
import DealPipeline from "@/components/crm/DealPipeline";
import CrmClientsTab from "@/components/crm/CrmClientsTab";
import CrmRevenueTab from "@/components/crm/CrmRevenueTab";
import ClientDetailPanel from "@/components/crm/ClientDetailPanel";
import type { Client } from "@/types";

type TabId = "pipeline" | "clients" | "revenue";

const TABS: { id: TabId; label: string; icon: typeof Kanban }[] = [
  { id: "pipeline", label: "خط الأنابيب", icon: Kanban },
  { id: "clients", label: "العملاء", icon: UserCircle },
  { id: "revenue", label: "الإيرادات", icon: UserCircle },
];

export default function CrmWorkspace() {
  const { hasPermission } = usePermissions();
  const { user } = useAuth();
  const toast = useToast();
  const canManage = hasPermission("manage_clients");

  const authorName = user?.name?.trim() || user?.email?.split("@")[0] || "مستخدم";

  const { data: clients, loading: clientsLoading, insert, update, remove } = useClients();
  const { data: tasks } = useTasks();
  const crmEnabled = canManage || clients.length > 0;
  const { snapshot, loading: crmLoading, error: crmError, refresh, ...crm } = useCrm(crmEnabled);

  const [tab, setTab] = useState<TabId>("pipeline");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const selectedFromList = useMemo(
    () => (selectedClient ? clients.find((c) => c.id === selectedClient.id) ?? selectedClient : null),
    [clients, selectedClient],
  );

  const openClient = (client: Client) => setSelectedClient(client);
  const openClientById = (id: string) => {
    const c = clients.find((x) => x.id === id);
    if (c) setSelectedClient(c);
  };

  const handleInsert = async (item: Omit<Client, "id" | "createdAt">) => {
    try {
      await insert({ ...item, accountManagerId: user?.id ?? item.accountManagerId });
      await refresh();
      toast.success("تمت إضافة العميل");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذر إضافة العميل");
      throw e;
    }
  };

  const handleUpdate = async (id: string, changes: Partial<Client>) => {
    try {
      await update(id, changes);
      await refresh();
      await logCrmActivity({
        client_id: id,
        activity_type: "client",
        title: "تحديث بيانات العميل",
        author_name: authorName,
      });
      toast.success("تم تحديث العميل");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذر تحديث العميل");
      throw e;
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await remove(id);
      await refresh();
      if (selectedClient?.id === id) setSelectedClient(null);
      toast.success("تم حذف العميل");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذر حذف العميل");
      throw e;
    }
  };

  const migrationHint =
    crmError &&
    (crmError.includes("does not exist") ||
      crmError.includes("relation") ||
      crmError.includes("crm_"));

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-white flex items-center gap-2">
            <UserCircle size={22} className="text-[#22d3ee]" />
            إدارة العملاء (CRM)
          </h1>
          <p className="text-[#8ba3c7] text-sm mt-1">
            صفقات، عملاء، عقود، تذكيرات، وجدول زمني — معزولة لكل منشأة
          </p>
        </div>

        {crmError && (
          <div className="glass-card p-4 flex gap-3 border border-amber-500/30">
            <AlertCircle className="text-amber-400 flex-shrink-0" size={20} />
            <div>
              <p className="text-white text-sm font-medium">تعذر تحميل بيانات CRM</p>
              <p className="text-[#8ba3c7] text-xs mt-1">{crmError}</p>
              {migrationHint && (
                <p className="text-[#22d3ee] text-xs mt-2">
                  طبّق migration 020_tenant_crm_system.sql في Supabase ثم أعد تحميل الصفحة.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                tab === id
                  ? "bg-[#22d3ee] text-[#0a1628]"
                  : "bg-[#1a3356]/50 text-[#8ba3c7] hover:text-white"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {tab === "pipeline" && (
          <>
            {(crmLoading || clientsLoading) && !snapshot && (
              <p className="text-center text-[#8ba3c7] text-sm py-8">جارٍ تحميل خط الأنابيب...</p>
            )}
            {snapshot && (
              <DealPipeline
                snapshot={snapshot}
                clients={clients}
                canManage={canManage}
                authorName={authorName}
                onMoveDeal={async (deal, stage) => {
                  await crm.moveDeal(deal, stage, authorName);
                  void fireAutomationEvent("crm.deal_stage_changed", {
                    deal_id: deal.id,
                    client_id: deal.client_id,
                    stage_name: stage.name,
                    author_name: authorName,
                  });
                  if (stage.is_closed_won) {
                    void fireAutomationEvent("crm.deal_won", {
                      deal_id: deal.id,
                      client_id: deal.client_id,
                      value: deal.value,
                      title: deal.title,
                      author_name: authorName,
                    });
                  }
                }}
                onCreateDeal={async (input) => {
                  await crm.createDeal({ ...input, author_name: authorName });
                  toast.success("تم إنشاء الصفقة");
                  void fireAutomationEvent("crm.deal_created", { client_id: input.client_id, title: input.title, value: input.value, author_name: authorName });
                }}
                onSelectClient={openClientById}
              />
            )}
            {!crmLoading && !crmError && snapshot && snapshot.deals.length === 0 && clients.length === 0 && (
              <p className="text-center text-[#8ba3c7] text-sm py-4">
                لم يتم إعداد بيانات هذه المنشأة بعد — أضف عميلاً ثم صفقة لبدء خط الأنابيب.
              </p>
            )}
          </>
        )}

        {tab === "clients" && (
          <CrmClientsTab
            clients={clients}
            loading={clientsLoading}
            canManage={canManage}
            onSelect={openClient}
            onInsert={handleInsert}
            onUpdate={handleUpdate}
            onRemove={handleRemove}
          />
        )}

        {tab === "revenue" && snapshot && <CrmRevenueTab snapshot={snapshot} clients={clients} />}
        {tab === "revenue" && !snapshot && !crmLoading && (
          <p className="text-center text-[#8ba3c7] text-sm py-8">لا تتوفر بيانات الإيرادات حتى يُحمّل CRM</p>
        )}
      </div>

      {selectedFromList && snapshot && (
        <ClientDetailPanel
          client={selectedFromList}
          snapshot={snapshot}
          tasks={tasks}
          canManage={canManage}
          authorName={authorName}
          onClose={() => setSelectedClient(null)}
          onAddNote={async (body) => {
            await crm.addNote({
              client_id: selectedFromList.id,
              body,
              author_name: authorName,
            });
            toast.success("تمت إضافة الملاحظة");
          }}
          onAddReminder={async (title, dueAt) => {
            await crm.addReminder({
              client_id: selectedFromList.id,
              title,
              due_at: dueAt,
            });
            toast.success("تمت إضافة التذكير");
          }}
          onToggleReminder={(id, done) => crm.setReminderDone(id, done)}
          onAddContract={async (input) => {
            await crm.addContract({
              client_id: selectedFromList.id,
              title: input.title,
              package_type: input.package_type,
              contract_value: input.contract_value,
              author_name: authorName,
            });
            toast.success("تم تسجيل العقد");
          }}
        />
      )}
    </DashboardLayout>
  );
}

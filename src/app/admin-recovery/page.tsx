"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, AlertTriangle, ShieldOff } from "lucide-react";

export default function AdminRecoveryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth");
    }
  }, [loading, user, router]);

  if (loading || !user) return null;

  if (user.role !== "super_admin") {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <ShieldOff size={28} className="text-red-400" />
          </div>
          <h2 className="text-white text-xl font-heading font-bold">لا تملك صلاحية الوصول</h2>
          <p className="text-[#8ba3c7] text-sm max-w-xs">
            هذا القسم محجوز للمديرين الأعلى فقط.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(245,158,11,0.12)" }}
          >
            <Shield size={20} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-white">لوحة الاسترداد الإدارية</h1>
            <p className="text-[#8ba3c7] text-sm mt-0.5">وصول طارئ — للمديرين الأعلى فقط</p>
          </div>
        </div>

        <div className="glass-card p-8 text-center space-y-4 border border-amber-500/20">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto">
            <AlertTriangle size={28} className="text-amber-400" />
          </div>
          <h2 className="text-white font-heading font-bold text-lg">قيد الإنشاء</h2>
          <p className="text-[#8ba3c7] text-sm max-w-sm mx-auto">
            هذه الصفحة للطوارئ فقط وسيتم تفعيل أدوات الاسترداد في المرحلة التالية.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getAllProfiles, updateProfileRole, toggleProfileStatus } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole =
  | "super_admin"
  | "board_member"
  | "defense_manager"
  | "attack_manager"
  | "finance_manager"
  | "employee";

export type Permission =
  | "view_dashboard"
  | "manage_board"
  | "manage_users"
  | "manage_roles"
  | "manage_tasks"
  | "manage_clients"
  | "manage_finance"
  | "manage_reports"
  | "manage_settings"
  | "manage_automations";

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin:      "مدير أعلى",
  board_member:     "عضو مجلس الإدارة",
  defense_manager:  "مدير وكالة الدفاع",
  attack_manager:   "مدير وكالة الهجوم",
  finance_manager:  "مدير مالي",
  employee:         "موظف",
};

export const PERMISSION_LABELS: Record<Permission, string> = {
  view_dashboard:    "عرض لوحة التحكم",
  manage_board:      "إدارة مجلس الإدارة",
  manage_users:      "إدارة المستخدمين",
  manage_roles:      "إدارة الأدوار",
  manage_tasks:      "إدارة المهام",
  manage_clients:    "إدارة العملاء",
  manage_finance:    "إدارة المالية",
  manage_reports:    "عرض التقارير",
  manage_settings:   "إدارة الإعدادات",
  manage_automations:"إدارة الأتمتة",
};

export const ALL_PERMISSIONS: Permission[] = [
  "view_dashboard",
  "manage_board",
  "manage_users",
  "manage_roles",
  "manage_tasks",
  "manage_clients",
  "manage_finance",
  "manage_reports",
  "manage_settings",
  "manage_automations",
];

export const ALL_ROLES: UserRole[] = [
  "super_admin",
  "board_member",
  "defense_manager",
  "attack_manager",
  "finance_manager",
  "employee",
];

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [...ALL_PERMISSIONS],
  board_member: [
    "view_dashboard",
    "manage_board",
    "manage_reports",
    "manage_finance",
  ],
  defense_manager: [
    "view_dashboard",
    "manage_board",
    "manage_users",
    "manage_tasks",
    "manage_reports",
    "manage_automations",
  ],
  attack_manager: [
    "view_dashboard",
    "manage_clients",
    "manage_tasks",
    "manage_reports",
  ],
  finance_manager: [
    "view_dashboard",
    "manage_finance",
    "manage_reports",
  ],
  employee: [
    "view_dashboard",
    "manage_tasks",
  ],
};

export function mapAuthRoleToUserRole(role: string): UserRole {
  switch (role) {
    case "مدير_عام":
    case "super_admin":      return "super_admin";
    case "مدير_مالي":
    case "finance_manager":  return "finance_manager";
    case "مدير_مبيعات":
    case "attack_manager":   return "attack_manager";
    case "مدير":
    case "defense_manager":  return "defense_manager";
    case "board_member":     return "board_member";
    default:                 return "employee";
  }
}

export interface ManagedUser {
  userId:     string;
  email:      string;
  name:       string;
  role:       UserRole;
  isActive:   boolean;
  department: string;
}

const DEFAULT_MANAGED_USERS: ManagedUser[] = [
  { userId: "1", email: "admin@blumark24.com",   name: "أحمد محمد",  role: "super_admin",    isActive: true, department: "الإدارة العليا" },
  { userId: "2", email: "finance@blumark24.com", name: "فاطمة خالد", role: "finance_manager", isActive: true, department: "وكالة الدفاع"  },
  { userId: "3", email: "sales@blumark24.com",   name: "سارة أحمد",  role: "attack_manager",  isActive: true, department: "وكالة الهجوم"  },
];

// ─── Context value ────────────────────────────────────────────────────────────

interface PermissionsContextValue {
  userRole:             UserRole;
  hasPermission:        (perm: Permission) => boolean;
  managedUsers:         ManagedUser[];
  rolePermissions:      Record<UserRole, Permission[]>;
  updateUserRole:       (userId: string, role: UserRole) => void;
  toggleUserStatus:     (userId: string) => void;
  addManagedUser:       (user: Omit<ManagedUser, "userId">) => void;
  updateRolePermissions:(role: UserRole, perms: Permission[]) => void;
  saveAll:              () => void;
}

const PermissionsContext = createContext<PermissionsContextValue>({
  userRole:             "employee",
  hasPermission:        () => false,
  managedUsers:         DEFAULT_MANAGED_USERS,
  rolePermissions:      DEFAULT_ROLE_PERMISSIONS,
  updateUserRole:       () => {},
  toggleUserStatus:     () => {},
  addManagedUser:       () => {},
  updateRolePermissions:() => {},
  saveAll:              () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [managedUsers,    setManagedUsers]    = useState<ManagedUser[]>(DEFAULT_MANAGED_USERS);
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, Permission[]>>(DEFAULT_ROLE_PERMISSIONS);

  // Load managed users from Supabase profiles when configured
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    getAllProfiles().then((profiles) => {
      if (!profiles.length) return;
      setManagedUsers(
        profiles.map((p) => ({
          userId:     p.id,
          email:      p.email,
          name:       p.name,
          role:       mapAuthRoleToUserRole(p.role),
          isActive:   p.is_active,
          department: p.department,
        }))
      );
    });
  }, []);

  const currentRecord = managedUsers.find(
    (u) => u.userId === user?.id || u.email === user?.email
  );
  const userRole: UserRole =
    currentRecord?.role ?? mapAuthRoleToUserRole(user?.role ?? "");

  const hasPermission = useCallback(
    (perm: Permission) => (rolePermissions[userRole] ?? []).includes(perm),
    [userRole, rolePermissions]
  );

  const updateUserRole = useCallback(
    (userId: string, role: UserRole) => {
      setManagedUsers((prev) => prev.map((u) => (u.userId === userId ? { ...u, role } : u)));
      if (isSupabaseConfigured) {
        updateProfileRole(userId, role).catch(console.error);
      }
    },
    []
  );

  const toggleUserStatus = useCallback(
    (userId: string) => {
      setManagedUsers((prev) => {
        const next = prev.map((u) =>
          u.userId === userId ? { ...u, isActive: !u.isActive } : u
        );
        if (isSupabaseConfigured) {
          const updated = next.find((u) => u.userId === userId);
          if (updated) toggleProfileStatus(userId, updated.isActive).catch(console.error);
        }
        return next;
      });
    },
    []
  );

  const addManagedUser = useCallback(
    (u: Omit<ManagedUser, "userId">) => {
      const newUser: ManagedUser = { ...u, userId: Date.now().toString() };
      setManagedUsers((prev) => [...prev, newUser]);
    },
    []
  );

  const updateRolePermissions = useCallback(
    (role: UserRole, perms: Permission[]) => {
      setRolePermissions((prev) => ({ ...prev, [role]: perms }));
    },
    []
  );

  const saveAll = useCallback(() => {
    // Role permissions are in-memory only; user roles are already synced to DB per-update
  }, []);

  return (
    <PermissionsContext.Provider
      value={{
        userRole,
        hasPermission,
        managedUsers,
        rolePermissions,
        updateUserRole,
        toggleUserStatus,
        addManagedUser,
        updateRolePermissions,
        saveAll,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  return useContext(PermissionsContext);
}

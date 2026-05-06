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
import { getAllProfiles, updateProfileRole, toggleProfileStatus } from "@/lib/db";
import { supabase } from "@/lib/supabase";

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

// ─── Context value ────────────────────────────────────────────────────────────

interface PermissionsContextValue {
  userRole:              UserRole;
  hasPermission:         (perm: Permission) => boolean;
  managedUsers:          ManagedUser[];
  rolePermissions:       Record<UserRole, Permission[]>;
  updateUserRole:        (userId: string, role: UserRole) => void;
  toggleUserStatus:      (userId: string) => void;
  addManagedUser:        (user: Omit<ManagedUser, "userId">) => void;
  updateRolePermissions: (role: UserRole, perms: Permission[]) => void;
  /** Save current rolePermissions state to DB */
  saveAll:               () => Promise<void>;
  /**
   * Update all permissions from `perms` (bypasses React state lag) and
   * persist to DB atomically.  Use this from the settings save handler.
   */
  savePermissions:       (perms: Record<UserRole, Permission[]>) => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextValue>({
  userRole:              "employee",
  hasPermission:         () => false,
  managedUsers:          [],
  rolePermissions:       DEFAULT_ROLE_PERMISSIONS,
  updateUserRole:        () => {},
  toggleUserStatus:      () => {},
  addManagedUser:        () => {},
  updateRolePermissions: () => {},
  saveAll:               async () => {},
  savePermissions:       async () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [managedUsers,    setManagedUsers]    = useState<ManagedUser[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, Permission[]>>(DEFAULT_ROLE_PERMISSIONS);

  // Load managed users from Supabase profiles — re-run when user signs in
  useEffect(() => {
    if (!user?.id) return;
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
    }).catch(console.error);
  }, [user?.id]);

  // Load persisted role permissions from DB
  useEffect(() => {
    if (!user?.id) return;
    Promise.resolve(
      supabase.from("role_permissions").select("role, permissions")
    ).then(({ data }) => {
      if (!data?.length) return;
      const loaded: Partial<Record<UserRole, Permission[]>> = {};
      data.forEach((row: { role: string; permissions: string[] }) => {
        const r = row.role as UserRole;
        if (ALL_ROLES.includes(r)) {
          loaded[r] = (row.permissions as Permission[]).filter((p) => ALL_PERMISSIONS.includes(p));
        }
      });
      if (Object.keys(loaded).length > 0) {
        setRolePermissions((prev) => ({ ...prev, ...loaded }));
      }
    }).catch(() => {}); // silently fall back to defaults
  }, [user?.id]);

  // ── userRole: single authoritative source is user.role from AuthContext
  //    (which reads directly from profiles table by auth user id).
  //    managedUsers is used only for the admin panel — never to determine
  //    the current user's own role, to avoid async race conditions.
  const userRole: UserRole = mapAuthRoleToUserRole(user?.role ?? "");

  const hasPermission = useCallback(
    (perm: Permission) => {
      if (userRole === "super_admin") return true;
      return (rolePermissions[userRole] ?? []).includes(perm);
    },
    [userRole, rolePermissions]
  );

  const updateUserRole = useCallback(
    (userId: string, role: UserRole) => {
      setManagedUsers((prev) => prev.map((u) => (u.userId === userId ? { ...u, role } : u)));
      updateProfileRole(userId, role).catch(console.error);
    },
    []
  );

  const toggleUserStatus = useCallback(
    (userId: string) => {
      setManagedUsers((prev) => {
        const next = prev.map((u) =>
          u.userId === userId ? { ...u, isActive: !u.isActive } : u
        );
        const updated = next.find((u) => u.userId === userId);
        if (updated) toggleProfileStatus(userId, updated.isActive).catch(console.error);
        return next;
      });
    },
    []
  );

  const addManagedUser = useCallback(
    (u: Omit<ManagedUser, "userId">) => {
      setManagedUsers((prev) => [...prev, { ...u, userId: Date.now().toString() }]);
    },
    []
  );

  const updateRolePermissions = useCallback(
    (role: UserRole, perms: Permission[]) => {
      setRolePermissions((prev) => ({ ...prev, [role]: perms }));
    },
    []
  );

  // Persist all role permissions to DB using the current state
  const saveAll = useCallback(async () => {
    const rows = ALL_ROLES.map((role) => ({
      role,
      permissions: rolePermissions[role] ?? [],
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from("role_permissions").upsert(rows, { onConflict: "role" });
    if (error) throw new Error(error.message);
  }, [rolePermissions]);

  // Persist permissions from an explicit map (avoids React state lag when called
  // immediately after multiple updateRolePermissions() calls)
  const savePermissions = useCallback(async (perms: Record<UserRole, Permission[]>) => {
    // Update state for all roles
    setRolePermissions((prev) => ({ ...prev, ...perms }));
    // Persist directly from the provided map — no state read lag
    const rows = ALL_ROLES.map((role) => ({
      role,
      permissions: perms[role] ?? [],
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from("role_permissions").upsert(rows, { onConflict: "role" });
    if (error) throw new Error(error.message);
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
        savePermissions,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  return useContext(PermissionsContext);
}

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
import { withSoftTimeout } from "@/lib/asyncHelpers";

// Background queries in this provider must never block Sidebar/Header
// from rendering.  Soft timeout = resolve with undefined on expiry.
const PERMS_QUERY_TIMEOUT = 6_000;

// ─── Types ───────────────────────────────────────────────────────────[...]

export type UserRole =
  | "super_admin"
  | "board_member"
  | "defense_manager"
  | "attack_manager"
  | "finance_manager"
  | "organization_manager"
  | "employee";

export type Permission =
  | "view_dashboard"
  | "view_employees"
  | "manage_board"
  | "manage_users"
  | "manage_roles"
  | "manage_tasks"
  | "manage_clients"
  | "manage_finance"
  | "manage_reports"
  | "manage_settings"
  | "manage_automations";

// Flexible labels mapping — keep labels for known internal roles,
// also include friendly labels for 'admin' / 'manager' strings.
export const ROLE_LABELS: Record<string, string> = {
  super_admin:         "مدير أعلى",
  board_chairman:      "رئيس مجلس الإدارة",
  general_manager:     "المدير العام",
  department_manager:  "مدير القسم",
  board_member:        "عضو مجلس الإدارة",
  defense_manager:     "مدير وكالة الدفاع",
  attack_manager:      "مدير وكالة الهجوم",
  finance_manager:     "مدير مالي",
  organization_manager:"مدير المنشأة",
  admin:               "مدير",
  manager:             "مدير قسم",
  employee:            "موظف",
};

export const PERMISSION_LABELS: Record<Permission, string> = {
  view_dashboard:    "عرض لوحة التحكم",
  view_employees:    "عرض الموظفين",
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
  "view_employees",
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
  "organization_manager",
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
  // Tenant manager ("مدير المنشأة"): the establishment-level admin of a single
  // customer organization. Broad in-org access, but never internal-only modules
  // (user management, automations, system settings). RLS confines every query
  // to the manager's own organization_id.
  organization_manager: [
    "view_dashboard",
    "view_employees",
    "manage_board",
    "manage_tasks",
    "manage_clients",
    "manage_finance",
    "manage_reports",
  ],
  employee: [
    "view_dashboard",
    "manage_tasks",
  ],
};

export function mapAuthRoleToUserRole(role: string): UserRole {
  const normalizedRole = String(role ?? "").trim();

  switch (normalizedRole) {
    case "super_admin":
    case "board_chairman":
    case "general_manager":
    case "مدير_عام":
      return "super_admin";
    case "admin":
      return "super_admin";
    case "department_manager":
    case "manager":
    case "مدير_قسم":
      return "defense_manager";
    case "finance_manager":
    case "مدير_مالي":
      return "finance_manager";
    case "attack_manager":
    case "مدير_مبيعات":
      return "attack_manager";
    case "organization_manager":
    case "مدير_المنشأة":
    case "مدير المنشأة":
    case "tenant_manager":
    case "owner":
      return "organization_manager";
    case "defense_manager":
    case "مدير":
      return "defense_manager";
    case "board_member":
      return "board_member";
    default:
      return "employee";
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

// ─── Context value ────────────────────────────────────────────────────────[...]

interface PermissionsContextValue {
  /**
   * The current user's effective role.  `null` means we have not yet resolved
   * a profile for the authenticated user (initial bootstrap, or profile load
   * error).  Consumers must NOT treat null as "employee".
   */
  userRole:              UserRole | null;
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
  userRole:              null,
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

// ─── Provider ─────────────────────────────────────────────────────────��[...]

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [managedUsers,    setManagedUsers]    = useState<ManagedUser[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, Permission[]>>(DEFAULT_ROLE_PERMISSIONS);

  // Load managed users from Supabase profiles — re-run when user signs in.
  // Wrapped in withSoftTimeout so a slow Supabase never stalls the
  // Sidebar/Header consumers of PermissionsContext.
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    withSoftTimeout(getAllProfiles(), PERMS_QUERY_TIMEOUT)
      .then((profiles) => {
        if (cancelled || !profiles?.length) return;
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
      })
      .catch(() => { /* silent — keep current managedUsers */ });
    return () => { cancelled = true; };
  }, [user?.id]);

  // Load persisted role permissions from DB.  Soft timeout — if Supabase
  // is slow we silently fall back to DEFAULT_ROLE_PERMISSIONS.
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    withSoftTimeout(
      Promise.resolve(supabase.from("role_permissions").select("role, permissions")),
      PERMS_QUERY_TIMEOUT,
    )
      .then((res) => {
        if (cancelled) return;
        const data = res?.data as { role: string; permissions: string[] }[] | undefined;
        if (!data?.length) return;
        const loaded: Partial<Record<UserRole, Permission[]>> = {};
        data.forEach((row) => {
          const r = row.role as UserRole;
          if (ALL_ROLES.includes(r)) {
            loaded[r] = (row.permissions as Permission[]).filter((p) => ALL_PERMISSIONS.includes(p));
          }
        });
        if (Object.keys(loaded).length > 0) {
          setRolePermissions((prev) => ({ ...prev, ...loaded }));
        }
      })
      .catch(() => { /* silent — defaults remain */ });
    return () => { cancelled = true; };
  }, [user?.id]);

  // ── userRole: single authoritative source is user.role from AuthContext
  //    (which reads directly from profiles table by auth user id).
  //    managedUsers is used only for the admin panel — never to determine
  //    the current user's own role, to avoid async race conditions.
  // We deliberately do NOT default to "employee" while AuthContext is still
  // resolving the profile — that would cause a brief flash of limited
  // permissions for super_admin on hard refresh.  `null` means "unknown".
  const userRole: UserRole | null = user?.role
    ? mapAuthRoleToUserRole(user.role)
    : null;

  const hasPermission = useCallback(
    (perm: Permission) => {
      if (!userRole) return false;
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

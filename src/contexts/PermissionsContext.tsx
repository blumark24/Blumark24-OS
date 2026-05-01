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
    case "مدير_عام":      return "super_admin";
    case "مدير_مالي":    return "finance_manager";
    case "مدير_مبيعات": return "attack_manager";
    case "مدير":          return "defense_manager";
    case "board_member":  return "board_member";
    default:              return "employee";
  }
}

// ─── User permission records (managed in settings) ────────────────────────────

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

const STORAGE_KEY = "blumark24_permissions_v2";

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [managedUsers,    setManagedUsers]    = useState<ManagedUser[]>(DEFAULT_MANAGED_USERS);
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, Permission[]>>(DEFAULT_ROLE_PERMISSIONS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { users?: ManagedUser[]; rolePermissions?: Record<UserRole, Permission[]> };
        if (saved.users)           setManagedUsers(saved.users);
        if (saved.rolePermissions) setRolePermissions(saved.rolePermissions);
      }
    } catch { /* ignore parse errors */ }
  }, []);

  const persist = useCallback(
    (u: ManagedUser[], rp: Record<UserRole, Permission[]>) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ users: u, rolePermissions: rp }));
      } catch { /* ignore */ }
    },
    []
  );

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
      setManagedUsers((prev) => {
        const next = prev.map((u) => (u.userId === userId ? { ...u, role } : u));
        persist(next, rolePermissions);
        return next;
      });
    },
    [rolePermissions, persist]
  );

  const toggleUserStatus = useCallback(
    (userId: string) => {
      setManagedUsers((prev) => {
        const next = prev.map((u) =>
          u.userId === userId ? { ...u, isActive: !u.isActive } : u
        );
        persist(next, rolePermissions);
        return next;
      });
    },
    [rolePermissions, persist]
  );

  const addManagedUser = useCallback(
    (u: Omit<ManagedUser, "userId">) => {
      const newUser: ManagedUser = { ...u, userId: Date.now().toString() };
      setManagedUsers((prev) => {
        const next = [...prev, newUser];
        persist(next, rolePermissions);
        return next;
      });
    },
    [rolePermissions, persist]
  );

  const updateRolePermissions = useCallback(
    (role: UserRole, perms: Permission[]) => {
      setRolePermissions((prev) => {
        const next = { ...prev, [role]: perms };
        persist(managedUsers, next);
        return next;
      });
    },
    [managedUsers, persist]
  );

  const saveAll = useCallback(() => {
    persist(managedUsers, rolePermissions);
  }, [managedUsers, rolePermissions, persist]);

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

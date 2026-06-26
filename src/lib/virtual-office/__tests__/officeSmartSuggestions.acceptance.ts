import {
  buildOfficeSmartSuggestions,
  firstOfficeSmartSuggestion,
} from "../officeSmartSuggestions";

export function assertOfficeSmartSuggestions(): boolean {
  const unassigned = firstOfficeSmartSuggestion({ officeNumber: 9, isUnassigned: true });
  const restricted = firstOfficeSmartSuggestion({ officeNumber: 1, canViewOperationalData: false });
  const board = firstOfficeSmartSuggestion({ officeNumber: 5, isBoard: true, canViewOperationalData: true });
  const overdue = firstOfficeSmartSuggestion({
    officeNumber: 1,
    canViewOperationalData: true,
    employeeCount: 3,
    openTaskCount: 5,
    overdueTaskCount: 3,
  });
  const healthy = firstOfficeSmartSuggestion({
    officeNumber: 2,
    canViewOperationalData: true,
    employeeCount: 4,
    openTaskCount: 0,
    overdueTaskCount: 0,
    healthPct: 90,
  });
  const openTasks = buildOfficeSmartSuggestions({
    officeNumber: 3,
    canViewOperationalData: true,
    employeeCount: 2,
    openTaskCount: 2,
    overdueTaskCount: 0,
  });

  return (
    unassigned.kind === "link_required" &&
    unassigned.blocked === false &&
    restricted.kind === "restricted" &&
    restricted.blocked === true &&
    board.kind === "board_summary" &&
    overdue.kind === "overdue_tasks" &&
    overdue.severity === "critical" &&
    healthy.kind === "healthy" &&
    healthy.severity === "success" &&
    openTasks.length === 1 &&
    openTasks[0].kind === "open_tasks"
  );
}

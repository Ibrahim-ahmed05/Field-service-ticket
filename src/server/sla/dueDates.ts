import { Ticket, TicketPriority, TicketStatus } from "../types/field-service";

// Configurable Priority-to-Hours SLA Mapping
export const DEFAULT_SLA_HOURS: Record<TicketPriority, number> = {
  Urgent: 4,
  High: 24, // 1 day
  Medium: 72, // 3 days
  Low: 168, // 7 days
};

/**
 * Calculates default due date based on priority and created timestamp
 */
export function calculateDueDate(priority: TicketPriority, createdAt: Date = new Date()): string {
  const hoursToAdd = DEFAULT_SLA_HOURS[priority] ?? DEFAULT_SLA_HOURS.Medium;
  const dueDateMs = createdAt.getTime() + hoursToAdd * 60 * 60 * 1000;
  return new Date(dueDateMs).toISOString();
}

/**
 * Checks if a ticket is overdue.
 * Specification Rule:
 * "A ticket is overdue when its dueDate has passed and its status is not
 * Resolved, Closed, Cancelled, or Rejected. Overdue is a calculated flag,
 * not a status of its own, so a ticket can be both In Progress and overdue at the same time."
 */
export function isTicketOverdue(
  dueDateStr: string,
  status: TicketStatus,
  asOf: Date = new Date(),
): boolean {
  // Non-actionable or final statuses are not marked overdue
  const excludedStatuses: TicketStatus[] = ["Resolved", "Closed", "Cancelled", "Rejected"];
  if (excludedStatuses.includes(status)) {
    return false;
  }

  const dueTime = new Date(dueDateStr).getTime();
  const currentTime = asOf.getTime();
  return currentTime > dueTime;
}

/**
 * Augments a ticket object with dynamic isOverdue calculated flag
 */
export function withOverdueFlag(ticket: Ticket, asOf: Date = new Date()): Ticket {
  return {
    ...ticket,
    isOverdue: isTicketOverdue(ticket.dueDate, ticket.status, asOf),
  };
}

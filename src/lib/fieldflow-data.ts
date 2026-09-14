export const BRAND = {
  name: "FieldFlow",
  tagline: "Field service operations, unified.",
};

export type UserRole = "manager" | "technician" | "customer";

export type TicketStatus =
  | "New"
  | "Assigned"
  | "In Progress"
  | "Waiting"
  | "Resolved"
  | "Closed"
  | "Cancelled"
  | "Rejected";

export type Priority = "Low" | "Medium" | "High" | "Urgent";

export type Category =
  | "Solar"
  | "HVAC"
  | "Electrical"
  | "Industrial Equipment"
  | "Facility Maintenance"
  | "Other";

export type TechnicianStatus = "Available" | "On Site" | "Travelling" | "Off Duty";

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  companyId: string;
};

export type Site = {
  id: string;
  customerId: string;
  name: string;
  address: string;
  siteType: string;
  companyId: string;
};

export type Equipment = {
  id: string;
  siteId: string;
  equipmentType: string;
  model: string;
  serialNumber: string;
  installDate: string;
};

export type Technician = {
  id: string;
  name: string;
  initials: string;
  phone: string;
  email: string;
  skillSet: string[];
  specialization: string;
  active: boolean;
  status: TechnicianStatus;
  activeJobs: number;
  completedToday: number;
  region: string;
  rating: number;
  completionRate: number;
  companyId: string;
};

export type TicketHistory = {
  id: string;
  ticketId: string;
  fromStatus: TicketStatus | null;
  toStatus: TicketStatus;
  changedBy: string;
  changedAt: string;
  note?: string;
};

export type Attachment = {
  id: string;
  ticketId: string;
  name: string;
  uploadedBy: string;
  fileUrl: string;
  fileType: "image/jpeg" | "image/png" | "application/pdf";
  fileSize: string;
  uploadedAt: string;
  customerVisible: boolean;
  tone?: "before" | "issue" | "fix" | "after";
};

export type NotificationLog = {
  id: string;
  ticketId: string;
  channel: "Email" | "SMS" | "WhatsApp" | "DevLog";
  recipient: string;
  status: "Sent" | "Delivered" | "Logged";
  sentAt: string;
  triggerEvent:
    | "Ticket created"
    | "Technician assigned"
    | "Status changed to In Progress"
    | "Status changed to Resolved"
    | "Status changed to Closed"
    | "Ticket cancelled";
  messagePreview: string;
};

export type Note = {
  id: string;
  ticketId: string;
  author: string;
  authorRole: UserRole;
  time: string;
  body: string;
  internal: boolean;
};

export type Ticket = {
  id: string;
  companyId: string;
  customerId: string;
  customerName: string;
  siteId: string;
  siteName: string;
  siteAddress: string;
  equipmentId?: string;
  equipmentModel?: string;
  contact: { name: string; phone: string; email?: string };
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: TicketStatus;
  assignedTechnicianId: string | null;
  createdBy: string;
  createdAt: string;
  dueDate: string;
  workInstructions: string[];
  resolution?: string;
};

// Default SLA configuration per Architecture Doc (Section 8)
export const SLA_HOURS: Record<Priority, number> = {
  Urgent: 4, // 4 hours
  High: 24, // 1 day
  Medium: 72, // 3 days
  Low: 168, // 7 days
};

export const calculateDueDate = (createdAt: string, priority: Priority): string => {
  const created = new Date(createdAt);
  const hours = SLA_HOURS[priority] || 72;
  const due = new Date(created.getTime() + hours * 60 * 60 * 1000);
  return due.toISOString();
};

export const isTicketOverdue = (ticket: Ticket): boolean => {
  if (["Resolved", "Closed", "Cancelled", "Rejected"].includes(ticket.status)) {
    return false;
  }
  return new Date().getTime() > new Date(ticket.dueDate).getTime();
};

export const formatTimeRemaining = (dueDate: string, status: TicketStatus): string => {
  if (["Closed", "Resolved"].includes(status)) return "Completed within SLA";
  if (status === "Cancelled") return "Cancelled";
  if (status === "Rejected") return "Awaiting reassignment";

  const now = new Date().getTime();
  const due = new Date(dueDate).getTime();
  const diffMs = due - now;

  if (diffMs <= 0) {
    const overdueMs = Math.abs(diffMs);
    const overdueHours = Math.floor(overdueMs / (1000 * 60 * 60));
    const overdueMinutes = Math.floor((overdueMs % (1000 * 60 * 60)) / (1000 * 60));
    return `Overdue by ${overdueHours}h ${overdueMinutes}m`;
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h remaining`;
  }
  return `${hours}h ${minutes}m remaining`;
};

// Allowed State Transitions per Architecture Doc (Section 3)
export const ALLOWED_TRANSITIONS: {
  from: TicketStatus;
  to: TicketStatus;
  roles: UserRole[];
  description: string;
}[] = [
  { from: "New", to: "Assigned", roles: ["manager"], description: "Assign technician to new ticket" },
  { from: "Assigned", to: "Rejected", roles: ["technician"], description: "Technician declines assignment" },
  { from: "Rejected", to: "New", roles: ["manager"], description: "Sent back to New for reassignment" },
  { from: "Assigned", to: "In Progress", roles: ["technician"], description: "Technician starts work" },
  { from: "In Progress", to: "Waiting", roles: ["technician"], description: "Waiting on parts or customer access" },
  { from: "Waiting", to: "In Progress", roles: ["technician"], description: "Work resumed by technician" },
  { from: "In Progress", to: "Resolved", roles: ["technician"], description: "Technician completes work and logs evidence" },
  { from: "Resolved", to: "Closed", roles: ["manager", "customer"], description: "Confirms job is complete" },
  { from: "Resolved", to: "In Progress", roles: ["manager"], description: "Reopened after customer dispute" },
  { from: "New", to: "Cancelled", roles: ["manager"], description: "Manager withdraws ticket" },
  { from: "Assigned", to: "Cancelled", roles: ["manager"], description: "Manager withdraws ticket" },
  { from: "In Progress", to: "Cancelled", roles: ["manager"], description: "Manager withdraws ticket" },
  { from: "Waiting", to: "Cancelled", roles: ["manager"], description: "Manager withdraws ticket" },
];

export const getNextAllowedTransitions = (status: TicketStatus, role: UserRole) => {
  return ALLOWED_TRANSITIONS.filter((t) => t.from === status && t.roles.includes(role));
};

export const canTransition = (from: TicketStatus, to: TicketStatus, role: UserRole): { allowed: boolean; reason?: string } => {
  if (from === "Closed") return { allowed: false, reason: "Closed tickets are final and cannot be transitioned." };
  if (from === "Cancelled") return { allowed: false, reason: "Cancelled tickets are final and cannot be reopened." };

  const match = ALLOWED_TRANSITIONS.find((t) => t.from === from && t.to === to);
  if (!match) {
    const valid = ALLOWED_TRANSITIONS.filter((t) => t.from === from).map((t) => t.to).join(", ") || "None";
    return { allowed: false, reason: `Invalid transition from "${from}" to "${to}". Allowed next statuses: ${valid}.` };
  }

  if (!match.roles.includes(role)) {
    return { allowed: false, reason: `Role "${role}" is not permitted to move ticket from "${from}" to "${to}". Allowed roles: ${match.roles.join(", ")}.` };
  }

  return { allowed: true };
};

import {
  seedCustomers,
  seedSites,
  seedEquipment,
  seedTechnicians,
  seedTickets,
  seedHistory,
  seedComments,
  seedAttachments,
  seedNotificationLogs,
} from "../data/seed-data";

// Initial Seed Data (Single source of truth with seed.ts)
export const initialCustomers: Customer[] = seedCustomers as unknown as Customer[];
export const initialSites: Site[] = seedSites as unknown as Site[];
export const initialEquipment: Equipment[] = seedEquipment as unknown as Equipment[];
export const initialTechnicians: Technician[] = seedTechnicians as unknown as Technician[];
export const initialTickets: Ticket[] = seedTickets as unknown as Ticket[];
export const initialHistory: TicketHistory[] = seedHistory as unknown as TicketHistory[];
export const initialNotes: Note[] = seedComments as unknown as Note[];
export const initialAttachments: Attachment[] = seedAttachments as unknown as Attachment[];
export const initialNotificationLogs: NotificationLog[] = seedNotificationLogs as unknown as NotificationLog[];

export const allTicketStatuses: TicketStatus[] = [
  "New",
  "Assigned",
  "In Progress",
  "Waiting",
  "Resolved",
  "Closed",
  "Cancelled",
  "Rejected",
];

export const allPriorities: Priority[] = ["Low", "Medium", "High", "Urgent"];

export const allCategories: Category[] = [
  "Solar",
  "HVAC",
  "Electrical",
  "Industrial Equipment",
  "Facility Maintenance",
  "Other",
];

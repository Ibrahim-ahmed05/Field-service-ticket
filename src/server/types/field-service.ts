// Field Service Ticket System - Core Types

export type UserRole = "MANAGER" | "ADMIN" | "TECHNICIAN" | "CUSTOMER";

export type TicketStatus =
  | "New"
  | "Assigned"
  | "In Progress"
  | "Waiting"
  | "Resolved"
  | "Closed"
  | "Cancelled"
  | "Rejected";

export type TicketPriority = "Urgent" | "High" | "Medium" | "Low";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string;
  technicianId?: string;
  customerId?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  companyId: string;
}

export interface Site {
  id: string;
  customerId: string;
  address: string;
  siteType: string;
  companyId: string;
}

export interface Equipment {
  id: string;
  siteId: string;
  equipmentType: string;
  model: string;
  serialNumber: string;
  installDate?: string;
  companyId?: string;
}

export interface Technician {
  id: string;
  name: string;
  phone: string;
  email: string;
  skillSet: string[];
  active: boolean;
  companyId: string;
}

export interface Ticket {
  id: string;
  customerId: string;
  siteId: string;
  equipmentId?: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  dueDate: string;
  assignedTechnicianId?: string;
  createdBy: string;
  category: string;
  companyId: string;
  isOverdue?: boolean;
}

export interface TicketHistory {
  id: string;
  ticketId: string;
  fromStatus: TicketStatus | "None";
  toStatus: TicketStatus;
  changedBy: string;
  changedAt: string;
  note?: string;
  isOverride?: boolean;
  companyId: string;
}

export interface Attachment {
  id: string;
  ticketId: string;
  uploadedBy: string;
  fileUrl: string;
  fileName: string;
  fileType: string; // image/jpeg, image/png, application/pdf
  fileSize: number; // in bytes (max 10MB = 10 * 1024 * 1024)
  uploadedAt: string;
  customerVisible: boolean;
  companyId: string;
}

export interface Comment {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  text: string;
  customerVisible: boolean;
  createdAt: string;
  companyId: string;
}

export type TriggerEvent =
  | "Ticket created"
  | "Technician assigned"
  | "Status changed to In Progress"
  | "Status changed to Resolved"
  | "Status changed to Closed"
  | "Ticket cancelled";

export interface NotificationRecipient {
  type: "Customer" | "Assigned Technician" | "Manager or Admin";
  name: string;
  email: string;
  phone?: string;
}

export interface NotificationMessage {
  id: string;
  ticketId: string;
  ticketTitle: string;
  triggerEvent: TriggerEvent;
  primaryRecipient: NotificationRecipient;
  alsoNotified?: NotificationRecipient[];
  channel: "LOG" | "EMAIL" | "SMS" | "WHATSAPP";
  status: "SENT" | "PENDING" | "FAILED";
  sentAt: string;
  companyId: string;
  content: string;
}

export interface NotificationLog {
  id: string;
  ticketId: string;
  channel: string;
  recipient: string;
  status: "SENT" | "PENDING" | "FAILED";
  sentAt: string;
  triggerEvent: TriggerEvent;
  companyId: string;
  content?: string;
}

export interface DashboardMetrics {
  countsByStatus: Record<TicketStatus, number>;
  totalTickets: number;
  overdueCount: number;
  openCount: number;
}

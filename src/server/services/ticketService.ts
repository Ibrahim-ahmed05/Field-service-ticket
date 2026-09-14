import { isDbConnected } from "../db";
import {
  AttachmentModel,
  CommentModel,
  CustomerModel,
  EquipmentModel,
  SiteModel,
  TechnicianModel,
  TicketHistoryModel,
  TicketModel,
} from "../models/index";
import {
  globalNotificationService,
  NotificationService,
} from "../notifications/NotificationService";
import { calculateDueDate, isTicketOverdue, withOverdueFlag } from "../sla/dueDates";
import { FieldServiceStore, globalStore } from "../storage/fieldServiceStore";
import {
  Attachment,
  AuthUser,
  Comment,
  Customer,
  DashboardMetrics,
  Equipment,
  Site,
  Technician,
  Ticket,
  TicketHistory,
  TicketPriority,
  TicketStatus,
  UserRole,
} from "../types/field-service";
import { validateStatusTransition } from "../workflow/stateMachine";

export interface CreateTicketDTO {
  customerId: string;
  siteId: string;
  equipmentId?: string;
  title: string;
  description: string;
  priority: TicketPriority;
  category: string;
  dueDate?: string;
}

export interface ListTicketsFilter {
  status?: TicketStatus;
  priority?: TicketPriority;
  technicianId?: string;
  customerId?: string;
  siteId?: string;
  overdueOnly?: boolean;
}

export interface FullTicketView {
  ticket: Ticket;
  customer: Customer | null;
  site: Site | null;
  equipment: Equipment | null;
  assignedTechnician: Technician | null;
  history: TicketHistory[];
  comments: Comment[];
  attachments: Attachment[];
}

export class TicketService {
  constructor(
    private store: FieldServiceStore = globalStore,
    private notificationService: NotificationService = globalNotificationService,
  ) {}

  /**
   * Helper to verify and return customer/site/equipment relations
   */
  private getRelations(ticket: Ticket) {
    const customer = this.store.customers.find((c) => c.id === ticket.customerId) || null;
    const site = this.store.sites.find((s) => s.id === ticket.siteId) || null;
    const equipment = ticket.equipmentId
      ? this.store.equipment.find((e) => e.id === ticket.equipmentId) || null
      : null;
    const assignedTechnician = ticket.assignedTechnicianId
      ? this.store.technicians.find((t) => t.id === ticket.assignedTechnicianId) || null
      : null;

    return { customer, site, equipment, assignedTechnician };
  }

  /**
   * POST /tickets: Create ticket (Allowed Roles: Manager, Customer)
   */
  async createTicket(dto: CreateTicketDTO, user: AuthUser): Promise<Ticket> {
    // RBAC check
    if (user.role === "TECHNICIAN") {
      throw {
        status: 403,
        code: "FORBIDDEN_ROLE",
        message: "Technicians are not authorized to create tickets.",
      };
    }

    // Customer scoping check
    if (user.role === "CUSTOMER" && user.customerId && user.customerId !== dto.customerId) {
      throw {
        status: 403,
        code: "UNAUTHORIZED_CUSTOMER_SCOPE",
        message: "Customers may only create tickets for their own organization.",
      };
    }

    // Verify Customer and Site exist under this company
    const customer = this.store.customers.find(
      (c) => c.id === dto.customerId && c.companyId === user.companyId,
    );
    if (!customer) {
      throw {
        status: 404,
        code: "CUSTOMER_NOT_FOUND",
        message: `Customer ${dto.customerId} not found in company ${user.companyId}.`,
      };
    }

    const site = this.store.sites.find(
      (s) =>
        s.id === dto.siteId && s.customerId === dto.customerId && s.companyId === user.companyId,
    );
    if (!site) {
      throw {
        status: 404,
        code: "SITE_NOT_FOUND",
        message: `Site ${dto.siteId} not found or does not belong to Customer ${dto.customerId}.`,
      };
    }

    if (dto.equipmentId) {
      const eq = this.store.equipment.find(
        (e) => e.id === dto.equipmentId && e.siteId === dto.siteId,
      );
      if (!eq) {
        throw {
          status: 404,
          code: "EQUIPMENT_NOT_FOUND",
          message: `Equipment ${dto.equipmentId} not found at Site ${dto.siteId}.`,
        };
      }
    }

    const now = new Date();
    const createdAt = now.toISOString();
    const dueDate = dto.dueDate || calculateDueDate(dto.priority, now);

    const ticket: Ticket = {
      id: `tkt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      customerId: dto.customerId,
      siteId: dto.siteId,
      equipmentId: dto.equipmentId,
      title: dto.title.trim(),
      description: dto.description.trim(),
      priority: dto.priority,
      status: "New",
      createdAt,
      updatedAt: createdAt,
      dueDate,
      createdBy: user.id,
      category: dto.category,
      companyId: user.companyId,
    };

    this.store.tickets.unshift(ticket);

    // Record initial history
    const historyEntry: TicketHistory = {
      id: `th-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ticketId: ticket.id,
      fromStatus: "None",
      toStatus: "New",
      changedBy: user.name || user.id,
      changedAt: createdAt,
      note: `Ticket created by ${user.role} (${user.name || user.id})`,
      companyId: user.companyId,
    };
    this.store.ticketHistory.push(historyEntry);

    // Dispatch Notification: "Ticket created"
    await this.notificationService.notify("Ticket created", ticket, customer, null, {
      name: "Operations Dispatch",
      email: "dispatch@fieldservice.local",
    });

    return withOverdueFlag(ticket);
  }

  /**
   * GET /tickets: List tickets with filters (Allowed Role: Manager / Admin)
   */
  async listTickets(filters: ListTicketsFilter, user: AuthUser): Promise<Ticket[]> {
    if (user.role !== "MANAGER" && user.role !== "ADMIN") {
      throw {
        status: 403,
        code: "FORBIDDEN_ROLE",
        message: "Only Managers or Admins can list all tickets with arbitrary filters.",
      };
    }

    let tickets = this.store.tickets.filter((t) => t.companyId === user.companyId);

    if (filters.status) {
      tickets = tickets.filter((t) => t.status === filters.status);
    }
    if (filters.priority) {
      tickets = tickets.filter((t) => t.priority === filters.priority);
    }
    if (filters.technicianId) {
      tickets = tickets.filter((t) => t.assignedTechnicianId === filters.technicianId);
    }
    if (filters.customerId) {
      tickets = tickets.filter((t) => t.customerId === filters.customerId);
    }
    if (filters.siteId) {
      tickets = tickets.filter((t) => t.siteId === filters.siteId);
    }

    const ticketsWithOverdue = tickets.map((t) => withOverdueFlag(t));

    if (filters.overdueOnly) {
      return ticketsWithOverdue.filter((t) => t.isOverdue);
    }

    return ticketsWithOverdue;
  }

  /**
   * GET /tickets/:id: Get single ticket with current state & relations
   * Allowed Roles: Manager, Assigned Technician, Owning Customer
   */
  async getTicketById(ticketId: string, user: AuthUser): Promise<FullTicketView> {
    const ticket = this.store.tickets.find(
      (t) => t.id === ticketId && t.companyId === user.companyId,
    );
    if (!ticket) {
      throw {
        status: 404,
        code: "TICKET_NOT_FOUND",
        message: `Ticket "${ticketId}" not found.`,
      };
    }

    // RBAC validation
    if (user.role === "TECHNICIAN") {
      if (ticket.assignedTechnicianId !== (user.technicianId || user.id)) {
        throw {
          status: 403,
          code: "TECHNICIAN_ACCESS_DENIED",
          message: "Technicians may only access tickets assigned to them.",
        };
      }
    } else if (user.role === "CUSTOMER") {
      if (ticket.customerId !== (user.customerId || user.id)) {
        throw {
          status: 403,
          code: "CUSTOMER_ACCESS_DENIED",
          message: "Customers may only access tickets belonging to their organization.",
        };
      }
    }

    const { customer, site, equipment, assignedTechnician } = this.getRelations(ticket);

    // History (Full chronological record)
    const history = this.store.ticketHistory
      .filter((h) => h.ticketId === ticket.id)
      .sort((a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime());

    // Comments & Attachments (Apply customerVisible filter for CUSTOMER role)
    let comments = this.store.comments
      .filter((c) => c.ticketId === ticket.id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    let attachments = this.store.attachments.filter((a) => a.ticketId === ticket.id);

    if (user.role === "CUSTOMER") {
      comments = comments.filter((c) => c.customerVisible);
      attachments = attachments.filter((a) => a.customerVisible);
    }

    return {
      ticket: withOverdueFlag(ticket),
      customer,
      site,
      equipment,
      assignedTechnician,
      history,
      comments,
      attachments,
    };
  }

  /**
   * PATCH /tickets/:id/assign: Assign or reassign a technician (Allowed Role: Manager)
   */
  async assignTechnician(
    ticketId: string,
    technicianId: string,
    user: AuthUser,
    note?: string,
  ): Promise<Ticket> {
    if (user.role !== "MANAGER" && user.role !== "ADMIN") {
      throw {
        status: 403,
        code: "FORBIDDEN_ROLE",
        message: "Only Managers or Admins can assign or reassign technicians.",
      };
    }

    const ticket = this.store.tickets.find(
      (t) => t.id === ticketId && t.companyId === user.companyId,
    );
    if (!ticket) {
      throw { status: 404, code: "TICKET_NOT_FOUND", message: `Ticket "${ticketId}" not found.` };
    }

    const technician = this.store.technicians.find(
      (tech) => tech.id === technicianId && tech.companyId === user.companyId && tech.active,
    );
    if (!technician) {
      throw {
        status: 404,
        code: "TECHNICIAN_NOT_FOUND",
        message: `Active technician "${technicianId}" not found.`,
      };
    }

    const previousStatus = ticket.status;
    const wasAssigned = Boolean(ticket.assignedTechnicianId);

    ticket.assignedTechnicianId = technician.id;
    ticket.updatedAt = new Date().toISOString();

    // If ticket was New or Rejected, transition status to Assigned
    if (ticket.status === "New" || ticket.status === "Rejected") {
      ticket.status = "Assigned";
    }

    // Write history
    const historyEntry: TicketHistory = {
      id: `th-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ticketId: ticket.id,
      fromStatus: previousStatus,
      toStatus: ticket.status,
      changedBy: user.name || user.id,
      changedAt: ticket.updatedAt,
      note:
        note ||
        (wasAssigned
          ? `Reassigned to technician ${technician.name}`
          : `Assigned to technician ${technician.name}`),
      companyId: user.companyId,
    };
    this.store.ticketHistory.push(historyEntry);

    const { customer } = this.getRelations(ticket);

    // Dispatch Notification: "Technician assigned"
    await this.notificationService.notify(
      "Technician assigned",
      ticket,
      customer,
      technician,
      { name: user.name || "Manager", email: user.email },
    );

    return withOverdueFlag(ticket);
  }

  /**
   * PATCH /tickets/:id/status: Change status, validated against state machine
   * Allowed Roles per matrix:
   * - Manager, Assigned Technician, Customer (confirming Resolved -> Closed)
   */
  async updateTicketStatus(
    ticketId: string,
    targetStatus: TicketStatus,
    user: AuthUser,
    note?: string,
    isOverride = false,
  ): Promise<Ticket> {
    const ticket = this.store.tickets.find(
      (t) => t.id === ticketId && t.companyId === user.companyId,
    );
    if (!ticket) {
      throw { status: 404, code: "TICKET_NOT_FOUND", message: `Ticket "${ticketId}" not found.` };
    }

    // Technician role assignment boundary check
    if (user.role === "TECHNICIAN") {
      if (ticket.assignedTechnicianId !== (user.technicianId || user.id)) {
        throw {
          status: 403,
          code: "TECHNICIAN_ACCESS_DENIED",
          message: "Technicians cannot update the status of tickets assigned to someone else.",
        };
      }
    }

    // Customer role boundary check
    if (user.role === "CUSTOMER") {
      if (ticket.customerId !== (user.customerId || user.id)) {
        throw {
          status: 403,
          code: "CUSTOMER_ACCESS_DENIED",
          message: "Customers may only interact with their own tickets.",
        };
      }
      // Customer is ONLY allowed to confirm Resolved -> Closed
      if (ticket.status !== "Resolved" || targetStatus !== "Closed") {
        throw {
          status: 403,
          code: "CUSTOMER_STATUS_FORBIDDEN",
          message: "Customers may only confirm a Resolved ticket as Closed.",
        };
      }
    }

    // Validate Status State Machine
    const validation = validateStatusTransition(
      ticket.status,
      targetStatus,
      user.role,
      isOverride,
    );
    if (!validation.valid && validation.error) {
      throw {
        status: 400,
        code: validation.error.code,
        message: validation.error.message,
        currentStatus: validation.error.currentStatus,
        requestedStatus: validation.error.requestedStatus,
        allowedTransitions: validation.error.allowedTransitions,
      };
    }

    // In Progress -> Resolved requires notes per Section 3
    if (ticket.status === "In Progress" && targetStatus === "Resolved" && !note && !isOverride) {
      throw {
        status: 400,
        code: "RESOLUTION_NOTE_REQUIRED",
        message: "Resolving a ticket requires notes documenting the completed work.",
      };
    }

    const previousStatus = ticket.status;
    ticket.status = targetStatus;
    ticket.updatedAt = new Date().toISOString();

    // If technician rejected the ticket, remove assignedTechnicianId
    if (targetStatus === "Rejected") {
      ticket.assignedTechnicianId = undefined;
    }

    // Write History Entry
    const historyEntry: TicketHistory = {
      id: `th-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ticketId: ticket.id,
      fromStatus: previousStatus,
      toStatus: targetStatus,
      changedBy: `${user.role}: ${user.name || user.id}`,
      changedAt: ticket.updatedAt,
      note: note || (isOverride ? `Manager Override: Transitioned to ${targetStatus}` : undefined),
      isOverride,
      companyId: user.companyId,
    };
    this.store.ticketHistory.push(historyEntry);

    const { customer, assignedTechnician } = this.getRelations(ticket);

    // Notification Trigger Handling
    if (targetStatus === "In Progress") {
      await this.notificationService.notify(
        "Status changed to In Progress",
        ticket,
        customer,
        assignedTechnician,
      );
    } else if (targetStatus === "Resolved") {
      await this.notificationService.notify(
        "Status changed to Resolved",
        ticket,
        customer,
        assignedTechnician,
        { name: user.name || "Manager", email: user.email },
      );
    } else if (targetStatus === "Closed") {
      await this.notificationService.notify(
        "Status changed to Closed",
        ticket,
        customer,
        assignedTechnician,
      );
    } else if (targetStatus === "Cancelled") {
      await this.notificationService.notify(
        "Ticket cancelled",
        ticket,
        customer,
        assignedTechnician,
      );
    }

    return withOverdueFlag(ticket);
  }

  /**
   * POST /tickets/:id/comments: Add internal or customer-visible note
   * Allowed Roles: Manager, Assigned Technician
   */
  async addComment(
    ticketId: string,
    text: string,
    customerVisible: boolean,
    user: AuthUser,
  ): Promise<Comment> {
    if (user.role === "CUSTOMER") {
      throw {
        status: 403,
        code: "FORBIDDEN_ROLE",
        message: "Direct internal comments are restricted to Managers and Technicians.",
      };
    }

    const ticket = this.store.tickets.find(
      (t) => t.id === ticketId && t.companyId === user.companyId,
    );
    if (!ticket) {
      throw { status: 404, code: "TICKET_NOT_FOUND", message: `Ticket "${ticketId}" not found.` };
    }

    if (user.role === "TECHNICIAN") {
      if (ticket.assignedTechnicianId !== (user.technicianId || user.id)) {
        throw {
          status: 403,
          code: "TECHNICIAN_ACCESS_DENIED",
          message: "Technicians may only comment on tickets assigned to them.",
        };
      }
    }

    const comment: Comment = {
      id: `c-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ticketId,
      authorId: user.id,
      authorName: user.name || user.id,
      authorRole: user.role,
      text: text.trim(),
      customerVisible,
      createdAt: new Date().toISOString(),
      companyId: user.companyId,
    };

    this.store.comments.push(comment);
    return comment;
  }

  /**
   * POST /tickets/:id/attachments: Upload evidence / photos / PDFs
   * Allowed Roles: Manager, Assigned Technician
   * Security Rules: Images and PDFs only, max 10MB (10 * 1024 * 1024 bytes)
   */
  async addAttachment(
    ticketId: string,
    fileName: string,
    fileType: string,
    fileSize: number,
    fileUrl: string,
    customerVisible: boolean,
    user: AuthUser,
  ): Promise<Attachment> {
    if (user.role === "CUSTOMER") {
      throw {
        status: 403,
        code: "FORBIDDEN_ROLE",
        message: "Customer cannot upload technician evidence attachments directly.",
      };
    }

    const ticket = this.store.tickets.find(
      (t) => t.id === ticketId && t.companyId === user.companyId,
    );
    if (!ticket) {
      throw { status: 404, code: "TICKET_NOT_FOUND", message: `Ticket "${ticketId}" not found.` };
    }

    if (user.role === "TECHNICIAN") {
      if (ticket.assignedTechnicianId !== (user.technicianId || user.id)) {
        throw {
          status: 403,
          code: "TECHNICIAN_ACCESS_DENIED",
          message: "Technicians may only upload attachments to tickets assigned to them.",
        };
      }
    }

    // Attachment Type & Size Security Checks per Section 6
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedMimeTypes.includes(fileType.toLowerCase())) {
      throw {
        status: 400,
        code: "INVALID_FILE_TYPE",
        message: `File type "${fileType}" is not allowed. Only images (JPEG, PNG, WebP) and PDF documents are supported.`,
      };
    }

    const maxSizeBytes = 10 * 1024 * 1024; // 10 MB limit
    if (fileSize > maxSizeBytes) {
      throw {
        status: 400,
        code: "FILE_TOO_LARGE",
        message: `File size (${(fileSize / (1024 * 1024)).toFixed(2)} MB) exceeds the 10 MB limit.`,
      };
    }

    const attachment: Attachment = {
      id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ticketId,
      uploadedBy: `${user.role}: ${user.name || user.id}`,
      fileUrl,
      fileName,
      fileType,
      fileSize,
      uploadedAt: new Date().toISOString(),
      customerVisible,
      companyId: user.companyId,
    };

    this.store.attachments.push(attachment);
    return attachment;
  }

  /**
   * GET /tickets/:id/history: Chronological status audit history
   */
  async getTicketHistory(ticketId: string, user: AuthUser): Promise<TicketHistory[]> {
    await this.getTicketById(ticketId, user); // verifies existence & access

    return this.store.ticketHistory
      .filter((h) => h.ticketId === ticketId && h.companyId === user.companyId)
      .sort((a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime());
  }

  /**
   * GET /technicians/:id/jobs: "My Jobs" query
   * Allowed Roles: Manager, That Specific Technician
   */
  async getTechnicianJobs(technicianId: string, user: AuthUser): Promise<Ticket[]> {
    if (user.role === "TECHNICIAN") {
      if ((user.technicianId || user.id) !== technicianId) {
        throw {
          status: 403,
          code: "FORBIDDEN_TECHNICIAN_SCOPE",
          message: "Technicians cannot view another technician's assigned jobs.",
        };
      }
    } else if (user.role === "CUSTOMER") {
      throw {
        status: 403,
        code: "FORBIDDEN_ROLE",
        message: "Customers cannot query technician job queues.",
      };
    }

    const jobs = this.store.tickets.filter(
      (t) => t.assignedTechnicianId === technicianId && t.companyId === user.companyId,
    );

    return jobs.map((j) => withOverdueFlag(j));
  }

  /**
   * GET /customers/:id/tickets: Customer's own tickets, customer-safe view
   * Allowed Roles: Manager, That Specific Customer
   */
  async getCustomerTickets(customerId: string, user: AuthUser): Promise<Ticket[]> {
    if (user.role === "CUSTOMER") {
      if ((user.customerId || user.id) !== customerId) {
        throw {
          status: 403,
          code: "FORBIDDEN_CUSTOMER_SCOPE",
          message: "Customers cannot view another organization's tickets.",
        };
      }
    } else if (user.role === "TECHNICIAN") {
      throw {
        status: 403,
        code: "FORBIDDEN_ROLE",
        message: "Technicians cannot query customer-wide tickets directly.",
      };
    }

    const tickets = this.store.tickets.filter(
      (t) => t.customerId === customerId && t.companyId === user.companyId,
    );

    return tickets.map((t) => withOverdueFlag(t));
  }

  /**
   * GET /dashboard/metrics: Status breakdown & Overdue counts
   * Allowed Role: Manager / Admin
   */
  async getDashboardMetrics(user: AuthUser): Promise<DashboardMetrics> {
    if (user.role !== "MANAGER" && user.role !== "ADMIN") {
      throw {
        status: 403,
        code: "FORBIDDEN_ROLE",
        message: "Only Managers or Admins can view dashboard metrics.",
      };
    }

    const companyTickets = this.store.tickets.filter((t) => t.companyId === user.companyId);

    const countsByStatus: Record<TicketStatus, number> = {
      New: 0,
      Assigned: 0,
      "In Progress": 0,
      Waiting: 0,
      Resolved: 0,
      Closed: 0,
      Cancelled: 0,
      Rejected: 0,
    };

    let overdueCount = 0;
    let openCount = 0;
    const now = new Date();

    for (const ticket of companyTickets) {
      if (countsByStatus[ticket.status] !== undefined) {
        countsByStatus[ticket.status]++;
      }

      if (isTicketOverdue(ticket.dueDate, ticket.status, now)) {
        overdueCount++;
      }

      if (ticket.status !== "Closed" && ticket.status !== "Cancelled") {
        openCount++;
      }
    }

    return {
      countsByStatus,
      totalTickets: companyTickets.length,
      overdueCount,
      openCount,
    };
  }
}

// Global shared service singleton
export const globalTicketService = new TicketService();

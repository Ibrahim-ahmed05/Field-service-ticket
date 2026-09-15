import { connectDB, isDbConnected } from "../db";
import {
  AttachmentModel,
  CommentModel,
  CustomerModel,
  EquipmentModel,
  SiteModel,
  TechnicianModel,
  TicketHistoryModel,
  TicketModel,
  NotificationLogModel,
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

export interface UpdateTicketDTO {
  title?: string;
  description?: string;
  category?: string;
  priority?: TicketPriority;
  equipmentId?: string | null;
  workInstructions?: string[];
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
    private useMongo = false,
  ) {}

  private async hydrateFromMongo() {
    if (!this.useMongo) return;
    const db = await connectDB();
    if (!db || !isDbConnected()) {
      throw {
        status: 503,
        code: "DATABASE_UNAVAILABLE",
        message: "MongoDB is unavailable. Check MONGODB_URI and the database network access settings.",
      };
    }

    const [customers, sites, equipment, technicians, tickets, ticketHistory, attachments, comments] =
      await Promise.all([
        CustomerModel.find({}).lean(),
        SiteModel.find({}).lean(),
        EquipmentModel.find({}).lean(),
        TechnicianModel.find({}).lean(),
        TicketModel.find({}).lean(),
        TicketHistoryModel.find({}).lean(),
        AttachmentModel.find({}).lean(),
        CommentModel.find({}).lean(),
      ]);

    const clean = <T,>(rows: unknown[]) =>
      rows.map(({ _id, __v, ...row }) => row) as T[];
    this.store.customers = clean<Customer>(customers);
    this.store.sites = clean<Site>(sites);
    this.store.equipment = clean<Equipment>(equipment);
    this.store.technicians = clean<Technician>(technicians);
    this.store.tickets = clean<Ticket>(tickets);
    this.store.ticketHistory = clean<TicketHistory>(ticketHistory);
    this.store.attachments = clean<Attachment>(attachments);
    this.store.comments = clean<Comment>(comments);
  }

  private async persistNotifications(companyId: string) {
    if (!this.useMongo) return;
    const logs = this.notificationService.getLogs(undefined, companyId);
    if (!logs.length) return;
    await NotificationLogModel.bulkWrite(
      logs.map((log) => ({
        updateOne: { filter: { id: log.id }, update: { $set: log }, upsert: true },
      })),
    );
  }

  async getBootstrap(user: AuthUser) {
    await this.hydrateFromMongo();
    const company = (row: { companyId?: string }) => row.companyId === user.companyId;
    const companyTickets = this.store.tickets.filter(company);
    const tickets = user.role === "TECHNICIAN"
      ? companyTickets.filter((ticket) => ticket.assignedTechnicianId === (user.technicianId || user.id))
      : user.role === "CUSTOMER"
        ? companyTickets.filter((ticket) => ticket.customerId === (user.customerId || user.id))
        : companyTickets;
    const ticketIds = new Set(tickets.map((ticket) => ticket.id));
    const customerIds = new Set(tickets.map((ticket) => ticket.customerId));
    const siteIds = new Set(tickets.map((ticket) => ticket.siteId));
    const technicianIds = new Set(tickets.map((ticket) => ticket.assignedTechnicianId).filter(Boolean));
    const notificationLogs = this.useMongo
      ? await NotificationLogModel.find({ companyId: user.companyId, ...(user.role === "MANAGER" || user.role === "ADMIN" ? {} : { ticketId: { $in: [...ticketIds] } }) }).lean()
      : this.notificationService.getLogs(undefined, user.companyId);

    return {
      customers: this.store.customers.filter((item) => company(item) && (user.role === "MANAGER" || user.role === "ADMIN" || customerIds.has(item.id))),
      sites: this.store.sites.filter((item) => company(item) && (user.role === "MANAGER" || user.role === "ADMIN" || siteIds.has(item.id))),
      equipment: this.store.equipment.filter((item) => {
        const site = this.store.sites.find((candidate) => candidate.id === item.siteId);
        return site?.companyId === user.companyId && (user.role === "MANAGER" || user.role === "ADMIN" || siteIds.has(item.siteId));
      }),
      technicians: this.store.technicians.filter((item) => company(item) && (user.role === "MANAGER" || user.role === "ADMIN" || technicianIds.has(item.id) || item.id === user.technicianId)),
      tickets,
      history: this.store.ticketHistory.filter((item) => ticketIds.has(item.ticketId)).map((item) => user.role === "CUSTOMER" ? { ...item, note: undefined } : item),
      comments: this.store.comments.filter((item) => ticketIds.has(item.ticketId) && (user.role !== "CUSTOMER" || item.customerVisible)),
      attachments: this.store.attachments.filter((item) => ticketIds.has(item.ticketId) && (user.role !== "CUSTOMER" || item.customerVisible)),
      notificationLogs: notificationLogs.map(({ _id, __v, ...row }: any) => row),
    };
  }

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
    await this.hydrateFromMongo();
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

    const selectedEquipment = dto.equipmentId
      ? this.store.equipment.find(
        (e) => e.id === dto.equipmentId && e.siteId === dto.siteId,
      )
      : undefined;
    if (dto.equipmentId) {
      if (!selectedEquipment) {
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
      ...( {
        customerName: customer.name,
        siteName: (site as any).name,
        siteAddress: site.address,
        equipmentModel: selectedEquipment?.model,
        contact: { name: customer.name, phone: customer.phone, email: customer.email },
        workInstructions: [],
      } as any),
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

    if (this.useMongo) {
      await Promise.all([TicketModel.create(ticket), TicketHistoryModel.create(historyEntry)]);
    }

    // Dispatch Notification: "Ticket created"
    await this.notificationService.notify("Ticket created", ticket, customer, null, {
      name: "Operations Dispatch",
      email: "dispatch@fieldservice.local",
    });
    await this.persistNotifications(user.companyId);

    return withOverdueFlag(ticket);
  }

  /**
   * GET /tickets: List tickets with filters (Allowed Role: Manager / Admin)
   */
  async listTickets(filters: ListTicketsFilter, user: AuthUser): Promise<Ticket[]> {
    await this.hydrateFromMongo();
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
    await this.hydrateFromMongo();
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

  async updateTicket(ticketId: string, dto: UpdateTicketDTO, user: AuthUser): Promise<Ticket> {
    await this.hydrateFromMongo();
    if (user.role !== "MANAGER" && user.role !== "ADMIN") {
      throw { status: 403, code: "FORBIDDEN_ROLE", message: "Only Managers or Admins can edit tickets." };
    }

    const ticket = this.store.tickets.find(
      (item) => item.id === ticketId && item.companyId === user.companyId,
    );
    if (!ticket) {
      throw { status: 404, code: "TICKET_NOT_FOUND", message: `Ticket "${ticketId}" not found.` };
    }
    if (ticket.status === "Closed" || ticket.status === "Cancelled") {
      throw { status: 400, code: "FINAL_TICKET", message: `${ticket.status} tickets cannot be edited.` };
    }

    if (dto.equipmentId) {
      const equipment = this.store.equipment.find(
        (item) => item.id === dto.equipmentId && item.siteId === ticket.siteId,
      );
      if (!equipment) {
        throw { status: 400, code: "INVALID_EQUIPMENT", message: "Equipment must belong to the ticket site." };
      }
      ticket.equipmentId = equipment.id;
      (ticket as any).equipmentModel = equipment.model;
    } else if (dto.equipmentId === null) {
      delete ticket.equipmentId;
      delete (ticket as any).equipmentModel;
    }

    if (dto.title !== undefined) ticket.title = dto.title.trim();
    if (dto.description !== undefined) ticket.description = dto.description.trim();
    if (dto.category !== undefined) ticket.category = dto.category;
    if (dto.workInstructions !== undefined) (ticket as any).workInstructions = dto.workInstructions;
    if (dto.priority !== undefined && dto.priority !== ticket.priority) {
      ticket.priority = dto.priority;
      ticket.dueDate = calculateDueDate(dto.priority, new Date(ticket.createdAt));
    }
    ticket.updatedAt = new Date().toISOString();

    const historyEntry: TicketHistory = {
      id: `th-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ticketId: ticket.id,
      fromStatus: ticket.status,
      toStatus: ticket.status,
      changedBy: user.name || user.id,
      changedAt: ticket.updatedAt,
      note: "Ticket details updated.",
      companyId: user.companyId,
    };
    this.store.ticketHistory.push(historyEntry);
    if (this.useMongo) {
      await Promise.all([
        TicketModel.updateOne({ id: ticket.id, companyId: user.companyId }, { $set: ticket }),
        TicketHistoryModel.create(historyEntry),
      ]);
    }
    return withOverdueFlag(ticket);
  }

  /**
   * PATCH /tickets/:id/assign: Assign or reassign a technician (Allowed Role: Manager)
   */
  async assignTechnician(
    ticketId: string,
    technicianId: string | null,
    user: AuthUser,
    note?: string,
  ): Promise<Ticket> {
    await this.hydrateFromMongo();
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

    const technician = technicianId
      ? this.store.technicians.find(
          (tech) => tech.id === technicianId && tech.companyId === user.companyId && tech.active,
        )
      : null;
    if (technicianId && !technician) {
      throw {
        status: 404,
        code: "TECHNICIAN_NOT_FOUND",
        message: `Active technician "${technicianId}" not found.`,
      };
    }

    const previousStatus = ticket.status;
    const wasAssigned = Boolean(ticket.assignedTechnicianId);

    ticket.assignedTechnicianId = technician?.id;
    ticket.updatedAt = new Date().toISOString();

    // If ticket was New or Rejected, transition status to Assigned
    if (technician && (ticket.status === "New" || ticket.status === "Rejected")) {
      ticket.status = "Assigned";
    } else if (!technician && ticket.status === "Assigned") {
      ticket.status = "New";
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
          ? technician
            ? `Reassigned to technician ${technician.name}`
            : "Technician unassigned"
          : technician
            ? `Assigned to technician ${technician.name}`
            : "Technician unassigned"),
      companyId: user.companyId,
    };
    this.store.ticketHistory.push(historyEntry);

    if (this.useMongo) {
      await Promise.all([
        TicketModel.updateOne({ id: ticket.id, companyId: user.companyId }, { $set: ticket }),
        TicketHistoryModel.create(historyEntry),
      ]);
    }

    const { customer } = this.getRelations(ticket);

    // Dispatch Notification: "Technician assigned"
    if (technician) {
      await this.notificationService.notify(
        "Technician assigned",
        ticket,
        customer,
        technician,
        { name: user.name || "Manager", email: user.email },
      );
      await this.persistNotifications(user.companyId);
    }

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
    await this.hydrateFromMongo();
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

    if (this.useMongo) {
      await Promise.all([
        TicketModel.updateOne({ id: ticket.id, companyId: user.companyId }, { $set: ticket }),
        TicketHistoryModel.create(historyEntry),
      ]);
    }

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
    await this.persistNotifications(user.companyId);

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
    await this.hydrateFromMongo();
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
    if (user.role === "CUSTOMER") {
      if (ticket.customerId !== (user.customerId || user.id)) {
        throw { status: 403, code: "CUSTOMER_ACCESS_DENIED", message: "Customers may only comment on their own tickets." };
      }
      customerVisible = true;
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
    if (this.useMongo) await CommentModel.create(comment);
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
    await this.hydrateFromMongo();
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
    if (this.useMongo) await AttachmentModel.create(attachment);
    return attachment;
  }

  /**
   * GET /tickets/:id/history: Chronological status audit history
   */
  async getTicketHistory(ticketId: string, user: AuthUser): Promise<TicketHistory[]> {
    await this.hydrateFromMongo();
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
    await this.hydrateFromMongo();
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
    await this.hydrateFromMongo();
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
    await this.hydrateFromMongo();
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
export const globalTicketService = new TicketService(globalStore, globalNotificationService, true);

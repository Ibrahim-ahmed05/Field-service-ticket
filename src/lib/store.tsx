import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  initialCustomers,
  initialEquipment,
  initialHistory,
  initialNotes,
  initialNotificationLogs,
  initialSites,
  initialTechnicians,
  initialTickets,
  initialAttachments,
  calculateDueDate,
  canTransition,
  type Attachment,
  type Category,
  type Customer,
  type Equipment,
  type Note,
  type NotificationLog,
  type Priority,
  type Site,
  type Technician,
  type Ticket,
  type TicketHistory,
  type TicketStatus,
  type UserRole,
} from "./fieldflow-data";
import { toast } from "sonner";

interface FieldFlowContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  activeTechnicianId: string;
  setActiveTechnicianId: (id: string) => void;
  activeCustomerId: string;
  setActiveCustomerId: (id: string) => void;
  
  tickets: Ticket[];
  technicians: Technician[];
  customers: Customer[];
  sites: Site[];
  equipment: Equipment[];
  history: TicketHistory[];
  notes: Note[];
  attachments: Attachment[];
  notificationLogs: NotificationLog[];

  // Store actions
  createTicket: (data: {
    customerId: string;
    siteId: string;
    equipmentId?: string;
    title: string;
    description: string;
    category: Category;
    priority: Priority;
    assignedTechnicianId?: string | null;
    workInstructions?: string[];
  }) => Ticket;

  editTicket: (
    ticketId: string,
    data: {
      title?: string;
      description?: string;
      category?: Category;
      priority?: Priority;
      equipmentId?: string;
      workInstructions?: string[];
    }
  ) => boolean;

  assignTechnician: (ticketId: string, technicianId: string | null) => boolean;

  updateTicketStatus: (
    ticketId: string,
    toStatus: TicketStatus,
    note?: string,
    evidence?: { name: string; url: string; customerVisible: boolean; tone?: Attachment["tone"] }
  ) => boolean;

  addNote: (ticketId: string, body: string, internal: boolean) => Note;

  uploadAttachment: (
    ticketId: string,
    file: { name: string; fileUrl: string; fileType: Attachment["fileType"]; fileSize: string; customerVisible: boolean; tone?: Attachment["tone"] }
  ) => Attachment;

  confirmResolution: (ticketId: string, feedback?: string) => boolean;

  resetToDefaults: () => void;

  // Query helpers
  getTicket: (id: string) => Ticket | undefined;
  getTechnician: (id: string | null) => Technician | undefined;
  getCustomer: (id: string) => Customer | undefined;
  getSite: (id: string) => Site | undefined;
  getEquipmentForSite: (siteId: string) => Equipment[];
  getSitesForCustomer: (customerId: string) => Site[];
  getRepeatIssueCountForSite: (siteId: string) => number;
  getRepeatIssueCountForEquipment: (equipmentId?: string) => number;
}

const STORAGE_KEY = "fieldflow_app_state_v3";

const FieldFlowContext = createContext<FieldFlowContextType | null>(null);

export function FieldFlowProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>("manager");
  const [activeTechnicianId, setActiveTechnicianId] = useState<string>("t1");
  const [activeCustomerId, setActiveCustomerId] = useState<string>("c1");

  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [technicians, setTechnicians] = useState<Technician[]>(initialTechnicians);
  const [customers] = useState<Customer[]>(initialCustomers);
  const [sites] = useState<Site[]>(initialSites);
  const [equipment] = useState<Equipment[]>(initialEquipment);
  const [history, setHistory] = useState<TicketHistory[]>(initialHistory);
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>(initialNotificationLogs);
  const [isHydrated, setIsHydrated] = useState(false);

  // Safe client hydration to prevent SSR mismatch and routing freeze
  useEffect(() => {
    try {
      const savedRole = localStorage.getItem(`${STORAGE_KEY}_role`);
      if (savedRole) setRole(savedRole as UserRole);

      const savedTechId = localStorage.getItem(`${STORAGE_KEY}_activeTechId`);
      if (savedTechId) setActiveTechnicianId(savedTechId);

      const savedCustId = localStorage.getItem(`${STORAGE_KEY}_activeCustId`);
      if (savedCustId) setActiveCustomerId(savedCustId);

      const savedTickets = localStorage.getItem(`${STORAGE_KEY}_tickets`);
      if (savedTickets) setTickets(JSON.parse(savedTickets));

      const savedTechs = localStorage.getItem(`${STORAGE_KEY}_technicians`);
      if (savedTechs) setTechnicians(JSON.parse(savedTechs));

      const savedHist = localStorage.getItem(`${STORAGE_KEY}_history`);
      if (savedHist) setHistory(JSON.parse(savedHist));

      const savedNotes = localStorage.getItem(`${STORAGE_KEY}_notes`);
      if (savedNotes) setNotes(JSON.parse(savedNotes));

      const savedAtts = localStorage.getItem(`${STORAGE_KEY}_attachments`);
      if (savedAtts) setAttachments(JSON.parse(savedAtts));

      const savedNotifs = localStorage.getItem(`${STORAGE_KEY}_notifications`);
      if (savedNotifs) setNotificationLogs(JSON.parse(savedNotifs));
    } catch (e) {
      console.warn("Could not load stored demo state", e);
    }
    setIsHydrated(true);
  }, []);

  // Save to localStorage after hydration
  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") return;
    try {
      localStorage.setItem(`${STORAGE_KEY}_role`, role);
      localStorage.setItem(`${STORAGE_KEY}_activeTechId`, activeTechnicianId);
      localStorage.setItem(`${STORAGE_KEY}_activeCustId`, activeCustomerId);
      localStorage.setItem(`${STORAGE_KEY}_tickets`, JSON.stringify(tickets));
      localStorage.setItem(`${STORAGE_KEY}_technicians`, JSON.stringify(technicians));
      localStorage.setItem(`${STORAGE_KEY}_history`, JSON.stringify(history));
      localStorage.setItem(`${STORAGE_KEY}_notes`, JSON.stringify(notes));
      localStorage.setItem(`${STORAGE_KEY}_attachments`, JSON.stringify(attachments));
      localStorage.setItem(`${STORAGE_KEY}_notifications`, JSON.stringify(notificationLogs));
    } catch (e) {
      console.warn("Could not save state to localStorage", e);
    }
  }, [isHydrated, role, activeTechnicianId, activeCustomerId, tickets, technicians, history, notes, attachments, notificationLogs]);

  const getTicket = (id: string) => tickets.find((t) => t.id === id);
  const getTechnician = (id: string | null) => technicians.find((t) => t.id === id);
  const getCustomer = (id: string) => customers.find((c) => c.id === id);
  const getSite = (id: string) => sites.find((s) => s.id === id);
  const getEquipmentForSite = (siteId: string) => equipment.filter((e) => e.siteId === siteId);
  const getSitesForCustomer = (customerId: string) => sites.filter((s) => s.customerId === customerId);

  const getRepeatIssueCountForSite = (siteId: string) => {
    return tickets.filter((t) => t.siteId === siteId).length;
  };

  const getRepeatIssueCountForEquipment = (equipmentId?: string) => {
    if (!equipmentId) return 0;
    return tickets.filter((t) => t.equipmentId === equipmentId).length;
  };

  // Auto-send notification logger
  const dispatchNotification = (
    ticket: Ticket,
    triggerEvent: NotificationLog["triggerEvent"],
    channel: NotificationLog["channel"] = "DevLog",
    customRecipient?: string,
    message?: string
  ) => {
    const tech = getTechnician(ticket.assignedTechnicianId);
    const recipient = customRecipient || (tech ? `${tech.phone} (${tech.name})` : ticket.contact.phone || "Operations Queue");
    const preview = message || `FieldFlow Notification: [${triggerEvent}] Ticket #${ticket.id} (${ticket.title}) is now ${ticket.status}.`;
    
    const newLog: NotificationLog = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ticketId: ticket.id,
      channel,
      recipient,
      status: channel === "DevLog" ? "Logged" : "Delivered",
      sentAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      triggerEvent,
      messagePreview: preview,
    };

    setNotificationLogs((prev) => [newLog, ...prev]);
  };

  const createTicket = (data: {
    customerId: string;
    siteId: string;
    equipmentId?: string;
    title: string;
    description: string;
    category: Category;
    priority: Priority;
    assignedTechnicianId?: string | null;
    workInstructions?: string[];
  }): Ticket => {
    const cust = getCustomer(data.customerId);
    const site = getSite(data.siteId);
    const eq = data.equipmentId ? equipment.find((e) => e.id === data.equipmentId) : undefined;
    
    const count = tickets.length + 2055;
    const newId = `TKT-${count}`;
    const createdAt = new Date().toISOString();
    const dueDate = calculateDueDate(createdAt, data.priority);
    const initialStatus: TicketStatus = data.assignedTechnicianId ? "Assigned" : "New";

    const newTicket: Ticket = {
      id: newId,
      companyId: cust?.companyId || "comp-1",
      customerId: data.customerId,
      customerName: cust?.name || "Customer",
      siteId: data.siteId,
      siteName: site?.name || "Main Site",
      siteAddress: site?.address || "Karachi",
      equipmentId: data.equipmentId,
      equipmentModel: eq?.model,
      contact: {
        name: cust?.name.split(" ")[0] || "Facility Manager",
        phone: cust?.phone || "+92 21 0000 0000",
        email: cust?.email,
      },
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority,
      status: initialStatus,
      assignedTechnicianId: data.assignedTechnicianId || null,
      createdBy: role === "customer" ? `${cust?.name || "Customer"} (Customer Portal)` : "Alex Morgan (Manager)",
      createdAt,
      dueDate,
      workInstructions: data.workInstructions || [],
    };

    setTickets((prev) => [newTicket, ...prev]);

    // History entry
    const newHist: TicketHistory = {
      id: `h-${Date.now()}`,
      ticketId: newId,
      fromStatus: null,
      toStatus: initialStatus,
      changedBy: role === "customer" ? cust?.name || "Customer" : "Alex Morgan (Manager)",
      changedAt: createdAt,
      note: "Ticket reported and registered in system.",
    };
    setHistory((prev) => [newHist, ...prev]);

    // Dispatch notification
    dispatchNotification(newTicket, "Ticket created", "WhatsApp", cust?.phone, `Ticket #${newId} created: ${data.title}. Priority: ${data.priority}`);
    if (data.assignedTechnicianId) {
      const tech = getTechnician(data.assignedTechnicianId);
      dispatchNotification(newTicket, "Technician assigned", "SMS", tech?.phone, `FieldFlow Dispatch: Assigned to Ticket #${newId}`);
    }

    toast.success(`Ticket #${newId} created successfully`);
    return newTicket;
  };

  const editTicket = (
    ticketId: string,
    data: {
      title?: string;
      description?: string;
      category?: Category;
      priority?: Priority;
      equipmentId?: string;
      workInstructions?: string[];
    }
  ): boolean => {
    const ticket = getTicket(ticketId);
    if (!ticket) return false;

    const eq = data.equipmentId ? equipment.find((e) => e.id === data.equipmentId) : undefined;
    const newDueDate = data.priority && data.priority !== ticket.priority ? calculateDueDate(ticket.createdAt, data.priority) : ticket.dueDate;

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        return {
          ...t,
          title: data.title !== undefined ? data.title : t.title,
          description: data.description !== undefined ? data.description : t.description,
          category: data.category !== undefined ? data.category : t.category,
          priority: data.priority !== undefined ? data.priority : t.priority,
          equipmentId: data.equipmentId !== undefined ? data.equipmentId : t.equipmentId,
          equipmentModel: eq?.model || t.equipmentModel,
          workInstructions: data.workInstructions !== undefined ? data.workInstructions : t.workInstructions,
          dueDate: newDueDate,
        };
      })
    );

    // Audit trail history
    const histEntry: TicketHistory = {
      id: `h-${Date.now()}`,
      ticketId,
      fromStatus: ticket.status,
      toStatus: ticket.status,
      changedBy: role === "manager" ? "Alex Morgan (Manager)" : "Customer",
      changedAt: new Date().toISOString(),
      note: `Ticket details updated (Title/Priority/Scope).`,
    };
    setHistory((prev) => [histEntry, ...prev]);

    toast.success(`Ticket #${ticketId} updated successfully`);
    return true;
  };

  const assignTechnician = (ticketId: string, technicianId: string | null): boolean => {
    if (role !== "manager") {
      toast.error("Only Managers or Admins can assign technicians.");
      return false;
    }

    const ticket = getTicket(ticketId);
    if (!ticket) return false;

    if (ticket.status === "Closed" || ticket.status === "Cancelled") {
      toast.error(`Cannot assign technician to ${ticket.status} ticket.`);
      return false;
    }

    const tech = getTechnician(technicianId);
    const nextStatus: TicketStatus = technicianId ? (ticket.status === "New" || ticket.status === "Rejected" ? "Assigned" : ticket.status) : "New";

    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, assignedTechnicianId: technicianId, status: nextStatus } : t))
    );

    // Update technician workload
    if (technicianId) {
      setTechnicians((prev) =>
        prev.map((t) => (t.id === technicianId ? { ...t, activeJobs: t.activeJobs + 1 } : t))
      );
    }

    const histEntry: TicketHistory = {
      id: `h-${Date.now()}`,
      ticketId,
      fromStatus: ticket.status,
      toStatus: nextStatus,
      changedBy: "Alex Morgan (Manager)",
      changedAt: new Date().toISOString(),
      note: tech ? `Assigned to technician ${tech.name} (${tech.specialization}).` : "Unassigned technician.",
    };
    setHistory((prev) => [histEntry, ...prev]);

    if (tech) {
      dispatchNotification(ticket, "Technician assigned", "SMS", tech.phone, `FieldFlow: You were assigned to ticket #${ticket.id}`);
      toast.success(`Assigned to ${tech.name}`);
    } else {
      toast.info("Ticket marked unassigned");
    }

    return true;
  };

  const updateTicketStatus = (
    ticketId: string,
    toStatus: TicketStatus,
    note?: string,
    evidence?: { name: string; url: string; customerVisible: boolean; tone?: Attachment["tone"] }
  ): boolean => {
    const ticket = getTicket(ticketId);
    if (!ticket) return false;

    // Check transition rules
    const check = canTransition(ticket.status, toStatus, role);
    if (!check.allowed) {
      toast.error("Status transition blocked", {
        description: check.reason,
      });
      return false;
    }

    const currentTech = getTechnician(activeTechnicianId);
    const actor = role === "manager"
      ? "Alex Morgan (Manager)"
      : role === "technician"
      ? `${currentTech?.name || "Technician"} (Technician)`
      : `${ticket.customerName} (Customer)`;

    // Update Ticket
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        return {
          ...t,
          status: toStatus,
          resolution: toStatus === "Resolved" || toStatus === "Closed" ? note || t.resolution : t.resolution,
        };
      })
    );

    // Add History
    const newHist: TicketHistory = {
      id: `h-${Date.now()}`,
      ticketId,
      fromStatus: ticket.status,
      toStatus,
      changedBy: actor,
      changedAt: new Date().toISOString(),
      note: note || `Status transitioned from ${ticket.status} to ${toStatus}.`,
    };
    setHistory((prev) => [newHist, ...prev]);

    // Attach evidence if provided
    if (evidence) {
      const newAtt: Attachment = {
        id: `att-${Date.now()}`,
        ticketId,
        name: evidence.name || "field_evidence.png",
        uploadedBy: actor,
        fileUrl: evidence.url || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80",
        fileType: "image/png",
        fileSize: "1.2 MB",
        uploadedAt: "Just now",
        customerVisible: evidence.customerVisible,
        tone: evidence.tone || "fix",
      };
      setAttachments((prev) => [newAtt, ...prev]);
    }

    // Trigger Notification Events
    if (toStatus === "In Progress") {
      dispatchNotification(ticket, "Status changed to In Progress", "Email", ticket.contact.email, `Technician has commenced work on ticket #${ticket.id}`);
    } else if (toStatus === "Resolved") {
      dispatchNotification(ticket, "Status changed to Resolved", "WhatsApp", ticket.contact.phone, `Ticket #${ticket.id} is now Resolved. Please verify and confirm.`);
    } else if (toStatus === "Closed") {
      dispatchNotification(ticket, "Status changed to Closed", "Email", ticket.contact.email, `Ticket #${ticket.id} resolution confirmed and closed.`);
    } else if (toStatus === "Cancelled") {
      dispatchNotification(ticket, "Ticket cancelled", "Email", ticket.contact.email, `Ticket #${ticket.id} was withdrawn.`);
    }

    toast.success(`Status updated to ${toStatus}`);
    return true;
  };

  const addNote = (ticketId: string, body: string, internal: boolean): Note => {
    const currentTech = getTechnician(activeTechnicianId);
    const author = role === "manager"
      ? "Alex Morgan (Manager)"
      : role === "technician"
      ? currentTech?.name || "Technician"
      : "Customer";

    const newNote: Note = {
      id: `n-${Date.now()}`,
      ticketId,
      author,
      authorRole: role,
      time: "Just now",
      body,
      internal,
    };

    setNotes((prev) => [newNote, ...prev]);
    toast.success(internal ? "Internal note saved" : "Public note shared with customer");
    return newNote;
  };

  const uploadAttachment = (
    ticketId: string,
    file: { name: string; fileUrl: string; fileType: Attachment["fileType"]; fileSize: string; customerVisible: boolean; tone?: Attachment["tone"] }
  ): Attachment => {
    const currentTech = getTechnician(activeTechnicianId);
    const uploadedBy = role === "manager" ? "Alex Morgan" : currentTech?.name || "Technician";

    const newAtt: Attachment = {
      id: `att-${Date.now()}`,
      ticketId,
      name: file.name,
      uploadedBy,
      fileUrl: file.fileUrl,
      fileType: file.fileType,
      fileSize: file.fileSize,
      uploadedAt: "Just now",
      customerVisible: file.customerVisible,
      tone: file.tone,
    };

    setAttachments((prev) => [newAtt, ...prev]);
    toast.success(`File uploaded (${file.customerVisible ? "Customer visible" : "Internal only"})`);
    return newAtt;
  };

  const confirmResolution = (ticketId: string, feedback?: string): boolean => {
    const ticket = getTicket(ticketId);
    if (!ticket) return false;

    if (ticket.status !== "Resolved") {
      toast.error("Only Resolved tickets can be confirmed as Closed.");
      return false;
    }

    return updateTicketStatus(
      ticketId,
      "Closed",
      feedback ? `Customer confirmed resolution: "${feedback}"` : "Customer confirmed service resolution. Ticket final."
    );
  };

  const resetToDefaults = () => {
    setTickets(initialTickets);
    setTechnicians(initialTechnicians);
    setHistory(initialHistory);
    setNotes(initialNotes);
    setAttachments(initialAttachments);
    setNotificationLogs(initialNotificationLogs);
    if (typeof window !== "undefined") {
      localStorage.removeItem(`${STORAGE_KEY}_role`);
      localStorage.removeItem(`${STORAGE_KEY}_activeTechId`);
      localStorage.removeItem(`${STORAGE_KEY}_activeCustId`);
      localStorage.removeItem(`${STORAGE_KEY}_tickets`);
      localStorage.removeItem(`${STORAGE_KEY}_technicians`);
      localStorage.removeItem(`${STORAGE_KEY}_history`);
      localStorage.removeItem(`${STORAGE_KEY}_notes`);
      localStorage.removeItem(`${STORAGE_KEY}_attachments`);
      localStorage.removeItem(`${STORAGE_KEY}_notifications`);
    }
    toast.info("Database reset to factory demo values");
  };

  return (
    <FieldFlowContext.Provider
      value={{
        role,
        setRole,
        activeTechnicianId,
        setActiveTechnicianId,
        activeCustomerId,
        setActiveCustomerId,
        tickets,
        technicians,
        customers,
        sites,
        equipment,
        history,
        notes,
        attachments,
        notificationLogs,
        createTicket,
        editTicket,
        assignTechnician,
        updateTicketStatus,
        addNote,
        uploadAttachment,
        confirmResolution,
        resetToDefaults,
        getTicket,
        getTechnician,
        getCustomer,
        getSite,
        getEquipmentForSite,
        getSitesForCustomer,
        getRepeatIssueCountForSite,
        getRepeatIssueCountForEquipment,
      }}
    >
      {children}
    </FieldFlowContext.Provider>
  );
}

export function useFieldFlow() {
  const context = useContext(FieldFlowContext);
  if (!context) {
    throw new Error("useFieldFlow must be used within a FieldFlowProvider");
  }
  return context;
}

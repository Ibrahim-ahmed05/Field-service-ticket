import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { Attachment, Category, Customer, Equipment, Note, NotificationLog, Priority, Site, Technician, Ticket, TicketHistory, TicketStatus, UserRole } from "./fieldflow-data";

type TicketInput = { customerId: string; siteId: string; equipmentId?: string; title: string; description: string; category: Category; priority: Priority; assignedTechnicianId?: string | null; workInstructions?: string[] };
type TicketEdit = Partial<Pick<TicketInput, "title" | "description" | "category" | "priority" | "workInstructions">> & { equipmentId?: string };
type RawNote = Note & { authorName?: string; text?: string; createdAt?: string; customerVisible?: boolean };
type RawAttachment = Attachment & { fileName?: string };
type BootstrapData = { tickets: Ticket[]; technicians: Technician[]; customers: Customer[]; sites: Site[]; equipment: Equipment[]; history: TicketHistory[]; comments: RawNote[]; attachments: RawAttachment[]; notificationLogs: NotificationLog[] };

interface FieldFlowContextType {
  role: UserRole; setRole: (role: UserRole) => void;
  activeTechnicianId: string; setActiveTechnicianId: (id: string) => void;
  activeCustomerId: string; setActiveCustomerId: (id: string) => void;
  tickets: Ticket[]; technicians: Technician[]; customers: Customer[]; sites: Site[]; equipment: Equipment[];
  history: TicketHistory[]; notes: Note[]; attachments: Attachment[]; notificationLogs: NotificationLog[];
  createTicket: (data: TicketInput) => Promise<Ticket>;
  editTicket: (ticketId: string, data: TicketEdit) => Promise<boolean>;
  assignTechnician: (ticketId: string, technicianId: string | null) => Promise<boolean>;
  updateTicketStatus: (ticketId: string, toStatus: TicketStatus, note?: string, evidence?: { name: string; url: string; customerVisible: boolean; tone?: Attachment["tone"] }) => Promise<boolean>;
  addNote: (ticketId: string, body: string, internal: boolean) => Promise<Note>;
  uploadAttachment: (ticketId: string, file: { name: string; fileUrl: string; fileType: Attachment["fileType"]; fileSize: string; customerVisible: boolean; tone?: Attachment["tone"] }) => Promise<Attachment>;
  confirmResolution: (ticketId: string, feedback?: string) => Promise<boolean>;
  resetToDefaults: () => Promise<void>;
  getTicket: (id: string) => Ticket | undefined; getTechnician: (id: string | null) => Technician | undefined;
  getCustomer: (id: string) => Customer | undefined; getSite: (id: string) => Site | undefined;
  getEquipmentForSite: (siteId: string) => Equipment[]; getSitesForCustomer: (customerId: string) => Site[];
  getRepeatIssueCountForSite: (siteId: string) => number; getRepeatIssueCountForEquipment: (equipmentId?: string) => number;
}

const emptyData = { tickets: [] as Ticket[], technicians: [] as Technician[], customers: [] as Customer[], sites: [] as Site[], equipment: [] as Equipment[], history: [] as TicketHistory[], notes: [] as Note[], attachments: [] as Attachment[], notificationLogs: [] as NotificationLog[] };
const FieldFlowContext = createContext<FieldFlowContextType | null>(null);
const errorText = (error: unknown) => error instanceof Error ? error.message : "The request could not be completed.";
const fileSizeToBytes = (value: string) => { const n = Number.parseFloat(value) || 0; return /mb/i.test(value) ? Math.round(n * 1048576) : /kb/i.test(value) ? Math.round(n * 1024) : Math.round(n); };

export function FieldFlowProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>("manager");
  const [activeTechnicianId, setActiveTechnicianId] = useState("t1");
  const [activeCustomerId, setActiveCustomerId] = useState("c1");
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const authHeaders = useMemo(() => {
    const headers: Record<string, string> = { "Content-Type": "application/json", "x-user-role": role.toUpperCase(), "x-company-id": "comp-1" };
    if (role === "technician") {
      Object.assign(headers, { "x-user-id": activeTechnicianId, "x-technician-id": activeTechnicianId, "x-user-name": "Technician", "x-user-email": "technician@fieldflow.local" });
    } else if (role === "customer") {
      Object.assign(headers, { "x-user-id": activeCustomerId, "x-customer-id": activeCustomerId, "x-user-name": "Customer", "x-user-email": "customer@fieldflow.local" });
    } else Object.assign(headers, { "x-user-id": "user-manager-1", "x-user-name": "Alex Morgan", "x-user-email": "manager@fieldflow.local" });
    return headers;
  }, [role, activeTechnicianId, activeCustomerId]);

  const request = useCallback(async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
    const response = await fetch(path, { ...init, headers: { ...authHeaders, ...(init.headers || {}) } });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || `Request failed (${response.status})`);
    return payload as T;
  }, [authHeaders]);

  const refreshData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const { data: raw } = await request<{ data: BootstrapData }>("/api/v1/bootstrap");
      const notes: Note[] = raw.comments.map((item) => ({ id: item.id, ticketId: item.ticketId, author: item.author || item.authorName || "User", authorRole: String(item.authorRole).toLowerCase() as UserRole, time: item.time || item.createdAt || "Just now", body: item.body || item.text || "", internal: item.internal ?? !item.customerVisible }));
      const attachments: Attachment[] = raw.attachments.map((item) => {
        const size = typeof item.fileSize === "number" ? `${(item.fileSize / 1048576).toFixed(1)} MB` : String(item.fileSize);
        return { ...item, name: item.name || item.fileName || "Attachment", fileSize: size };
      });
      setData({ tickets: raw.tickets, technicians: raw.technicians, customers: raw.customers, sites: raw.sites, equipment: raw.equipment, history: raw.history, notes, attachments, notificationLogs: raw.notificationLogs });
      setLoadError(null);
    } catch (error) { setLoadError(errorText(error)); }
    finally { setLoading(false); }
  }, [request]);
  useEffect(() => { void refreshData(true); }, [refreshData]);

  const createTicket = async (input: TicketInput) => {
    try {
      let { ticket } = await request<{ ticket: Ticket }>("/api/v1/tickets/", { method: "POST", body: JSON.stringify({ ...input, assignedTechnicianId: undefined, workInstructions: undefined }) });
      if (input.assignedTechnicianId) ({ ticket } = await request<{ ticket: Ticket }>(`/api/v1/tickets/${ticket.id}/assign`, { method: "PATCH", body: JSON.stringify({ technicianId: input.assignedTechnicianId }) }));
      if (role === "manager" && input.workInstructions?.length) ({ ticket } = await request<{ ticket: Ticket }>(`/api/v1/tickets/${ticket.id}/`, { method: "PATCH", body: JSON.stringify({ workInstructions: input.workInstructions }) }));
      await refreshData(); toast.success(`Ticket #${ticket.id} created successfully`); return ticket;
    } catch (error) { toast.error("Ticket creation failed", { description: errorText(error) }); throw error; }
  };
  const editTicket = async (ticketId: string, update: TicketEdit) => {
    try { await request(`/api/v1/tickets/${ticketId}/`, { method: "PATCH", body: JSON.stringify({ ...update, equipmentId: update.equipmentId ?? null }) }); await refreshData(); toast.success(`Ticket #${ticketId} updated successfully`); return true; }
    catch (error) { toast.error("Ticket update failed", { description: errorText(error) }); return false; }
  };
  const assignTechnician = async (ticketId: string, technicianId: string | null) => {
    try { await request(`/api/v1/tickets/${ticketId}/assign`, { method: "PATCH", body: JSON.stringify({ technicianId }) }); await refreshData(); toast.success(technicianId ? "Technician assigned" : "Ticket marked unassigned"); return true; }
    catch (error) { toast.error("Assignment failed", { description: errorText(error) }); return false; }
  };
  const updateTicketStatus = async (ticketId: string, toStatus: TicketStatus, note?: string, evidence?: Parameters<FieldFlowContextType["updateTicketStatus"]>[3]) => {
    try {
      await request(`/api/v1/tickets/${ticketId}/status`, { method: "PATCH", body: JSON.stringify({ status: toStatus, note }) });
      if (evidence) await request(`/api/v1/tickets/${ticketId}/attachments`, { method: "POST", body: JSON.stringify({ fileName: evidence.name, fileUrl: evidence.url, fileType: "image/png", fileSize: 1258291, customerVisible: evidence.customerVisible, tone: evidence.tone }) });
      await refreshData(); toast.success(`Status updated to ${toStatus}`); return true;
    } catch (error) { toast.error("Status update blocked", { description: errorText(error) }); return false; }
  };
  const addNote = async (ticketId: string, body: string, internal: boolean) => {
    try {
      const { comment } = await request<{ comment: any }>(`/api/v1/tickets/${ticketId}/comments`, { method: "POST", body: JSON.stringify({ text: body, customerVisible: !internal }) });
      await refreshData(); toast.success(internal ? "Internal note saved" : "Public note shared");
      return { id: comment.id, ticketId, author: comment.authorName, authorRole: String(comment.authorRole).toLowerCase(), time: comment.createdAt, body: comment.text, internal: !comment.customerVisible } as Note;
    } catch (error) { toast.error("Note could not be saved", { description: errorText(error) }); throw error; }
  };
  const uploadAttachment = async (ticketId: string, file: Parameters<FieldFlowContextType["uploadAttachment"]>[1]) => {
    try {
      const { attachment } = await request<{ attachment: Attachment }>(`/api/v1/tickets/${ticketId}/attachments`, { method: "POST", body: JSON.stringify({ fileName: file.name, fileUrl: file.fileUrl, fileType: file.fileType, fileSize: fileSizeToBytes(file.fileSize), customerVisible: file.customerVisible, tone: file.tone }) });
      await refreshData(); toast.success("Evidence uploaded"); return attachment;
    } catch (error) { toast.error("Upload failed", { description: errorText(error) }); throw error; }
  };
  const confirmResolution = (ticketId: string, feedback?: string) => updateTicketStatus(ticketId, "Closed", feedback || "Customer confirmed resolution.");
  const resetToDefaults = async () => { await refreshData(true); toast.success("Latest MongoDB data loaded"); };

  if (loading) return <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">Loading workspace data…</div>;
  if (loadError) return <div className="grid min-h-screen place-items-center bg-background px-6"><div className="max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm"><h1 className="text-lg font-semibold">Database connection unavailable</h1><p className="mt-2 text-sm text-muted-foreground">{loadError}</p><button className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={() => void refreshData(true)}>Try again</button></div></div>;

  const value: FieldFlowContextType = { ...data, role, setRole, activeTechnicianId, setActiveTechnicianId, activeCustomerId, setActiveCustomerId,
    createTicket, editTicket, assignTechnician, updateTicketStatus, addNote, uploadAttachment, confirmResolution, resetToDefaults,
    getTicket: (id) => data.tickets.find((item) => item.id === id), getTechnician: (id) => data.technicians.find((item) => item.id === id), getCustomer: (id) => data.customers.find((item) => item.id === id), getSite: (id) => data.sites.find((item) => item.id === id),
    getEquipmentForSite: (siteId) => data.equipment.filter((item) => item.siteId === siteId), getSitesForCustomer: (customerId) => data.sites.filter((item) => item.customerId === customerId), getRepeatIssueCountForSite: (siteId) => data.tickets.filter((item) => item.siteId === siteId).length, getRepeatIssueCountForEquipment: (equipmentId) => equipmentId ? data.tickets.filter((item) => item.equipmentId === equipmentId).length : 0 };
  return <FieldFlowContext.Provider value={value}>{children}</FieldFlowContext.Provider>;
}

export function useFieldFlow() { const context = useContext(FieldFlowContext); if (!context) throw new Error("useFieldFlow must be used inside FieldFlowProvider"); return context; }

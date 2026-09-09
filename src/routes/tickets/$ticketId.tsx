import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useFieldFlow } from "@/lib/store";
import { AppShell } from "@/components/ff/app-shell";
import { StatusBadge, PriorityBadge, Avatar } from "@/components/ff/badges";
import {
  isTicketOverdue,
  formatTimeRemaining,
  getNextAllowedTransitions,
  type TicketStatus,
} from "@/lib/fieldflow-data";
import {
  Clock,
  MapPin,
  Phone,
  Mail,
  Building,
  Wrench,
  Cpu,
  CheckSquare,
  Square,
  Send,
  Lock,
  Globe,
  Paperclip,
  Upload,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Bell,
  Eye,
  EyeOff,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransitionModal } from "@/components/ff/transition-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/tickets/$ticketId")({
  component: TicketDetailPage,
});

function TicketDetailPage() {
  const { ticketId } = useParams({ from: "/tickets/$ticketId" });
  const {
    getTicket,
    technicians,
    history,
    notes,
    attachments,
    notificationLogs,
    role,
    activeTechnicianId,
    assignTechnician,
    addNote,
    uploadAttachment,
    confirmResolution,
    updateTicketStatus,
  } = useFieldFlow();

  const ticket = getTicket(ticketId);

  // Modals & form state
  const [transitionTarget, setTransitionTarget] = useState<TicketStatus | null>(null);
  const [transitionModalOpen, setTransitionModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [attachModalOpen, setAttachModalOpen] = useState(false);

  // New Note state
  const [newNoteBody, setNewNoteBody] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);

  // New Attachment state
  const [attachName, setAttachName] = useState("");
  const [attachUrl, setAttachUrl] = useState("https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80");
  const [attachCustomerVisible, setAttachCustomerVisible] = useState(true);
  const [attachTone, setAttachTone] = useState<"before" | "issue" | "fix" | "after">("issue");

  // Checklist state
  const [completedInstructions, setCompletedInstructions] = useState<Record<number, boolean>>({});

  if (!ticket) {
    return (
      <AppShell title="Ticket Not Found">
        <div className="card-surface p-12 text-center space-y-4 max-w-lg mx-auto">
          <p className="text-base font-semibold">Ticket #{ticketId} does not exist.</p>
          <Link to="/tickets" className="inline-flex h-9 items-center px-4 rounded-lg bg-primary text-xs text-white">
            Return to Tickets List
          </Link>
        </div>
      </AppShell>
    );
  }

  const assignedTech = technicians.find((t) => t.id === ticket.assignedTechnicianId);
  const overdue = isTicketOverdue(ticket);
  const remainingText = formatTimeRemaining(ticket.dueDate, ticket.status);

  // Filter items by ticketId
  const ticketHistory = history.filter((h) => h.ticketId === ticket.id);
  
  // Security filter per Section 6 & 7: Customers cannot see internal notes or internal attachments
  const ticketNotes = notes.filter((n) => {
    if (n.ticketId !== ticket.id) return false;
    if (role === "customer" && n.internal) return false;
    return true;
  });

  const ticketAttachments = attachments.filter((a) => {
    if (a.ticketId !== ticket.id) return false;
    if (role === "customer" && !a.customerVisible) return false;
    return true;
  });

  const ticketNotifications = notificationLogs.filter((l) => l.ticketId === ticket.id);

  // Available next transitions for current role
  const nextTransitions = getNextAllowedTransitions(ticket.status, role);

  const handleTriggerTransition = (status: TicketStatus) => {
    setTransitionTarget(status);
    setTransitionModalOpen(true);
  };

  const handlePostNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteBody.trim()) return;
    addNote(ticket.id, newNoteBody.trim(), isInternalNote);
    setNewNoteBody("");
  };

  const handleUploadAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attachName.trim() || !attachUrl.trim()) return;
    uploadAttachment(ticket.id, {
      name: attachName.trim(),
      fileUrl: attachUrl.trim(),
      fileType: "image/png",
      fileSize: "1.8 MB",
      customerVisible: attachCustomerVisible,
      tone: attachTone,
    });
    setAttachModalOpen(false);
    setAttachName("");
  };

  const toggleInstruction = (idx: number) => {
    setCompletedInstructions((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <AppShell
      title={`Ticket #${ticket.id}`}
      subtitle={`${ticket.title} — ${ticket.customerName}`}
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          {/* Manager Actions: Assign / Reassign */}
          {role === "manager" && ticket.status !== "Closed" && ticket.status !== "Cancelled" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAssignModalOpen(true)}
              className="h-8 text-xs gap-1.5"
            >
              <UserCheck className="size-3.5" />
              <span>{ticket.assignedTechnicianId ? "Reassign Tech" : "Assign Tech"}</span>
            </Button>
          )}

          {/* Role Transitions Dropdown / Quick Buttons */}
          {nextTransitions.map((t) => (
            <Button
              key={t.to}
              size="sm"
              onClick={() => handleTriggerTransition(t.to)}
              className={`h-8 text-xs gap-1.5 font-medium ${
                t.to === "Resolved"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : t.to === "Rejected" || t.to === "Cancelled"
                  ? "bg-rose-600 hover:bg-rose-700 text-white"
                  : "bg-primary text-white"
              }`}
            >
              <span>{t.to === "Resolved" ? "Complete & Resolve" : t.to === "In Progress" ? "Start Work" : `Move to ${t.to}`}</span>
              <ArrowRight className="size-3.5" />
            </Button>
          ))}

          {/* Customer Confirmation Action when Resolved */}
          {role === "customer" && ticket.status === "Resolved" && (
            <Button
              size="sm"
              onClick={() => confirmResolution(ticket.id)}
              className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              <ShieldCheck className="size-3.5" />
              <span>Confirm Resolution (Close)</span>
            </Button>
          )}
        </div>
      }
    >
      {/* Top Banner Status Bar */}
      <div className="card-surface p-5 shadow-soft mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <StatusBadge status={ticket.status} className="text-xs py-1 px-3" />
          <PriorityBadge priority={ticket.priority} />
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-muted border border-hairline text-muted-foreground font-medium">
            Category: {ticket.category}
          </span>
          {ticket.equipmentModel && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 font-mono">
              Asset: {ticket.equipmentModel}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">SLA Target:</span>
            <span className={`font-mono font-semibold ${overdue ? "text-red-600" : "text-foreground"}`}>
              {remainingText}
            </span>
          </div>
          {overdue && (
            <span className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-medium text-[11px]">
              SLA BREACH
            </span>
          )}
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1.7fr] gap-6">
        {/* Left Column: Details, Site, Equipment & Work Instructions */}
        <div className="space-y-6">
          {/* Issue Summary */}
          <section className="card-surface p-6 shadow-soft space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Issue Description</h2>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>

            {ticket.resolution && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 space-y-1">
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5" />
                  Verified Work Resolution
                </span>
                <p className="text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed">
                  {ticket.resolution}
                </p>
              </div>
            )}
          </section>

          {/* Customer & Location Card */}
          <section className="card-surface p-6 shadow-soft space-y-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Building className="size-4 text-primary" />
              Customer & Site Location
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">{ticket.customerName}</p>
                  <p className="text-muted-foreground mt-0.5">{ticket.siteName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface border border-hairline text-muted-foreground">
                <MapPin className="size-4 shrink-0 text-primary" />
                <span className="flex-1 truncate">{ticket.siteAddress}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 rounded-lg bg-surface border border-hairline flex items-center gap-2">
                  <Phone className="size-3.5 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground">Contact</p>
                    <p className="font-medium truncate">{ticket.contact.name}</p>
                    <p className="font-mono text-[10px] text-primary">{ticket.contact.phone}</p>
                  </div>
                </div>

                {ticket.contact.email && (
                  <div className="p-2.5 rounded-lg bg-surface border border-hairline flex items-center gap-2">
                    <Mail className="size-3.5 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground">Email</p>
                      <p className="font-medium truncate">{ticket.contact.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Assigned Technician Card */}
          <section className="card-surface p-6 shadow-soft space-y-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Wrench className="size-4 text-primary" />
              Assigned Field Engineer
            </h2>

            {assignedTech ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-hairline">
                <div className="flex items-center gap-3">
                  <Avatar initials={assignedTech.initials} size="lg" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">{assignedTech.name}</p>
                    <p className="text-[11px] text-muted-foreground">{assignedTech.specialization}</p>
                    <p className="font-mono text-[10px] text-primary mt-0.5">{assignedTech.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-foreground">{assignedTech.rating}★</span>
                  <p className="text-[10px] text-muted-foreground">{assignedTech.activeJobs} active jobs</p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-hairline text-center space-y-2">
                <p className="text-xs text-muted-foreground">No field technician assigned to this ticket yet.</p>
                {role === "manager" && (
                  <Button size="sm" variant="outline" onClick={() => setAssignModalOpen(true)} className="text-xs h-7">
                    Assign Technician Now
                  </Button>
                )}
              </div>
            )}
          </section>

          {/* Work Instructions Checklist */}
          {ticket.workInstructions && ticket.workInstructions.length > 0 && (
            <section className="card-surface p-6 shadow-soft space-y-3">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <CheckSquare className="size-4 text-primary" />
                Work Instructions Checklist
              </h2>
              <ul className="space-y-2">
                {ticket.workInstructions.map((ins, idx) => {
                  const isDone = !!completedInstructions[idx];
                  return (
                    <li
                      key={idx}
                      onClick={() => toggleInstruction(idx)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isDone
                          ? "bg-emerald-50/50 border-emerald-200 text-emerald-900 line-through dark:bg-emerald-950/30"
                          : "bg-surface border-hairline text-foreground hover:bg-muted/50"
                      }`}
                    >
                      {isDone ? (
                        <CheckSquare className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                      )}
                      <span className="leading-snug">{ins}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>

        {/* Right Column: Tabs (Activity/History, Notes, Evidence/Attachments, Notifications) */}
        <div>
          <Tabs defaultValue="history" className="space-y-4">
            <TabsList className="grid grid-cols-4 bg-muted p-1 rounded-xl h-10">
              <TabsTrigger value="history" className="text-xs font-medium rounded-lg">
                Activity ({ticketHistory.length})
              </TabsTrigger>
              <TabsTrigger value="notes" className="text-xs font-medium rounded-lg">
                Notes ({ticketNotes.length})
              </TabsTrigger>
              <TabsTrigger value="attachments" className="text-xs font-medium rounded-lg">
                Evidence ({ticketAttachments.length})
              </TabsTrigger>
              <TabsTrigger value="notifications" className="text-xs font-medium rounded-lg">
                Dispatches ({ticketNotifications.length})
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Chronological Immutable TicketHistory (Section 2 & 3) */}
            <TabsContent value="history" className="card-surface p-6 shadow-soft space-y-6">
              <div className="flex items-baseline justify-between border-b border-hairline pb-3">
                <div>
                  <h3 className="text-sm font-semibold">Chronological Status History</h3>
                  <p className="text-xs text-muted-foreground">Immutable audit record of every transition</p>
                </div>
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-hairline">
                {ticketHistory.map((h, i) => (
                  <div key={h.id} className="relative space-y-1">
                    <span className="absolute -left-6 top-1 size-3 rounded-full bg-primary ring-4 ring-card" />
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">{h.changedBy}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {new Date(h.changedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 py-0.5">
                      {h.fromStatus && (
                        <>
                          <StatusBadge status={h.fromStatus} className="text-[10px] py-0 px-1.5" />
                          <ArrowRight className="size-3 text-muted-foreground" />
                        </>
                      )}
                      <StatusBadge status={h.toStatus} className="text-[10px] py-0 px-1.5" />
                    </div>

                    {h.note && (
                      <p className="text-xs text-muted-foreground bg-surface p-2.5 rounded-lg border border-hairline mt-1">
                        {h.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Tab 2: Notes & Comments (Internal vs Customer Visible) */}
            <TabsContent value="notes" className="card-surface p-6 shadow-soft space-y-6">
              <div className="flex items-baseline justify-between border-b border-hairline pb-3">
                <div>
                  <h3 className="text-sm font-semibold">Service Comments & Notes</h3>
                  <p className="text-xs text-muted-foreground">
                    {role === "customer" ? "Public updates from field operations" : "Customer-safe & internal engineering logs"}
                  </p>
                </div>
              </div>

              {/* Note Composer */}
              <form onSubmit={handlePostNote} className="space-y-3 p-3.5 rounded-xl border border-hairline bg-surface">
                <Textarea
                  required
                  rows={2}
                  placeholder="Type an update, diagnostic note, or note for customer..."
                  value={newNoteBody}
                  onChange={(e) => setNewNoteBody(e.target.value)}
                  className="text-xs resize-none bg-background"
                />

                <div className="flex items-center justify-between gap-3">
                  {role !== "customer" ? (
                    <div className="flex items-center gap-2">
                      <Switch checked={isInternalNote} onCheckedChange={setIsInternalNote} />
                      <Label className="text-xs text-muted-foreground flex items-center gap-1 cursor-pointer">
                        {isInternalNote ? (
                          <>
                            <Lock className="size-3 text-amber-500" />
                            <strong className="text-foreground">Internal Only</strong> (Hidden from customer)
                          </>
                        ) : (
                          <>
                            <Globe className="size-3 text-emerald-500" />
                            <span>Customer Visible</span>
                          </>
                        )}
                      </Label>
                    </div>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">Posting as customer response</span>
                  )}

                  <Button type="submit" size="sm" className="h-8 text-xs gap-1.5 bg-primary font-medium">
                    <Send className="size-3" /> Post Note
                  </Button>
                </div>
              </form>

              {/* Notes List */}
              <div className="space-y-3">
                {ticketNotes.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No notes logged yet.</p>
                ) : (
                  ticketNotes.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                        n.internal
                          ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-900/40"
                          : "bg-surface border-hairline"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{n.author}</span>
                          {n.internal ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-[10px] font-semibold">
                              <Lock className="size-2.5" /> Internal
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-[10px] font-medium">
                              <Globe className="size-2.5" /> Customer Visible
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground">{n.time}</span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{n.body}</p>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Tab 3: Evidence & Attachments (Section 6 Security) */}
            <TabsContent value="attachments" className="card-surface p-6 shadow-soft space-y-6">
              <div className="flex items-center justify-between border-b border-hairline pb-3">
                <div>
                  <h3 className="text-sm font-semibold">Evidence & Attachments</h3>
                  <p className="text-xs text-muted-foreground">Section 6 Attachment & Evidence Security</p>
                </div>
                {role !== "customer" && (
                  <Button size="sm" variant="outline" onClick={() => setAttachModalOpen(true)} className="h-8 text-xs gap-1.5">
                    <Upload className="size-3.5" /> Upload Evidence
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {ticketAttachments.length === 0 ? (
                  <div className="col-span-2 text-center py-8 text-xs text-muted-foreground">
                    No attachments uploaded for this ticket.
                  </div>
                ) : (
                  ticketAttachments.map((att) => (
                    <div
                      key={att.id}
                      className="rounded-xl border border-hairline bg-surface p-3 space-y-2.5 transition-all hover:border-border"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground truncate max-w-[140px]">{att.name}</span>
                        {att.customerVisible ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
                            <Eye className="size-2.5" /> Public
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full border border-amber-200 font-medium">
                            <EyeOff className="size-2.5" /> Internal Only
                          </span>
                        )}
                      </div>

                      {att.fileUrl && att.fileUrl.startsWith("http") && (
                        <div className="aspect-video w-full rounded-lg overflow-hidden border border-hairline bg-muted">
                          <img src={att.fileUrl} alt={att.name} className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-hairline/60 font-mono">
                        <span>By: {att.uploadedBy}</span>
                        <span>{att.fileSize}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Tab 4: Notifications Log */}
            <TabsContent value="notifications" className="card-surface p-6 shadow-soft space-y-4">
              <div className="border-b border-hairline pb-3">
                <h3 className="text-sm font-semibold">Notification Dispatch Log</h3>
                <p className="text-xs text-muted-foreground">Trigger event dispatches for this specific ticket</p>
              </div>

              <div className="space-y-3">
                {ticketNotifications.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No notifications recorded.</p>
                ) : (
                  ticketNotifications.map((l) => (
                    <div key={l.id} className="p-3 rounded-xl border border-hairline bg-surface text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">{l.triggerEvent}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{l.sentAt}</span>
                      </div>
                      <p className="text-[11px] font-mono text-muted-foreground bg-elevated p-2 rounded border border-hairline">
                        {l.messagePreview}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                        <span>Channel: <strong>{l.channel}</strong></span>
                        <span>To: <strong>{l.recipient}</strong></span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* State Transition Modal */}
      <TransitionModal
        ticket={ticket}
        targetStatus={transitionTarget}
        open={transitionModalOpen}
        onOpenChange={setTransitionModalOpen}
      />

      {/* Assign Technician Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Assign Technician</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select a field engineer to handle Ticket #{ticket.id}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            {technicians.map((t) => (
              <div
                key={t.id}
                onClick={() => {
                  assignTechnician(ticket.id, t.id);
                  setAssignModalOpen(false);
                }}
                className="flex items-center justify-between p-3 rounded-xl border border-hairline hover:border-primary hover:bg-muted/50 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <Avatar initials={t.initials} size="md" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">{t.name}</p>
                    <p className="text-[11px] text-muted-foreground">{t.specialization}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-medium">{t.activeJobs} jobs</span>
                  <p className="text-[10px] text-muted-foreground">{t.status}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Attachment Modal */}
      <Dialog open={attachModalOpen} onOpenChange={setAttachModalOpen}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Upload Evidence / Document</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Attach inspection photo or technical report to Ticket #{ticket.id}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadAttachment} className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Attachment Label / File Name</Label>
              <Input
                required
                placeholder="e.g., multimeter_reading_dc.png"
                value={attachName}
                onChange={(e) => setAttachName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Image URL</Label>
              <Input
                required
                value={attachUrl}
                onChange={(e) => setAttachUrl(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-hairline">
              <div>
                <Label className="text-xs font-medium">Customer Visible</Label>
                <p className="text-[10px] text-muted-foreground">Make visible on customer tracking portal</p>
              </div>
              <Switch checked={attachCustomerVisible} onCheckedChange={setAttachCustomerVisible} />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setAttachModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-primary text-white text-xs">
                Upload File
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

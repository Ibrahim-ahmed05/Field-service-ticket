import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useFieldFlow } from "@/lib/store";
import { WorkspaceNavigation } from "@/components/ff/workspace-navigation";
import { RoleBar } from "@/components/ff/role-bar";
import { StatusBadge, PriorityBadge, Avatar } from "@/components/ff/badges";
import {
  isTicketOverdue,
  formatTimeRemaining,
  type TicketStatus,
} from "@/lib/fieldflow-data";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Building,
  Wrench,
  ShieldCheck,
  Send,
  Camera,
  HelpCircle,
  Sparkles,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Logo } from "@/components/ff/logo";

export const Route = createFileRoute("/track/$ticketId")({
  component: CustomerTicketTrackingPage,
});

const customerStages = [
  { id: "received", label: "Request Received", desc: "Your request has been received" },
  { id: "assigned", label: "Technician Assigned", desc: "A technician has been assigned" },
  { id: "progress", label: "Work In Progress", desc: "Your technician is working on the issue" },
  { id: "resolved", label: "Work Completed", desc: "The fix and service notes are ready" },
  { id: "closed", label: "Service Closed", desc: "You confirmed the completed work" },
];

const getStageIndex = (status: TicketStatus): number => {
  switch (status) {
    case "New":
      return 0;
    case "Assigned":
      return 1;
    case "In Progress":
    case "Waiting":
      return 2;
    case "Resolved":
      return 3;
    case "Closed":
      return 4;
    default:
      return 0;
  }
};

function CustomerTicketTrackingPage() {
  const { ticketId } = useParams({ from: "/track/$ticketId" });
  const {
    getTicket,
    technicians,
    history,
    notes,
    attachments,
    addNote,
    confirmResolution,
  } = useFieldFlow();

  const ticket = getTicket(ticketId);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [customerMessage, setCustomerMessage] = useState("");

  if (!ticket) {
    return (
      <div className="min-h-screen bg-surface p-6 text-center space-y-4">
        <p className="text-base font-semibold">Service ticket #{ticketId} not found.</p>
        <Link to="/customer" className="inline-flex h-9 items-center px-4 rounded-lg bg-primary text-xs text-white">
          Back to Customer Portal
        </Link>
      </div>
    );
  }

  const assignedTech = technicians.find((t) => t.id === ticket.assignedTechnicianId);
  const currentStage = getStageIndex(ticket.status);
  const remaining = formatTimeRemaining(ticket.dueDate, ticket.status);
  const overdue = isTicketOverdue(ticket);

  // Security filters: Customer sees ONLY public notes & public attachments (Section 6 & 7)
  const publicNotes = notes.filter((n) => n.ticketId === ticket.id && !n.internal);
  const publicAttachments = attachments.filter((a) => a.ticketId === ticket.id && a.customerVisible);
  const ticketHistory = history.filter((h) => h.ticketId === ticket.id);

  const handleConfirmResolution = () => {
    confirmResolution(ticket.id, feedbackText.trim() || undefined);
    setConfirmModalOpen(false);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerMessage.trim()) return;
    addNote(ticket.id, customerMessage.trim(), false); // Always public from customer
    setCustomerMessage("");
  };

  return (
    <div className="portal-screen min-h-screen bg-surface flex flex-col">
      <WorkspaceNavigation /><div className="portal-role"><RoleBar /></div>

      {/* Header */}
      <header className="border-b border-hairline bg-elevated/90 backdrop-blur-md relative z-20">
        <div className="max-w-4xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/customer" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-4" />
            </Link>
            <Logo />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-foreground">{ticket.id}</span>
            <StatusBadge status={ticket.status} />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-5 py-8 space-y-6">
        {/* Top Status Card with 5-Stage Stepper */}
        <section className="card-surface p-6 shadow-soft space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                Service progress
              </span>
              <h1 className="text-lg font-bold text-foreground mt-0.5">{ticket.title}</h1>
              <p className="text-xs text-muted-foreground mt-1">
                {ticket.siteName} • {ticket.siteAddress}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-muted-foreground">Target SLA:</span>
              <p className={`font-mono text-xs font-semibold ${overdue ? "text-red-600" : "text-foreground"}`}>
                {remaining}
              </p>
            </div>
          </div>

          {/* 5-Stage Visual Progress Bar */}
          <div className="pt-2">
            <div className="relative flex items-center justify-between">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-muted w-full z-0" />
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary transition-all duration-700 z-0"
                style={{ width: `${(currentStage / (customerStages.length - 1)) * 100}%` }}
              />

              {customerStages.map((stage, idx) => {
                const isCompleted = idx <= currentStage;
                const isCurrent = idx === currentStage;
                return (
                  <div key={stage.id} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`size-8 rounded-full grid place-items-center text-xs font-bold transition-all shadow-xs ${
                        isCompleted
                          ? "bg-primary text-primary-foreground ring-4 ring-background"
                          : "bg-muted text-muted-foreground border border-hairline"
                      }`}
                    >
                      {isCurrent ? <Clock className="size-4" /> : isCompleted ? <CheckCircle2 className="size-4" /> : idx + 1}
                    </div>
                    <span
                      className={`text-[10px] sm:text-[11px] font-medium mt-2 block text-center max-w-[90px] ${
                        isCurrent ? "text-primary font-bold" : isCompleted ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {["Received", "Assigned", "Working", "Completed", "Closed"][idx]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Prominent Action Banner when ticket is Resolved */}
        {ticket.status === "Resolved" && (
          <section className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 shadow-soft space-y-4">
            <div className="flex items-start gap-4">
              <div className="size-11 rounded-xl bg-emerald-500 text-white grid place-items-center shrink-0 shadow-xs">
                <ShieldCheck className="size-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-bold text-emerald-950 dark:text-emerald-100">
                  Technician has completed the requested work
                </h2>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1 leading-relaxed">
                  Your technician has recorded the fix. Review the service notes below, then confirm that the issue is resolved.
                </p>

                {ticket.resolution && (
                  <div className="mt-3 p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-emerald-200 dark:border-emerald-900 text-xs">
                    <p className="font-semibold text-emerald-900 dark:text-emerald-200">Resolution Summary:</p>
                    <p className="text-muted-foreground mt-1">{ticket.resolution}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-emerald-200/80 dark:border-emerald-900/60">
              <Button
                size="sm"
                onClick={() => setConfirmModalOpen(true)}
                className="h-9 px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="size-4" />
                <span>Confirm Resolution (Close Ticket)</span>
              </Button>
            </div>
          </section>
        )}

        {/* Details & Technician Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Issue & Service Details */}
          <section className="card-surface p-6 shadow-soft space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Service Request Details</h2>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Reported Issue</span>
                <p className="text-muted-foreground mt-0.5 leading-relaxed">{ticket.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-hairline">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Category</span>
                  <p className="font-medium text-foreground mt-0.5">{ticket.category}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Priority</span>
                  <p className="font-medium text-foreground mt-0.5">{ticket.priority}</p>
                </div>
              </div>

              {ticket.equipmentModel && (
                <div className="pt-2 border-t border-hairline">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Equipment Asset</span>
                  <p className="font-mono text-foreground mt-0.5">{ticket.equipmentModel}</p>
                </div>
              )}
            </div>
          </section>

          {/* Assigned Field Engineer Card */}
          <section className="card-surface p-6 shadow-soft space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Assigned Field Engineer</h2>
            {assignedTech ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar initials={assignedTech.initials} size="lg" />
                  <div>
                    <h3 className="text-xs font-bold text-foreground">{assignedTech.name}</h3>
                    <p className="text-[11px] text-muted-foreground">{assignedTech.specialization}</p>
                    <span className="text-[10px] text-emerald-600 font-medium">✓ Certified Field Specialist</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surface border border-hairline flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Direct Technician Contact:</span>
                  <a
                    href={`tel:${assignedTech.phone}`}
                    className="inline-flex items-center gap-1.5 font-mono text-primary font-semibold hover:underline"
                  >
                    <Phone className="size-3" /> {assignedTech.phone}
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-6 text-center">
                A technician is currently being assigned by the dispatch manager.
              </p>
            )}
          </section>
        </div>

        {/* Customer-Safe Photos & Evidence Gallery (Section 6) */}
        <section className="card-surface p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Camera className="size-4 text-primary" />
              Verified Field Photos & Evidence
            </h2>
            <span className="text-xs text-muted-foreground">{publicAttachments.length} photos</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {publicAttachments.length === 0 ? (
              <p className="col-span-3 text-xs text-muted-foreground text-center py-6">
                No public photos attached yet. Inspection photos will appear here as technician uploads them.
              </p>
            ) : (
              publicAttachments.map((att) => (
                <div key={att.id} className="rounded-xl overflow-hidden border border-hairline bg-surface p-1.5 space-y-1.5">
                  {att.fileUrl && att.fileUrl.startsWith("http") && (
                    <img src={att.fileUrl} alt={att.name} className="w-full aspect-video object-cover rounded-lg" />
                  )}
                  <div className="flex items-center justify-between px-1 text-[11px]">
                    <span className="font-medium text-foreground truncate">{att.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{att.uploadedAt}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Customer Updates & Messaging */}
        <section className="card-surface p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Service Communication & Updates</h2>

          <form onSubmit={handleSendMessage} className="space-y-2">
            <Textarea
              required
              rows={2}
              placeholder="Have a question about this ticket or need to provide site access instructions?..."
              value={customerMessage}
              onChange={(e) => setCustomerMessage(e.target.value)}
              className="text-xs resize-none bg-surface"
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm" className="h-8 text-xs bg-primary text-white font-medium">
                <Send className="size-3 mr-1" /> Send Message
              </Button>
            </div>
          </form>

          <div className="space-y-3 pt-2 border-t border-hairline">
            {publicNotes.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No public updates logged yet.</p>
            ) : (
              publicNotes.map((n) => (
                <div key={n.id} className="p-3 rounded-xl border border-hairline bg-surface text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-foreground">{n.author}</span>
                    <span className="text-muted-foreground font-mono">{n.time}</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{n.body}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Confirmation Dialog */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <ShieldCheck className="size-5 text-emerald-600" />
              Confirm Service Resolution
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              By confirming, you verify that the reported issue has been addressed to your satisfaction. The ticket will transition to 'Closed'.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Optional Feedback or Rating Note</label>
              <Textarea
                rows={3}
                placeholder="e.g. Excellent service. Solar output restored to 100%..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="text-xs resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setConfirmModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmResolution}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs"
            >
              Confirm & Close Ticket
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}




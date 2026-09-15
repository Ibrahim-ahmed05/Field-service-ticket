import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useFieldFlow } from "@/lib/store";
import { WorkspaceNavigation } from "@/components/ff/workspace-navigation";
import { RoleBar } from "@/components/ff/role-bar";
import { StatusBadge, PriorityBadge } from "@/components/ff/badges";
import {
  isTicketOverdue,
  formatTimeRemaining,
  type TicketStatus,
} from "@/lib/fieldflow-data";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Building,
  CheckSquare,
  Square,
  Camera,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  XCircle,
  Send,
  Lock,
  Globe,
  Upload,
  Clock,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TransitionModal } from "@/components/ff/transition-modal";

export const Route = createFileRoute("/tech/$jobId")({
  component: TechnicianJobDetailPage,
});

function TechnicianJobDetailPage() {
  const { jobId } = useParams({ from: "/tech/$jobId" });
  const {
    getTicket,
    notes,
    attachments,
    addNote,
    uploadAttachment,
    updateTicketStatus,
  } = useFieldFlow();

  const ticket = getTicket(jobId);

  const [completedInstructions, setCompletedInstructions] = useState<Record<number, boolean>>({});
  const [noteText, setNoteText] = useState("");
  const [isInternal, setIsInternal] = useState(true);

  // Transition modal
  const [targetStatus, setTargetStatus] = useState<TicketStatus | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  if (!ticket) {
    return (
      <div className="min-h-screen bg-surface p-6 text-center space-y-4">
        <p className="text-sm font-semibold">Work Order #{jobId} not found.</p>
        <Link to="/tech" className="inline-flex h-8 items-center px-4 rounded-lg bg-primary text-xs text-white">
          Back to My Jobs
        </Link>
      </div>
    );
  }

  const overdue = isTicketOverdue(ticket);
  const remaining = formatTimeRemaining(ticket.dueDate, ticket.status);

  const jobNotes = notes.filter((n) => n.ticketId === ticket.id);
  const jobAttachments = attachments.filter((a) => a.ticketId === ticket.id);

  const toggleInstruction = (idx: number) => {
    setCompletedInstructions((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handlePostNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    await addNote(ticket.id, noteText.trim(), isInternal);
    setNoteText("");
  };

  const openTransition = (status: TicketStatus) => {
    if (status === "Waiting" || status === "Resolved" || status === "Rejected") {
      setTargetStatus(status);
      setModalOpen(true);
    } else {
      void updateTicketStatus(ticket.id, status, "Technician updated status from mobile app.");
    }
  };

  return (
    <div className="portal-screen min-h-screen bg-surface flex flex-col pb-12">
      <WorkspaceNavigation />

      {/* Top Header */}
      <header className="relative z-20 bg-elevated border-b border-hairline shadow-xs">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/tech" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium">
            <ArrowLeft className="size-4" />
            <span>My Jobs</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-foreground">{ticket.id}</span>
            <PriorityBadge priority={ticket.priority} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 space-y-4">
        {/* Status & SLA Banner */}
        <div className="card-surface p-4 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <StatusBadge status={ticket.status} className="text-xs py-1 px-3" />
            <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              <span className={overdue ? "text-red-600 font-bold" : ""}>{remaining}</span>
            </div>
          </div>

          <h1 className="text-base font-bold text-foreground leading-snug">{ticket.title}</h1>
          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
        </div>

        {/* Site Location & Customer Contact */}
        <div className="card-surface p-4 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">Site & Client Details</h2>
            <span className="text-[10px] text-muted-foreground">{ticket.customerName}</span>
          </div>

          <div className="p-3 rounded-xl bg-surface border border-hairline space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">{ticket.siteName}</p>
                <p className="text-muted-foreground text-[11px]">{ticket.siteAddress}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-hairline/60">
              <span className="text-muted-foreground text-[11px]">Site Contact: <strong>{ticket.contact.name}</strong></span>
              <a
                href={`tel:${ticket.contact.phone}`}
                className="h-7 px-3 rounded-lg bg-primary text-primary-foreground font-mono text-[11px] flex items-center gap-1.5 font-medium shadow-xs"
              >
                <Phone className="size-3" /> Call Contact
              </a>
            </div>
          </div>

          {ticket.equipmentModel && (
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs flex items-center justify-between">
              <span className="text-blue-950 dark:text-blue-200">Asset: <strong>{ticket.equipmentModel}</strong></span>
              <span className="text-[10px] font-mono text-blue-700 dark:text-blue-300">Category: {ticket.category}</span>
            </div>
          )}
        </div>

        {/* Work Instructions Checklist */}
        {ticket.workInstructions && ticket.workInstructions.length > 0 && (
          <div className="card-surface p-4 shadow-soft space-y-3">
            <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Diagnostic & Service Checklist
            </h2>
            <ul className="space-y-2">
              {ticket.workInstructions.map((ins, idx) => {
                const isDone = !!completedInstructions[idx];
                return (
                  <li
                    key={idx}
                    onClick={() => toggleInstruction(idx)}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                      isDone
                        ? "bg-emerald-50/60 border-emerald-200 text-emerald-900 line-through dark:bg-emerald-950/30"
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
          </div>
        )}

        {/* Evidence Photos Gallery */}
        <div className="card-surface p-4 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Field Evidence & Photos
            </h2>
            <span className="text-[10px] text-muted-foreground">{jobAttachments.length} photos</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {jobAttachments.length === 0 ? (
              <p className="col-span-2 text-center py-4 text-xs text-muted-foreground">
                No photos uploaded. Complete job modal will prompt for completion photo.
              </p>
            ) : (
              jobAttachments.map((att) => (
                <div key={att.id} className="rounded-lg overflow-hidden border border-hairline bg-surface p-1 space-y-1">
                  {att.fileUrl && att.fileUrl.startsWith("http") && (
                    <img src={att.fileUrl} alt={att.name} className="w-full aspect-video object-cover rounded" />
                  )}
                  <div className="flex items-center justify-between px-1 text-[10px]">
                    <span className="truncate">{att.name}</span>
                    <span className="text-muted-foreground">{att.customerVisible ? "Public" : "Internal"}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Field Notes & Live Logs */}
        <div className="card-surface p-4 shadow-soft space-y-3">
          <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Job Notes & Customer Updates
          </h2>

          <form onSubmit={handlePostNote} className="space-y-2">
            <Textarea
              required
              rows={2}
              placeholder="Log voltage reading, parts used, or client note..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="text-xs resize-none bg-surface"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Switch checked={isInternal} onCheckedChange={setIsInternal} />
                <Label className="text-[11px] text-muted-foreground flex items-center gap-1 cursor-pointer">
                  {isInternal ? (
                    <>
                      <Lock className="size-3 text-amber-500" /> Internal Engineering
                    </>
                  ) : (
                    <>
                      <Globe className="size-3 text-emerald-500" /> Customer Visible
                    </>
                  )}
                </Label>
              </div>

              <Button type="submit" size="sm" className="h-7 text-xs bg-primary text-white">
                <Send className="size-3 mr-1" /> Log Note
              </Button>
            </div>
          </form>

          <div className="space-y-2 pt-2 border-t border-hairline">
            {jobNotes.map((n) => (
              <div
                key={n.id}
                className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                  n.internal
                    ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/60"
                    : "bg-surface border-hairline"
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-foreground">{n.author}</span>
                  <span className="text-muted-foreground">{n.time}</span>
                </div>
                <p className="text-muted-foreground">{n.body}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Sticky Bottom Action Toolbar */}
      <footer className="fixed bottom-0 inset-x-0 bg-elevated/95 border-t border-hairline backdrop-blur-md p-3 shadow-lift z-20">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-2">
          {ticket.status === "Assigned" && (
            <>
              <Button
                variant="outline"
                onClick={() => openTransition("Rejected")}
                className="flex-1 h-10 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 font-medium"
              >
                <XCircle className="size-4 mr-1.5" /> Decline Assignment
              </Button>
              <Button
                onClick={() => openTransition("In Progress")}
                className="flex-1 h-10 text-xs bg-primary text-white font-semibold"
              >
                <PlayCircle className="size-4 mr-1.5" /> Start Work
              </Button>
            </>
          )}

          {ticket.status === "In Progress" && (
            <>
              <Button
                variant="outline"
                onClick={() => openTransition("Waiting")}
                className="flex-1 h-10 text-xs text-purple-700 border-purple-200 hover:bg-purple-50 font-medium"
              >
                <PauseCircle className="size-4 mr-1.5" /> Pause (Waiting)
              </Button>
              <Button
                onClick={() => openTransition("Resolved")}
                className="flex-1 h-10 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                <CheckCircle2 className="size-4 mr-1.5" /> Complete & Resolve
              </Button>
            </>
          )}

          {ticket.status === "Waiting" && (
            <Button
              onClick={() => openTransition("In Progress")}
              className="w-full h-10 text-xs bg-primary text-white font-semibold"
            >
              <PlayCircle className="size-4 mr-1.5" /> Resume Work
            </Button>
          )}

          {(ticket.status === "Resolved" || ticket.status === "Closed") && (
            <div className="w-full text-center py-1 text-xs text-emerald-600 font-semibold flex items-center justify-center gap-1.5">
              <CheckCircle2 className="size-4" /> Work Completed & Logged
            </div>
          )}
        </div>
      </footer>

      <TransitionModal
        ticket={ticket}
        targetStatus={targetStatus}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}


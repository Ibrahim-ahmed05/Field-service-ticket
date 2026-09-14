import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useFieldFlow } from "@/lib/store";
import { WorkspaceNavigation } from "@/components/ff/workspace-navigation";
import { RoleBar } from "@/components/ff/role-bar";
import { StatusBadge, PriorityBadge, Avatar, TechStatus } from "@/components/ff/badges";
import { isTicketOverdue, formatTimeRemaining, type TicketStatus, type Ticket } from "@/lib/fieldflow-data";
import {
  Smartphone,
  MapPin,
  Phone,
  Clock,
  ArrowRight,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  XCircle,
  ChevronRight,
  Wrench,
  AlertTriangle,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransitionModal } from "@/components/ff/transition-modal";
import { Logo } from "@/components/ff/logo";

export const Route = createFileRoute("/tech/")({
  component: TechnicianMyJobsPage,
  head: () => ({
    meta: [{ title: "My Jobs (Field Technician) — FieldFlow" }],
  }),
});

function TechnicianMyJobsPage() {
  const {
    tickets,
    technicians,
    activeTechnicianId,
    setActiveTechnicianId,
    updateTicketStatus,
  } = useFieldFlow();

  const [filterTab, setFilterTab] = useState<"ACTIVE" | "COMPLETED" | "ALL">("ACTIVE");
  const [transitionTicket, setTransitionTicket] = useState<Ticket | null>(null);
  const [transitionTarget, setTransitionTarget] = useState<TicketStatus | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const activeTech = technicians.find((t) => t.id === activeTechnicianId) || technicians[0];

  // My Jobs: Only tickets assigned to this technician (Section 2 & 7)
  const myJobs = tickets.filter((t) => t.assignedTechnicianId === activeTech.id);

  const activeJobs = myJobs.filter((t) =>
    ["Assigned", "In Progress", "Waiting"].includes(t.status)
  );

  const completedJobs = myJobs.filter((t) =>
    ["Resolved", "Closed"].includes(t.status)
  );

  const displayedJobs =
    filterTab === "ACTIVE"
      ? activeJobs
      : filterTab === "COMPLETED"
      ? completedJobs
      : myJobs;

  const handleQuickTransition = (ticket: Ticket, nextStatus: TicketStatus) => {
    if (nextStatus === "Waiting" || nextStatus === "Resolved" || nextStatus === "Rejected") {
      setTransitionTicket(ticket);
      setTransitionTarget(nextStatus);
      setModalOpen(true);
    } else {
      updateTicketStatus(ticket.id, nextStatus, "Technician updated status from mobile app.");
    }
  };

  return (
    <div className="portal-screen min-h-screen bg-surface flex flex-col">
      <WorkspaceNavigation />

      {/* Mobile Top Header */}
      <header className="relative z-20 bg-elevated border-b border-hairline shadow-xs">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/">
              <Logo mark />
            </Link>
            <div>
              <h1 className="text-sm font-bold text-foreground">My jobs</h1>
              <p className="text-[10px] text-muted-foreground">Your assigned service visits</p>
            </div>
          </div>

          {/* Technician Persona Profile Pill */}
          <div className="flex items-center gap-2">
            <div className="text-right hidden xs:block">
              <p className="text-xs font-semibold text-foreground">{activeTech.name}</p>
              <p className="text-[10px] text-muted-foreground">{activeTech.specialization}</p>
            </div>
            <Avatar initials={activeTech.initials} size="sm" />
          </div>
        </div>
      </header>

      {/* Main Mobile Container */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 space-y-4">
        {/* Active Duty Status Card & Technician Persona Switcher */}
        <div className="card-surface p-4 shadow-soft space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                <Wrench className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-foreground">{activeTech.name}</span>
                  <TechStatus status={activeTech.status} />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <span className="font-semibold text-foreground">{activeJobs.length}</span> active jobs • <span className="font-semibold text-foreground">{completedJobs.length}</span> resolved
                </p>
              </div>
            </div>

            {/* Quick Switch Technician Dropdown */}
            <div className="text-right">
              <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                Active Technician
              </label>
              <select
                value={activeTechnicianId}
                onChange={(e) => setActiveTechnicianId(e.target.value)}
                className="h-8 px-2.5 py-1 text-xs font-semibold rounded-lg bg-surface border border-hairline hover:border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                {technicians.map((t) => {
                  const techActiveCount = tickets.filter(
                    (tk) => tk.assignedTechnicianId === t.id && ["Assigned", "In Progress", "Waiting"].includes(tk.status)
                  ).length;
                  return (
                    <option key={t.id} value={t.id}>
                      {t.name} ({techActiveCount} active)
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-hairline/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Specialization: <strong className="text-foreground">{activeTech.specialization}</strong></span>
            <span>Region: <strong className="text-foreground">{activeTech.region}</strong></span>
          </div>
        </div>

        {/* Tab Filters: Active Jobs / Completed / All */}
        <div className="grid grid-cols-3 bg-muted p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => setFilterTab("ACTIVE")}
            className={`py-2 rounded-lg transition-all ${
              filterTab === "ACTIVE"
                ? "bg-elevated text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Active ({activeJobs.length})
          </button>
          <button
            onClick={() => setFilterTab("COMPLETED")}
            className={`py-2 rounded-lg transition-all ${
              filterTab === "COMPLETED"
                ? "bg-elevated text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Resolved ({completedJobs.length})
          </button>
          <button
            onClick={() => setFilterTab("ALL")}
            className={`py-2 rounded-lg transition-all ${
              filterTab === "ALL"
                ? "bg-elevated text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Jobs ({myJobs.length})
          </button>
        </div>

        {/* Job Cards Queue */}
        <div className="space-y-3.5">
          {displayedJobs.length === 0 ? (
            <div className="card-surface p-8 text-center space-y-3">
              <CheckCircle2 className="size-8 text-emerald-500 mx-auto" />
              <div>
                <p className="text-sm font-semibold">No assigned jobs for {activeTech.name} in this tab</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Switch technician above to view service tickets assigned to other field engineers:
                </p>
              </div>

              {/* Quick switch pills for other technicians with active jobs */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {technicians
                  .filter((t) => t.id !== activeTech.id)
                  .map((t) => {
                    const count = tickets.filter(
                      (tk) => tk.assignedTechnicianId === t.id && ["Assigned", "In Progress", "Waiting"].includes(tk.status)
                    ).length;
                    return (
                      <Button
                        key={t.id}
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveTechnicianId(t.id)}
                        className="h-7 text-xs font-medium bg-surface hover:bg-muted"
                      >
                        <span className="font-semibold">{t.name}</span>
                        <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                          {count} active
                        </span>
                      </Button>
                    );
                  })}
              </div>
            </div>
          ) : (
            displayedJobs.map((t) => {
              const overdue = isTicketOverdue(t);
              const remaining = formatTimeRemaining(t.dueDate, t.status);

              return (
                <div
                  key={t.id}
                  className="card-surface p-4 shadow-soft space-y-3.5 border-hairline hover:border-border transition-all"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-foreground">{t.id}</span>
                      <PriorityBadge priority={t.priority} />
                    </div>
                    <StatusBadge status={t.status} />
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground leading-snug">{t.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                  </div>

                  {/* Site Address & Customer */}
                  <div className="p-3 rounded-xl bg-surface border border-hairline space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-foreground font-medium">
                      <Building className="size-3.5 text-primary shrink-0" />
                      <span className="truncate">{t.customerName}</span>
                    </div>

                    <div className="flex items-start gap-2 text-muted-foreground text-[11px]">
                      <MapPin className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="flex-1">{t.siteAddress} ({t.siteName})</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-hairline/70">
                      <span className="text-[11px] text-muted-foreground">Contact: {t.contact.name}</span>
                      <a
                        href={`tel:${t.contact.phone}`}
                        className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-primary hover:underline"
                      >
                        <Phone className="size-3" />
                        {t.contact.phone}
                      </a>
                    </div>
                  </div>

                  {/* SLA Target Pill */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                      <Clock className="size-3.5" />
                      <span className={overdue ? "text-red-600 font-semibold" : ""}>{remaining}</span>
                    </div>
                    {t.equipmentModel && (
                      <span className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">
                        {t.equipmentModel}
                      </span>
                    )}
                  </div>

                  {/* Quick Action Buttons based on allowed technician transitions */}
                  <div className="pt-2 border-t border-hairline flex items-center justify-between gap-2 flex-wrap">
                    <Link
                      to="/tech/$jobId"
                      params={{ jobId: t.id }}
                      className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
                    >
                      <span>Full Work Order</span>
                      <ChevronRight className="size-3.5" />
                    </Link>

                    <div className="flex items-center gap-2">
                      {/* State 1: Assigned -> Start Work (In Progress) or Reject */}
                      {t.status === "Assigned" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQuickTransition(t, "Rejected")}
                            className="h-8 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <XCircle className="size-3.5 mr-1" /> Decline
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleQuickTransition(t, "In Progress")}
                            className="h-8 text-xs bg-primary text-white font-medium"
                          >
                            <PlayCircle className="size-3.5 mr-1" /> Start Work
                          </Button>
                        </>
                      )}

                      {/* State 2: In Progress -> Pause (Waiting) or Complete (Resolved) */}
                      {t.status === "In Progress" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQuickTransition(t, "Waiting")}
                            className="h-8 text-xs text-purple-700 border-purple-200 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                          >
                            <PauseCircle className="size-3.5 mr-1" /> Pause
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleQuickTransition(t, "Resolved")}
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                          >
                            <CheckCircle2 className="size-3.5 mr-1" /> Complete Job
                          </Button>
                        </>
                      )}

                      {/* State 3: Waiting -> Resume (In Progress) */}
                      {t.status === "Waiting" && (
                        <Button
                          size="sm"
                          onClick={() => handleQuickTransition(t, "In Progress")}
                          className="h-8 text-xs bg-primary text-white font-medium"
                        >
                          <PlayCircle className="size-3.5 mr-1" /> Resume Work
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Transition Modal */}
      {transitionTicket && (
        <TransitionModal
          ticket={transitionTicket}
          targetStatus={transitionTarget}
          open={modalOpen}
          onOpenChange={setModalOpen}
        />
      )}
    </div>
  );
}



import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, ArrowUpRight, AlertTriangle, Clock, UserX, CheckCircle2, Users, ShieldAlert } from "lucide-react";
import { useFieldFlow } from "@/lib/store";
import { AppShell } from "@/components/ff/app-shell";
import { KpiTile } from "@/components/ff/kpi";
import { Avatar, PriorityBadge, StatusBadge, TechStatus } from "@/components/ff/badges";
import { isTicketOverdue, allTicketStatuses, type TicketStatus } from "@/lib/fieldflow-data";
import { useState } from "react";
import { CreateTicketModal } from "@/components/ff/create-ticket-modal";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Operations Dashboard — FieldFlow" },
      {
        name: "description",
        content:
          "Live view of active service tickets, technician workload, SLA risk, and completed jobs across field operations.",
      },
    ],
  }),
});

function Dashboard() {
  const { tickets, technicians, role } = useFieldFlow();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Status distributions
  const activeTickets = tickets.filter((t) =>
    ["New", "Assigned", "In Progress", "Waiting"].includes(t.status)
  );
  const overdueTickets = tickets.filter(isTicketOverdue);
  const resolvedCount = tickets.filter((t) => t.status === "Resolved" || t.status === "Closed").length;
  const workingTechnicians = technicians.filter((t) => t.status === "On Site" || t.status === "Travelling").length;

  // Status distribution breakdown matching 8 statuses
  const statusCounts: Record<TicketStatus, number> = allTicketStatuses.reduce((acc, status) => {
    acc[status] = tickets.filter((t) => t.status === status).length;
    return acc;
  }, {} as Record<TicketStatus, number>);

  const maxCount = Math.max(...Object.values(statusCounts), 1);

  // Attention required queue
  const attentionItems = [
    ...overdueTickets.map((t) => ({ t, kind: "SLA Overdue", icon: Clock, tone: "text-red-600 bg-red-50 dark:bg-red-950/40" })),
    ...tickets
      .filter((t) => t.status === "New" && (t.priority === "Urgent" || t.priority === "High"))
      .map((t) => ({ t, kind: "Unassigned Urgent", icon: UserX, tone: "text-amber-600 bg-amber-50 dark:bg-amber-950/40" })),
    ...tickets
      .filter((t) => t.status === "Rejected")
      .map((t) => ({ t, kind: "Rejected Assignment", icon: AlertTriangle, tone: "text-rose-600 bg-rose-50 dark:bg-rose-950/40" })),
    ...tickets
      .filter((t) => t.status === "Resolved")
      .map((t) => ({ t, kind: "Awaiting Confirmation", icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" })),
  ].slice(0, 5);

  const todaysOperations = tickets.slice(0, 6);

  return (
    <AppShell
      title="Operations Dashboard"
      subtitle="A clear view of your tickets, team, and work that needs attention."
      actions={
        <Button
          size="sm"
          onClick={() => setCreateModalOpen(true)}
          className="h-9 gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-xs hover:brightness-110"
        >
          <Plus className="size-4" />
          <span>{role === "customer" ? "Report Issue" : "Create Ticket"}</span>
        </Button>
      }
    >
      {/* Top 4 KPI Tiles */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile value={activeTickets.length} label="Active tickets" hint="Open and ongoing work" />
        <KpiTile
          value={overdueTickets.length}
          label="Overdue tickets"
          tone={overdueTickets.length > 0 ? "danger" : "default"}
          hint={overdueTickets.length > 0 ? "needs immediate action" : "all SLAs on track"}
          delay={60}
        />
        <KpiTile value={workingTechnicians} icon={Users} label="Technicians working" hint="on site or travelling" delay={120} />
        <KpiTile value={resolvedCount} label="Completed tickets" tone="success" hint="completed work" delay={180} />
      </div>

      {/* 8-Status Distribution and Technician Workload Grid */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        {/* Status Distribution Bars */}
        <section className="card-surface p-6 shadow-soft">
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Ticket progress</h2>
              <p className="text-xs text-muted-foreground mt-0.5">See where every job stands</p>
            </div>
            <Link to="/tickets" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
              View all tickets <ArrowUpRight className="size-3" />
            </Link>
          </div>

          <div className="mt-6 space-y-3.5">
            {allTicketStatuses.map((status) => {
              const count = statusCounts[status];
              const pct = (count / maxCount) * 100;
              return (
                <div key={status} className="grid grid-cols-[110px_1fr_40px] items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={status} className="text-[11px] py-0 px-2" />
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                      style={{
                        width: `${count > 0 ? Math.max(pct, 4) : 0}%`,
                        opacity: count > 0 ? 0.9 : 0.2,
                      }}
                    />
                  </div>

                  <span className="text-right font-mono text-xs tabular-nums font-semibold text-foreground">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Technician Capacity Panel */}
        <section className="card-surface p-6 shadow-soft">
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Technician Workload</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Active jobs & deployment</p>
            </div>
            <Link to="/technicians" className="text-xs font-medium text-primary hover:underline">
              Manage all
            </Link>
          </div>

          <div className="mt-5 space-y-4">
            {technicians.map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Avatar initials={t.initials} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-xs font-semibold text-foreground">{t.name}</p>
                    <span className="text-[10px] font-mono text-muted-foreground">{t.activeJobs} jobs</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <TechStatus status={t.status} className="text-[11px]" />
                    <span className="text-[10px] text-muted-foreground">{t.rating}★ rating</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Recent Operations & Attention Grid */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        {/* Recent Operations Table */}
        <section className="card-surface overflow-hidden shadow-soft">
          <div className="flex items-baseline justify-between border-b border-hairline px-6 py-4">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Active Field Work</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Recent service tickets</p>
            </div>
            <Link to="/tickets" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              Tickets table <ArrowUpRight className="size-3" />
            </Link>
          </div>

          <div className="divide-y divide-hairline">
            {todaysOperations.map((t) => {
              const overdue = isTicketOverdue(t);
              const assignedTech = technicians.find((tech) => tech.id === t.assignedTechnicianId);

              return (
                <Link
                  key={t.id}
                  to="/tickets/$ticketId"
                  params={{ ticketId: t.id }}
                  className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-foreground">{t.id}</span>
                      <PriorityBadge priority={t.priority} />
                      {overdue && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-medium text-[10px]">
                          <Clock className="size-3" /> Overdue
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-xs font-medium text-foreground">{t.title}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {t.customerName} • {t.siteName}
                    </p>
                  </div>

                  {assignedTech ? (
                    <div className="hidden items-center gap-2 sm:flex">
                      <Avatar initials={assignedTech.initials} size="xs" />
                      <span className="text-xs text-muted-foreground">{assignedTech.name}</span>
                    </div>
                  ) : (
                    <span className="hidden sm:inline-block text-xs text-muted-foreground/70 italic">Unassigned</span>
                  )}

                  <StatusBadge status={t.status} />
                </Link>
              );
            })}
          </div>
        </section>

        {/* Attention Required Card */}
        <section className="card-surface p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight flex items-center gap-2">
              <ShieldAlert className="size-4 text-amber-500" />
              Attention Required
            </h2>
            <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">
              {attentionItems.length} items
            </span>
          </div>

          <ul className="mt-4 space-y-2.5">
            {attentionItems.length === 0 ? (
              <li className="text-xs text-muted-foreground text-center py-6">
                All tickets operational. No urgent exceptions pending.
              </li>
            ) : (
              attentionItems.map(({ t, kind, icon: Icon, tone }) => (
                <li key={`${t.id}-${kind}`}>
                  <Link
                    to="/tickets/$ticketId"
                    params={{ ticketId: t.id }}
                    className="flex items-start gap-3 rounded-xl border border-hairline p-3 transition-all duration-200 hover:-translate-y-px hover:shadow-soft hover:border-border bg-surface"
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${tone}`}>
                      <Icon className="size-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-foreground">{kind}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">{t.id}</span>
                      </div>
                      <p className="truncate text-xs text-foreground mt-0.5 font-medium">{t.title}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{t.customerName}</p>
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <CreateTicketModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </AppShell>
  );
}



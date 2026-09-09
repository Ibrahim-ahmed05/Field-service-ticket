import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useFieldFlow } from "@/lib/store";
import { AppShell } from "@/components/ff/app-shell";
import { StatusBadge, PriorityBadge } from "@/components/ff/badges";
import {
  Building,
  Plus,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateTicketModal } from "@/components/ff/create-ticket-modal";
import { isTicketOverdue, formatTimeRemaining } from "@/lib/fieldflow-data";

export const Route = createFileRoute("/customer/")({
  component: CustomerPortalPage,
  head: () => ({
    meta: [{ title: "Customer Service Portal — FieldFlow" }],
  }),
});

function CustomerPortalPage() {
  const { tickets, customers, sites, activeCustomerId, role } = useFieldFlow();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const activeCustomer = customers.find((c) => c.id === activeCustomerId) || customers[0];

  // Customer only sees tickets belonging to their company/account (Section 2 & 7)
  const myTickets = tickets.filter((t) => t.customerId === activeCustomer.id);
  const mySites = sites.filter((s) => s.customerId === activeCustomer.id);

  const activeTickets = myTickets.filter((t) =>
    ["New", "Assigned", "In Progress", "Waiting"].includes(t.status)
  );
  const awaitingConfirm = myTickets.filter((t) => t.status === "Resolved");
  const closedTickets = myTickets.filter((t) => t.status === "Closed");

  return (
    <AppShell
      title={`Welcome, ${activeCustomer.name}`}
      subtitle="Follow your service requests, share updates, and confirm completed work."
      actions={
        <Button
          size="sm"
          onClick={() => setCreateModalOpen(true)}
          className="h-9 gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-xs hover:brightness-110"
        >
          <Plus className="size-4" />
          <span>Report New Issue</span>
        </Button>
      }
    >
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card-surface p-5 shadow-soft space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Active Service Requests</span>
          <p className="text-2xl font-bold text-foreground font-mono">{activeTickets.length}</p>
          <p className="text-[11px] text-muted-foreground">Your open and ongoing requests</p>
        </div>

        <div className="card-surface p-5 shadow-soft space-y-1 border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20">
          <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5" /> Awaiting Your Confirmation
          </span>
          <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-200 font-mono">
            {awaitingConfirm.length}
          </p>
          <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400">
            Work completed — ready for client approval
          </p>
        </div>

        <div className="card-surface p-5 shadow-soft space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Completed & Closed</span>
          <p className="text-2xl font-bold text-foreground font-mono">{closedTickets.length}</p>
          <p className="text-[11px] text-muted-foreground">Archived service history</p>
        </div>
      </div>

      {/* Action Banner for Resolved Tickets */}
      {awaitingConfirm.length > 0 && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 grid place-items-center shrink-0">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                {awaitingConfirm.length} service ticket(s) completed and ready for your sign-off
              </h3>
              <p className="text-[11px] text-emerald-800/80 dark:text-emerald-400">
                Please verify technician resolution notes and click 'Confirm Resolution' to close the work order.
              </p>
            </div>
          </div>

          <Link
            to="/track/$ticketId"
            params={{ ticketId: awaitingConfirm[0].id }}
            className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-xs"
          >
            Review Ticket #{awaitingConfirm[0].id} <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      )}

      {/* Tickets List */}
      <div className="card-surface overflow-hidden shadow-soft mb-6">
        <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Your Service Work Orders</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Live status and transparent field history</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setCreateModalOpen(true)} className="h-8 text-xs gap-1.5">
            <Plus className="size-3.5" /> Report Issue
          </Button>
        </div>

        <div className="divide-y divide-hairline">
          {myTickets.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-3">
              <Building className="size-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-semibold text-foreground">No service tickets reported yet</p>
              <p className="text-xs text-muted-foreground">Click 'Report New Issue' to request technician service.</p>
              <Button size="sm" onClick={() => setCreateModalOpen(true)} className="text-xs bg-primary text-white">
                Report First Issue
              </Button>
            </div>
          ) : (
            myTickets.map((t) => {
              const overdue = isTicketOverdue(t);
              const remaining = formatTimeRemaining(t.dueDate, t.status);

              return (
                <Link
                  key={t.id}
                  to="/track/$ticketId"
                  params={{ ticketId: t.id }}
                  className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-muted/40 transition-colors group"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                        {t.id}
                      </span>
                      <PriorityBadge priority={t.priority} />
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-foreground truncate">{t.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{t.siteName} — {t.siteAddress}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <StatusBadge status={t.status} />
                      <p className="text-[10px] font-mono text-muted-foreground mt-1">
                        SLA: {remaining}
                      </p>
                    </div>

                    <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* Registered Sites List */}
      <div className="card-surface p-6 shadow-soft space-y-4">
        <h2 className="text-sm font-semibold tracking-tight">Your Registered Facilities & Sites</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {mySites.map((s) => (
            <div key={s.id} className="p-3.5 rounded-xl border border-hairline bg-surface space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">{s.name}</span>
                <span className="text-[10px] text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded">
                  {s.siteType}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                <MapPin className="size-3 text-primary shrink-0" />
                <span className="truncate">{s.address}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CreateTicketModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </AppShell>
  );
}


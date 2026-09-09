import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, ArrowUpRight, AlertTriangle, Clock, UserX } from "lucide-react";
import {
  distribution,
  kpis,
  technicians,
  tickets,
  technicianById,
} from "@/lib/fieldflow-data";
import { AppShell } from "@/components/ff/app-shell";
import { KpiTile } from "@/components/ff/kpi";
import { Avatar, PriorityBadge, StatusBadge, TechStatus } from "@/components/ff/badges";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Operations Dashboard — FieldFlow" },
      {
        name: "description",
        content:
          "Live view of active service tickets, technician workload, SLA risk and completed jobs across your field operations.",
      },
      { property: "og:title", content: "Operations Dashboard — FieldFlow" },
      {
        property: "og:description",
        content: "Live view of active tickets, technician workload and SLA risk.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Dashboard() {
  const todays = tickets.filter((t) =>
    ["In Progress", "Assigned", "On Site", "Travelling"].includes(t.status),
  );
  const attention = [
    ...tickets.filter((t) => t.overdue).map((t) => ({ t, kind: "Overdue", icon: Clock })),
    ...tickets
      .filter((t) => t.status === "New" && (t.priority === "Urgent" || t.priority === "High"))
      .map((t) => ({ t, kind: "Unassigned urgent", icon: UserX })),
    ...tickets
      .filter((t) => t.status === "Rejected")
      .map((t) => ({ t, kind: "Rejected job", icon: AlertTriangle })),
  ].slice(0, 5);

  const max = Math.max(...distribution.map((d) => d.value));

  return (
    <AppShell
      title="Good morning, Alex"
      subtitle="Here's what's happening across your service operations today."
      actions={
        <Link
          to="/tickets"
          search={{ create: true }}
          className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-transform duration-150 hover:brightness-110 active:scale-[0.98]"
        >
          <Plus className="size-4" /> Create Ticket
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile value={kpis.active} label="Active tickets" hint="across 8 sites" />
        <KpiTile value={kpis.overdue} label="Overdue" tone="danger" hint="needs action" delay={60} />
        <KpiTile value={kpis.working} label="Technicians working" delay={120} />
        <KpiTile value={kpis.completedToday} label="Completed today" tone="success" delay={180} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="card-surface animate-rise p-6" style={{ animationDelay: "120ms" }}>
          <div className="flex items-baseline justify-between">
            <h2 className="text-[15px] font-semibold">Ticket distribution</h2>
            <span className="text-xs text-muted-foreground">Last 7 days</span>
          </div>
          <div className="mt-7 space-y-5">
            {distribution.map((d, i) => (
              <div key={d.label} className="grid grid-cols-[130px_1fr_32px] items-center gap-4">
                <span className="text-sm text-muted-foreground">{d.label}</span>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/85 transition-[width] duration-1000 ease-out"
                    style={{
                      width: `${(d.value / max) * 100}%`,
                      transitionDelay: `${i * 90}ms`,
                      opacity: 1 - i * 0.11,
                    }}
                  />
                </div>
                <span className="text-right font-mono text-sm tabular-nums">{d.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card-surface animate-rise p-6" style={{ animationDelay: "180ms" }}>
          <div className="flex items-baseline justify-between">
            <h2 className="text-[15px] font-semibold">Technician availability</h2>
            <Link to="/technicians" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-5 space-y-4">
            {technicians.slice(0, 4).map((t) => (
              <div key={t.id} className="flex items-center gap-3">
                <Avatar initials={t.initials} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.name}</p>
                  <TechStatus status={t.status} className="mt-0.5" />
                </div>
                <div className="w-20">
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>{t.activeJobs} jobs</span>
                    <span>{t.completedToday}✓</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/70 transition-all duration-700"
                      style={{ width: `${Math.min(100, t.activeJobs * 20)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="card-surface animate-rise overflow-hidden" style={{ animationDelay: "220ms" }}>
          <div className="flex items-baseline justify-between border-b border-hairline px-6 py-5">
            <h2 className="text-[15px] font-semibold">Today's operations</h2>
            <Link to="/tickets" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              All tickets <ArrowUpRight className="size-3" />
            </Link>
          </div>
          <ul>
            {todays.slice(0, 6).map((t) => {
              const tech = technicianById(t.technicianId);
              return (
                <li key={t.id}>
                  <Link
                    to="/tickets/$ticketId"
                    params={{ ticketId: t.id }}
                    className="flex items-center gap-4 border-b border-hairline px-6 py-4 transition-colors last:border-0 hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{t.id}</span>
                        <PriorityBadge priority={t.priority} />
                      </div>
                      <p className="mt-1 truncate text-sm font-medium">{t.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{t.customer}</p>
                    </div>
                    {tech && (
                      <div className="hidden items-center gap-2 sm:flex">
                        <Avatar initials={tech.initials} size="sm" />
                        <span className="text-xs text-muted-foreground">{tech.name}</span>
                      </div>
                    )}
                    <StatusBadge status={t.status} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="card-surface animate-rise p-6" style={{ animationDelay: "260ms" }}>
          <h2 className="text-[15px] font-semibold">Attention required</h2>
          <p className="mt-1 text-xs text-muted-foreground">{attention.length} items to review</p>
          <ul className="mt-5 space-y-2.5">
            {attention.map(({ t, kind, icon: Icon }) => (
              <li key={`${t.id}-${kind}`}>
                <Link
                  to="/tickets/$ticketId"
                  params={{ ticketId: t.id }}
                  className="flex gap-3 rounded-[10px] border border-hairline p-3.5 transition-all duration-200 hover:-translate-y-px hover:shadow-soft"
                >
                  <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{kind}</p>
                    <p className="truncate text-sm font-medium">{t.title}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{t.id}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}

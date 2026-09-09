import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useFieldFlow } from "@/lib/store";
import { AppShell } from "@/components/ff/app-shell";
import { Avatar, TechStatus, StatusBadge, PriorityBadge } from "@/components/ff/badges";
import {
  Wrench,
  Phone,
  Mail,
  MapPin,
  Star,
  CheckCircle2,
  Briefcase,
  Search,
  Filter,
  Plus,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Technician } from "@/lib/fieldflow-data";

export const Route = createFileRoute("/technicians/")({
  component: TechniciansPage,
  head: () => ({
    meta: [{ title: "Field Technicians — FieldFlow" }],
  }),
});

function TechniciansPage() {
  const { technicians, tickets, assignTechnician, role } = useFieldFlow();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);

  // Unassigned tickets for quick dispatch
  const unassignedTickets = tickets.filter(
    (t) => t.assignedTechnicianId === null && t.status !== "Closed" && t.status !== "Cancelled"
  );

  const filteredTechs = technicians.filter((t) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        t.name.toLowerCase().includes(q) ||
        t.specialization.toLowerCase().includes(q) ||
        t.region.toLowerCase().includes(q) ||
        t.skillSet.some((s) => s.toLowerCase().includes(q));
      if (!match) return false;
    }

    if (statusFilter !== "ALL" && t.status !== statusFilter) {
      return false;
    }

    return true;
  });

  const handleOpenDispatch = (tech: Technician) => {
    setSelectedTech(tech);
    setDispatchModalOpen(true);
  };

  return (
    <AppShell
      title="Your team"
      subtitle={`${technicians.length} technicians · availability, skills, and assigned work`}
    >
      {/* Search & Filter Bar */}
      <div className="card-surface p-4 shadow-soft space-y-3 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search technicians by name, skills, or region..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 text-xs bg-background"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-44 text-xs bg-background">
              <SelectValue placeholder="Status: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">Status: All</SelectItem>
              <SelectItem value="Available" className="text-xs">Available</SelectItem>
              <SelectItem value="On Site" className="text-xs">On Site</SelectItem>
              <SelectItem value="Travelling" className="text-xs">Travelling</SelectItem>
              <SelectItem value="Off Duty" className="text-xs">Off Duty</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Technicians Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTechs.map((t) => {
          const techJobs = tickets.filter((ticket) => ticket.assignedTechnicianId === t.id);
          const activeJobs = techJobs.filter(
            (ticket) => !["Closed", "Cancelled", "Resolved"].includes(ticket.status)
          );

          return (
            <div
              key={t.id}
              className="card-surface p-6 shadow-soft space-y-5 flex flex-col justify-between hover:border-border transition-all"
            >
              <div className="space-y-4">
                {/* Header Profile */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar initials={t.initials} size="lg" />
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{t.name}</h3>
                      <p className="text-xs text-muted-foreground">{t.specialization}</p>
                    </div>
                  </div>
                  <TechStatus status={t.status} />
                </div>

                {/* Rating & Workload Metrics */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-surface border border-hairline text-center text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground">Rating</span>
                    <p className="font-semibold text-foreground flex items-center justify-center gap-1 mt-0.5">
                      <Star className="size-3 text-amber-500 fill-amber-500" />
                      {t.rating}
                    </p>
                  </div>
                  <div className="border-x border-hairline">
                    <span className="text-[10px] text-muted-foreground">Active Jobs</span>
                    <p className="font-mono font-semibold text-foreground mt-0.5">{activeJobs.length}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Completed</span>
                    <p className="font-mono font-semibold text-emerald-600 mt-0.5">{t.completedToday}✓</p>
                  </div>
                </div>

                {/* Contact & Region */}
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                    <span>{t.region}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <Phone className="size-3.5 text-muted-foreground shrink-0" />
                    <span>{t.phone}</span>
                  </div>
                </div>

                {/* Skillset Pills */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Skills & Certifications
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {t.skillSet.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-medium text-foreground border border-hairline"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Active Assigned Tickets Preview */}
                {activeJobs.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-hairline">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Current Active Queue
                    </span>
                    <div className="space-y-1.5">
                      {activeJobs.slice(0, 2).map((j) => (
                        <Link
                          key={j.id}
                          to="/tickets/$ticketId"
                          params={{ ticketId: j.id }}
                          className="flex items-center justify-between p-2 rounded-lg bg-surface border border-hairline hover:bg-muted/50 text-xs transition-colors"
                        >
                          <span className="font-mono font-medium truncate max-w-[140px]">{j.id}</span>
                          <StatusBadge status={j.status} className="text-[9px] py-0 px-1.5" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-hairline flex items-center justify-between gap-2">
                <Link
                  to="/tech"
                  className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                >
                  <span>Technician view</span>
                  <ArrowRight className="size-3" />
                </Link>

                {role === "manager" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenDispatch(t)}
                    className="h-8 text-xs gap-1"
                  >
                    <UserCheck className="size-3.5" />
                    <span>Dispatch Job</span>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Dispatch Job Dialog */}
      <Dialog open={dispatchModalOpen} onOpenChange={setDispatchModalOpen}>
        <DialogContent className="max-w-lg bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Dispatch Ticket to {selectedTech?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select an unassigned ticket from the queue to dispatch to this field engineer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
            {unassignedTickets.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                No unassigned tickets currently in queue.
              </p>
            ) : (
              unassignedTickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    if (selectedTech) {
                      assignTechnician(t.id, selectedTech.id);
                      setDispatchModalOpen(false);
                    }
                  }}
                  className="p-3 rounded-xl border border-hairline hover:border-primary hover:bg-muted/50 cursor-pointer transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-foreground">{t.id}</span>
                    <PriorityBadge priority={t.priority} />
                  </div>
                  <p className="text-xs font-medium text-foreground">{t.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {t.customerName} • {t.siteName}
                  </p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}


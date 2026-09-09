import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useFieldFlow } from "@/lib/store";
import { AppShell } from "@/components/ff/app-shell";
import { StatusBadge, PriorityBadge, Avatar } from "@/components/ff/badges";
import {
  allTicketStatuses,
  allPriorities,
  allCategories,
  isTicketOverdue,
  formatTimeRemaining,
  type TicketStatus,
  type Priority,
  type Category,
} from "@/lib/fieldflow-data";
import {
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  Clock,
  ChevronRight,
  SlidersHorizontal,
  X,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateTicketModal } from "@/components/ff/create-ticket-modal";

export const Route = createFileRoute("/tickets/")({
  component: TicketsListPage,
  head: () => ({
    meta: [{ title: "Service Tickets — FieldFlow" }],
  }),
});

function TicketsListPage() {
  const { tickets, technicians, customers, role } = useFieldFlow();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [techFilter, setTechFilter] = useState<string>("ALL");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Filter tickets
  const filteredTickets = tickets.filter((t) => {
    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        t.id.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        t.siteName.toLowerCase().includes(q) ||
        t.siteAddress.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Status filter
    if (statusFilter !== "ALL" && t.status !== statusFilter) {
      return false;
    }

    // Priority filter
    if (priorityFilter !== "ALL" && t.priority !== priorityFilter) {
      return false;
    }

    // Category filter
    if (categoryFilter !== "ALL" && t.category !== categoryFilter) {
      return false;
    }

    // Technician filter
    if (techFilter === "UNASSIGNED" && t.assignedTechnicianId !== null) {
      return false;
    } else if (techFilter !== "ALL" && techFilter !== "UNASSIGNED" && t.assignedTechnicianId !== techFilter) {
      return false;
    }

    // Overdue toggle
    if (overdueOnly && !isTicketOverdue(t)) {
      return false;
    }

    return true;
  });

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
    setCategoryFilter("ALL");
    setTechFilter("ALL");
    setOverdueOnly(false);
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "ALL" ||
    priorityFilter !== "ALL" ||
    categoryFilter !== "ALL" ||
    techFilter !== "ALL" ||
    overdueOnly;

  return (
    <AppShell
      title="Field Service Tickets"
      subtitle={`${filteredTickets.length} of ${tickets.length} tickets matching filters`}
      actions={
        <Button
          size="sm"
          onClick={() => setCreateModalOpen(true)}
          className="h-9 gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-xs hover:brightness-110"
        >
          <Plus className="size-4" />
          <span>{role === "customer" ? "Report Issue" : "New Ticket"}</span>
        </Button>
      }
    >
      {/* Filter and Control Bar */}
      <div className="card-surface p-4 shadow-soft space-y-3 mb-6">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by ticket ID, issue title, client, or site..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 text-xs bg-background"
            />
          </div>

          {/* Quick Overdue Toggle */}
          <button
            onClick={() => setOverdueOnly(!overdueOnly)}
            className={`h-9 px-3 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              overdueOnly
                ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300"
                : "bg-surface text-muted-foreground border-hairline hover:text-foreground"
            }`}
          >
            <Clock className="size-3.5" />
            <span>Overdue SLA Only</span>
          </button>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-hairline/70">
          {/* Status Select */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs bg-background">
              <SelectValue placeholder="Status: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">Status: All (8 States)</SelectItem>
              {allTicketStatuses.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Priority Select */}
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="h-8 text-xs bg-background">
              <SelectValue placeholder="Priority: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">Priority: All</SelectItem>
              {allPriorities.map((p) => (
                <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Category Select */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-8 text-xs bg-background">
              <SelectValue placeholder="Category: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">Category: All</SelectItem>
              {allCategories.map((c) => (
                <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Technician Select */}
          <Select value={techFilter} onValueChange={setTechFilter}>
            <SelectTrigger className="h-8 text-xs bg-background">
              <SelectValue placeholder="Technician: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">Technician: All</SelectItem>
              <SelectItem value="UNASSIGNED" className="text-xs">Unassigned</SelectItem>
              {technicians.map((t) => (
                <SelectItem key={t.id} value={t.id} className="text-xs">{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground border-t border-hairline/60">
            <span>Filters active: Showing {filteredTickets.length} tickets</span>
            <button
              onClick={clearFilters}
              className="text-primary hover:underline flex items-center gap-1 font-medium"
            >
              <X className="size-3" /> Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Tickets List Table / Card View */}
      <div className="card-surface overflow-hidden shadow-soft">
        <div className="hidden lg:grid grid-cols-[120px_1fr_200px_160px_140px_120px_40px] items-center gap-4 px-6 py-3 bg-muted/60 border-b border-hairline text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          <span>Ticket ID</span>
          <span>Title & Description</span>
          <span>Customer & Site</span>
          <span>Assigned Tech</span>
          <span>Target SLA</span>
          <span>Status</span>
          <span></span>
        </div>

        <div className="divide-y divide-hairline">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-3">
              <p className="text-sm font-medium text-foreground">No matching tickets found</p>
              <p className="text-xs text-muted-foreground">Try clearing search terms or expanding status filters.</p>
              {hasActiveFilters && (
                <Button size="sm" variant="outline" onClick={clearFilters} className="text-xs">
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            filteredTickets.map((t) => {
              const tech = technicians.find((tech) => tech.id === t.assignedTechnicianId);
              const overdue = isTicketOverdue(t);
              const remainingText = formatTimeRemaining(t.dueDate, t.status);

              return (
                <Link
                  key={t.id}
                  to="/tickets/$ticketId"
                  params={{ ticketId: t.id }}
                  className="flex flex-col lg:grid lg:grid-cols-[120px_1fr_200px_160px_140px_120px_40px] lg:items-center gap-3 lg:gap-4 px-6 py-4 hover:bg-muted/40 transition-colors group"
                >
                  {/* ID & Priority */}
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                      {t.id}
                    </span>
                    <PriorityBadge priority={t.priority} />
                  </div>

                  {/* Title & Category */}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{t.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{t.description}</p>
                  </div>

                  {/* Customer & Site */}
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{t.customerName}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{t.siteName}</p>
                  </div>

                  {/* Assigned Technician */}
                  <div className="min-w-0">
                    {tech ? (
                      <div className="flex items-center gap-2">
                        <Avatar initials={tech.initials} size="xs" />
                        <span className="text-xs font-medium text-foreground truncate">{tech.name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/80 italic flex items-center gap-1">
                        <UserCheck className="size-3" /> Unassigned
                      </span>
                    )}
                  </div>

                  {/* SLA Countdown */}
                  <div className="min-w-0">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-mono ${
                        overdue
                          ? "text-red-600 font-semibold dark:text-red-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      <Clock className="size-3 shrink-0" />
                      {remainingText}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div>
                    <StatusBadge status={t.status} />
                  </div>

                  {/* Arrow Icon */}
                  <div className="hidden lg:flex justify-end">
                    <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      <CreateTicketModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </AppShell>
  );
}

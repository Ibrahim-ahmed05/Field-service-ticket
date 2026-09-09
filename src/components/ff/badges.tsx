import { cn } from "@/lib/utils";
import type { Priority, TicketStatus, TechnicianStatus } from "@/lib/fieldflow-data";

const statusTone: Record<TicketStatus, string> = {
  New: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300",
  Assigned: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300",
  "In Progress": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300",
  Waiting: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300",
  Resolved: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300",
  Closed: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400",
  Cancelled: "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400",
  Rejected: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300",
};

const dotTone: Record<TicketStatus, string> = {
  New: "bg-slate-400",
  Assigned: "bg-blue-500",
  "In Progress": "bg-amber-500 animate-pulse",
  Waiting: "bg-purple-500",
  Resolved: "bg-emerald-500",
  Closed: "bg-zinc-400",
  Cancelled: "bg-rose-400",
  Rejected: "bg-red-500",
};

export function StatusBadge({
  status,
  className,
  dot = true,
}: {
  status: TicketStatus;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-tight whitespace-nowrap shadow-xs",
        statusTone[status] || "bg-muted text-muted-foreground border-hairline",
        className,
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full shrink-0", dotTone[status] || "bg-muted-foreground")} />}
      {status}
    </span>
  );
}

const priorityTone: Record<Priority, string> = {
  Low: "text-slate-600 border-slate-200 bg-slate-50 dark:bg-slate-900 dark:text-slate-400",
  Medium: "text-blue-700 border-blue-200 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400",
  High: "text-amber-700 border-amber-200 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400",
  Urgent: "text-red-700 border-red-200 bg-red-50 font-semibold dark:bg-red-950/40 dark:text-red-300",
};

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        priorityTone[priority],
        className,
      )}
    >
      {priority === "Urgent" && <span className="mr-1 inline-block size-1.5 rounded-full bg-red-500 animate-ping" />}
      {priority}
    </span>
  );
}

const techTone: Record<TechnicianStatus, string> = {
  "On Site": "bg-amber-500",
  Travelling: "bg-blue-500",
  Available: "bg-emerald-500",
  "Off Duty": "bg-zinc-400",
};

export function TechStatus({ status, className }: { status: TechnicianStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      <span className={cn("size-1.5 rounded-full shrink-0", techTone[status])} />
      {status}
    </span>
  );
}

export function Avatar({
  initials,
  className,
  size = "md",
}: {
  initials: string;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-medium text-primary border border-primary/20",
        size === "xs" && "size-5 text-[9px]",
        size === "sm" && "size-7 text-[10px]",
        size === "md" && "size-8 text-xs",
        size === "lg" && "size-10 text-sm",
        size === "xl" && "size-14 text-base font-semibold",
        className,
      )}
    >
      {initials}
    </span>
  );
}

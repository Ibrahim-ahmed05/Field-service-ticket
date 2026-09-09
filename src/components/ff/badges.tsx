import { cn } from "@/lib/utils";
import type { Priority, TicketStatus, TechnicianStatus } from "@/lib/fieldflow-data";

const statusTone: Record<TicketStatus, string> = {
  New: "bg-neutral-soft text-muted-foreground border-hairline",
  Assigned: "bg-info-soft text-info border-info/15",
  Travelling: "bg-info-soft text-info border-info/15",
  "On Site": "bg-warning-soft text-warning border-warning/20",
  "In Progress": "bg-warning-soft text-warning border-warning/20",
  "Waiting for Customer": "bg-neutral-soft text-muted-foreground border-hairline",
  "On Hold": "bg-neutral-soft text-muted-foreground border-hairline",
  Completed: "bg-success-soft text-success border-success/15",
  Cancelled: "bg-neutral-soft text-muted-foreground border-hairline",
  Rejected: "bg-danger-soft text-danger border-danger/15",
};

const dotTone: Record<TicketStatus, string> = {
  New: "bg-muted-foreground/50",
  Assigned: "bg-info",
  Travelling: "bg-info",
  "On Site": "bg-warning",
  "In Progress": "bg-warning",
  "Waiting for Customer": "bg-muted-foreground/50",
  "On Hold": "bg-muted-foreground/50",
  Completed: "bg-success",
  Cancelled: "bg-muted-foreground/40",
  Rejected: "bg-danger",
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
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        statusTone[status],
        className,
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", dotTone[status])} />}
      {status}
    </span>
  );
}

const priorityTone: Record<Priority, string> = {
  Low: "text-muted-foreground border-hairline bg-neutral-soft",
  Medium: "text-info border-info/15 bg-info-soft",
  High: "text-warning border-warning/20 bg-warning-soft",
  Urgent: "text-danger border-danger/20 bg-danger-soft",
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
      {priority}
    </span>
  );
}

const techTone: Record<TechnicianStatus, string> = {
  "On Site": "bg-warning",
  Travelling: "bg-info",
  Available: "bg-success",
  "Off Duty": "bg-muted-foreground/40",
};

export function TechStatus({ status, className }: { status: TechnicianStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      <span className={cn("size-1.5 rounded-full", techTone[status])} />
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
  size?: "sm" | "md" | "lg";
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-accent font-medium text-accent-foreground",
        size === "sm" && "size-6 text-[10px]",
        size === "md" && "size-8 text-xs",
        size === "lg" && "size-11 text-sm",
        className,
      )}
    >
      {initials}
    </span>
  );
}

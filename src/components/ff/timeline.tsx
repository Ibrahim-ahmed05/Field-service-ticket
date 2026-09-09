import { cn } from "@/lib/utils";
import type { TimelineEvent } from "@/lib/fieldflow-data";

export function Timeline({
  events,
  customerView = false,
}: {
  events: TimelineEvent[];
  customerView?: boolean;
}) {
  const list = customerView ? events.filter((e) => e.customerSafe) : events;
  if (!list.length)
    return <p className="text-sm text-muted-foreground">No activity recorded yet.</p>;

  return (
    <ol className="relative">
      {list.map((e, i) => {
        const last = i === list.length - 1;
        return (
          <li
            key={`${e.time}-${i}`}
            className="animate-rise relative flex gap-4 pb-6 last:pb-0"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "mt-1 size-2.5 shrink-0 rounded-full ring-4",
                  last ? "bg-primary ring-primary/10" : "bg-border ring-transparent",
                )}
              />
              {!last && <span className="mt-1 w-px flex-1 bg-hairline" />}
            </div>
            <div className="-mt-0.5 min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-3">
                <p className="text-sm font-medium">{e.label}</p>
                <span className="font-mono text-xs text-muted-foreground">{e.time}</span>
              </div>
              {!customerView && (
                <p className="mt-0.5 text-xs text-muted-foreground">{e.actor}</p>
              )}
              {e.description && (
                <p className="mt-1.5 text-sm text-muted-foreground">{e.description}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

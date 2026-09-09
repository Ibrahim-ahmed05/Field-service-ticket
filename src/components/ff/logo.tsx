import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/fieldflow-data";

export function Logo({ className, mark = false }: { className?: string; mark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="relative grid size-7 place-items-center rounded-[9px] bg-primary text-primary-foreground">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7h16M4 12h10M4 17h6" />
        </svg>
      </span>
      {!mark && <span className="text-[15px] font-semibold tracking-tight">{BRAND.name}</span>}
    </span>
  );
}

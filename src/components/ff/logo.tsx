import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/fieldflow-data";
export function Logo({ className, mark = false }: { className?: string; mark?: boolean }) {
  return (
    <span className={cn("brand-logo", className)}>
      <span className="brand-mark">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M7 18V6h12M7 12h9"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="m11 17 2 2 5-5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {!mark && <span className="brand-name">{BRAND.name}</span>}
    </span>
  );
}

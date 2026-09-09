import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function useCountUp(value: number, duration = 900) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const from = ref.current;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (p < 1) frame = requestAnimationFrame(tick);
      else ref.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);
  return display;
}

export function KpiTile({
  value,
  label,
  hint,
  tone = "default",
  delay = 0,
}: {
  value: number;
  label: string;
  hint?: string;
  tone?: "default" | "danger" | "success";
  delay?: number;
}) {
  const display = useCountUp(value);
  return (
    <div
      className="animate-rise card-surface p-5 transition-shadow duration-300 hover:shadow-soft"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            "font-mono text-[30px] leading-none font-semibold tracking-tight tabular-nums",
            tone === "danger" && "text-danger",
            tone === "success" && "text-success",
          )}
        >
          {display}
        </span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      <p className="mt-2.5 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

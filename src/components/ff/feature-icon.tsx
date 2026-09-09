import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
export function FeatureIcon({
  icon: Icon,
  tone = "blue",
  small = false,
}: {
  icon: LucideIcon;
  tone?: "blue" | "violet" | "green" | "amber" | "red";
  small?: boolean;
}) {
  return (
    <span
      className={cn("feature-icon", `feature-icon-${tone}`, small && "feature-icon-small")}
      aria-hidden="true"
    >
      <Icon strokeWidth={1.75} />
    </span>
  );
}

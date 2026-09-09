import { ClipboardList, Clock3, CircleCheck, type LucideIcon } from "lucide-react";
import { FeatureIcon } from "./feature-icon";
export function KpiTile({
  value,
  label,
  hint,
  tone = "default",
  icon,
  delay = 0,
}: {
  value: number;
  label: string;
  hint?: string;
  tone?: "default" | "danger" | "success";
  icon?: LucideIcon;
  delay?: number;
}) {
  const Icon =
    icon || (tone === "danger" ? Clock3 : tone === "success" ? CircleCheck : ClipboardList);
  return (
    <div className="card-surface metric-card" style={{ animationDelay: `${delay}ms` }}>
      <FeatureIcon
        icon={Icon}
        tone={tone === "danger" ? "red" : tone === "success" ? "green" : "blue"}
        small
      />
      <div>
        <p className="metric-label">{label}</p>
        <strong className="metric-value">{value}</strong>
        {hint && <p className={`metric-hint metric-hint-${tone}`}>{hint}</p>}
      </div>
    </div>
  );
}


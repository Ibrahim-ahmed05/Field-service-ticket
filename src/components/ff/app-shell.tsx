import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { WorkspaceNavigation } from "./workspace-navigation";
import { CreateTicketModal } from "./create-ticket-modal";
import { useFieldFlow } from "@/lib/store";
import { Button } from "@/components/ui/button";

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { role } = useFieldFlow();
  const [createOpen, setCreateOpen] = useState(false);
  return (
    <div className="workspace min-h-screen bg-surface">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <WorkspaceNavigation />
      <div className="workspace-body">
        <div className="page-heading">
          <div>
            <p className="eyebrow">YOUR WORKSPACE, CONNECTED</p>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <div>
            {actions ||
              (role !== "technician" && (
                <Button onClick={() => setCreateOpen(true)} className="rounded-xl gap-2 text-xs font-semibold">
                  <Plus size={16} />
                  {role === "customer" ? "Report issue" : "New ticket"}
                </Button>
              ))}
          </div>
        </div>
        <main id="main-content">{children}</main>
      </div>
      <CreateTicketModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

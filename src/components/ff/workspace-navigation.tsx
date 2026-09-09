import { ThemeToggle } from "./theme";
import { Link, useRouterState } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useState } from "react";
import { Logo } from "./logo";
import { NotificationsDrawer } from "./notifications-drawer";
import { useFieldFlow } from "@/lib/store";
const items = [
  { to: "/dashboard", label: "Overview", role: "manager" },
  { to: "/tickets", label: "Tickets", role: "manager" },
  { to: "/technicians", label: "Team", role: "manager" },
  { to: "/tech", label: "My jobs", role: "technician" },
  { to: "/customer", label: "Customer portal", role: "customer" },
] as const;
export function WorkspaceNavigation() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { setRole, notificationLogs } = useFieldFlow();
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="workspace-header">
        <div className="workspace-nav">
          <Link to="/" aria-label="FieldFlow home">
            <Logo />
          </Link>
          <nav aria-label="Main navigation">
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setRole(item.role)}
                aria-current={
                  path === item.to ||
                  path.startsWith(item.to + "/") ||
                  (item.to === "/customer" && path.startsWith("/track/"))
                    ? "page"
                    : undefined
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
          <button
            className="notification-button"
            onClick={() => setOpen(true)}
            aria-label="Open notifications"
          >
            <Bell size={19} />
            {notificationLogs.length > 0 && <span />}
          </button>
        </div>
      </header>
      <NotificationsDrawer open={open} onOpenChange={setOpen} />
    </>
  );
}

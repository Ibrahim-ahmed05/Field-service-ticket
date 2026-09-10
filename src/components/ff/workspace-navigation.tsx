import { ThemeToggle } from "./theme";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Bell, LogOut, ShieldCheck, Wrench, Building } from "lucide-react";
import { useState } from "react";
import { Logo } from "./logo";
import { NotificationsDrawer } from "./notifications-drawer";
import { useFieldFlow } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function WorkspaceNavigation() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { role, notificationLogs } = useFieldFlow();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Role-scoped navigation items
  const navItems =
    role === "manager"
      ? [
          { to: "/dashboard", label: "Overview" },
          { to: "/tickets", label: "Tickets" },
          { to: "/technicians", label: "Team" },
        ]
      : role === "technician"
      ? [
          { to: "/tech", label: "My Jobs" },
          { to: "/tickets", label: "Assigned Tickets" },
        ]
      : [
          { to: "/customer", label: "My Service Requests" },
        ];

  const roleLabel = role === "manager" ? "Manager" : role === "technician" ? "Technician" : "Client";
  const RoleIcon = role === "manager" ? ShieldCheck : role === "technician" ? Wrench : Building;

  const handleLogout = () => {
    toast.info("Signed out of FieldFlow");
    navigate({ to: "/login" });
  };

  return (
    <>
      <header className="workspace-header border-b border-hairline">
        <div className="workspace-nav flex items-center justify-between px-4 lg:px-8 py-2.5">
          {/* Left: Brand & Navigation */}
          <div className="flex items-center gap-6">
            <Link to="/" aria-label="FieldFlow home">
              <Logo />
            </Link>
            <nav aria-label="Main navigation" className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
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
          </div>

          {/* Right: User Role Badge, Theme, Notifications & Logout */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-hairline text-xs font-semibold text-muted-foreground mr-1">
              <RoleIcon className="size-3.5 text-primary" />
              <span>{roleLabel}</span>
            </div>

            <ThemeToggle />

            <button
              className="notification-button relative"
              onClick={() => setOpen(true)}
              aria-label="Open notifications"
            >
              <Bell size={18} />
              {notificationLogs.length > 0 && <span />}
            </button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="h-9 px-3 text-xs font-medium gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-xl"
              title="Sign Out"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Log out</span>
            </Button>
          </div>
        </div>
      </header>
      <NotificationsDrawer open={open} onOpenChange={setOpen} />
    </>
  );
}

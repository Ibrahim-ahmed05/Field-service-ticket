import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutGrid,
  Ticket as TicketIcon,
  Wrench,
  Building2,
  BarChart3,
  Settings,
  Search,
  Bell,
  Smartphone,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { Avatar } from "./badges";

const nav = [
  { to: "/dashboard", label: "Overview", icon: LayoutGrid },
  { to: "/tickets", label: "Tickets", icon: TicketIcon },
  { to: "/technicians", label: "Technicians", icon: Wrench },
  { to: "/customers", label: "Customers", icon: Building2 },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

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
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-surface">
      {/* Navigation rail */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[68px] flex-col items-center border-r border-hairline bg-elevated py-4 lg:flex">
        <Link to="/" className="mb-6">
          <Logo mark />
        </Link>
        <nav className="flex flex-1 flex-col items-center gap-1">
          {nav.map((item) => {
            const active = path.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group relative grid size-10 place-items-center rounded-[10px] text-muted-foreground transition-colors duration-200",
                  active ? "bg-accent text-accent-foreground" : "hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="size-[18px]" strokeWidth={1.8} />
                <span className="pointer-events-none absolute left-[52px] z-50 origin-left scale-95 rounded-md border border-hairline bg-elevated px-2 py-1 text-xs font-medium whitespace-nowrap opacity-0 shadow-soft transition-all duration-150 group-hover:scale-100 group-hover:opacity-100">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
        <Link
          to="/tech"
          className="mb-3 grid size-10 place-items-center rounded-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Technician app"
        >
          <Smartphone className="size-[18px]" strokeWidth={1.8} />
        </Link>
        <Avatar initials="AM" />
      </aside>

      {/* Mobile top nav */}
      <div className="sticky top-0 z-30 flex items-center gap-1 overflow-x-auto border-b border-hairline bg-elevated/90 px-3 py-2 backdrop-blur lg:hidden">
        <Link to="/" className="mr-1 shrink-0">
          <Logo mark />
        </Link>
        {nav.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              path.startsWith(item.to)
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="lg:pl-[68px]">
        <header className="sticky top-0 z-20 border-b border-hairline bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-5 py-5 sm:px-8 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h1 className="truncate text-[22px] font-semibold tracking-tight">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative hidden sm:block">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  placeholder="Search"
                  className="h-9 w-44 rounded-[10px] border border-hairline bg-elevated pr-3 pl-9 text-sm outline-none transition-all duration-200 placeholder:text-muted-foreground focus:w-60 focus:ring-2 focus:ring-ring/20"
                />
              </div>
              <button className="relative grid size-9 place-items-center rounded-[10px] border border-hairline bg-elevated text-muted-foreground transition-colors hover:text-foreground">
                <Bell className="size-4" />
                <span className="absolute top-2 right-2.5 size-1.5 rounded-full bg-danger" />
              </button>
              {actions}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1400px] px-5 py-7 sm:px-8">{children}</main>
      </div>
    </div>
  );
}

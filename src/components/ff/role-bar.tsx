import { useFieldFlow } from "@/lib/store";
import { Link } from "@tanstack/react-router";
import { ChevronDown, RotateCcw, Users } from "lucide-react";
import type { UserRole } from "@/lib/fieldflow-data";
export function RoleBar() {
  const {
    role,
    setRole,
    activeTechnicianId,
    setActiveTechnicianId,
    activeCustomerId,
    setActiveCustomerId,
    technicians,
    customers,
    resetToDefaults,
  } = useFieldFlow();
  return (
    <details className="demo-settings role-settings">
      <summary>
        <Users size={14} />
        <span>
          Demo workspace ·{" "}
          {role === "manager" ? "Manager" : role === "technician" ? "Technician" : "Customer"}
        </span>
        <span className="role-settings-action">
          Switch view <ChevronDown size={12} />
        </span>
      </summary>
      <div className="role-settings-panel">
        <p>
          Explore the demo as a manager, technician, or customer. Changes are saved in this browser.
        </p>
        <div className="role-settings-fields">
          <label>
            View as
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              <option value="manager">Manager</option>
              <option value="technician">Technician</option>
              <option value="customer">Customer</option>
            </select>
          </label>
          {role === "technician" && (
            <label>
              Technician
              <select
                value={activeTechnicianId}
                onChange={(e) => setActiveTechnicianId(e.target.value)}
              >
                {technicians.map((t) => (
                  <option value={t.id} key={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {role === "customer" && (
            <label>
              Customer
              <select
                value={activeCustomerId}
                onChange={(e) => setActiveCustomerId(e.target.value)}
              >
                {customers.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded bg-primary/10 hover:bg-primary hover:text-primary-foreground text-primary text-xs font-semibold transition-colors mt-2"
          >
            Login Page (All Credentials)
          </Link>
          <button
            className="reset-demo"
            onClick={() => {
              if (
                window.confirm(
                  "Reset tickets and updates to the original demo data? This removes changes saved in this browser.",
                )
              )
                resetToDefaults();
            }}
          >
            <RotateCcw size={14} /> Reset demo
          </button>
        </div>
      </div>
    </details>
  );
}

import { Link } from "@tanstack/react-router";
import { Check, ClipboardList, MapPin, Wrench, ArrowUpRight, Sun } from "lucide-react";
import { Logo } from "./logo";
import { useFieldFlow } from "@/lib/store";
export function ProductPreview() {
  const { tickets, technicians, setRole } = useFieldFlow();
  const counts = ["New", "Assigned", "In Progress", "Waiting", "Resolved", "Closed"].map(
    (status) => ({ status, count: tickets.filter((t) => t.status === status).length }),
  );
  const maximum = Math.max(...counts.map((c) => c.count), 1);
  return (
    <div
      className="product-scene"
      aria-label="FieldFlow dashboard, technician jobs and customer tracking previews"
    >
      <div className="preview-dashboard">
        <div className="mock-toolbar">
          <Logo />
          <span>Overview</span>
          <span>Tickets</span>
          <span>Team</span>
          <i>Demo</i>
        </div>
        <div className="mock-body">
          <div className="mock-heading">
            <div>
              <small>OPERATIONS OVERVIEW</small>
              <h3>Ready for a great day.</h3>
            </div>
            <div className="sun-orb">
              <Sun size={26} strokeWidth={1.7} />
            </div>
          </div>
          <div className="mock-stats">
            {[
              {
                label: "Active tickets",
                value: tickets.filter((t) =>
                  ["New", "Assigned", "In Progress", "Waiting"].includes(t.status),
                ).length,
              },
              { label: "Your team", value: technicians.length },
              {
                label: "Completed",
                value: tickets.filter((t) => ["Closed", "Resolved"].includes(t.status)).length,
              },
            ].map((s) => (
              <div key={s.label}>
                <small>{s.label}</small>
                <strong>{s.value}</strong>
                <span>Workspace snapshot</span>
              </div>
            ))}
          </div>
          <div className="mock-chart">
            <div>
              <strong>Work at a glance</strong>
              <span>Ticket status</span>
            </div>
            <div className="chart-bars">
              {counts.map((c) => (
                <div key={c.status}>
                  <b>{c.count}</b>
                  <span style={{ height: `${20 + (c.count / maximum) * 78}px` }} />
                  <small>{c.status}</small>
                </div>
              ))}
            </div>
          </div>
          <Link to="/dashboard" onClick={() => setRole("manager")} className="preview-open">
            Explore your workspace <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>
      <div className="preview-phone">
        <div className="phone-speaker" />
        <div className="phone-time">
          9:41 <span>••• ▰</span>
        </div>
        <h3>My jobs</h3>
        <div className="phone-tabs">Assigned to me</div>
        {tickets
          .filter((t) => t.assignedTechnicianId)
          .slice(0, 3)
          .map((t, i) => (
            <div className="phone-job" key={t.id}>
              <span className={`job-icon job-${i}`}>
                <ClipboardList size={15} />
              </span>
              <small>{t.id}</small>
              <strong>{t.title}</strong>
              <p>
                <MapPin size={9} />
                {t.siteName}
              </p>
            </div>
          ))}
        <Link to="/tech" onClick={() => setRole("technician")}>
          View job list <ArrowUpRight size={12} />
        </Link>
      </div>
      <div className="preview-tracker">
        <span className="micro-label">CUSTOMER VIEW · EXAMPLE</span>
        <h3>You’re in the loop.</h3>
        {["Ticket received", "Technician assigned", "In progress", "Resolved"].map((s, i) => (
          <div className={`tracker-row tracker-${i}`} key={s}>
            <span>{i < 2 ? <Check size={12} /> : i === 2 ? <Wrench size={12} /> : null}</span>
            <div>
              <strong>{s}</strong>
              <small>
                {
                  [
                    "Request logged",
                    "Ready for the next step",
                    "Your team is on it",
                    "Confirmation to follow",
                  ][i]
                }
              </small>
            </div>
          </div>
        ))}
        <div className="tracker-note">
          <Check size={15} />
          <span>
            Every update.
            <br />
            One shared view.
          </span>
        </div>
      </div>
    </div>
  );
}

import { ThemeToggle } from "@/components/ff/theme";
import { useLandingMotion } from "@/hooks/use-landing-motion";
import { FeatureIcon } from "@/components/ff/feature-icon";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  CheckCheck,
  Wrench,
  Sun,
  Snowflake,
  Zap,
  Building2,
  MapPin,
  ClipboardCheck,
  Users,
  Bell,
  ArrowUpRight,
} from "lucide-react";
import { Logo } from "@/components/ff/logo";
import { ProductPreview } from "@/components/ff/product-preview";
import { useFieldFlow } from "@/lib/store";
export const Route = createFileRoute("/")({ component: LandingPage });
export function LandingPage() {
  const { setRole } = useFieldFlow();
  const motionRef = useLandingMotion();
  return (
    <div className="landing" ref={motionRef}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="landing-header">
        <div className="landing-container nav-inner">
          <Link to="/" aria-label="FieldFlow home">
            <Logo />
          </Link>
          <nav aria-label="Main navigation">
            <a href="#workflow">How it works</a>
            <a href="#solutions">Solutions</a>
          </nav>
          <ThemeToggle />
          <div className="flex items-center gap-2">
            <Link to="/login" className="button-primary text-xs py-2 px-4 shadow-sm">
              Sign In <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>
      <main id="main-content">
        <section className="hero landing-container">
          <div className="hero-copy">
            <h1>
              Great service.
              <br />
              <span>
                Every step
                <br className="desktop-break" /> of the way.
              </span>
            </h1>
            <p className="hero-description">
              Bring your team, tickets, and customers together. Less chasing updates. More getting
              the job done.
            </p>
            <div className="hero-actions">
              <Link to="/login" className="button-primary">
                Sign In to Workspace <ArrowRight size={17} />
              </Link>
              <a href="#workflow" className="button-secondary">
                See how it works <ArrowUpRight size={16} />
              </a>
            </div>
            <div className="hero-checks">
              <span>
                <Check size={15} /> One connected workspace
              </span>
              <span>
                <Check size={15} /> Built for the field
              </span>
            </div>
          </div>
          <ProductPreview />
        </section>
        <section className="industries landing-container" aria-label="Industries">
          <p>
            BUILT FOR THE WORK
            <br />
            THAT KEEPS US GOING
          </p>
          <span>
            <Sun />
            Solar
          </span>
          <span>
            <Snowflake />
            HVAC
          </span>
          <span>
            <Zap />
            Electrical
          </span>
          <span>
            <Building2 />
            Facilities
          </span>
        </section>
        <section id="workflow" className="workflow-section landing-container">
          <div className="section-intro">
            <div>
              <p className="eyebrow">A CLEAR PATH TO DONE</p>
              <h2>
                From first request.
                <br />
                To a job well done.
              </h2>
            </div>
            <p>
              Everyone knows what comes next.
              <br />
              Every detail stays with the ticket.
            </p>
          </div>
          <div className="workflow-grid">
            {[
              {
                icon: ClipboardCheck,
                title: "Capture the request",
                text: "Give every issue a home, with site details and the right priority.",
              },
              {
                icon: Users,
                title: "Connect the right team",
                text: "Assign a technician and keep the work moving in one shared view.",
              },
              {
                icon: CheckCheck,
                title: "Close the loop",
                text: "Record the fix, share progress, and let customers confirm resolution.",
              },
            ].map((s, i) => (
              <article key={s.title}>
                <div className="step-top">
                  <FeatureIcon
                    icon={s.icon}
                    tone={i === 1 ? "violet" : i === 2 ? "green" : "blue"}
                  />
                  <span>0{i + 1}</span>
                </div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </article>
            ))}
          </div>
        </section>
        <section id="solutions" className="solutions-section landing-container">
          <div className="service-preview">
            <div className="preview-top">
              <Logo />
              <span>EXAMPLE SERVICE UPDATE</span>
            </div>
            <div className="preview-title">
              <FeatureIcon icon={Bell} small />
              <div>
                <h3>Everything in the loop.</h3>
                <p>Solar inverter inspection</p>
              </div>
            </div>
            {["Request received", "Technician assigned", "Work in progress"].map((s, i) => (
              <div className="preview-step" key={s}>
                <span className={i === 2 ? "current" : ""}>
                  {i === 2 ? <MapPin size={16} /> : <Check size={15} />}
                </span>
                <div>
                  <strong>{s}</strong>
                  <p>
                    {
                      [
                        "Your service ticket is ready.",
                        "The right person for the job.",
                        "Updates, all in one place.",
                      ][i]
                    }
                  </p>
                </div>
                {i === 2 && <b>In progress</b>}
              </div>
            ))}
          </div>
          <div className="solution-copy">
            <p className="eyebrow">LESS BACK-AND-FORTH</p>
            <h2>
              A little more clarity.
              <br />A lot less busywork.
            </h2>
            <p>
              Give the office a clear overview, technicians a focused job list, and customers a
              simple way to follow their service.
            </p>
            <div className="solution-links">
              <Link to="/login">
                For operations teams <ArrowRight size={17} />
              </Link>
              <Link to="/login">
                For field technicians <ArrowRight size={17} />
              </Link>
              <Link to="/login">
                For your customers <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </section>
        <section className="landing-container">
          <div className="bottom-cta">
            <div>
              <p className="eyebrow">BRING IT ALL TOGETHER</p>
              <h2>Your next great service starts here.</h2>
              <p>Sign in to explore your operational workspace.</p>
            </div>
            <Link to="/login" className="button-primary">
              Sign In & Get Started <ArrowRight size={17} />
            </Link>
          </div>
        </section>
      </main>
      <footer className="landing-container landing-footer">
        <Logo />
        <span>Good service. Connected.</span>
        <p>FieldFlow · Demo workspace</p>
      </footer>
    </div>
  );
}

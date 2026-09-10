import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useFieldFlow } from "@/lib/store";
import { Logo } from "@/components/ff/logo";
import { ThemeToggle } from "@/components/ff/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck,
  UserCheck,
  Wrench,
  Building,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Lock,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { type UserRole } from "@/lib/fieldflow-data";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Sign In — FieldFlow Platform" },
      {
        name: "description",
        content: "Sign in to FieldFlow Field Service Ticket System for Managers, Technicians, and Clients.",
      },
    ],
  }),
});

interface RoleAccount {
  role: UserRole;
  label: string;
  title: string;
  email: string;
  pass: string;
  icon: typeof ShieldCheck;
  dest: string;
  description: string;
  badge: string;
  badgeTone: string;
}

const ROLES: RoleAccount[] = [
  {
    role: "manager",
    label: "Manager",
    title: "Alex Morgan",
    email: "manager@fieldflow.com",
    pass: "manager123",
    icon: ShieldCheck,
    dest: "/dashboard",
    description: "Full dispatch dashboard, ticket lifecycle control, SLA risk tracking & tech capacity.",
    badge: "Operations Admin",
    badgeTone: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  {
    role: "technician",
    label: "Technician",
    title: "Marcus Vance",
    email: "tech@fieldflow.com",
    pass: "tech123",
    icon: Wrench,
    dest: "/tech",
    description: "Mobile field workflow, job checklists, status updates & work evidence upload.",
    badge: "Field Specialist",
    badgeTone: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  },
  {
    role: "customer",
    label: "Customer",
    title: "Apex Solar Industrial",
    email: "customer@fieldflow.com",
    pass: "customer123",
    icon: Building,
    dest: "/customer",
    description: "Report site issues, track resolution timeline, and confirm completed service orders.",
    badge: "Client Account",
    badgeTone: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  },
];

function LoginPage() {
  const { setRole, setActiveTechnicianId, setActiveCustomerId } = useFieldFlow();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<UserRole>("manager");
  const [email, setEmail] = useState("manager@fieldflow.com");
  const [password, setPassword] = useState("manager123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeAccount = ROLES.find((r) => r.role === selectedRole) || ROLES[0];

  const handleRoleSelect = (account: RoleAccount) => {
    setSelectedRole(account.role);
    setEmail(account.email);
    setPassword(account.pass);
  };

  const executeLogin = (account: RoleAccount) => {
    setIsSubmitting(true);
    setRole(account.role);
    if (account.role === "technician") {
      setActiveTechnicianId("t1");
    } else if (account.role === "customer") {
      setActiveCustomerId("c1");
    }

    setTimeout(() => {
      setIsSubmitting(false);
      toast.success(`Welcome back, ${account.title}!`, {
        description: `Signed in as ${account.label} (${account.email})`,
      });
      navigate({ to: account.dest });
    }, 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeLogin(activeAccount);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary selection:text-primary-foreground">
      {/* Top Header Bar */}
      <header className="border-b border-hairline bg-surface/80 backdrop-blur-md sticky top-0 z-50 px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="hidden sm:inline-block text-xs font-medium text-muted-foreground border-l border-hairline pl-3">
            Unified Field Service Operations
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/" })}
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Back to Home
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

          {/* Left Column: Quick Role Selection Cards */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              {/* <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-3">
                <Sparkles className="size-3.5" />
                <span>Multi-Role Demo Access</span>
              </div> */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                Sign in to your service workspace
              </h1>
              <p className="text-sm text-muted-foreground mt-2 max-w-lg">
                Choose a role below to auto-fill credentials or sign in manually to experience the full end-to-end field flow.
              </p>
            </div>

            {/* Role Switcher Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {ROLES.map((acc) => {
                const Icon = acc.icon;
                const isSelected = selectedRole === acc.role;

                return (
                  <div
                    key={acc.role}
                    onClick={() => handleRoleSelect(acc)}
                    className={`relative p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between gap-3 ${isSelected
                      ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/30"
                      : "border-hairline bg-card hover:bg-accent/40 hover:border-muted-foreground/30"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`size-9 rounded-xl grid place-items-center ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        <Icon className="size-4" />
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="size-4 text-primary shrink-0" />
                      )}
                    </div>

                    <div>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${acc.badgeTone}`}>
                        {acc.badge}
                      </span>
                      <h3 className="text-sm font-bold text-foreground mt-1.5">{acc.label}</h3>
                      <p className="text-[11px] font-mono text-muted-foreground truncate">{acc.email}</p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRoleSelect(acc);
                        executeLogin(acc);
                      }}
                      className="mt-1 w-full py-1.5 px-2 rounded-lg bg-primary/10 hover:bg-primary hover:text-primary-foreground text-primary text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                    >
                      Instant Sign In <ArrowRight className="size-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Info notice */}
            {/* <div className="p-4 rounded-xl border border-hairline bg-surface/50 text-xs space-y-1">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                Role-Based Access Control (RBAC) Active
              </p>
              <p className="text-muted-foreground text-[11px]">
                Each role opens a tailored view with enforced permissions: Managers control dispatch, Technicians view assigned jobs, and Customers confirm service resolutions.
              </p>
            </div> */}
          </div>

          {/* Right Column: Authentication Card Form */}
          <div className="lg:col-span-5">
            <div className="card-surface p-6 sm:p-8 rounded-3xl shadow-xl border border-hairline relative">
              <div className="flex items-center justify-between border-b border-hairline pb-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Sign In</h2>
                  <p className="text-xs text-muted-foreground">Selected Role: <span className="font-semibold text-primary capitalize">{selectedRole}</span></p>
                </div>
                <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${activeAccount.badgeTone}`}>
                  {activeAccount.label}
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Input */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10 pl-9 text-xs bg-background"
                      placeholder="name@company.com"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Password</Label>
                    <span className="text-[11px] text-muted-foreground font-mono">Demo: {activeAccount.pass}</span>
                  </div>
                  <div className="relative">
                    <Lock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-10 pl-9 pr-9 text-xs bg-background"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember & Hardcoded Info */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-hairline text-primary focus:ring-primary size-3.5"
                    />
                    <span>Remember this session</span>
                  </label>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:brightness-110 gap-2 transition-all mt-2"
                >
                  {isSubmitting ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>Enter {activeAccount.label} Portal</span>
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </form>

              {/* Demo Credentials Table */}
              <div className="mt-6 pt-4 border-t border-hairline text-[11px] space-y-2">
                <p className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">Hardcoded Demo Credentials</p>
                <div className="grid grid-cols-3 gap-2 font-mono text-[10px]">
                  {ROLES.map((r) => (
                    <div
                      key={r.role}
                      onClick={() => handleRoleSelect(r)}
                      className={`p-2 rounded-lg border cursor-pointer text-center transition-colors ${selectedRole === r.role ? "bg-primary/10 border-primary text-primary" : "bg-muted/50 border-hairline text-muted-foreground"}`}
                    >
                      <div className="font-bold capitalize">{r.role}</div>
                      <div className="truncate text-[9px] mt-0.5">{r.pass}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-hairline py-4 px-4 text-center text-xs text-muted-foreground bg-surface/50">
        FieldFlow v2.0 • Field Service Management System • Connected to Reactive Store
      </footer>
    </div>
  );
}

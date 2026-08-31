import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  FlaskConical,
  Search,
  Syringe,
  UserPlus,
  Users,
} from "lucide-react";
import { api } from "@/lib/api";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Facility Dashboard — Mama na Mtoto+ CHV" },
      {
        name: "description",
        content:
          "Daily maternal health overview for Kenyan facility nurses: registered mothers, ANC visits, danger sign alerts and appointments.",
      },
      { property: "og:title", content: "Facility Dashboard — Mama na Mtoto+ CHV" },
      {
        property: "og:description",
        content: "Track mothers, ANC visits, lab results, vaccinations and danger sign alerts.",
      },
    ],
  }),
  component: DashboardHome,
});

const actions = [
  { to: "/mothers/register", label: "Register mother", icon: UserPlus },
  { to: "/mothers/search", label: "Find a mother", icon: Search },
  { to: "/alerts", label: "Danger alerts", icon: AlertTriangle },
] as const;

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: number | string;
  icon: typeof Users;
  tone?: "primary" | "critical" | "success";
}) {
  const tones = {
    primary: "bg-accent text-accent-foreground",
    critical: "bg-critical/10 text-critical",
    success: "bg-success/10 text-success",
  };
  return (
    <div className="card-surface">
      <div className={`mb-3 inline-flex rounded-xl p-2 ${tones[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function DashboardHome() {
  const stats = useQuery({ queryKey: ["stats"], queryFn: api.stats });
  const alerts = useQuery({ queryKey: ["alerts"], queryFn: api.alerts });
  const openAlerts = (alerts.data ?? []).filter((a) => a.status === "open").slice(0, 3);

  return (
    <AppShell title="Today at a glance">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="Mothers registered"
          value={stats.data?.mothersRegistered ?? "—"}
          icon={Users}
        />
        <StatCard
          label="ANC visits this month"
          value={stats.data?.ancVisitsThisMonth ?? "—"}
          icon={Activity}
        />
        <StatCard
          label="Open danger alerts"
          value={stats.data?.openAlerts ?? "—"}
          icon={AlertTriangle}
          tone="critical"
        />
        <StatCard
          label="Appointments today"
          value={stats.data?.appointmentsToday ?? "—"}
          icon={CalendarClock}
        />
        <StatCard
          label="High-risk mothers"
          value={stats.data?.highRiskMothers ?? "—"}
          icon={FlaskConical}
          tone="critical"
        />
        <StatCard
          label="Vaccines given"
          value={stats.data?.vaccinationsThisMonth ?? "—"}
          icon={Syringe}
          tone="success"
        />
      </section>

      <h2 className="mb-3 mt-7 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Quick actions
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {actions.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary hover:bg-accent/50"
          >
            <span className="rounded-xl bg-gradient-brand p-2.5 text-primary-foreground">
              <Icon className="h-5 w-5" />
            </span>
            <span className="font-semibold text-foreground">{label}</span>
          </Link>
        ))}
      </div>

      <div className="mt-7 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Latest alerts
        </h2>
        <Link to="/alerts" className="text-sm font-medium text-primary">
          View all
        </Link>
      </div>
      <div className="mt-3 space-y-3">
        {alerts.isLoading && <p className="text-sm text-muted-foreground">Loading alerts…</p>}
        {!alerts.isLoading && openAlerts.length === 0 && (
          <p className="card-surface text-sm text-muted-foreground">
            No open danger sign alerts. 🎉
          </p>
        )}
        {openAlerts.map((a) => (
          <Link
            key={a.id}
            to="/mothers/$motherId"
            params={{ motherId: a.motherId }}
            className="block card-surface border-l-4 border-l-critical"
          >
            <p className="font-semibold text-foreground">{a.dangerSign}</p>
            <p className="text-sm text-muted-foreground">
              {a.motherName} · {a.motherPhone}
            </p>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}

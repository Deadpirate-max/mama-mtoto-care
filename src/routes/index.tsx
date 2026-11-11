import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Bell,
  UserPlus,
  Search,
  Heart,
  Activity,
  AlertTriangle,
  Calendar,
  ChevronRight,
  ShieldAlert,
  Lightbulb,
} from "lucide-react";
import { api, type Mother, type Alert } from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { useRequireAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function formatDate(date: string | undefined | null): string {
  if (!date) return "—";
  try {
    const d = new Date(date);
    if (d.getFullYear() < 2000 || isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "2-digit" });
  } catch {
    return "—";
  }
}

function formatTime(date: string | undefined | null): string {
  if (!date) return "just now";
  try {
    return new Date(date).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "just now";
  }
}

function HomePage() {
  const { user } = useRequireAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: () => api.stats(),
  });
  const { data: allAlerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => api.alerts(),
  });
  const { data: allMothers = [], isLoading: mothersLoading } = useQuery({
    queryKey: ["mothers"],
    queryFn: () => api.searchMothers(""),
  });

  const [upcoming, setUpcoming] = useState<any[]>([]);

  useEffect(() => {
    if (!allMothers.length) return;
    // Compute upcoming appointments
    const upcomingList = allMothers
      .flatMap((mother: any) =>
        (mother.ancVisits || [])
          .filter((v: any) => v.attended && v.nextAppointmentDate)
          .map((v: any) => ({
            motherName: mother.name,
            motherId: mother.id,
            date: v.nextAppointmentDate,
            visitNumber: (v.visitNumber || 0) + 1,
          })),
      )
      .filter((x: any) => new Date(x.date) >= new Date())
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
    setUpcoming(upcomingList);
  }, [allMothers]);

  const firstName = user?.name?.split(" ")[0] || "Nurse";

  const openAlerts = allAlerts.filter(
    (a: any) => a.status === "open" || a.status === "sent" || a.status === "logged_no_sms",
  );
  const recentAlerts = openAlerts.slice(0, 3);
  const recentMothers = allMothers.slice(0, 4);

  const getMotherRisk = (mother: any) => {
    const hasOpenAlert = openAlerts.some((a: any) => a.motherId === mother.id);
    if (hasOpenAlert || mother.riskLevel === "high" || mother.riskLevel === "critical")
      return "critical";
    if (mother.riskLevel === "medium") return "warning";
    return "success";
  };

  const loading = statsLoading || alertsLoading || mothersLoading;

  return (
    <AppShell
      title={`Karibu, ${firstName}`}
      subtitle={user?.facility || ""}
      alertCount={openAlerts.length}
    >
      <div className="space-y-8 pb-10">
        {/* ALERTS BANNER */}
        {openAlerts.length > 0 && (
          <Link
            to="/alerts"
            className="flex items-center gap-4 rounded-2xl border border-critical-line bg-critical-soft p-4 transition-all hover:bg-critical/10"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-critical text-critical-foreground shadow-sm animate-pulse">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold text-critical">
                {openAlerts.length} Open Alert{openAlerts.length > 1 ? "s" : ""}
              </p>
              <p className="truncate text-sm font-medium text-critical/80">
                {recentAlerts[0]?.dangerSign || recentAlerts[0]?.symptom || "Danger sign reported"}{" "}
                — tap to review
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-critical" />
          </Link>
        )}

        {/* QUICK ACTIONS & STATS... (Keep existing code) */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            to="/mothers/register"
            className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-5 text-center shadow-sm transition-all hover:border-primary/30 hover:bg-primary/5"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm group-hover:scale-105">
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-foreground">Register</p>
              <p className="text-xs font-medium text-muted-foreground">New mother</p>
            </div>
          </Link>
          <Link
            to="/mothers/search"
            className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-5 text-center shadow-sm transition-all hover:border-primary/30 hover:bg-primary/5"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground shadow-sm group-hover:scale-105">
              <Search className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-foreground">Search</p>
              <p className="text-xs font-medium text-muted-foreground">Find a mother</p>
            </div>
          </Link>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Today at a glance
          </h2>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <StatCard
              icon={Heart}
              label="Mothers"
              value={loading ? "—" : (stats?.mothersRegistered ?? 0)}
              color="text-primary"
              bg="bg-primary/10"
            />
            <StatCard
              icon={Activity}
              label="ANC Visits"
              value={loading ? "—" : (stats?.ancVisitsThisMonth ?? 0)}
              color="text-success"
              bg="bg-success-soft"
            />
            <StatCard
              icon={Bell}
              label="Alerts"
              value={loading ? "—" : openAlerts.length}
              color={openAlerts.length > 0 ? "text-critical" : "text-muted-foreground"}
              bg={openAlerts.length > 0 ? "bg-critical-soft" : "bg-muted"}
            />
          </div>
        </div>

        {/* RECENT MOTHERS - WITH RISK BADGES */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Recent mothers
            </h2>
            <Link
              to="/mothers/search"
              className="text-sm font-semibold text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          {loading ? (
            <LoadingRow />
          ) : recentMothers.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="No mothers yet"
              subtitle="Register the first mother to get started"
              actionLabel="Register a mother"
              actionTo="/mothers/register"
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              {recentMothers.map((m: any, i: number) => {
                const riskTone = getMotherRisk(m); // 👈 Use the unified risk logic
                return (
                  <Link
                    key={m.id}
                    to="/mothers/$motherId"
                    params={{ motherId: m.id }}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50",
                      i !== recentMothers.length - 1 && "border-b border-border",
                    )}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-baby-soft text-sm font-bold text-baby">
                      {m.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-foreground">
                          {m.name || "Unknown"}
                        </p>
                        <Badge tone={riskTone}>
                          {riskTone === "critical"
                            ? "High Risk"
                            : riskTone === "warning"
                              ? "Medium Risk"
                              : "Stable"}
                        </Badge>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {m.phone} · {m.county || "—"}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

// ── Reusable Components ──

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
  bg: string;
}) {
  return (
    <div className="card-surface flex flex-col items-center justify-center p-4 text-center sm:p-5">
      <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-xl", bg, color)}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:text-xs">
        {label}
      </p>
    </div>
  );
}

function LoadingRow() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-2xl border border-border bg-muted/50" />
      ))}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  actionTo,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  actionLabel: string;
  actionTo: string;
}) {
  return (
    <div className="card-surface flex flex-col items-center justify-center p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <p className="mt-4 font-bold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      <Link
        to={actionTo}
        className="mt-5 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
      >
        {actionLabel}
      </Link>
    </div>
  );
}

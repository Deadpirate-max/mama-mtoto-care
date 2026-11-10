import { createFileRoute, Link } from "@tanstack/react-router";
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
import { api, type Mother, type Alert, type Stats } from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { useRequireAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: HomePage,
});

// 🛡️ Safe date formatters
function formatDate(date: string | undefined | null): string {
  if (!date) return "—";
  try {
    const d = new Date(date);
    if (d.getFullYear() < 2000 || isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    });
  } catch {
    return "—";
  }
}

function formatTime(date: string | undefined | null): string {
  if (!date) return "just now";
  try {
    return new Date(date).toLocaleTimeString("en-KE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "just now";
  }
}

type UpcomingItem = {
  motherName: string;
  motherId: string;
  date: string;
  visitNumber: number;
};

function HomePage() {
  const { user } = useRequireAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentMothers, setRecentMothers] = useState<Mother[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [s, m, a] = await Promise.all([
          api.stats().catch(() => null),
          api.searchMothers("").catch(() => []),
          api.alerts().catch(() => []),
        ]);

        if (!mounted) return;

        // Compute upcoming appointments from mothers with nextAppointmentDate
        const upcomingList: UpcomingItem[] = (m || [])
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
          .filter((x) => new Date(x.date) >= new Date())
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 5);

        setStats(s);
        setRecentMothers((m || []).slice(0, 4));
        setRecentAlerts(
          (a || []).filter((x) => x.status === "open" || x.status === "sent").slice(0, 3),
        );
        setUpcoming(upcomingList);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const firstName = user?.name?.split(" ")[0] || "Nurse";
  const openAlerts = stats?.openAlerts ?? recentAlerts.length;

  return (
    <AppShell title={`Karibu, ${firstName}`} subtitle={user?.facility || ""}>
      <div className="space-y-8 pb-10">
        {/* ── ALERTS BANNER ── */}
        {openAlerts > 0 && (
          <Link
            to="/alerts"
            className="flex items-center gap-4 rounded-2xl border border-critical-line bg-critical-soft p-4 transition-all hover:bg-critical/10"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-critical text-critical-foreground shadow-sm animate-pulse">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold text-critical">
                {openAlerts} Open Alert{openAlerts > 1 ? "s" : ""}
              </p>
              <p className="truncate text-sm font-medium text-critical/80">
                {recentAlerts[0]?.dangerSign || recentAlerts[0]?.symptom || "Danger sign reported"}{" "}
                — tap to review immediately
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-critical" />
          </Link>
        )}

        {/* ── QUICK ACTIONS ── */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            to="/mothers/register"
            className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-5 text-center shadow-sm transition-all hover:border-primary/30 hover:bg-primary/5"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
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
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground shadow-sm transition-transform group-hover:scale-105">
              <Search className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-foreground">Search</p>
              <p className="text-xs font-medium text-muted-foreground">Find a mother</p>
            </div>
          </Link>
        </div>

        {/* ── STATS GRID ── */}
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
              value={loading ? "—" : openAlerts}
              color={openAlerts > 0 ? "text-critical" : "text-muted-foreground"}
              bg={openAlerts > 0 ? "bg-critical-soft" : "bg-muted"}
            />
          </div>
        </div>

        {/* ── UPCOMING APPOINTMENTS ── */}
        {upcoming.length > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Upcoming appointments
            </h2>
            <div className="space-y-3">
              {upcoming.map((u, i) => (
                <Link
                  key={`${u.motherId}-${i}`}
                  to="/mothers/$motherId"
                  params={{ motherId: u.motherId }}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">{u.motherName}</p>
                    <p className="text-xs text-muted-foreground">
                      ANC Visit {u.visitNumber} ·{" "}
                      {new Date(u.date).toLocaleDateString("en-KE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── RECENT MOTHERS ── */}
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
              {recentMothers.map((m, i) => (
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
                    <p className="truncate font-semibold text-foreground">{m.name || "Unknown"}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.phone} · {m.county || "—"}
                    </p>
                  </div>
                  {m.edd && (
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        EDD
                      </p>
                      <p className="text-xs font-semibold text-foreground">{formatDate(m.edd)}</p>
                    </div>
                  )}
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── RECENT ALERTS ── */}
        {recentAlerts.length > 0 && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-critical">
                <AlertTriangle className="h-4 w-4" /> Needs attention
              </h2>
              <Link to="/alerts" className="text-sm font-semibold text-critical hover:underline">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {recentAlerts.map((a) => (
                <Link
                  key={a.id}
                  to="/alerts"
                  className="flex items-center gap-4 rounded-2xl border border-critical-line bg-critical-soft p-4 transition-colors hover:bg-critical/10"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-critical text-critical-foreground shadow-sm">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-critical">
                      {a.dangerSign || a.symptom || "Danger sign"}
                    </p>
                    <p className="truncate text-xs font-medium text-critical/80">
                      {a.motherName || a.motherPhone} · {formatTime(a.createdAt || a.firedAt)}
                    </p>
                  </div>
                  {a.severity && <Badge tone="critical">{a.severity.toUpperCase()}</Badge>}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── TIP CARD ── */}
        <div className="card-surface flex items-start gap-4 border-primary/20 bg-primary/5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Lightbulb className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-primary">Pilot Tip</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Every mother you register gets an 8-character code by SMS. She uses it to link her app
              to your care team.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// ── 🎨 Reusable Components ──

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

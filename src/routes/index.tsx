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
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { api, getStoredUser, type Mother, type Alert, type Stats } from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { useRequireAuth } from "@/lib/auth";

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
      <div className="space-y-5">
        {/* ── ALERTS BANNER ── */}
        {openAlerts > 0 && (
          <Link
            to="/alerts"
            className="flex items-center gap-3 rounded-2xl border-2 border-red-600 bg-red-600 p-4 text-white shadow-[0_8px_24px_rgba(220,38,38,0.35)] transition active:scale-[0.99]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/25 animate-pulse">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black uppercase tracking-wide">
                🚨 {openAlerts} Open Alert{openAlerts > 1 ? "s" : ""}
              </p>
              <p className="truncate text-xs font-medium opacity-95">
                {recentAlerts[0]?.dangerSign || recentAlerts[0]?.symptom || "Danger sign reported"}{" "}
                — tap to review immediately
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0" />
          </Link>
        )}

        {/* ── Quick actions ── */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/mothers/register"
            className="flex flex-col items-start gap-2 rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm transition active:scale-[0.98] hover:border-purple-400"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-purple-900">Register</p>
              <p className="text-[11px] font-medium text-purple-600">New mother</p>
            </div>
          </Link>

          <Link
            to="/mothers/search"
            className="flex flex-col items-start gap-2 rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm transition active:scale-[0.98] hover:border-purple-400"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-purple-900">Search</p>
              <p className="text-[11px] font-medium text-purple-600">Find a mother</p>
            </div>
          </Link>
        </div>

        {/* ── Stats grid ── */}
        <div>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-purple-900">
            Today at a glance
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              icon={<Heart className="h-4 w-4" />}
              label="Mothers"
              value={loading ? "—" : (stats?.mothersRegistered ?? 0)}
              gradient="from-purple-500 to-purple-700"
            />
            <StatCard
              icon={<Activity className="h-4 w-4" />}
              label="ANC visits"
              value={loading ? "—" : (stats?.ancVisitsThisMonth ?? 0)}
              gradient="from-emerald-500 to-emerald-700"
            />
            <StatCard
              icon={<Bell className="h-4 w-4" />}
              label="Alerts"
              value={loading ? "—" : openAlerts}
              gradient="from-red-500 to-red-700"
            />
          </div>
        </div>

        {/* ── 🗓️ Upcoming appointments ── */}
        {upcoming.length > 0 && (
          <div>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-purple-900">
              Upcoming appointments
            </h2>
            <div className="space-y-2">
              {upcoming.map((u, i) => (
                <Link
                  key={`${u.motherId}-${i}`}
                  to="/mothers/$motherId"
                  params={{ motherId: u.motherId }}
                  className="flex items-center gap-3 rounded-2xl border-2 border-blue-200 bg-white p-3 shadow-sm transition active:scale-[0.99]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-900">{u.motherName}</p>
                    <p className="text-xs text-gray-500">
                      ANC Visit {u.visitNumber} ·{" "}
                      {new Date(u.date).toLocaleDateString("en-KE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-blue-400" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Recent mothers ── */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-purple-900">
              Recent mothers
            </h2>
            <Link to="/mothers/search" className="text-xs font-bold text-purple-600">
              View all →
            </Link>
          </div>

          {loading ? (
            <LoadingRow />
          ) : recentMothers.length === 0 ? (
            <EmptyState
              icon={<Heart className="h-6 w-6" />}
              title="No mothers yet"
              subtitle="Register the first mother to get started"
              actionLabel="Register a mother"
              actionTo="/mothers/register"
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border-2 border-purple-100 bg-white shadow-sm">
              {recentMothers.map((m, i) => (
                <Link
                  key={m.id}
                  to="/mothers/$motherId"
                  params={{ motherId: m.id }}
                  className={`flex items-center gap-3 px-4 py-3 transition hover:bg-purple-50 active:bg-purple-100 ${
                    i !== recentMothers.length - 1 ? "border-b border-purple-100" : ""
                  }`}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-700 text-sm font-black text-white shadow-md">
                    {m.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-900">
                      {m.name || "Unknown"}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {m.phone} · {m.county || "—"}
                    </p>
                  </div>
                  {m.edd && (
                    <div className="shrink-0 rounded-lg bg-purple-100 px-2 py-1 text-right">
                      <p className="text-[9px] font-bold uppercase text-purple-700">EDD</p>
                      <p className="text-xs font-black text-purple-900">{formatDate(m.edd)}</p>
                    </div>
                  )}
                  <ChevronRight className="h-4 w-4 shrink-0 text-purple-400" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── 🚨 Recent alerts ── */}
        {recentAlerts.length > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-red-700">
                <AlertTriangle className="h-3 w-3" />
                Needs attention
              </h2>
              <Link to="/alerts" className="text-xs font-bold text-red-600">
                View all →
              </Link>
            </div>
            <div className="space-y-2">
              {recentAlerts.map((a) => (
                <Link
                  key={a.id}
                  to="/alerts"
                  className="flex items-center gap-3 rounded-2xl border-2 border-red-200 bg-gradient-to-r from-red-50 to-white p-3 shadow-sm transition active:scale-[0.99]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-600 text-white shadow-md">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-900">
                      {a.dangerSign || a.symptom || "Danger sign"}
                    </p>
                    <p className="truncate text-xs text-gray-600">
                      {a.motherName || a.motherPhone} · {formatTime(a.createdAt || a.firedAt)}
                    </p>
                  </div>
                  {a.severity && (
                    <span className="shrink-0 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                      {a.severity}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── 💡 Tip card ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-4 text-white shadow-[0_8px_24px_rgba(109,40,217,0.35)]">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />
          <div className="relative flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-300 text-purple-900 shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-wider text-yellow-200">
                💡 Pilot tip
              </p>
              <p className="mt-1 text-sm font-medium leading-snug">
                Every mother you register gets an 8-character code by SMS. She uses it to link her
                app to your care team.
              </p>
            </div>
          </div>
        </div>

        <div className="h-4" />
      </div>
    </AppShell>
  );
}

// ── 🎨 StatCard ──
function StatCard({
  icon,
  label,
  value,
  gradient,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  gradient: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-3 text-white shadow-md transition active:scale-[0.98]`}
    >
      <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/10" />
      <div className="relative">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/25 backdrop-blur-sm">
          {icon}
        </div>
        <p className="mt-2 text-2xl font-black leading-tight">{value}</p>
        <p className="text-[10px] font-bold uppercase tracking-wider opacity-90">{label}</p>
      </div>
    </div>
  );
}

function LoadingRow() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-16 animate-pulse rounded-2xl border-2 border-purple-100 bg-white shadow-sm"
        />
      ))}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  actionTo,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  actionLabel: string;
  actionTo: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-purple-100 bg-white p-6 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-md">
        {icon}
      </div>
      <p className="mt-3 text-sm font-bold text-gray-900">{title}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
      <Link
        to={actionTo}
        className="mt-4 inline-block rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 px-5 py-2.5 text-sm font-bold text-white shadow-md transition active:scale-[0.98]"
      >
        {actionLabel}
      </Link>
    </div>
  );
}

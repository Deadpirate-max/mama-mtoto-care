import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Phone, ChevronRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { api, type Alert } from "@/lib/api";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/alerts")({
  component: AlertsPage,
});

type Filter = "open" | "acknowledged" | "resolved" | "all";

function formatRelative(date: string | undefined | null): string {
  if (!date) return "just now";
  try {
    const d = new Date(date);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString("en-KE", { day: "numeric", month: "short" });
  } catch {
    return "just now";
  }
}

function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("open");
  const [updating, setUpdating] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await api.alerts();
      setAlerts(data || []);
    } catch (err) {
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function changeStatus(id: string, status: Alert["status"]) {
    setUpdating(id);
    try {
      await api.updateAlert(id, status);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
      toast.success(`Alert marked ${status}`);
    } catch (err) {
      toast.error("Failed to update alert");
    } finally {
      setUpdating(null);
    }
  }

  const filtered = alerts.filter((a) => {
    if (filter === "all") return true;
    if (filter === "open") {
      // Treat these as open
      return a.status === "open" || a.status === "sent" || a.status === "logged_no_sms";
    }
    return a.status === filter;
  });

  const counts = {
    open: alerts.filter(
      (a) => a.status === "open" || a.status === "sent" || a.status === "logged_no_sms",
    ).length,
    acknowledged: alerts.filter((a) => a.status === "acknowledged").length,
    resolved: alerts.filter((a) => a.status === "resolved").length,
    all: alerts.length,
  };

  return (
    <AppShell title="Alerts" subtitle="Danger signs & responses">
      <div className="space-y-4">
        {/* ── Refresh button ── */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {counts.open > 0
              ? `${counts.open} open alert${counts.open > 1 ? "s" : ""} need attention`
              : "All caught up ✅"}
          </p>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1 rounded-lg bg-purple-100 px-3 py-1.5 text-xs font-bold text-purple-700 transition active:scale-95"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* ── Filter tabs ── */}
        <div className="flex gap-2 overflow-x-auto">
          {(["open", "acknowledged", "resolved", "all"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide transition ${
                filter === f
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-white text-gray-600 border border-purple-100"
              }`}
            >
              {f} {counts[f] > 0 && `(${counts[f]})`}
            </button>
          ))}
        </div>

        {/* ── Alerts list ── */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-2xl border-2 border-purple-100 bg-white"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border-2 border-purple-100 bg-white p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <p className="mt-3 text-sm font-bold text-gray-900">
              {filter === "open"
                ? "No open alerts"
                : filter === "acknowledged"
                  ? "No acknowledged alerts"
                  : filter === "resolved"
                    ? "No resolved alerts"
                    : "No alerts at all"}
            </p>
            <p className="text-xs text-gray-500">
              {filter === "open" ? "Your mothers are safe for now 💜" : "Nothing to show here"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onUpdate={changeStatus}
                updating={updating === alert.id}
              />
            ))}
          </div>
        )}

        <div className="h-4" />
      </div>
    </AppShell>
  );
}

// ── Alert Card ────────────────────────────────────────────────────────────
function AlertCard({
  alert,
  onUpdate,
  updating,
}: {
  alert: Alert;
  onUpdate: (id: string, status: Alert["status"]) => void;
  updating: boolean;
}) {
  const isOpen = alert.status === "open" || alert.status === "sent";
  const isAcked = alert.status === "acknowledged";
  const isResolved = alert.status === "resolved";

  const severityColor =
    alert.severity === "critical"
      ? "from-red-500 to-red-600 border-red-300"
      : alert.severity === "urgent"
        ? "from-orange-500 to-orange-600 border-orange-300"
        : "from-yellow-500 to-yellow-600 border-yellow-300";

  const bgColor = isResolved
    ? "from-gray-50 to-white border-gray-200"
    : `from-red-50 to-white ${severityColor.split(" ").slice(1).join(" ")}`;

  return (
    <div className={`overflow-hidden rounded-2xl border-2 bg-gradient-to-r ${bgColor} shadow-sm`}>
      {/* Header row */}
      <div className="flex items-start gap-3 p-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
            isResolved
              ? "bg-gray-300 text-gray-600"
              : `bg-gradient-to-br ${severityColor} text-white shadow-md`
          }`}
        >
          {isResolved ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <AlertTriangle className="h-5 w-5" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-black uppercase tracking-wide text-gray-900">
              {alert.dangerSign || alert.symptom || "Danger sign"}
            </p>
            {alert.severity && !isResolved && (
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                  alert.severity === "critical"
                    ? "bg-red-600 text-white"
                    : alert.severity === "urgent"
                      ? "bg-orange-500 text-white"
                      : "bg-yellow-400 text-yellow-900"
                }`}
              >
                {alert.severity}
              </span>
            )}
          </div>

          <p className="mt-1 text-sm font-bold text-purple-700">
            {alert.motherName || "Unknown mother"}
          </p>
          <p className="flex items-center gap-1 text-xs text-gray-600">
            <Phone className="h-3 w-3" />
            {alert.motherPhone}
          </p>

          {alert.message && (
            <p className="mt-2 rounded-lg bg-white/70 px-2 py-1 text-xs italic text-gray-700">
              "{alert.message}"
            </p>
          )}

          <p className="mt-2 flex items-center gap-1 text-[11px] font-medium text-gray-500">
            <Clock className="h-3 w-3" />
            {formatRelative(alert.createdAt || alert.firedAt)}
            {isResolved && alert.resolvedAt && (
              <span className="ml-1 text-emerald-600 font-bold">· Resolved</span>
            )}
            {isAcked && <span className="ml-1 text-purple-600 font-bold">· Acknowledged</span>}
          </p>
        </div>
      </div>

      {/* Actions */}
      {!isResolved && (
        <div className="flex gap-2 border-t border-gray-100 bg-white/60 p-3">
          {isOpen && (
            <>
              <button
                onClick={() => onUpdate(alert.id, "acknowledged")}
                disabled={updating}
                className="flex-1 rounded-xl bg-purple-600 py-2 text-xs font-bold uppercase text-white shadow-sm transition active:scale-[0.98] disabled:opacity-50"
              >
                {updating ? "..." : "Acknowledge"}
              </button>
              <a
                href={`tel:${alert.motherPhone}`}
                className="flex items-center justify-center gap-1 rounded-xl border-2 border-purple-200 bg-white px-3 py-2 text-xs font-bold text-purple-700 transition active:scale-95"
              >
                <Phone className="h-3 w-3" />
                Call
              </a>
            </>
          )}
          {isAcked && (
            <button
              onClick={() => onUpdate(alert.id, "resolved")}
              disabled={updating}
              className="flex-1 rounded-xl bg-emerald-600 py-2 text-xs font-bold uppercase text-white shadow-sm transition active:scale-[0.98] disabled:opacity-50"
            >
              {updating ? "..." : "Mark as Resolved"}
            </button>
          )}
        </div>
      )}

      {/* Open mother profile link */}
      {alert.motherId && (
        <Link
          to="/mothers/$motherId"
          params={{ motherId: alert.motherId }}
          className="flex items-center justify-between border-t border-gray-100 bg-white/80 px-4 py-2 text-xs font-bold text-purple-700 transition hover:bg-purple-50"
        >
          View mother's profile
          <ChevronRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

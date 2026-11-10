import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Phone,
  ChevronRight,
  RefreshCw,
  ShieldAlert,
  BellRing,
} from "lucide-react";
import { toast } from "sonner";
import { api, type Alert } from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
    <AppShell
      title="Alerts"
      subtitle="Monitor and respond to danger signs"
      alertCount={counts.open}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {/* ── TOP BAR (Refresh) ── */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            {counts.open > 0
              ? `You have ${counts.open} open alert${counts.open > 1 ? "s" : ""} requiring attention.`
              : "No open alerts at the moment."}
          </p>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm ring-1 ring-border transition-all hover:bg-muted active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </button>
        </div>

        {/* ── FILTER TABS ── */}
        <div className="grid grid-cols-4 gap-2">
          {(["open", "acknowledged", "resolved", "all"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex flex-col items-center justify-center rounded-xl py-2.5 text-sm font-bold capitalize transition-all",
                filter === f
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card text-muted-foreground ring-1 ring-border hover:bg-muted",
              )}
            >
              <span>{f}</span>
              <span
                className={cn(
                  "mt-0.5 text-[10px] font-bold uppercase tracking-wider",
                  filter === f ? "text-primary-foreground/80" : "text-muted-foreground/70",
                )}
              >
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        {/* ── ALERTS LIST ── */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-2xl border border-border bg-muted/50"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-soft">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <p className="mt-4 text-lg font-bold text-foreground">
              {filter === "open" ? "All mothers are safe" : "No alerts found"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {filter === "open"
                ? "There are no unaddressed danger signs right now."
                : "Nothing to show in this category."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
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
  const isOpen =
    alert.status === "open" || alert.status === "sent" || alert.status === "logged_no_sms";
  const isAcked = alert.status === "acknowledged";
  const isResolved = alert.status === "resolved";

  // Determine styling based on severity
  const isCritical = alert.severity === "critical";
  const isUrgent = alert.severity === "urgent";

  let tone: "critical" | "warning" | "success" | "neutral" = "neutral";
  let HeaderIcon = BellRing;
  let bgClass = "bg-card";
  let borderClass = "border-border";
  let iconBgClass = "bg-muted";
  let iconTextClass = "text-muted-foreground";

  if (isResolved) {
    tone = "success";
    HeaderIcon = CheckCircle2;
    iconBgClass = "bg-success-soft";
    iconTextClass = "text-success";
  } else if (isCritical) {
    tone = "critical";
    HeaderIcon = ShieldAlert;
    bgClass = "bg-critical-soft";
    borderClass = "border-critical-line";
    iconBgClass = "bg-critical";
    iconTextClass = "text-critical-foreground";
  } else if (isUrgent) {
    tone = "warning";
    HeaderIcon = AlertTriangle;
    bgClass = "bg-warning-soft";
    borderClass = "border-warning-line";
    iconBgClass = "bg-warning";
    iconTextClass = "text-warning-foreground";
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border shadow-sm transition-all",
        bgClass,
        borderClass,
      )}
    >
      {/* Header Row */}
      <div className="flex items-start gap-4 p-5">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-sm",
            iconBgClass,
            iconTextClass,
          )}
        >
          <HeaderIcon className={cn("h-6 w-6", !isResolved && isCritical && "animate-pulse")} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3
              className={cn(
                "text-base font-bold uppercase tracking-wide",
                isCritical ? "text-critical" : isUrgent ? "text-warning" : "text-foreground",
              )}
            >
              {alert.dangerSign || alert.symptom || "Danger Sign"}
            </h3>
            {alert.severity && !isResolved && (
              <Badge tone={tone}>{alert.severity.toUpperCase()}</Badge>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <p className="font-semibold text-foreground">{alert.motherName || "Unknown mother"}</p>
            {alert.motherPhone && (
              <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                {alert.motherPhone}
              </span>
            )}
          </div>

          {alert.message && (
            <div className="mt-3 rounded-xl bg-card/60 p-3 ring-1 ring-border/50">
              <p className="text-sm italic text-foreground">"{alert.message}"</p>
            </div>
          )}

          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {formatRelative(alert.createdAt || alert.firedAt)}
            {isResolved && alert.resolvedAt && (
              <span className="ml-2 text-success">· Resolved</span>
            )}
            {isAcked && <span className="ml-2 text-primary">· Acknowledged</span>}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {!isResolved && (
        <div className="flex items-center gap-3 border-t border-border/50 bg-card/40 p-4">
          {isOpen && (
            <>
              <button
                onClick={() => onUpdate(alert.id, "acknowledged")}
                disabled={updating}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
              >
                {updating ? "Acknowledging..." : "Acknowledge"}
              </button>
              <a
                href={`tel:${alert.motherPhone}`}
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-bold text-foreground shadow-sm transition-all hover:bg-muted active:scale-95"
              >
                <Phone className="h-4 w-4" />
                Call
              </a>
            </>
          )}
          {isAcked && (
            <button
              onClick={() => onUpdate(alert.id, "resolved")}
              disabled={updating}
              className="w-full rounded-xl bg-success py-3 text-sm font-bold text-success-foreground shadow-sm transition-all hover:bg-success/90 active:scale-[0.98] disabled:opacity-50"
            >
              {updating ? "Resolving..." : "Mark as Resolved"}
            </button>
          )}
        </div>
      )}

      {/* View Mother Profile Link */}
      {alert.motherId && (
        <Link
          to="/mothers/$motherId"
          params={{ motherId: alert.motherId }}
          className="flex items-center justify-between border-t border-border bg-card px-5 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
        >
          View mother's profile
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Phone } from "lucide-react";
import { api, type Alert } from "@/lib/api";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Danger Sign Alerts — Mama na Mtoto+ CHV" },
      {
        name: "description",
        content:
          "Live feed of maternal danger sign alerts reported by mothers and CHVs at your facility.",
      },
      { property: "og:title", content: "Danger Sign Alerts — Mama na Mtoto+" },
      {
        property: "og:description",
        content: "Triage and resolve maternal danger sign alerts from your facility catchment.",
      },
    ],
  }),
  component: AlertsFeed;
});

const severityTone: Record<Alert["severity"], string> = {
  critical: "border-l-critical bg-critical/5",
  urgent: "border-l-warning",
  watch: "border-l-muted-foreground/40",
};

const FILTERS = ["open", "acknowledged", "resolved", "all"] as const;

function AlertsFeed() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("open");
  const { data, isLoading } = useQuery({ queryKey: ["alerts"], queryFn: api.alerts });

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Alert["status"] }) =>
      api.updateAlert(id, status),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["alerts"] });
      await qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Alert updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  const alerts = (data ?? []).filter((a) => filter === "all" || a.status === filter);

  return (
    <AppShell title="Danger sign alerts" back={{ to: "/" }}>
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-secondary p-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors ${
              filter === f ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading alerts…</p>}
      {!isLoading && alerts.length === 0 && (
        <p className="card-surface text-sm text-muted-foreground">No {filter} alerts right now.</p>
      )}

      <div className="space-y-3">
        {alerts.map((a) => (
          <div key={a.id} className={`card-surface border-l-4 ${severityTone[a.severity]}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-semibold text-foreground">
                  <AlertTriangle className="h-4 w-4 text-critical" />
                  {a.dangerSign}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{a.message}</p>
              </div>
              <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold capitalize text-secondary-foreground">
                {a.severity}
              </span>
            </div>

            <p className="mt-3 text-sm">
              <Link
                to="/mothers/$motherId"
                params={{ motherId: a.motherId }}
                className="font-semibold text-primary"
              >
                {a.motherName}
              </Link>
              <span className="text-muted-foreground">
                {" "}· {new Date(a.createdAt).toLocaleString()}
              </span>
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={`tel:${a.motherPhone}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-foreground"
              >
                <Phone className="h-4 w-4" /> Call
              </a>
              {a.status === "open" && (
                <button
                  onClick={() => update.mutate({ id: a.id, status: "acknowledged" })}
                  className="rounded-xl border border-border px-3 py-2 text-sm font-semibold text-foreground"
                >
                  Acknowledge
                </button>
              )}
              {a.status !== "resolved" && (
                <button
                  onClick={() => update.mutate({ id: a.id, status: "resolved" })}
                  className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                >
                  Mark resolved
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Plus,
  Loader2,
  Calendar,
  CalendarDays,
  ShieldAlert,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { Field, inputClass } from "@/components/Field";
import { analyseANCVisit } from "@/lib/clinicalFlags";
import { ClinicalFlagModal } from "@/components/ClinicalFlagModal";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mothers/$motherId/anc-visit")({
  component: ANCVisitPage,
});

function formatDate(d?: string | null): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function ANCVisitPage() {
  const { motherId } = useParams({ from: "/mothers/$motherId/anc-visit" });
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await api.visits(motherId);
      setVisits(data || []);
    } catch {
      toast.error("Failed to load visits");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [motherId]);

  return (
    <AppShell
      title="ANC Visits"
      subtitle="Antenatal care record"
      back={{ to: `/mothers/${motherId}` }}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-brand transition-all hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Plus className="h-5 w-5" /> Record New Visit
        </button>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : visits.length === 0 ? (
          <div className="card-surface flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Activity className="h-8 w-8" />
            </div>
            <p className="mt-4 text-lg font-bold text-foreground">No visits recorded</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tap the button above to record the first ANC visit.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {visits.map((v) => (
              <div key={v.id} className="card-surface overflow-hidden p-0">
                <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      Visit {v.visit_number}{" "}
                      <span className="text-sm font-medium text-muted-foreground">
                        · Week {v.gestation_weeks || v.scheduled_week || "—"}
                      </span>
                    </h3>
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {formatDate(v.visit_date)}
                    </div>
                  </div>
                  {v.attended && <Badge tone="success">Attended</Badge>}
                </div>

                <div className="grid grid-cols-2 gap-4 bg-muted/20 p-5 sm:grid-cols-4">
                  <Stat
                    label="BP"
                    value={v.bp_systolic ? `${v.bp_systolic}/${v.bp_diastolic}` : "—"}
                  />
                  <Stat label="Weight" value={v.weight ? `${v.weight} kg` : "—"} />
                  <Stat label="Fundal ht" value={v.fundal_height ? `${v.fundal_height} cm` : "—"} />
                  <Stat
                    label="FHR"
                    value={v.fetal_heart_rate ? `${v.fetal_heart_rate} bpm` : "—"}
                  />
                </div>

                {(v.next_appointment || v.notes) && (
                  <div className="space-y-3 p-5">
                    {v.next_appointment && (
                      <div className="flex items-center gap-2 rounded-xl bg-primary/5 p-3 text-sm font-semibold text-primary">
                        <CalendarDays className="h-4 w-4 shrink-0" />
                        Next visit scheduled: {formatDate(v.next_appointment)}
                      </div>
                    )}
                    {v.notes && (
                      <div className="flex items-start gap-2 rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4 shrink-0 mt-0.5" />
                        <p className="italic">"{v.notes}"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <VisitForm
          motherId={motherId}
          nextVisitNumber={
            visits.length > 0 ? Math.max(...visits.map((v: any) => v.visit_number || 0)) + 1 : 1
          }
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

function VisitForm({ motherId, nextVisitNumber, onClose, onSaved }: any) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    visitNumber: String(nextVisitNumber),
    visitDate: new Date().toISOString().slice(0, 10),
    bpSystolic: "",
    bpDiastolic: "",
    weight: "",
    fundalHeight: "",
    fetalHeartRate: "",
    urineProtein: "negative",
    urineGlucose: "negative",
    notes: "",
  });
  const [flags, setFlags] = useState<any[]>([]);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const lastCriticalHash = useRef<string>("");

  useEffect(() => {
    if (!form.bpSystolic && !form.fetalHeartRate && !form.urineProtein) {
      setFlags([]);
      return;
    }

    const timer = setTimeout(() => {
      const result = analyseANCVisit({
        bpSystolic: parseInt(form.bpSystolic) || 0,
        bpDiastolic: parseInt(form.bpDiastolic) || 0,
        weight: parseFloat(form.weight) || 0,
        fundalHeight: parseFloat(form.fundalHeight) || 0,
        fetalHeartRate: parseInt(form.fetalHeartRate) || 0,
        urineProtein: form.urineProtein || "negative",
        gestationalWeek: 28,
        age: 26,
        conditions: [],
      });
      setFlags(result);

      // 🚨 Show popup ONLY when a critical finding appears for the first time
      const criticals = result.filter((f) => f.severity === "critical");
      if (criticals.length > 0) {
        const hash = criticals
          .map((f) => f.condition)
          .sort()
          .join("|");
        if (hash !== lastCriticalHash.current) {
          lastCriticalHash.current = hash;
          setShowFlagModal(true);
        }
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [
    form.bpSystolic,
    form.bpDiastolic,
    form.fetalHeartRate,
    form.urineProtein,
    form.fundalHeight,
  ]);

  const set = (k: string) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const response: any = await api.createVisit(motherId, {
        visitNumber: parseInt(form.visitNumber),
        visitDate: form.visitDate,
        attended: true,
        bpSystolic: parseInt(form.bpSystolic) || null,
        bpDiastolic: parseInt(form.bpDiastolic) || null,
        weight: parseFloat(form.weight) || null,
        fundalHeight: parseFloat(form.fundalHeight) || null,
        fetalHeartRate: parseInt(form.fetalHeartRate) || null,
        urineProtein: form.urineProtein,
        urineGlucose: form.urineGlucose,
        notes: form.notes,
        recordedBy: "Nurse",
      } as any);

      const nextWeek = response?.nextAncWeek;
      const nextDate = response?.next_appointment;

      if (nextWeek && nextDate) {
        toast.success(
          `Visit saved · next visit at Week ${nextWeek} on ${new Date(nextDate).toLocaleDateString(
            "en-KE",
            { day: "numeric", month: "short" },
          )}`,
        );
      } else {
        toast.success("Visit saved successfully");
      }

      onSaved();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save visit. Check the values.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden rounded-2xl p-0">
        <DialogHeader className="border-b border-border p-5">
          <DialogTitle className="text-lg">Record ANC Visit</DialogTitle>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          <form id="anc-visit-form" onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Visit number">
                <input
                  className={inputClass()}
                  type="number"
                  value={form.visitNumber}
                  onChange={set("visitNumber")}
                />
              </Field>
              <Field label="Date">
                <input
                  className={inputClass()}
                  type="date"
                  value={form.visitDate}
                  onChange={set("visitDate")}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="BP Systolic">
                <input
                  className={inputClass()}
                  type="number"
                  value={form.bpSystolic}
                  onChange={set("bpSystolic")}
                  placeholder="120"
                />
              </Field>
              <Field label="BP Diastolic">
                <input
                  className={inputClass()}
                  type="number"
                  value={form.bpDiastolic}
                  onChange={set("bpDiastolic")}
                  placeholder="80"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Weight (kg)">
                <input
                  className={inputClass()}
                  type="number"
                  step="0.1"
                  value={form.weight}
                  onChange={set("weight")}
                />
              </Field>
              <Field label="Fundal height (cm)">
                <input
                  className={inputClass()}
                  type="number"
                  value={form.fundalHeight}
                  onChange={set("fundalHeight")}
                  placeholder="5-50"
                />
              </Field>
            </div>

            <Field label="Fetal heart rate (bpm)">
              <input
                className={inputClass()}
                type="number"
                value={form.fetalHeartRate}
                onChange={set("fetalHeartRate")}
                placeholder="140"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Urine protein">
                <select
                  className={inputClass()}
                  value={form.urineProtein}
                  onChange={set("urineProtein")}
                >
                  <option value="negative">Negative</option>
                  <option value="trace">Trace</option>
                  <option value="1+">1+</option>
                  <option value="2+">2+</option>
                  <option value="3+">3+</option>
                </select>
              </Field>
              <Field label="Urine glucose">
                <select
                  className={inputClass()}
                  value={form.urineGlucose}
                  onChange={set("urineGlucose")}
                >
                  <option value="negative">Negative</option>
                  <option value="trace">Trace</option>
                  <option value="1+">1+</option>
                  <option value="2+">2+</option>
                </select>
              </Field>
            </div>

            <Field label="Notes">
              <textarea
                className={inputClass()}
                rows={3}
                value={form.notes}
                onChange={set("notes")}
                placeholder="Any observations..."
              />
            </Field>

            {/* Inline Clinical Flags Warning */}
            {flags.length > 0 && (
              <div className="space-y-2">
                {flags.map((f, i) => {
                  const isCritical = f.severity === "critical";
                  return (
                    <div
                      key={i}
                      className={cn(
                        "rounded-xl border p-3",
                        isCritical
                          ? "border-critical-line bg-critical-soft"
                          : "border-warning-line bg-warning-soft",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {isCritical ? (
                          <ShieldAlert className="h-4 w-4 text-critical" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-warning" />
                        )}
                        <p
                          className={cn(
                            "text-xs font-bold uppercase tracking-wider",
                            isCritical ? "text-critical" : "text-warning",
                          )}
                        >
                          {f.condition}
                        </p>
                      </div>
                      <p className="mt-1 text-sm font-medium text-foreground">{f.finding}</p>
                      <div className="mt-2 rounded-lg bg-card/50 p-2 text-xs">
                        <span className="font-bold text-foreground">Action:</span>{" "}
                        <span className="text-muted-foreground">{f.action}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </form>
        </div>

        <div className="flex gap-3 border-t border-border bg-card p-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border bg-card py-3 text-sm font-bold text-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="anc-visit-form"
            disabled={busy}
            className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-brand transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {busy ? "Saving..." : "Save visit"}
          </button>
        </div>
      </DialogContent>

      <ClinicalFlagModal
        visible={showFlagModal}
        flags={flags.filter((f) => f.severity === "critical")}
        onDismiss={() => setShowFlagModal(false)}
      />
    </Dialog>
  );
}

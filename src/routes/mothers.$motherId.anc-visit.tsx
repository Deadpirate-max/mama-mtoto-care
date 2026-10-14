import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Activity, Plus, Loader2, X, Calendar } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { Field, inputClass } from "@/components/Field";
import { analyseANCVisit } from "@/lib/clinicalFlags";
import { ClinicalFlagModal } from "@/components/ClinicalFlagModal";

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
      <div className="space-y-4">
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 py-3.5 text-sm font-bold text-white shadow-md active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" /> Add new visit
        </button>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          </div>
        ) : visits.length === 0 ? (
          <div className="rounded-2xl border-2 border-purple-100 bg-white p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <Activity className="h-7 w-7" />
            </div>
            <p className="mt-3 text-sm font-bold text-gray-900">No visits recorded</p>
            <p className="text-xs text-gray-500">Tap the button above to add the first visit</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visits.map((v) => (
              <div
                key={v.id}
                className="rounded-2xl border-2 border-purple-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-black text-gray-900">
                      Visit {v.visit_number} · Week {v.gestation_weeks || v.scheduled_week || "—"}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <Calendar className="h-3 w-3" /> {formatDate(v.visit_date)}
                    </p>
                  </div>
                  {v.attended && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700">
                      Attended
                    </span>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
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
                {v.next_appointment && (
                  <p className="mt-3 rounded-lg bg-blue-50 p-2 text-xs font-bold text-blue-700">
                    🗓️ Next visit: {formatDate(v.next_appointment)}
                  </p>
                )}
                {v.notes && (
                  <p className="mt-3 rounded-lg bg-gray-50 p-2 text-xs italic text-gray-600">
                    {v.notes}
                  </p>
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
      <p className="text-[10px] font-bold uppercase text-gray-400">{label}</p>
      <p className="text-sm font-bold text-gray-900">{value}</p>
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
    }, 1200); // wait 1.2s after typing stops

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

      // 🗓️ Show next appointment in the toast
      const nextWeek = response?.nextAncWeek;
      const nextDate = response?.next_appointment;

      if (nextWeek && nextDate) {
        toast.success(
          `Visit saved · next visit at Week ${nextWeek} on ${new Date(nextDate).toLocaleDateString(
            "en-KE",
            { day: "numeric", month: "short" },
          )}`,
        );
      } else if (nextWeek) {
        toast.success(`Visit saved · next visit at Week ${nextWeek}`);
      } else {
        toast.success("Visit saved");
      }

      onSaved();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save visit. Check the values.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-gray-900">New ANC Visit</h2>
          <button onClick={onClose} className="rounded-full bg-gray-100 p-2">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
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

          <div className="grid grid-cols-2 gap-3">
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

          <div className="grid grid-cols-2 gap-3">
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

          <div className="grid grid-cols-2 gap-3">
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
          {flags.length > 0 && (
            <div className="space-y-2">
              {flags.map((f, i) => (
                <div
                  key={i}
                  className={`rounded-xl border-2 p-3 ${
                    f.severity === "critical"
                      ? "border-red-400 bg-red-50"
                      : "border-orange-300 bg-orange-50"
                  }`}
                >
                  <p
                    className={`text-xs font-black uppercase tracking-wide ${
                      f.severity === "critical" ? "text-red-700" : "text-orange-700"
                    }`}
                  >
                    {f.severity === "critical" ? "🚨 CRITICAL" : "⚠️ WARNING"} — {f.condition}
                  </p>
                  <p className="mt-1 text-xs font-medium text-gray-700">{f.finding}</p>
                  <p className="mt-2 text-xs font-bold text-gray-900">💊 Action: {f.action}</p>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border-2 border-gray-200 py-3 text-sm font-bold text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-1 rounded-xl bg-purple-600 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {busy ? "Saving..." : "Save visit"}
            </button>
          </div>
          <ClinicalFlagModal
            visible={showFlagModal}
            flags={flags.filter((f) => f.severity === "critical")}
            onDismiss={() => setShowFlagModal(false)}
          />
        </form>
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { api, flagVisit } from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { Field, inputClass } from "@/components/Field";

export const Route = createFileRoute("/mothers/$motherId/anc-visit")({
  head: () => ({
    meta: [
      { title: "Record ANC Visit — Mama na Mtoto+ CHV" },
      {
        name: "description",
        content:
          "Record blood pressure, weight, fundal height, fetal heart rate, urine tests and the next appointment date.",
      },
      { property: "og:title", content: "Record ANC Visit — Mama na Mtoto+" },
      {
        property: "og:description",
        content: "Capture antenatal clinic observations with automatic danger-sign flagging.",
      },
    ],
  }),
  component: AncVisitForm,
});

const URINE = ["negative", "trace", "+", "++", "+++"];

function AncVisitForm() {
  const { motherId } = useParams({ from: "/mothers/$motherId/anc-visit" });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    visitDate: new Date().toISOString().slice(0, 10),
    gestationWeeks: "",
    bpSystolic: "",
    bpDiastolic: "",
    weightKg: "",
    fundalHeightCm: "",
    fetalHeartRate: "",
    urineProtein: "negative",
    urineGlucose: "negative",
    notes: "",
    nextAppointment: "",
  });

  const set =
    (k: keyof typeof f) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setF((p) => ({ ...p, [k]: e.target.value }));

  const livePreview = flagVisit({
    bpSystolic: Number(f.bpSystolic),
    bpDiastolic: Number(f.bpDiastolic),
    fetalHeartRate: f.fetalHeartRate ? Number(f.fetalHeartRate) : null,
    urineProtein: f.urineProtein,
    urineGlucose: f.urineGlucose,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.bpSystolic || !f.bpDiastolic) return toast.error("Blood pressure is required");
    if (!f.weightKg) return toast.error("Weight is required");
    setBusy(true);
    try {
      await api.createVisit(motherId, {
        visitDate: f.visitDate,
        gestationWeeks: f.gestationWeeks ? Number(f.gestationWeeks) : null,
        bpSystolic: Number(f.bpSystolic),
        bpDiastolic: Number(f.bpDiastolic),
        weightKg: Number(f.weightKg),
        fundalHeightCm: f.fundalHeightCm ? Number(f.fundalHeightCm) : null,
        fetalHeartRate: f.fetalHeartRate ? Number(f.fetalHeartRate) : null,
        urineProtein: f.urineProtein,
        urineGlucose: f.urineGlucose,
        notes: f.notes.trim(),
        nextAppointment: f.nextAppointment || null,
      });
      await qc.invalidateQueries({ queryKey: ["visits", motherId] });
      await qc.invalidateQueries({ queryKey: ["mother", motherId] });
      toast.success("ANC visit recorded");
      navigate({ to: "/mothers/$motherId", params: { motherId } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save visit");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell
      title="Record ANC visit"
      back={{ to: "/mothers/$motherId", params: { motherId } }}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="card-surface space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Visit date">
              <input className={inputClass()} type="date" value={f.visitDate} onChange={set("visitDate")} />
            </Field>
            <Field label="Gestation (weeks)">
              <input className={inputClass()} type="number" inputMode="numeric" value={f.gestationWeeks} onChange={set("gestationWeeks")} />
            </Field>
          </div>

          <Field label="Blood pressure (mmHg)" hint="Systolic / diastolic">
            <div className="flex items-center gap-2">
              <input className={inputClass()} type="number" inputMode="numeric" placeholder="120" value={f.bpSystolic} onChange={set("bpSystolic")} />
              <span className="text-lg text-muted-foreground">/</span>
              <input className={inputClass()} type="number" inputMode="numeric" placeholder="80" value={f.bpDiastolic} onChange={set("bpDiastolic")} />
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Weight (kg)">
              <input className={inputClass()} type="number" step="0.1" inputMode="decimal" value={f.weightKg} onChange={set("weightKg")} />
            </Field>
            <Field label="Fundal height (cm)">
              <input className={inputClass()} type="number" step="0.5" inputMode="decimal" value={f.fundalHeightCm} onChange={set("fundalHeightCm")} />
            </Field>
          </div>

          <Field label="Fetal heart rate (bpm)" hint="Normal range 110–160 bpm">
            <input className={inputClass()} type="number" inputMode="numeric" value={f.fetalHeartRate} onChange={set("fetalHeartRate")} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Urine protein">
              <select className={inputClass()} value={f.urineProtein} onChange={set("urineProtein")}>
                {URINE.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </Field>
            <Field label="Urine glucose">
              <select className={inputClass()} value={f.urineGlucose} onChange={set("urineGlucose")}>
                {URINE.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Next appointment date">
            <input className={inputClass()} type="date" value={f.nextAppointment} onChange={set("nextAppointment")} />
          </Field>

          <Field label="Notes">
            <textarea className={inputClass("min-h-24")} value={f.notes} onChange={set("notes")} placeholder="Observations, counselling, referrals…" />
          </Field>
        </div>

        {livePreview.length > 0 && (
          <div className="rounded-2xl border border-critical/30 bg-critical/5 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-critical">
              <AlertTriangle className="h-4 w-4" /> Danger signs detected
            </p>
            <ul className="mt-2 list-inside list-disc text-sm text-critical">
              {livePreview.map((flag) => (
                <li key={flag}>{flag}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-primary py-3.5 text-base font-semibold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save ANC visit"}
        </button>
      </form>
    </AppShell>
  );
}

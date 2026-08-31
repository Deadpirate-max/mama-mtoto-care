import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { api, flagLab } from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { Field, inputClass } from "@/components/Field";

export const Route = createFileRoute("/mothers/$motherId/lab-results")({
  head: () => ({
    meta: [
      { title: "Enter Lab Results — Mama na Mtoto+ CHV" },
      {
        name: "description",
        content:
          "Record blood group, haemoglobin, HIV, urinalysis, blood sugar and syphilis results with automatic flagging of abnormal values.",
      },
      { property: "og:title", content: "Enter Lab Results — Mama na Mtoto+" },
      {
        property: "og:description",
        content: "Capture antenatal laboratory results with instant abnormal-value flagging.",
      },
    ],
  }),
  component: LabResultsForm,
});

const BLOOD_GROUPS = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function LabResultsForm() {
  const { motherId } = useParams({ from: "/mothers/$motherId/lab-results" });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    testDate: new Date().toISOString().slice(0, 10),
    bloodGroup: "",
    hb: "",
    hivStatus: "negative",
    urinalysis: "normal",
    bloodSugar: "",
    syphilis: "non-reactive",
  });

  const set =
    (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setF((p) => ({ ...p, [k]: e.target.value }));

  const flags = flagLab({
    hb: f.hb ? Number(f.hb) : null,
    hivStatus: f.hivStatus,
    bloodSugar: f.bloodSugar ? Number(f.bloodSugar) : null,
    syphilis: f.syphilis,
    urinalysis: f.urinalysis,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.createLab(motherId, {
        testDate: f.testDate,
        bloodGroup: f.bloodGroup,
        hb: f.hb ? Number(f.hb) : null,
        hivStatus: f.hivStatus,
        urinalysis: f.urinalysis,
        bloodSugar: f.bloodSugar ? Number(f.bloodSugar) : null,
        syphilis: f.syphilis,
      });
      await qc.invalidateQueries({ queryKey: ["labs", motherId] });
      toast.success(
        flags.length ? "Lab results saved — abnormal values flagged" : "Lab results saved",
      );
      navigate({ to: "/mothers/$motherId", params: { motherId } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save results");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="Enter lab results" back={{ to: "/mothers/$motherId", params: { motherId } }}>
      <form onSubmit={submit} className="space-y-4">
        <div className="card-surface space-y-4">
          <Field label="Test date">
            <input className={inputClass()} type="date" value={f.testDate} onChange={set("testDate")} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Blood group">
              <select className={inputClass()} value={f.bloodGroup} onChange={set("bloodGroup")}>
                {BLOOD_GROUPS.map((b) => (
                  <option key={b} value={b}>{b || "Select"}</option>
                ))}
              </select>
            </Field>
            <Field label="Haemoglobin (g/dL)" hint="Flagged below 11">
              <input className={inputClass()} type="number" step="0.1" inputMode="decimal" value={f.hb} onChange={set("hb")} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="HIV status">
              <select className={inputClass()} value={f.hivStatus} onChange={set("hivStatus")}>
                <option value="negative">Negative</option>
                <option value="positive">Positive</option>
                <option value="unknown">Not done</option>
              </select>
            </Field>
            <Field label="Syphilis (VDRL)">
              <select className={inputClass()} value={f.syphilis} onChange={set("syphilis")}>
                <option value="non-reactive">Non-reactive</option>
                <option value="reactive">Reactive</option>
                <option value="unknown">Not done</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Urine analysis">
              <select className={inputClass()} value={f.urinalysis} onChange={set("urinalysis")}>
                <option value="normal">Normal</option>
                <option value="protein present">Protein present</option>
                <option value="glucose present">Glucose present</option>
                <option value="leucocytes / infection">Leucocytes / infection</option>
                <option value="blood present">Blood present</option>
              </select>
            </Field>
            <Field label="Blood sugar (mmol/L)" hint="Flagged at 7.8 and above">
              <input className={inputClass()} type="number" step="0.1" inputMode="decimal" value={f.bloodSugar} onChange={set("bloodSugar")} />
            </Field>
          </div>
        </div>

        {flags.length > 0 && (
          <div className="rounded-2xl border border-critical/30 bg-critical/5 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-critical">
              <AlertTriangle className="h-4 w-4" /> Abnormal results flagged
            </p>
            <ul className="mt-2 list-inside list-disc text-sm text-critical">
              {flags.map((flag) => (
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
          {busy ? "Saving…" : "Save lab results"}
        </button>
      </form>
    </AppShell>
  );
}

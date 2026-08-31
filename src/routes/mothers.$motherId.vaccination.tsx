import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { api, getStoredUser } from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { Field, inputClass } from "@/components/Field";

export const Route = createFileRoute("/mothers/$motherId/vaccination")({
  head: () => ({
    meta: [
      { title: "Mark Vaccination Given — Mama na Mtoto+ CHV" },
      {
        name: "description",
        content:
          "Record a vaccine dose given to a mother or newborn, including batch number and next due date.",
      },
      { property: "og:title", content: "Mark Vaccination Given — Mama na Mtoto+" },
      {
        property: "og:description",
        content: "Log maternal and newborn immunisations at the point of care.",
      },
    ],
  }),
  component: VaccinationForm,
});

const VACCINES = [
  "Tetanus-Diphtheria (TD)",
  "BCG (newborn)",
  "Polio (OPV 0)",
  "Hepatitis B",
  "Influenza",
  "COVID-19",
];

function VaccinationForm() {
  const { motherId } = useParams({ from: "/mothers/$motherId/vaccination" });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    vaccine: VACCINES[0],
    dose: "TD1",
    givenDate: new Date().toISOString().slice(0, 10),
    batchNumber: "",
    nextDueDate: "",
  });

  const set =
    (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setF((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.dose.trim()) return toast.error("Enter the dose");
    setBusy(true);
    try {
      await api.createVaccination(motherId, {
        vaccine: f.vaccine,
        dose: f.dose.trim(),
        givenDate: f.givenDate,
        batchNumber: f.batchNumber.trim(),
        administeredBy: getStoredUser()?.name ?? "Facility nurse",
        nextDueDate: f.nextDueDate || null,
      });
      await qc.invalidateQueries({ queryKey: ["vaccinations", motherId] });
      toast.success("Vaccination recorded");
      navigate({ to: "/mothers/$motherId", params: { motherId } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save vaccination");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="Mark vaccination given" back={{ to: "/mothers/$motherId", params: { motherId } }}>
      <form onSubmit={submit} className="space-y-4">
        <div className="card-surface space-y-4">
          <Field label="Vaccine">
            <select className={inputClass()} value={f.vaccine} onChange={set("vaccine")}>
              {VACCINES.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Dose">
              <input className={inputClass()} value={f.dose} onChange={set("dose")} placeholder="TD2" />
            </Field>
            <Field label="Date given">
              <input className={inputClass()} type="date" value={f.givenDate} onChange={set("givenDate")} />
            </Field>
          </div>
          <Field label="Batch number">
            <input className={inputClass()} value={f.batchNumber} onChange={set("batchNumber")} placeholder="TD-2291" />
          </Field>
          <Field label="Next dose due">
            <input className={inputClass()} type="date" value={f.nextDueDate} onChange={set("nextDueDate")} />
          </Field>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-primary py-3.5 text-base font-semibold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Saving…" : "Mark as given"}
        </button>
      </form>
    </AppShell>
  );
}

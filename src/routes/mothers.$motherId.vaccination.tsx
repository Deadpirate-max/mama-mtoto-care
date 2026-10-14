import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Syringe, Plus, Loader2, X, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { Field, inputClass } from "@/components/Field";

export const Route = createFileRoute("/mothers/$motherId/vaccination")({
  component: VaccinationPage,
});

const COMMON_VACCINES = [
  "Tetanus Toxoid (TT1)",
  "Tetanus Toxoid (TT2)",
  "Tetanus Toxoid (TT3)",
  "Tetanus Toxoid (TT4)",
  "Tetanus Toxoid (TT5)",
  "Influenza",
  "COVID-19",
  "Hepatitis B",
];

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

function VaccinationPage() {
  const { motherId } = useParams({ from: "/mothers/$motherId/vaccination" });
  const [vax, setVax] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await api.vaccinations(motherId);
      setVax(data || []);
    } catch {
      toast.error("Failed to load vaccinations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [motherId]);

  const givenCount = vax.filter((v) => v.given).length;

  return (
    <AppShell
      title="Vaccinations"
      subtitle={`${givenCount}/${vax.length} given`}
      back={{ to: `/mothers/${motherId}` }}
    >
      <div className="space-y-4">
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 py-3.5 text-sm font-bold text-white shadow-md active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" /> Record vaccination
        </button>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : vax.length === 0 ? (
          <div className="rounded-2xl border-2 border-blue-100 bg-white p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Syringe className="h-7 w-7" />
            </div>
            <p className="mt-3 text-sm font-bold text-gray-900">No vaccinations yet</p>
            <p className="text-xs text-gray-500">Record the first one to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {vax.map((v) => {
              const isDone = v.given;
              return (
                <div
                  key={v.id}
                  className={`rounded-2xl border-2 bg-white p-4 shadow-sm ${
                    isDone ? "border-blue-200" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        isDone ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Clock className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-900">{v.name}</p>
                      {v.target_week_or_age && (
                        <p className="text-[11px] text-gray-500">Target: {v.target_week_or_age}</p>
                      )}
                      <p className="mt-1 text-xs font-semibold text-blue-700">
                        {isDone ? `Given: ${formatDate(v.given_date)}` : "Not yet given"}
                      </p>
                      {v.batch_number && (
                        <p className="text-[11px] text-gray-500">Batch: {v.batch_number}</p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                        isDone ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {isDone ? "Done" : "Pending"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <VaxForm
          motherId={motherId}
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

function VaxForm({ motherId, onClose, onSaved }: any) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: COMMON_VACCINES[0],
    customName: "",
    givenDate: new Date().toISOString().slice(0, 10),
    batchNumber: "",
  });

  const set = (k: string) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const finalName = form.name === "Custom" ? form.customName : form.name;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!finalName) {
      toast.error("Select a vaccine");
      return;
    }
    setBusy(true);
    try {
      await api.createVaccination(motherId, {
        name: finalName,
        givenDate: form.givenDate,
        given: true,
        batchNumber: form.batchNumber,
        givenBy: "Nurse",
      } as any);
      toast.success("Vaccination recorded");
      onSaved();
    } catch {
      toast.error("Failed to save");
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
          <h2 className="text-lg font-black text-gray-900">Record Vaccination</h2>
          <button onClick={onClose} className="rounded-full bg-gray-100 p-2">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Field label="Vaccine">
            <select className={inputClass()} value={form.name} onChange={set("name")}>
              {COMMON_VACCINES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
              <option value="Custom">Other (specify)</option>
            </select>
          </Field>

          {form.name === "Custom" && (
            <Field label="Custom vaccine name">
              <input
                className={inputClass()}
                value={form.customName}
                onChange={set("customName")}
              />
            </Field>
          )}

          <Field label="Date given">
            <input
              className={inputClass()}
              type="date"
              value={form.givenDate}
              onChange={set("givenDate")}
            />
          </Field>

          <Field label="Batch number (optional)">
            <input
              className={inputClass()}
              value={form.batchNumber}
              onChange={set("batchNumber")}
            />
          </Field>

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
              className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {busy ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

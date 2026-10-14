import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TestTube, Plus, Loader2, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { Field, inputClass } from "@/components/Field";

export const Route = createFileRoute("/mothers/$motherId/lab-results")({
  component: LabResultsPage,
});

const COMMON_LABS = [
  "Haemoglobin (Hb)",
  "Blood Group & Rhesus",
  "HIV Test",
  "Urine Analysis",
  "Blood Sugar (RBS)",
  "Syphilis (VDRL)",
  "Malaria Test",
];

function LabResultsPage() {
  const { motherId } = useParams({ from: "/mothers/$motherId/lab-results" });
  const [labs, setLabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await api.labs(motherId);
      setLabs(data || []);
    } catch {
      toast.error("Failed to load labs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [motherId]);

  const completed = labs.filter((l) => l.status === "complete").length;

  return (
    <AppShell
      title="Lab Results"
      subtitle={`${completed}/${labs.length} complete`}
      back={{ to: `/mothers/${motherId}` }}
    >
      <div className="space-y-4">
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 py-3.5 text-sm font-bold text-white shadow-md active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" /> Add lab result
        </button>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : labs.length === 0 ? (
          <div className="rounded-2xl border-2 border-emerald-100 bg-white p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <TestTube className="h-7 w-7" />
            </div>
            <p className="mt-3 text-sm font-bold text-gray-900">No labs recorded</p>
            <p className="text-xs text-gray-500">Add the first lab result to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {labs.map((lab) => {
              const isDone = lab.status === "complete";
              const isAbnormal = lab.status === "abnormal";
              return (
                <div
                  key={lab.id}
                  className={`rounded-2xl border-2 bg-white p-4 shadow-sm ${
                    isAbnormal
                      ? "border-orange-200"
                      : isDone
                        ? "border-emerald-200"
                        : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        isDone
                          ? "bg-emerald-100 text-emerald-600"
                          : isAbnormal
                            ? "bg-orange-100 text-orange-600"
                            : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <AlertTriangle className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-900">{lab.name}</p>
                      <p className="text-lg font-black text-emerald-700">
                        {lab.value || "Pending"}{" "}
                        {lab.unit && <span className="text-xs text-gray-500">{lab.unit}</span>}
                      </p>
                      {lab.normal_range && (
                        <p className="text-[11px] text-gray-500">Normal: {lab.normal_range}</p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                        isDone
                          ? "bg-emerald-100 text-emerald-700"
                          : isAbnormal
                            ? "bg-orange-100 text-orange-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {lab.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <LabForm
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

function LabForm({ motherId, onClose, onSaved }: any) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: COMMON_LABS[0],
    customName: "",
    value: "",
    unit: "",
    normalRange: "",
    status: "complete",
  });

  const set = (k: string) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const finalName = form.name === "Custom" ? form.customName : form.name;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!finalName || !form.value) {
      toast.error("Enter a test name and value");
      return;
    }
    setBusy(true);
    try {
      await api.createLab(motherId, {
        name: finalName,
        value: form.value,
        unit: form.unit,
        normalRange: form.normalRange,
        status: form.status,
        testDate: new Date().toISOString(),
        recordedBy: "Nurse",
      } as any);
      toast.success("Lab result saved");
      onSaved();
    } catch {
      toast.error("Failed to save lab");
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
          <h2 className="text-lg font-black text-gray-900">Add Lab Result</h2>
          <button onClick={onClose} className="rounded-full bg-gray-100 p-2">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Field label="Test">
            <select className={inputClass()} value={form.name} onChange={set("name")}>
              {COMMON_LABS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
              <option value="Custom">Other (specify)</option>
            </select>
          </Field>

          {form.name === "Custom" && (
            <Field label="Custom test name">
              <input
                className={inputClass()}
                value={form.customName}
                onChange={set("customName")}
                placeholder="e.g. Hepatitis B"
              />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Value">
              <input
                className={inputClass()}
                value={form.value}
                onChange={set("value")}
                placeholder="e.g. 11.5"
              />
            </Field>
            <Field label="Unit">
              <input
                className={inputClass()}
                value={form.unit}
                onChange={set("unit")}
                placeholder="e.g. g/dL"
              />
            </Field>
          </div>

          <Field label="Normal range">
            <input
              className={inputClass()}
              value={form.normalRange}
              onChange={set("normalRange")}
              placeholder="e.g. 11.0-14.0"
            />
          </Field>

          <Field label="Status">
            <select className={inputClass()} value={form.status} onChange={set("status")}>
              <option value="complete">Complete</option>
              <option value="pending">Pending</option>
              <option value="abnormal">Abnormal</option>
            </select>
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
              className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {busy ? "Saving..." : "Save result"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

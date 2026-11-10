import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TestTube, Plus, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { Field, inputClass } from "@/components/Field";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

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
      <div className="mx-auto max-w-3xl space-y-6">
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-brand transition-all hover:bg-primary/90"
        >
          <Plus className="h-5 w-5" /> Add Lab Result
        </button>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : labs.length === 0 ? (
          <div className="card-surface flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <TestTube className="h-8 w-8" />
            </div>
            <p className="mt-4 text-lg font-bold text-foreground">No labs recorded</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add the first lab result to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {labs.map((lab) => {
              const isAbnormal = lab.status === "abnormal";
              const isDone = lab.status === "complete";

              let Icon = TestTube;
              let iconClass = "bg-muted text-muted-foreground";
              let badgeTone: "success" | "warning" | "neutral" = "neutral";

              if (isAbnormal) {
                Icon = AlertTriangle;
                iconClass = "bg-warning-soft text-warning";
                badgeTone = "warning";
              } else if (isDone) {
                Icon = CheckCircle2;
                iconClass = "bg-success-soft text-success";
                badgeTone = "success";
              }

              return (
                <div key={lab.id} className="card-surface flex items-start gap-4 p-4">
                  <div
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
                      iconClass,
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold text-foreground">{lab.name}</p>
                      <Badge tone={badgeTone}>{lab.status}</Badge>
                    </div>
                    <p className="mt-1 text-lg font-black text-foreground">
                      {lab.value || "Pending"}{" "}
                      {lab.unit && (
                        <span className="text-sm font-medium text-muted-foreground">
                          {lab.unit}
                        </span>
                      )}
                    </p>
                    {lab.normal_range && (
                      <p className="text-xs text-muted-foreground">
                        Normal range: {lab.normal_range}
                      </p>
                    )}
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
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md gap-0 overflow-hidden rounded-2xl p-0">
        <DialogHeader className="border-b border-border p-5">
          <DialogTitle className="text-lg">Add Lab Result</DialogTitle>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          <form id="lab-form" onSubmit={submit} className="space-y-4">
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

            <div className="grid grid-cols-2 gap-4">
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
          </form>
        </div>

        <div className="flex gap-3 border-t border-border bg-card p-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border bg-card py-3 text-sm font-bold text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="lab-form"
            disabled={busy}
            className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-brand hover:bg-primary/90 disabled:opacity-60"
          >
            {busy ? "Saving..." : "Save Result"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Syringe, Plus, Loader2, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { Field, inputClass } from "@/components/Field";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mothers/$motherId/vaccination")({
  component: VaccinationPage,
});

const COMMON_VACCINES = [
  "BCG",
  "OPV 0",
  "Penta 1",
  "OPV 1",
  "PCV 1",
  "Rota 1",
  "Penta 2",
  "Penta 3",
  "Measles",
];

// 👇 1. The 9 default vaccines
const DEFAULT_VACCINES = [
  {
    id: "bcg",
    name: "BCG",
    target_week_or_age: "At birth",
    given: false,
    given_date: null,
    batch_number: null,
  },
  {
    id: "opv0",
    name: "OPV 0",
    target_week_or_age: "At birth",
    given: false,
    given_date: null,
    batch_number: null,
  },
  {
    id: "penta1",
    name: "Penta 1",
    target_week_or_age: "6 weeks",
    given: false,
    given_date: null,
    batch_number: null,
  },
  {
    id: "opv1",
    name: "OPV 1",
    target_week_or_age: "6 weeks",
    given: false,
    given_date: null,
    batch_number: null,
  },
  {
    id: "pcv1",
    name: "PCV 1",
    target_week_or_age: "6 weeks",
    given: false,
    given_date: null,
    batch_number: null,
  },
  {
    id: "rota1",
    name: "Rota 1",
    target_week_or_age: "6 weeks",
    given: false,
    given_date: null,
    batch_number: null,
  },
  {
    id: "penta2",
    name: "Penta 2",
    target_week_or_age: "10 weeks",
    given: false,
    given_date: null,
    batch_number: null,
  },
  {
    id: "penta3",
    name: "Penta 3",
    target_week_or_age: "14 weeks",
    given: false,
    given_date: null,
    batch_number: null,
  },
  {
    id: "measles1",
    name: "Measles",
    target_week_or_age: "9 months",
    given: false,
    given_date: null,
    batch_number: null,
  },
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

  // 👇 2. Merge the server data with the 9 defaults
  const mergedVaccines = DEFAULT_VACCINES.map((def) => {
    const serverVax = vax.find((v: any) => v.name === def.name || v.id === def.id);
    return serverVax ? { ...def, ...serverVax, given: true } : def;
  });

  // 👇 3. Count based on the merged array
  const givenCount = mergedVaccines.filter((v) => v.given).length;

  return (
    <AppShell
      title="Vaccinations"
      subtitle={`${givenCount}/${mergedVaccines.length} given`} // Shows 1/9 instead of 1/1
      back={{ to: `/mothers/${motherId}` }}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-brand transition-all hover:bg-primary/90"
        >
          <Plus className="h-5 w-5" /> Record Vaccination
        </button>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* 👇 4. Map through the merged array */}
            {mergedVaccines.map((v) => {
              const isDone = v.given;
              return (
                <div key={v.id} className="card-surface flex items-start gap-4 p-4">
                  <div
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
                      isDone ? "bg-success-soft text-success" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {isDone ? <CheckCircle2 className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold text-foreground">{v.name}</p>
                      <Badge tone={isDone ? "success" : "neutral"}>
                        {isDone ? "Done" : "Pending"}
                      </Badge>
                    </div>

                    {v.target_week_or_age && (
                      <p className="mt-1 text-xs font-medium text-muted-foreground">
                        Target: {v.target_week_or_age}
                      </p>
                    )}
                    <p
                      className={cn(
                        "mt-1 text-sm font-semibold",
                        isDone ? "text-success" : "text-muted-foreground",
                      )}
                    >
                      {isDone ? `Given: ${formatDate(v.given_date)}` : "Not yet given"}
                    </p>
                    {v.batch_number && (
                      <p className="text-xs text-muted-foreground">Batch: {v.batch_number}</p>
                    )}
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
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md gap-0 overflow-hidden rounded-2xl p-0">
        <DialogHeader className="border-b border-border p-5">
          <DialogTitle className="text-lg">Record Vaccination</DialogTitle>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          <form id="vax-form" onSubmit={submit} className="space-y-4">
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
            form="vax-form"
            disabled={busy}
            className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-brand hover:bg-primary/90 disabled:opacity-60"
          >
            {busy ? "Saving..." : "Save Vaccination"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

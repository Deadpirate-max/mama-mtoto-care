import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, CalendarClock, FlaskConical, Phone, Stethoscope, Syringe } from "lucide-react";
import { api } from "@/lib/api";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/mothers/$motherId/")({
  head: () => ({
    meta: [
      { title: "Mother Profile — Mama na Mtoto+ CHV" },
      {
        name: "description",
        content:
          "Full maternal record: overview, ANC visits, lab results and vaccinations for an enrolled mother.",
      },
      { property: "og:title", content: "Mother Profile — Mama na Mtoto+" },
      {
        property: "og:description",
        content: "Review ANC visits, lab results and vaccination history in one place.",
      },
    ],
  }),
  component: MotherProfile,
});

const TABS = ["Overview", "ANC Visits", "Lab Results", "Vaccinations"] as const;
type Tab = (typeof TABS)[number];

function Flags({ flags }: { flags: string[] }) {
  if (!flags.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {flags.map((f) => (
        <span
          key={f}
          className="inline-flex items-center gap-1 rounded-full bg-critical/10 px-2 py-0.5 text-[11px] font-semibold text-critical"
        >
          <AlertTriangle className="h-3 w-3" /> {f}
        </span>
      ))}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium text-foreground">{value ?? "—"}</span>
    </div>
  );
}

function MotherProfile() {
  const { motherId } = useParams({ from: "/mothers/$motherId/" });
  const [tab, setTab] = useState<Tab>("Overview");

  const mother = useQuery({ queryKey: ["mother", motherId], queryFn: () => api.mother(motherId) });
  const visits = useQuery({ queryKey: ["visits", motherId], queryFn: () => api.visits(motherId) });
  const labs = useQuery({ queryKey: ["labs", motherId], queryFn: () => api.labs(motherId) });
  const vaccines = useQuery({
    queryKey: ["vaccinations", motherId],
    queryFn: () => api.vaccinations(motherId),
  });

  const m = mother.data;

  return (
    <AppShell
      title={m?.name ?? "Mother profile"}
      subtitle={m ? `${m.phone} · Code ${m.registrationCode}` : "Loading…"}
      back={{ to: "/mothers/search" }}
    >
      {m && (
        <div className="mb-4 grid grid-cols-3 gap-2">
          <Link
            to="/mothers/$motherId/anc-visit"
            params={{ motherId }}
            className="flex flex-col items-center gap-1 rounded-2xl bg-gradient-brand p-3 text-center text-[11px] font-semibold text-primary-foreground"
          >
            <Stethoscope className="h-5 w-5" /> ANC visit
          </Link>
          <Link
            to="/mothers/$motherId/lab-results"
            params={{ motherId }}
            className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card p-3 text-center text-[11px] font-semibold text-foreground"
          >
            <FlaskConical className="h-5 w-5 text-primary" /> Lab results
          </Link>
          <Link
            to="/mothers/$motherId/vaccination"
            params={{ motherId }}
            className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card p-3 text-center text-[11px] font-semibold text-foreground"
          >
            <Syringe className="h-5 w-5 text-primary" /> Vaccination
          </Link>
        </div>
      )}

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-secondary p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-card text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="card-surface">
          {!m ? (
            <p className="text-sm text-muted-foreground">Loading profile…</p>
          ) : (
            <>
              <Row label="Age" value={`${m.age} years`} />
              <Row label="Village" value={m.village} />
              <Row label="National ID" value={m.nationalId || "—"} />
              <Row label="LMP" value={m.lmp} />
              <Row label="EDD" value={m.edd} />
              <Row label="Gravida / Parity" value={`${m.gravida} / ${m.parity}`} />
              <Row
                label="Risk level"
                value={<span className="capitalize">{m.riskLevel}</span>}
              />
              <Row
                label="Next appointment"
                value={
                  m.nextAppointment ? (
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5" /> {m.nextAppointment}
                    </span>
                  ) : (
                    "Not scheduled"
                  )
                }
              />
              <a
                href={`tel:${m.phone}`}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 font-semibold text-foreground"
              >
                <Phone className="h-4 w-4" /> Call mother
              </a>
            </>
          )}
        </div>
      )}

      {tab === "ANC Visits" && (
        <div className="space-y-3">
          {visits.data?.length === 0 && (
            <p className="card-surface text-sm text-muted-foreground">No ANC visits recorded yet.</p>
          )}
          {visits.data?.map((v) => (
            <div key={v.id} className="card-surface">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground">{v.visitDate}</p>
                {v.gestationWeeks ? (
                  <span className="text-xs text-muted-foreground">{v.gestationWeeks} weeks</span>
                ) : null}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-x-4 text-sm text-muted-foreground">
                <p>BP: <span className="font-medium text-foreground">{v.bpSystolic}/{v.bpDiastolic}</span></p>
                <p>Weight: <span className="font-medium text-foreground">{v.weightKg} kg</span></p>
                <p>Fundal: <span className="font-medium text-foreground">{v.fundalHeightCm ?? "—"} cm</span></p>
                <p>FHR: <span className="font-medium text-foreground">{v.fetalHeartRate ?? "—"} bpm</span></p>
                <p>Urine protein: <span className="font-medium text-foreground">{v.urineProtein}</span></p>
                <p>Urine glucose: <span className="font-medium text-foreground">{v.urineGlucose}</span></p>
              </div>
              {v.notes && <p className="mt-2 text-sm text-muted-foreground">{v.notes}</p>}
              <Flags flags={v.flags} />
            </div>
          ))}
        </div>
      )}

      {tab === "Lab Results" && (
        <div className="space-y-3">
          {labs.data?.length === 0 && (
            <p className="card-surface text-sm text-muted-foreground">No lab results recorded yet.</p>
          )}
          {labs.data?.map((l) => (
            <div key={l.id} className="card-surface">
              <p className="font-semibold text-foreground">{l.testDate}</p>
              <div className="mt-2 grid grid-cols-2 gap-x-4 text-sm text-muted-foreground">
                <p>Blood group: <span className="font-medium text-foreground">{l.bloodGroup ?? "—"}</span></p>
                <p>Hb: <span className="font-medium text-foreground">{l.hb ?? "—"} g/dL</span></p>
                <p>HIV: <span className="font-medium text-foreground">{l.hivStatus ?? "—"}</span></p>
                <p>Syphilis: <span className="font-medium text-foreground">{l.syphilis ?? "—"}</span></p>
                <p>Blood sugar: <span className="font-medium text-foreground">{l.bloodSugar ?? "—"} mmol/L</span></p>
                <p>Urinalysis: <span className="font-medium text-foreground">{l.urinalysis ?? "—"}</span></p>
              </div>
              <Flags flags={l.flags} />
            </div>
          ))}
        </div>
      )}

      {tab === "Vaccinations" && (
        <div className="space-y-3">
          {vaccines.data?.length === 0 && (
            <p className="card-surface text-sm text-muted-foreground">No vaccinations recorded yet.</p>
          )}
          {vaccines.data?.map((v) => (
            <div key={v.id} className="card-surface">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground">{v.vaccine}</p>
                <span className="rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
                  {v.dose}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Given {v.givenDate}
                {v.batchNumber ? ` · Batch ${v.batchNumber}` : ""}
                {v.nextDueDate ? ` · Next due ${v.nextDueDate}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

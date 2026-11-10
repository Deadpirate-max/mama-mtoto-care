import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Phone,
  MapPin,
  User,
  Heart,
  Activity,
  Syringe,
  AlertTriangle,
  ChevronRight,
  Loader2,
  FileText,
  TestTube,
  CalendarDays,
  ShieldAlert,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mothers/$motherId/")({
  component: MotherProfile,
});

type MotherFull = {
  id: string;
  name: string;
  phone: string;
  age?: number;
  idNumber?: string;
  county?: string;
  village?: string;
  profilePhoto?: string | null;
  weeksPregnantAtRegistration?: number;
  registrationDate?: string;
  edd?: string;
  lmp?: string;
  gravida?: string;
  para?: string;
  bloodGroup?: string;
  conditions?: string[];
  nurseName?: string;
  nursePhone?: string;
  facilityName?: string;
  facilityCode?: string;
  partnerName?: string;
  partnerAge?: number;
  partnerPhone?: string;
  ancVisits?: any[];
  labResults?: any[];
  vaccinations?: any[];
  symptomLogs?: any[];
  alerts?: any[];
  createdAt?: string;
};

function formatDate(date?: string | null): string {
  if (!date) return "—";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function MotherProfile() {
  const { motherId } = useParams({ from: "/mothers/$motherId/" });
  const [mother, setMother] = useState<MotherFull | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await api.mother(motherId);
        if (mounted) setMother(data as any);
      } catch (err) {
        toast.error("Could not load mother profile");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [motherId]);

  if (loading) {
    return (
      <AppShell title="Loading…" back={{ to: "/mothers/search" }}>
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (!mother) {
    return (
      <AppShell title="Not found" back={{ to: "/mothers/search" }}>
        <div className="card-surface flex flex-col items-center justify-center p-8 text-center">
          <User className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="font-semibold text-foreground">This mother could not be found.</p>
          <Link
            to="/mothers/search"
            className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Back to search
          </Link>
        </div>
      </AppShell>
    );
  }

  const initials = (mother.name || "?")
    .split(" ")
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const visitsCount = mother.ancVisits?.filter((v: any) => v.attended).length ?? 0;
  const labsCount = mother.labResults?.filter((l: any) => l.status === "complete").length ?? 0;
  const vaxCount = mother.vaccinations?.filter((v: any) => v.given).length ?? 0;

  const openAlerts =
    mother.alerts?.filter((a: any) => a.status === "open" || a.status === "sent").length ?? 0;

  return (
    <AppShell title="Mother Profile" back={{ to: "/mothers/search" }}>
      <div className="mx-auto max-w-3xl space-y-6 pb-12">
        {/* ── HERO CARD ── */}
        <div className="card-surface overflow-hidden">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
            {/* Avatar */}
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-baby-soft text-2xl font-black text-baby shadow-sm ring-4 ring-white">
              {initials}
            </div>

            {/* Identity Info */}
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h2 className="truncate text-2xl font-bold tracking-tight text-foreground">
                {mother.name}
              </h2>

              <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm sm:justify-start">
                <a
                  href={`tel:${mother.phone}`}
                  className="flex items-center gap-1.5 font-medium text-primary hover:underline"
                >
                  <Phone className="h-4 w-4" />
                  {mother.phone}
                </a>
                {mother.county && mother.county !== "N/A" && (
                  <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {mother.village ? `${mother.village}, ` : ""}
                    {mother.county}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Clinical Snapshot Row */}
          <div className="mt-6 grid grid-cols-3 gap-3 rounded-xl bg-muted/50 p-4">
            <div className="text-center sm:text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                EDD
              </p>
              <p className="mt-0.5 text-sm font-bold text-foreground">{formatDate(mother.edd)}</p>
            </div>
            <div className="border-x border-border text-center sm:text-left sm:pl-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Gravida
              </p>
              <p className="mt-0.5 text-sm font-bold text-foreground">{mother.gravida || "—"}</p>
            </div>
            <div className="text-center sm:text-left sm:pl-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Para
              </p>
              <p className="mt-0.5 text-sm font-bold text-foreground">{mother.para || "—"}</p>
            </div>
          </div>
        </div>

        {/* ── CRITICAL ALERTS ── */}
        {openAlerts > 0 && (
          <Link
            to="/alerts"
            className="flex items-center gap-4 rounded-2xl border border-critical-line bg-critical-soft p-4 transition-colors hover:bg-critical/10"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-critical text-critical-foreground shadow-sm animate-pulse">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold text-critical">
                {openAlerts} Active Alert{openAlerts > 1 ? "s" : ""}
              </p>
              <p className="truncate text-sm font-medium text-critical/80">
                This mother has unresolved danger signs. Tap to review.
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-critical" />
          </Link>
        )}

        {/* ── QUICK STATS & ACTIONS ── */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <StatBox
              icon={Heart}
              label="Visits"
              value={visitsCount}
              color="text-primary"
              bg="bg-primary/10"
            />
            <StatBox
              icon={TestTube}
              label="Labs"
              value={labsCount}
              color="text-success"
              bg="bg-success-soft"
            />
            <StatBox
              icon={Syringe}
              label="Vax"
              value={vaxCount}
              color="text-warning"
              bg="bg-warning-soft"
            />
          </div>

          {/* Actions */}
          <div className="grid grid-cols-3 gap-2">
            <ActionButton
              to="/mothers/$motherId/anc-visit"
              params={{ motherId }}
              icon={Plus}
              label="Visit"
            />
            <ActionButton
              to="/mothers/$motherId/lab-results"
              params={{ motherId }}
              icon={TestTube}
              label="Lab"
            />
            <ActionButton
              to="/mothers/$motherId/vaccination"
              params={{ motherId }}
              icon={Syringe}
              label="Vax"
            />
          </div>
        </div>

        {/* ── DETAILS SECTIONS ── */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Personal */}
          <Section title="Personal Info" icon={User}>
            <Row label="Age" value={mother.age ? `${mother.age} yrs` : "—"} />
            <Row label="National ID" value={mother.idNumber || "—"} />
            <Row label="Blood Group" value={mother.bloodGroup || "—"} />
            <Row label="Registered" value={formatDate(mother.registrationDate)} />
          </Section>

          {/* Pregnancy */}
          <Section title="Pregnancy Details" icon={CalendarDays}>
            <Row label="LMP" value={formatDate(mother.lmp)} />
            <Row label="EDD" value={formatDate(mother.edd)} />
            <Row
              label="Weeks at Reg."
              value={
                mother.weeksPregnantAtRegistration
                  ? `${mother.weeksPregnantAtRegistration} wks`
                  : "—"
              }
            />
            <Row label="G / P" value={`${mother.gravida || "—"} / ${mother.para || "—"}`} />
          </Section>

          {/* Care Team */}
          <Section title="Care Team" icon={Activity}>
            <Row label="Facility" value={mother.facilityName || "—"} />
            <Row label="Nurse" value={mother.nurseName || "—"} />
            <Row label="Nurse Phone" value={mother.nursePhone || "—"} />
          </Section>

          {/* Partner (Conditional) */}
          {(mother.partnerName || mother.partnerPhone) && (
            <Section title="Partner / Support" icon={User}>
              <Row label="Name" value={mother.partnerName || "—"} />
              <Row label="Age" value={mother.partnerAge ? `${mother.partnerAge} yrs` : "—"} />
              <Row label="Phone" value={mother.partnerPhone || "—"} />
            </Section>
          )}
        </div>

        {/* ── CONDITIONS ── */}
        {mother.conditions && mother.conditions.length > 0 && (
          <Section title="Medical Conditions" icon={FileText}>
            <div className="flex flex-wrap gap-2 py-1">
              {mother.conditions.map((c: string, i: number) => (
                <Badge key={i} tone="warning">
                  {c}
                </Badge>
              ))}
            </div>
          </Section>
        )}

        {/* ── RECENT VISITS ── */}
        {mother.ancVisits && mother.ancVisits.length > 0 && (
          <Section
            title="Recent ANC Visits"
            icon={Activity}
            action={{
              label: "All Visits",
              to: "/mothers/$motherId/anc-visit",
              params: { motherId },
            }}
          >
            <div className="divide-y divide-border">
              {mother.ancVisits.slice(0, 3).map((v: any) => (
                <Link
                  key={v.id}
                  to="/mothers/$motherId/anc-visit"
                  params={{ motherId }}
                  className="flex items-center justify-between py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground">
                      Visit {v.visit_number || v.visitNumber}{" "}
                      <span className="text-muted-foreground font-normal">
                        · Week {v.gestation_weeks || v.gestationWeeks || "—"}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                      BP {v.bp_systolic || v.bpSystolic}/{v.bp_diastolic || v.bpDiastolic} mmHg
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-primary">
                    {formatDate(v.visit_date || v.visitDate)}
                  </span>
                </Link>
              ))}
            </div>
          </Section>
        )}
      </div>
    </AppShell>
  );
}

// ── Helper Components ─────────────────────────────────────────────────────

function StatBox({ icon: Icon, label, value, color, bg }: any) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className={cn("mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg", bg, color)}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function ActionButton({ to, params, icon: Icon, label }: any) {
  return (
    <Link
      to={to}
      params={params}
      className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 p-3 text-primary shadow-sm transition-all hover:bg-primary/10 active:scale-95"
    >
      <Icon className="h-5 w-5" />
      <span className="text-[11px] font-bold uppercase tracking-wide">{label}</span>
    </Link>
  );
}

function Section({ title, icon: Icon, children, action }: any) {
  return (
    <div className="card-surface overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">{title}</h3>
        </div>
        {action && (
          <Link
            to={action.to}
            params={action.params}
            className="text-xs font-bold text-primary hover:underline"
          >
            {action.label}
          </Link>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2.5 last:border-0 last:pb-0">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground text-right">{value || "—"}</p>
    </div>
  );
}

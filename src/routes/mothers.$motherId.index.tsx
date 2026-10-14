import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Phone,
  MapPin,
  Calendar,
  User,
  Heart,
  Activity,
  Syringe,
  AlertTriangle,
  Plus,
  ChevronRight,
  Loader2,
  FileText,
  TestTube,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { AppShell } from "@/components/AppShell";

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
      <AppShell title="Loading…" back={{ to: "/" }}>
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        </div>
      </AppShell>
    );
  }

  if (!mother) {
    return (
      <AppShell title="Not found" back={{ to: "/" }}>
        <div className="rounded-2xl bg-white p-8 text-center">
          <p className="text-sm text-gray-600">This mother could not be found.</p>
          <Link
            to="/mothers/search"
            className="mt-4 inline-block rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold text-white"
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
    <AppShell title={mother.name} subtitle={mother.facilityName || ""} back={{ to: "/" }}>
      <div className="space-y-4">
        {/* ── Hero card ── */}
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-5 text-white shadow-[0_10px_30px_rgba(109,40,217,0.35)]">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/20 text-xl font-black backdrop-blur-sm">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-black leading-tight">{mother.name}</h2>
              <p className="mt-0.5 flex items-center gap-1 text-xs opacity-90">
                <Phone className="h-3 w-3" />
                {mother.phone}
              </p>
              {mother.county && mother.county !== "N/A" && (
                <p className="mt-0.5 flex items-center gap-1 text-xs opacity-90">
                  <MapPin className="h-3 w-3" />
                  {mother.county}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/20 pt-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide opacity-75">EDD</p>
              <p className="text-sm font-black">{formatDate(mother.edd)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide opacity-75">Gravida</p>
              <p className="text-sm font-black">{mother.gravida || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide opacity-75">Para</p>
              <p className="text-sm font-black">{mother.para || "—"}</p>
            </div>
          </div>
        </div>

        {/* ── Red alert badge ── */}
        {openAlerts > 0 && (
          <Link
            to="/alerts"
            className="flex items-center gap-3 rounded-2xl border-2 border-red-600 bg-red-600 p-4 text-white shadow-[0_8px_24px_rgba(220,38,38,0.35)] transition active:scale-[0.99]"
          >
            <AlertTriangle className="h-6 w-6 animate-pulse" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black uppercase tracking-wide">
                🚨 {openAlerts} Open Alert{openAlerts > 1 ? "s" : ""}
              </p>
              <p className="text-xs opacity-95">Tap to review now</p>
            </div>
            <ChevronRight className="h-5 w-5" />
          </Link>
        )}

        {/* ── Quick stats row ── */}
        <div className="grid grid-cols-3 gap-3">
          <StatPill
            icon={<Heart className="h-4 w-4" />}
            label="Visits"
            value={visitsCount}
            gradient="from-purple-500 to-purple-700"
          />
          <StatPill
            icon={<TestTube className="h-4 w-4" />}
            label="Labs"
            value={labsCount}
            gradient="from-emerald-500 to-emerald-700"
          />
          <StatPill
            icon={<Syringe className="h-4 w-4" />}
            label="Vaccines"
            value={vaxCount}
            gradient="from-blue-500 to-blue-700"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <ActionButton
            to="/mothers/$motherId/anc-visit"
            params={{ motherId }}
            icon={<Activity className="h-4 w-4" />}
            label="+ Visit"
          />
          <ActionButton
            to="/mothers/$motherId/lab-results"
            params={{ motherId }}
            icon={<TestTube className="h-4 w-4" />}
            label="+ Lab"
          />
          <ActionButton
            to="/mothers/$motherId/vaccination"
            params={{ motherId }}
            icon={<Syringe className="h-4 w-4" />}
            label="+ Vaccine"
          />
        </div>

        {/* ── Personal details ── */}
        <Section title="Personal details" icon={<User className="h-4 w-4" />}>
          <Row label="Full name" value={mother.name} />
          <Row label="Age" value={mother.age ? `${mother.age} years` : "—"} />
          <Row label="National ID" value={mother.idNumber || "—"} />
          <Row label="County" value={mother.county || "—"} />
          <Row label="Village" value={mother.village || "—"} />
          <Row label="Blood group" value={mother.bloodGroup || "—"} />
        </Section>

        {/* ── Pregnancy info ── */}
        <Section title="Pregnancy" icon={<Heart className="h-4 w-4" />}>
          <Row label="LMP" value={formatDate(mother.lmp)} />
          <Row label="EDD" value={formatDate(mother.edd)} />
          <Row
            label="Weeks at registration"
            value={
              mother.weeksPregnantAtRegistration
                ? `${mother.weeksPregnantAtRegistration} weeks`
                : "—"
            }
          />
          <Row label="Gravida / Para" value={`${mother.gravida || "—"} / ${mother.para || "—"}`} />
          <Row label="Registered" value={formatDate(mother.registrationDate)} />
        </Section>

        {/* ── Care team ── */}
        <Section title="Care team" icon={<User className="h-4 w-4" />}>
          <Row label="Nurse" value={mother.nurseName || "—"} />
          <Row label="Nurse phone" value={mother.nursePhone || "—"} />
          <Row label="Facility" value={mother.facilityName || "—"} />
        </Section>

        {/* ── Partner ── */}
        {(mother.partnerName || mother.partnerPhone) && (
          <Section title="Partner" icon={<User className="h-4 w-4" />}>
            <Row label="Name" value={mother.partnerName || "—"} />
            <Row label="Age" value={mother.partnerAge ? `${mother.partnerAge} years` : "—"} />
            <Row label="Phone" value={mother.partnerPhone || "—"} />
          </Section>
        )}

        {/* ── Medical conditions ── */}
        {mother.conditions && mother.conditions.length > 0 && (
          <Section title="Medical conditions" icon={<FileText className="h-4 w-4" />}>
            <div className="flex flex-wrap gap-2 pt-1">
              {mother.conditions.map((c: string, i: number) => (
                <span
                  key={i}
                  className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700"
                >
                  {c}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* ── Recent ANC visits ── */}
        {mother.ancVisits && mother.ancVisits.length > 0 && (
          <Section
            title="Recent ANC visits"
            icon={<Activity className="h-4 w-4" />}
            action={{
              label: "All visits",
              to: "/mothers/$motherId/anc-visit",
              params: { motherId },
            }}
          >
            {mother.ancVisits.slice(0, 3).map((v: any) => (
              <Link
                key={v.id}
                to="/mothers/$motherId/anc-visit"
                params={{ motherId }}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900">
                    Visit {v.visit_number || v.visitNumber} · Week{" "}
                    {v.gestation_weeks || v.gestationWeeks || "—"}
                  </p>
                  <p className="text-xs text-gray-500">
                    BP {v.bp_systolic || v.bpSystolic}/{v.bp_diastolic || v.bpDiastolic}
                  </p>
                </div>
                <span className="text-xs font-bold text-purple-600">
                  {formatDate(v.visit_date || v.visitDate)}
                </span>
              </Link>
            ))}
          </Section>
        )}

        <div className="h-4" />
      </div>
    </AppShell>
  );
}

// ── Helper components ─────────────────────────────────────────────────────

function Section({
  title,
  icon,
  children,
  action,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  action?: { label: string; to: string; params?: Record<string, string> };
}) {
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-purple-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-purple-100 bg-purple-50/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-purple-600">{icon}</span>
          <h3 className="text-xs font-black uppercase tracking-wide text-purple-900">{title}</h3>
        </div>
        {action &&
          (action.params ? (
            <Link
              to={action.to}
              params={action.params}
              className="text-xs font-bold text-purple-600"
            >
              {action.label} →
            </Link>
          ) : (
            <Link to={action.to} className="text-xs font-bold text-purple-600">
              {action.label} →
            </Link>
          ))}
      </div>
      <div className="px-4 py-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-2 last:border-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-sm font-bold text-gray-900">{value || "—"}</p>
    </div>
  );
}

function StatPill({
  icon,
  label,
  value,
  gradient,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  gradient: string;
}) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${gradient} p-3 text-white shadow-md`}>
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/25">{icon}</div>
      <p className="mt-2 text-xl font-black leading-tight">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wide opacity-90">{label}</p>
    </div>
  );
}

function ActionButton({
  to,
  params,
  icon,
  label,
}: {
  to: string;
  params?: Record<string, string>;
  icon: React.ReactNode;
  label: string;
}) {
  const linkProps = params ? { to, params } : { to };
  return (
    <Link
      {...(linkProps as any)}
      className="flex flex-col items-center gap-1 rounded-2xl border-2 border-purple-200 bg-white px-2 py-3 text-purple-700 shadow-sm transition active:scale-95"
    >
      {icon}
      <span className="text-[11px] font-bold">{label}</span>
    </Link>
  );
}

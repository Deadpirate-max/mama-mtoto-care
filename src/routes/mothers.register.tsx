import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  MessageSquare,
  Share2,
  Copy,
  User,
  Phone,
  MapPin,
  CalendarDays,
  Hash,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Field, inputClass } from "@/components/Field";
import { api, getStoredUser, type Mother } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/mothers/register")({
  head: () => ({ meta: [{ title: "Register New Mother — Mama na Mtoto+ CHV" }] }),
  component: RegisterMother,
});

function addDays(dateStr: string, days: number) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Helper for the red error border
function inputClassError(extra = "") {
  return `min-h-12 w-full rounded-xl border border-critical bg-card px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-critical focus-visible:ring-2 focus-visible:ring-critical/30 ${extra}`;
}

function RegisterMother() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();
  const [done, setDone] = useState<{ mother: Mother; smsSent: boolean } | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name: "",
    phone: "+254",
    age: "",
    nationalId: "",
    village: "",
    lmp: "",
    gravida: "1",
    parity: "0",
    bloodGroup: ""
  });

  const edd = addDays(form.lmp, 280);

     const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    // Validate
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors["name"] = "Full name is required";
    if (!/^\+?\d{9,15}$/.test(form.phone.replace(/\s/g, "")))
      newErrors["phone"] = "Enter a valid phone number";
    if (!form.lmp) newErrors["lmp"] = "LMP date is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    const user = getStoredUser();
    if (!user) {
      toast.error("Session expired — please log in again");
      return;
    }

    setBusy(true);
    try {
      const res = await api.registerMother({
        name: form.name.trim(),
        phone: form.phone.replace(/\s/g, ""),
        age: Number(form.age) || 0,
        nationalId: form.nationalId.trim(),
        bloodGroup: form.bloodGroup,
        village: form.village.trim(),
        lmp: form.lmp,
        edd,
        gravida: String(form.gravida),
        parity: String(form.parity),
        nurse_name: user.name,
        nurse_phone: user.phone,
        facility_name: user.facility,
        facility_code: user.facility,
        nextAppointment: null,
      });
      queryClient.invalidateQueries({ queryKey: ["mothers"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });

      setDone(res);
      toast.success("Mother registered successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <AppShell title="Registration Complete" back={{ to: "/" }}>
        <div className="mx-auto max-w-lg">
          <div className="card-surface text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success-soft shadow-sm">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>

            <h2 className="mt-5 text-2xl font-bold tracking-tight text-foreground">
              {done.mother.name}
            </h2>
            <p className="text-sm font-medium text-muted-foreground">{done.mother.phone}</p>

            <div className="mt-8 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-primary/80">
                Registration Code
              </p>
              <p className="mt-3 font-mono text-4xl font-black tracking-[0.25em] text-primary">
                {done.mother.registrationCode}
              </p>

              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={() => {
                    if (!done.mother.registrationCode) return;
                    navigator.clipboard.writeText(done.mother.registrationCode);
                    toast.success("Code copied to clipboard");
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-primary shadow-sm ring-1 ring-primary/10 transition-all hover:bg-primary/5 active:scale-95"
                >
                  <Copy className="h-4 w-4" /> Copy
                </button>
                <button
                  onClick={() => {
                    if (!done.mother.registrationCode) return;
                    const msg = `Mama na Mtoto+ Registration Code: ${done.mother.registrationCode}`;
                    if (navigator.share) navigator.share({ text: msg });
                    else window.open(`sms:${done.mother.phone}?body=${encodeURIComponent(msg)}`);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95"
                >
                  <Share2 className="h-4 w-4" /> Share
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-muted-foreground">
              <span>
                EDD: <strong className="text-foreground">{done.mother.edd}</strong>
              </span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span>
                Gravida: <strong className="text-foreground">{done.mother.gravida}</strong>
              </span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span>
                Parity: <strong className="text-foreground">{done.mother.parity}</strong>
              </span>
            </div>

            <div className="mt-8 flex justify-center">
              <Badge tone={done.smsSent ? "success" : "warning"} className="px-4 py-1.5 text-sm">
                <MessageSquare className="h-4 w-4 mr-1.5" />
                {done.smsSent
                  ? `SMS sent to ${done.mother.phone}`
                  : "SMS not sent — share manually"}
              </Badge>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button
                onClick={() =>
                  navigate({ to: "/mothers/$motherId", params: { motherId: done.mother.id } })
                }
                className="rounded-xl bg-primary py-3.5 text-base font-bold text-primary-foreground shadow-brand transition-all hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Open Profile
              </button>
              <button
                onClick={() => {
                  setDone(null);
                  setForm({
                    name: "",
                    phone: "+254",
                    age: "",
                    nationalId: "",
                    village: "",
                    lmp: "",
                    gravida: "1",
                    parity: "0",
                    bloodGroup: ""
                  });
                  setErrors({});
                }}
                className="rounded-xl border border-border bg-card py-3.5 text-base font-bold text-foreground transition-colors hover:bg-muted"
              >
                Register Another
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Register New Mother" back={{ to: "/" }}>
      <div className="mx-auto max-w-2xl">
        <form onSubmit={submit} className="space-y-6">
          {/* Identity Card */}
          <div className="card-surface space-y-5">
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <User className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Identity Details
              </h3>
            </div>

            <Field label="Full name" error={errors["name"]} required>
              <div className="relative">
                <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  className={errors["name"] ? inputClassError("pl-11") : inputClass("pl-11")}
                  value={form.name}
                  onChange={set("name")}
                  placeholder="e.g. Amina Wanjiku"
                />
              </div>
            </Field>

            <Field
              label="Phone number"
              hint="Registration code is sent to this number by SMS."
              error={errors["phone"]}
              required
            >
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  className={errors["phone"] ? inputClassError("pl-11") : inputClass("pl-11")}
                  type="tel"
                  inputMode="tel"
                  placeholder="+254 7XX XXX XXX"
                  value={form.phone}
                  onChange={set("phone")}
                />
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Age">
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    className={inputClass("pl-11")}
                    type="number"
                    inputMode="numeric"
                    min={12}
                    max={60}
                    value={form.age}
                    onChange={set("age")}
                    placeholder="Years"
                  />
                </div>
              </Field>
              <Field label="National ID">
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    className={inputClass("pl-11")}
                    value={form.nationalId}
                    onChange={set("nationalId")}
                    placeholder="ID Number"
                  />
                </div>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
  <Field label="Blood Group" required>
    <select
      className={errors["bloodGroup"] ? inputClassError() : inputClass()}
      value={form.bloodGroup}
      onChange={set("bloodGroup")}
    >
      <option value="">Select...</option>
      <option value="A+">A+</option>
      <option value="A-">A-</option>
      <option value="B+">B+</option>
      <option value="B-">B-</option>
      <option value="O+">O+</option>
      <option value="O-">O-</option>
      <option value="AB+">AB+</option>
      <option value="AB-">AB-</option>
    </select>
  </Field>

            <Field label="Village / Location">
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  className={inputClass("pl-11")}
                  value={form.village}
                  onChange={set("village")}
                  placeholder="e.g. Ndumberi"
                />
              </div>
            </Field>
          </div>

          {/* Pregnancy Details Card */}
          <div className="card-surface space-y-5">
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-baby-soft text-baby">
                <CalendarDays className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Pregnancy Details
              </h3>
            </div>

            <Field
              label="Last Menstrual Period (LMP)"
              hint={edd ? `Estimated Delivery Date: ${edd}` : "Select a date to calculate EDD"}
              error={errors["lmp"]}
              required
            >
              <div className="relative">
                <CalendarDays className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  className={errors["lmp"] ? inputClassError("pl-11") : inputClass("pl-11")}
                  type="date"
                  value={form.lmp}
                  onChange={set("lmp")}
                />
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Gravida (Pregnancies)">
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    className={inputClass("pl-11")}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={form.gravida}
                    onChange={set("gravida")}
                  />
                </div>
              </Field>
              <Field label="Parity (Births)">
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    className={inputClass("pl-11")}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={form.parity}
                    onChange={set("parity")}
                  />
                </div>
              </Field>
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-brand transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {busy ? "Registering…" : "Register & Generate Code"}
          </button>
        </form>
      </div>
    </AppShell>
  );
}

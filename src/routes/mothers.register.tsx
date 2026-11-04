import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, MessageSquare } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Field, inputClass } from "@/components/Field";
import { api, getStoredUser, type Mother } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/mothers/register")({
  head: () => ({
    meta: [
      { title: "Register New Mother — Mama na Mtoto+ CHV" },
      {
        name: "description",
        content:
          "Enrol a new expectant mother, generate her 8-character registration code and send it by SMS.",
      },
      { property: "og:title", content: "Register New Mother — Mama na Mtoto+" },
      {
        property: "og:description",
        content: "Enrol expectant mothers and issue their SMS registration code in seconds.",
      },
    ],
  }),
  component: RegisterMother,
});

function addDays(dateStr: string, days: number) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10); // Returns "2027-06-08"
}

function RegisterMother() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();
  const [done, setDone] = useState<{ mother: Mother; smsSent: boolean } | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "+254",
    age: "",
    nationalId: "",
    village: "",
    lmp: "",
    gravida: "1",
    parity: "0",
  });

  const edd = addDays(form.lmp, 280);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Enter the mother's full name");
      return;
    }
    if (!/^\+?\d{9,15}$/.test(form.phone.replace(/\s/g, ""))) {
      toast.error("Enter a valid phone number");
      return;
    }
    if (!form.lmp) {
      toast.error("Enter the last menstrual period date");
      return;
    }

    // 🛡️ Auto-fill nurse info from logged-in session
    const user = getStoredUser();
    if (!user) {
      toast.error("Session expired — please log in again");
      return;
    }

    setBusy(true);
    try {
      // Find this in the submit function
      const res = await api.registerMother({
        name: form.name.trim(),
        phone: form.phone.replace(/\s/g, ""),
        age: Number(form.age) || 0,
        nationalId: form.nationalId.trim(),
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
      toast.success("Mother registered");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <AppShell title="Registration complete" back={{ to: "/" }}>
        <div className="card-surface text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
          <h2 className="mt-3 text-lg font-bold text-foreground">{done.mother.name}</h2>
          <p className="text-sm text-muted-foreground">{done.mother.phone}</p>

          <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Registration code
          </p>
          <p className="mt-1 font-mono text-3xl font-bold tracking-[0.25em] text-primary">
            {done.mother.registrationCode}
          </p>
          {/* ── Copy / Share buttons ── */}
          <div className="mt-3 flex justify-center gap-2">
            <button
              onClick={() => {
                const code = done.mother.registrationCode || "";
                if (!code) return;
                navigator.clipboard.writeText(code);
                toast.success("Code copied");
              }}
              className="rounded-lg bg-purple-100 px-3 py-1.5 text-xs font-bold text-purple-700"
            >
              Copy
            </button>
            <button
              onClick={() => {
                const code = done.mother.registrationCode || "";
                if (!code) return;
                const msg = `Mama na Mtoto+ Registration Code: ${code}`;
                if (navigator.share) {
                  navigator.share({ text: msg });
                } else {
                  window.open(`sms:${done.mother.phone}?body=${encodeURIComponent(msg)}`);
                }
              }}
              className="rounded-lg bg-purple-100 px-3 py-1.5 text-xs font-bold text-purple-700"
            >
              Share
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            EDD {done.mother.edd} · Gravida {done.mother.gravida} · Parity {done.mother.parity}
          </p>

          <div
            className={`mt-5 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${
              done.smsSent ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            {done.smsSent
              ? `SMS sent to ${done.mother.phone}`
              : "SMS not sent — share the code manually"}
          </div>

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <button
              onClick={() =>
                navigate({ to: "/mothers/$motherId", params: { motherId: done.mother.id } })
              }
              className="rounded-xl bg-primary py-3 font-semibold text-primary-foreground"
            >
              Open profile
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
                });
              }}
              className="rounded-xl border border-border py-3 font-semibold text-foreground"
            >
              Register another
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Register new mother" back={{ to: "/" }}>
      <form onSubmit={submit} className="space-y-4">
        <div className="card-surface space-y-4">
          <Field label="Full name">
            <input
              className={inputClass()}
              value={form.name}
              onChange={set("name")}
              placeholder="Amina Wanjiku"
            />
          </Field>
          <Field label="Phone number" hint="Registration code is sent to this number by SMS.">
            <input
              className={inputClass()}
              type="tel"
              inputMode="tel"
              value={form.phone}
              onChange={set("phone")}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Age">
              <input
                className={inputClass()}
                type="number"
                inputMode="numeric"
                value={form.age}
                onChange={set("age")}
              />
            </Field>
            <Field label="National ID">
              <input
                className={inputClass()}
                value={form.nationalId}
                onChange={set("nationalId")}
              />
            </Field>
          </div>
          <Field label="Village / location">
            <input
              className={inputClass()}
              value={form.village}
              onChange={set("village")}
              placeholder="Ndumberi"
            />
          </Field>
        </div>

        <div className="card-surface space-y-4">
          <Field
            label="Last menstrual period (LMP)"
            hint={edd ? `Estimated delivery date: ${edd}` : undefined}
          >
            <input className={inputClass()} type="date" value={form.lmp} onChange={set("lmp")} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Gravida">
              <input
                className={inputClass()}
                type="number"
                inputMode="numeric"
                min={1}
                value={form.gravida}
                onChange={set("gravida")}
              />
            </Field>
            <Field label="Parity">
              <input
                className={inputClass()}
                type="number"
                inputMode="numeric"
                min={0}
                value={form.parity}
                onChange={set("parity")}
              />
            </Field>
          </div>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-primary py-3.5 text-base font-semibold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Registering…" : "Register & send SMS code"}
        </button>
      </form>
    </AppShell>
  );
}

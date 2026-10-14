import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { HeartPulse, Phone, ShieldCheck, KeyRound } from "lucide-react";
import { api, getToken, setSession } from "@/lib/api";
import { Field, inputClass } from "@/components/Field";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("+254");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const hasNavigated = useRef(false); // ✅ Prevent repeated navigation

  useEffect(() => {
    if (getToken() && !hasNavigated.current) {
      hasNavigated.current = true;
      navigate({ to: "/", replace: true });
    }
  }, [navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\+?\d{9,15}$/.test(phone.replace(/\s/g, ""))) {
      toast.error("Enter a valid phone number, e.g. +254712345678");
      return;
    }
    if (pin.length !== 4) {
      toast.error("Enter your 4-digit PIN");
      return;
    }

    setBusy(true);
    try {
      const res = await api.chvLogin(phone.replace(/\s/g, ""), pin);
      setSession(res.token, res.user);
      toast.success(`Karibu, ${res.user.name}`);
      navigate({ to: "/", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-brand px-4 py-10">
      <div className="mx-auto w-full max-w-md flex-1">
        <div className="mb-8 text-center text-primary-foreground">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <HeartPulse className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold">Mama na Mtoto+</h1>
          <p className="mt-1 text-sm opacity-85">CHV &amp; Nurse Dashboard</p>
        </div>

        <div className="rounded-3xl bg-card p-6 shadow-xl">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Sign in</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your facility phone number and PIN.
              </p>
            </div>

            <Field label="Phone number">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className={inputClass("pl-9")}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254712345678"
                />
              </div>
            </Field>

            <Field label="4-digit PIN">
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className={inputClass("pl-9 text-center tracking-[0.5em]")}
                  inputMode="numeric"
                  autoComplete="current-password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                />
              </div>
            </Field>

            <button
              type="submit"
              disabled={busy || pin.length !== 4}
              className="w-full rounded-xl bg-primary py-3.5 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" /> Ministry of Health approved facility access
          </p>
        </div>
      </div>
    </div>
  );
}

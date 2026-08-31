import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { HeartPulse, Phone, ShieldCheck } from "lucide-react";
import { api, getToken, setSession } from "@/lib/api";
import { Field, inputClass } from "@/components/Field";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Nurse Sign In — Mama na Mtoto+ CHV Dashboard" },
      {
        name: "description",
        content:
          "Secure phone OTP sign in for nurses and midwives using the Mama na Mtoto+ maternal health dashboard.",
      },
      { property: "og:title", content: "Nurse Sign In — Mama na Mtoto+" },
      {
        property: "og:description",
        content: "Sign in with your facility phone number to manage maternal health records.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("+254");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (getToken()) navigate({ to: "/", replace: true });
  }, [navigate]);

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\+?\d{9,15}$/.test(phone.replace(/\s/g, ""))) {
      toast.error("Enter a valid phone number, e.g. +254712345678");
      return;
    }
    setBusy(true);
    try {
      await api.requestOtp(phone.replace(/\s/g, ""));
      setStep("code");
      toast.success("Verification code sent by SMS");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send code");
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.verifyOtp(phone.replace(/\s/g, ""), code);
      setSession(res.token, res.user);
      toast.success(`Karibu, ${res.user.name}`);
      navigate({ to: "/", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid code");
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
          {step === "phone" ? (
            <form onSubmit={sendOtp} className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Sign in</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  We will send a one-time code to your registered facility number.
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
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-primary py-3.5 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy ? "Sending code…" : "Send OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Enter code</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sent to <span className="font-medium text-foreground">{phone}</span>
                </p>
              </div>
              <Field label="6-digit code">
                <input
                  className={inputClass("text-center text-2xl tracking-[0.5em]")}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                />
              </Field>
              <button
                type="submit"
                disabled={busy || code.length !== 6}
                className="w-full rounded-xl bg-primary py-3.5 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy ? "Verifying…" : "Verify & continue"}
              </button>
              <button
                type="button"
                onClick={() => setStep("phone")}
                className="w-full text-sm font-medium text-primary"
              >
                Change number
              </button>
            </form>
          )}

          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" /> Ministry of Health approved facility access
          </p>
        </div>
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { HeartPulse, Phone, ShieldCheck, KeyRound, ArrowRight } from "lucide-react";
import { api, getToken, setSession } from "@/lib/api";
import { Field } from "@/components/Field";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("+254");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (getToken() && !hasNavigated.current) {
      hasNavigated.current = true;
      navigate({ to: "/", replace: true });
    }
  }, [navigate]);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const cleanPhone = phone.replace(/\s/g, "");

    if (!/^\+?\d{9,15}$/.test(cleanPhone)) {
      toast.error("Enter a valid phone number, e.g. +254712345678");
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      toast.error("Enter your 4-digit PIN");
      return;
    }

    setBusy(true);
    try {
      const res = await api.chvLogin(cleanPhone, pin);
      setSession(res.token, res.user);
      toast.success(`Karibu, ${res.user.name}`);
      hasNavigated.current = true;
      navigate({ to: "/", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-layout">
      {/* ── LEFT: HERO ── */}
      <section className="login-hero">
        <div className="hero-bg-image" />
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />

        <div className="hero-brand">
          <div className="hero-brand-icon">
            <HeartPulse size={27} strokeWidth={2.5} />
          </div>
          <span>Mama na Mtoto+</span>
        </div>

        <div className="hero-main">
          <div className="hero-copy">
            <h1>
              Safe pregnancy.
              <br />
              <span>Every step of the way.</span>
            </h1>
            <div className="hero-accent" />
            <p>
              The clinical dashboard for CHVs and Nurses. Track ANC visits, monitor risks, and keep
              mothers safe.
            </p>
          </div>
        </div>
      </section>

      {/* ── RIGHT: LOGIN PANEL ── */}
      <section className="login-panel">
        <div className="login-curve-top" />
        <div className="login-curve-bottom" />
        <div className="login-dots" />

        <div className="login-card">
          <div className="login-card-icon">
            <HeartPulse size={36} strokeWidth={2.5} />
          </div>

          <div className="login-heading">
            <h2>Welcome back</h2>
            <p>Sign in to your CHV Dashboard.</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <Field label="Phone number">
              <div className="login-input-wrap">
                <Phone className="login-input-icon" size={20} />
                <input
                  className="login-input"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254 7XX XXX XXX"
                  required
                />
              </div>
            </Field>

            <Field label="4-digit PIN">
              <div className="login-input-wrap">
                <KeyRound className="login-input-icon" size={20} />
                <input
                  className="login-input text-center tracking-[0.8em] font-mono text-2xl"
                  type="password"
                  inputMode="numeric"
                  autoComplete="current-password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  required
                />
              </div>
            </Field>

            <button type="submit" disabled={busy || pin.length !== 4} className="login-submit">
              <span>{busy ? "Signing in..." : "Sign in"}</span>
              {!busy && (
                <div className="login-submit-icon">
                  <ArrowRight size={18} strokeWidth={3} />
                </div>
              )}
            </button>
          </form>

          <div className="login-divider">
            <span />
            <p>OR</p>
            <span />
          </div>

          <div className="login-approval">
            <ShieldCheck size={18} />
          </div>
        </div>
      </section>
    </main>
  );
}

import { Link, useRouterState } from "@tanstack/react-router";
import type { ComponentType, ReactNode } from "react";
import { useState } from "react";
import {
  Bell,
  ChevronLeft,
  HeartPulse,
  Home,
  KeyRound,
  LogOut,
  Search,
  Shield,
  UserPlus,
} from "lucide-react";
import { useRequireAuth, useSignOut } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { ChangePinModal } from "./ChangePinModal";

type AnyLinkProps = {
  to: string;
  params?: Record<string, string> | undefined;
  className?: string;
  children: ReactNode;
  "aria-current"?: "page" | undefined;
  "aria-label"?: string;
};
const AnyLink = Link as unknown as ComponentType<AnyLinkProps>;

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super admin",
  facility_admin: "Facility admin",
  nurse: "Nurse",
  midwife: "Midwife",
  clinical_officer: "Clinical Officer",
  doctor: "Medical Doctor",
  general_practitioner: "General Practitioner",
  obstetrician: "Obstetrician",
};
//
const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";

function AlertBadge({ count }: { count?: number | undefined }) {
  if (!count) return null;
  return (
    <span
      aria-label={`${count} open alerts`}
      className="inline-flex min-w-5 items-center justify-center rounded-full bg-critical px-1.5 text-xs font-bold leading-5 text-critical-foreground"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function AppShell({
  title,
  subtitle,
  back,
  alertCount,
  children,
}: {
  title: string;
  subtitle?: string;
  back?: { to: string; params?: Record<string, string> };
  alertCount?: number;
  children: ReactNode;
}) {
  const { ready, user } = useRequireAuth();
  const [showPinModal, setShowPinModal] = useState(false);
  const signOut = useSignOut();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const u = user as unknown as Record<string, string | undefined>;
  const name = u["name"] ?? u["full_name"] ?? u["fullName"] ?? "";
  const facility = u["facility_name"] ?? u["facilityName"] ?? u["facility_code"] ?? "";
  const roleLabel = ROLE_LABEL[u["role"] ?? ""] ?? "Staff";

  // Clean the "Role, Facility" string so we never get a trailing comma
  const metaLine = facility ? `${roleLabel} · ${facility}` : roleLabel;

  const baseNav = [
    { to: "/", label: "Home", icon: Home },
    { to: "/mothers/search", label: "Mothers", icon: Search },
    { to: "/mothers/register", label: "Register", icon: UserPlus },
    { to: "/alerts", label: "Alerts", icon: Bell },
  ];
  const isAdmin = u["role"] === "facility_admin" || u["role"] === "super_admin";
  const nav = isAdmin
    ? [...baseNav, { to: "/admin/nurses", label: "Nurses", icon: Shield }]
    : baseNav;

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <div className="min-h-screen bg-background">
      {/* ── Desktop sidebar ─────────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card md:flex">
        <div className="flex items-center gap-3 border-b border-border px-5 py-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-brand">
            <HeartPulse className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-bold leading-tight tracking-tight">
              Mama na Mtoto+
            </p>
            <p className="text-xs text-muted-foreground">Clinical dashboard</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Main">
          {nav.map((item) => {
            const active = isActive(item.to);
            const Icon = item.icon;
            return (
              <AnyLink
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-secondary text-secondary-foreground before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:rounded-full before:bg-primary"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                <span className="flex-1">{item.label}</span>
                {item.to === "/alerts" && <AlertBadge count={alertCount} />}
              </AnyLink>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-baby-soft text-sm font-bold text-baby">
              {initialsOf(name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{name || roleLabel}</p>
              <p className="truncate text-xs text-muted-foreground">{metaLine}</p>
            </div>
          </div>
          <div className="mt-1 grid gap-0.5">
            <button
              onClick={() => setShowPinModal(true)}
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
            >
              <KeyRound className="h-4 w-4" aria-hidden />
              Change PIN
            </button>
            <button
              onClick={signOut}
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-critical-soft hover:text-critical"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile top bar ──────────────────────────────────────── */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-card px-4 py-3.5 md:hidden">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-brand">
          <HeartPulse className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold leading-tight">{name || "Mama na Mtoto+"}</p>
          <p className="truncate text-xs text-muted-foreground">{metaLine}</p>
        </div>
        <button
          onClick={() => setShowPinModal(true)}
          aria-label="Change PIN"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary/50"
        >
          <KeyRound className="h-5 w-5" aria-hidden />
        </button>
        <button
          onClick={signOut}
          aria-label="Sign out"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-critical-soft hover:text-critical"
        >
          <LogOut className="h-5 w-5" aria-hidden />
        </button>
      </header>

      {/* ── Page content ────────────────────────────────────────── */}
      <div className="md:pl-64">
        <main className="mx-auto w-full max-w-4xl px-4 pb-28 pt-6 md:px-8 md:pb-12 md:pt-8">
          {back && (
            <AnyLink
              to={back.to}
              params={back.params}
              className="mb-3 inline-flex min-h-11 items-center gap-1 rounded-lg pr-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Back
            </AnyLink>
          )}
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {children}
        </main>
      </div>

      {/* ── Mobile bottom tab bar ──────────────────────────────── */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <div className="mx-auto flex max-w-3xl">
          {nav.map((item) => {
            const active = isActive(item.to);
            const Icon = item.icon;
            return (
              <AnyLink
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                className="flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-xs font-medium"
              >
                <span
                  className={cn(
                    "relative flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                    active ? "bg-secondary text-secondary-foreground" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                  {item.to === "/alerts" && alertCount ? (
                    <span className="absolute -right-0.5 -top-1">
                      <AlertBadge count={alertCount} />
                    </span>
                  ) : null}
                </span>
                <span
                  className={cn(
                    "transition-colors",
                    active ? "text-secondary-foreground font-semibold" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </span>
              </AnyLink>
            );
          })}
        </div>
      </nav>

      <ChangePinModal isOpen={showPinModal} onClose={() => setShowPinModal(false)} />
    </div>
  );
}

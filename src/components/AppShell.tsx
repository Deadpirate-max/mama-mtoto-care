import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Home, LogOut, Search, UserPlus } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { isOffline, onOfflineChange } from "@/lib/api";
import { useRequireAuth, useSignOut } from "@/lib/auth";

const nav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/mothers/search", label: "Search", icon: Search },
  { to: "/mothers/register", label: "Register", icon: UserPlus },
  { to: "/alerts", label: "Alerts", icon: Bell },
] as const;

function OfflineBanner() {
  const [off, setOff] = useState(false);
  useEffect(() => {
    setOff(isOffline());
    return onOfflineChange(() => setOff(isOffline()));
  }, []);
  if (!off) return null;
  return (
    <div className="bg-warning px-4 py-2 text-center text-xs font-medium text-warning-foreground">
      Live server unavailable — showing demo data saved on this device.
    </div>
  );
}

export function AppShell({
  title,
  subtitle,
  back,
  children,
}: {
  title: string;
  subtitle?: string;
  back?: { to: string; params?: Record<string, string> };
  children: ReactNode;
}) {
  const { ready, user } = useRequireAuth();
  const signOut = useSignOut();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40 pb-24">
      <OfflineBanner />
      <header className="sticky top-0 z-20 bg-gradient-brand px-4 py-4 text-primary-foreground shadow-brand">
        <div className="mx-auto flex max-w-3xl items-start justify-between gap-3">
          <div className="min-w-0">
            {back && (
              <Link
                to={back.to}
                params={back.params}
                className="mb-1 inline-block text-xs opacity-80 hover:opacity-100"
              >
                ← Back
              </Link>
            )}
            <h1 className="truncate text-lg font-bold leading-tight">{title}</h1>
            <p className="truncate text-xs opacity-85">{subtitle ?? user.facility}</p>
          </div>
          <button
            onClick={signOut}
            aria-label="Sign out"
            className="rounded-lg bg-white/15 p-2 transition-colors hover:bg-white/25"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-5">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-3xl">
          {nav.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

import { Link, useRouterState } from "@tanstack/react-router";
import type { ComponentType } from "react";
import { Bell, Home, KeyRound, LogOut, Search, UserPlus, Shield } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useRequireAuth, useSignOut } from "@/lib/auth";
import { ChangePinModal } from "./ChangePinModal";

const BackLink = Link as unknown as ComponentType<{
  to: string;
  params?: Record<string, string>;
  className?: string;
  children: ReactNode;
}>;

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

  // 👇 1. Define base navigation
  const baseNav = [
    { to: "/", label: "Home", icon: Home },
    { to: "/mothers/search", label: "Search", icon: Search },
    { to: "/mothers/register", label: "Register", icon: UserPlus },
    { to: "/alerts", label: "Alerts", icon: Bell },
  ];

  // 👇 2. Check if user is an Admin
  const isAdmin = user.role === "facility_admin" || user.role === "super_admin";

  // 👇 3. Inject the "Nurses" tab if they are an Admin
  const nav = isAdmin
    ? [...baseNav, { to: "/admin/nurses", label: "Nurses", icon: Shield }]
    : baseNav;

  return (
    <div className="min-h-screen bg-muted/40 pb-24">
      <header className="sticky top-0 z-20 bg-gradient-brand px-4 py-4 text-primary-foreground shadow-brand">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPinModal(true)}
            className="rounded-lg bg-white/15 p-2 transition-colors hover:bg-white/25"
            title="Change PIN"
          >
            <KeyRound className="h-4 w-4" />
          </button>
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
      <ChangePinModal isOpen={showPinModal} onClose={() => setShowPinModal(false)} />
    </div>
  );
}

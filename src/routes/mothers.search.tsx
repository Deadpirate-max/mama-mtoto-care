import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, UserRound } from "lucide-react";
import { api } from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { inputClass } from "@/components/Field";

export const Route = createFileRoute("/mothers/search")({
  head: () => ({
    meta: [
      { title: "Search Mothers — Mama na Mtoto+ CHV" },
      {
        name: "description",
        content: "Find enrolled mothers by phone number, name or registration code.",
      },
      { property: "og:title", content: "Search Mothers — Mama na Mtoto+" },
      {
        property: "og:description",
        content: "Look up any mother's maternal health record in the facility register.",
      },
    ],
  }),
  component: SearchMothers,
});

const riskTone: Record<string, string> = {
  low: "bg-success/10 text-success",
  medium: "bg-warning/20 text-warning-foreground",
  high: "bg-critical/10 text-critical",
};

function SearchMothers() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["mothers", q],
    queryFn: () => api.searchMothers(q),
  });

  return (
    <AppShell title="Search mothers" back={{ to: "/" }}>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className={inputClass("pl-9")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Phone, name or registration code"
          autoFocus
        />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Searching…</p>}
      {!isLoading && (data?.length ?? 0) === 0 && (
        <p className="card-surface text-sm text-muted-foreground">
          No mothers match “{q}”. Check the number or register her as a new mother.
        </p>
      )}

      <div className="space-y-3">
        {data?.map((m) => (
          <Link
            key={m.id}
            to="/mothers/$motherId"
            params={{ motherId: m.id }}
            className="flex items-center gap-3 card-surface transition-colors hover:border-primary"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <UserRound className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-foreground">{m.name}</span>
              <span className="block truncate text-sm text-muted-foreground">
                {m.phone} · {m.registrationCode}
              </span>
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${riskTone[m.riskLevel]}`}
            >
              {m.riskLevel} risk
            </span>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}

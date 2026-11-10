import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, ChevronRight, User, Phone, MapPin, X, AlertCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { inputClass } from "@/components/Field";
import { api, type Mother } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mothers/search")({
  component: SearchMothers,
});

function formatDate(date: string | undefined | null): string {
  if (!date) return "—";
  try {
    const d = new Date(date);
    if (d.getFullYear() < 2000 || isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    });
  } catch {
    return "—";
  }
}

function SearchMothers() {
  const [query, setQuery] = useState("");
  const [mothers, setMothers] = useState<Mother[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 👇 Debounced search effect
  useEffect(() => {
    let mounted = true;

    // If empty, fetch recent mothers. If typing, wait 300ms before hitting the API.
    const delayDebounceFn = setTimeout(
      async () => {
        setLoading(true);
        setError("");
        try {
          const results = await api.searchMothers(query);
          if (mounted) setMothers(results || []);
        } catch (err: any) {
          if (mounted) setError(err.message || "Failed to search mothers");
        } finally {
          if (mounted) setLoading(false);
        }
      },
      query ? 300 : 0,
    );

    return () => {
      mounted = false;
      clearTimeout(delayDebounceFn);
    };
  }, [query]);

  return (
    <AppShell title="Mothers" back={{ to: "/" }}>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* ── SEARCH BAR ── */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <input
            type="text"
            className={inputClass("pl-11 pr-11 h-14 text-base shadow-sm")}
            placeholder="Search by name, phone, or ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query.length > 0 && (
            <button
              onClick={() => setQuery("")}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* ── RESULTS ── */}
        {error ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-critical-line bg-critical-soft p-8 text-center">
            <AlertCircle className="mb-3 h-8 w-8 text-critical" />
            <p className="font-semibold text-critical">Error searching</p>
            <p className="text-sm text-critical/80">{error}</p>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-2xl border border-border bg-muted/50"
              />
            ))}
          </div>
        ) : mothers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <User className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-4 font-bold text-foreground">No mothers found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {query
                ? `No results for "${query}". Try a different name or phone number.`
                : "You haven't registered any mothers yet."}
            </p>
            {query && (
              <button
                onClick={() => setQuery("")}
                className="mt-4 text-sm font-semibold text-primary hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {query ? "Search Results" : "Recently Registered"}
            </h2>
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              {mothers.map((mother, i) => (
                <Link
                  key={mother.id}
                  to="/mothers/$motherId"
                  params={{ motherId: mother.id }}
                  className={cn(
                    "group flex items-center gap-4 p-4 transition-colors hover:bg-muted/50",
                    i !== mothers.length - 1 && "border-b border-border",
                  )}
                >
                  {/* Avatar */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-baby-soft text-base font-bold text-baby">
                    {mother.name?.charAt(0).toUpperCase() || "?"}
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-bold text-foreground">
                        {mother.name || "Unknown"}
                      </p>
                      {mother.riskLevel === "high" ? (
                        <Badge tone="critical">High Risk</Badge>
                      ) : mother.riskLevel === "medium" ? (
                        <Badge tone="warning">Medium Risk</Badge>
                      ) : (
                        <Badge tone="success">Stable</Badge>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {mother.phone}
                      </span>
                      {(mother.village || mother.county) && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {[mother.village, mother.county].filter(Boolean).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* EDD & Chevron */}
                  <div className="flex shrink-0 items-center gap-4">
                    {mother.edd && (
                      <div className="hidden text-right sm:block">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          EDD
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {formatDate(mother.edd)}
                        </p>
                      </div>
                    )}
                    <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

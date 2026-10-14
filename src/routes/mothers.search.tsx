import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Search as SearchIcon, Phone, ChevronRight, X, Loader2, UserSearch } from "lucide-react";
import { api, type Mother } from "@/lib/api";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/mothers/search")({
  component: SearchMothers,
});

function formatDate(date?: string | null): string {
  if (!date) return "—";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function SearchMothers() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Mother[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch on query change (debounced 300ms) ──
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.searchMothers(query.trim());
        setResults(data || []);
        setLoaded(true);
      } catch (err) {
        console.error("Search error:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <AppShell title="Find a mother" subtitle="Search by name or phone">
      <div className="space-y-4">
        {/* ── Search bar ── */}
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-500" />
          <input
            type="text"
            inputMode="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name or phone (e.g. 0795094349)"
            className="w-full rounded-2xl border-2 border-purple-200 bg-white py-3.5 pl-11 pr-11 text-sm font-medium text-gray-900 shadow-sm outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
            autoFocus
          />
          {query.length > 0 && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-gray-100 p-1.5 text-gray-500 transition active:scale-90"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
            </div>
          )}
        </div>

        {/* ── Helper text ── */}
        <p className="px-1 text-xs text-gray-500">
          Tip: search <span className="font-mono font-bold text-purple-700">0795…</span> or{" "}
          <span className="font-mono font-bold text-purple-700">254795…</span> — both work.
        </p>

        {/* ── Results ── */}
        {!loaded && !loading ? (
          <EmptyState
            icon={<UserSearch className="h-7 w-7" />}
            title="Start typing"
            subtitle="Search by name or phone number"
          />
        ) : loading && results.length === 0 ? (
          <LoadingState />
        ) : results.length === 0 ? (
          <EmptyState
            icon={<SearchIcon className="h-7 w-7" />}
            title="No matches"
            subtitle={`No mother found for "${query}"`}
          />
        ) : (
          <>
            <p className="px-1 text-xs font-bold uppercase tracking-wide text-gray-500">
              {results.length} result{results.length !== 1 ? "s" : ""}
            </p>
            <div className="overflow-hidden rounded-2xl border-2 border-purple-100 bg-white shadow-sm">
              {results.map((m, i) => (
                <Link
                  key={m.id}
                  to="/mothers/$motherId"
                  params={{ motherId: m.id }}
                  className={`flex items-center gap-3 px-4 py-3 transition hover:bg-purple-50 active:bg-purple-100 ${
                    i !== results.length - 1 ? "border-b border-purple-100" : ""
                  }`}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-700 text-sm font-black text-white shadow-md">
                    {m.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-900">
                      {m.name || "Unknown"}
                    </p>
                    <p className="flex items-center gap-1 truncate text-xs text-gray-500">
                      <Phone className="h-3 w-3" />
                      {m.phone}
                      {m.county && m.county !== "N/A" && <> · {m.county}</>}
                    </p>
                    {m.edd && (
                      <p className="mt-0.5 text-[11px] font-semibold text-purple-600">
                        EDD {formatDate(m.edd)}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-purple-400" />
                </Link>
              ))}
            </div>
          </>
        )}

        <div className="h-4" />
      </div>
    </AppShell>
  );
}

// ── Helper components ─────────────────────────────────────────────────────

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-purple-100 bg-white p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 text-purple-600">
        {icon}
      </div>
      <p className="mt-3 text-sm font-bold text-gray-900">{title}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-16 animate-pulse rounded-2xl border-2 border-purple-100 bg-white"
        />
      ))}
    </div>
  );
}

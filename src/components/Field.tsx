import type { ReactNode } from "react";

export function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center gap-1 text-sm font-medium text-foreground">
        {label}
        {required && (
          <span aria-hidden className="text-critical">
            *
          </span>
        )}
      </span>
      {children}
      {error ? (
        <span role="alert" className="block text-sm text-critical">
          {error}
        </span>
      ) : hint ? (
        <span className="block text-sm text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  );
}

// 👇 MAKE SURE THESE ARE AT THE BOTTOM OF THE FILE
export function inputClass(extra = "") {
  return `min-h-12 w-full rounded-xl border border-input bg-card px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30 disabled:bg-muted disabled:text-muted-foreground ${extra}`;
}

export function inputClassError(extra = "") {
  return `min-h-12 w-full rounded-xl border border-critical bg-card px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-critical focus-visible:ring-2 focus-visible:ring-critical/30 disabled:bg-muted disabled:text-muted-foreground ${extra}`;
}

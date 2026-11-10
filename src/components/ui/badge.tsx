import { cn } from "@/lib/utils";

type Tone = "critical" | "warning" | "success" | "baby" | "brand" | "neutral";

const styles: Record<Tone, string> = {
  critical: "bg-critical-soft text-critical border-critical-line",
  warning: "bg-warning-soft text-warning border-warning-line",
  success: "bg-success-soft text-success border-success-line",
  baby: "bg-baby-soft text-baby border-baby/20",
  brand: "bg-primary/10 text-primary border-primary/20",
  neutral: "bg-muted text-muted-foreground border-border",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        styles[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

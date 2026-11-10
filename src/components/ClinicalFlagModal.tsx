import { AlertOctagon, AlertTriangle } from "lucide-react";
import type { ClinicalFlag } from "@/lib/clinicalFlags";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function ClinicalFlagModal({
  visible,
  flags,
  onDismiss,
}: {
  visible: boolean;
  flags: ClinicalFlag[];
  onDismiss: () => void;
}) {
  if (flags.length === 0) return null;

  const criticalCount = flags.filter((f) => f.severity === "critical").length;
  const hasCritical = criticalCount > 0;
  const HeaderIcon = hasCritical ? AlertOctagon : AlertTriangle;

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && onDismiss()}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden rounded-2xl p-0">
        <DialogHeader className="space-y-0 border-b border-border p-5 text-left">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                hasCritical
                  ? "bg-critical text-critical-foreground"
                  : "bg-warning text-warning-foreground",
              )}
            >
              <HeaderIcon className="h-6 w-6" aria-hidden />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-lg leading-snug">
                {hasCritical
                  ? `${criticalCount} critical finding${criticalCount > 1 ? "s" : ""} need action`
                  : "Please review before saving"}
              </DialogTitle>
              <DialogDescription>
                Clinical decision support. The final decision is yours.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-3 overflow-y-auto p-5">
          {flags.map((f, i) => {
            const critical = f.severity === "critical";
            return (
              <section
                key={i}
                className={cn(
                  "rounded-xl border p-4",
                  critical
                    ? "border-critical-line bg-critical-soft"
                    : "border-warning-line bg-warning-soft",
                )}
              >
                <h3
                  className={cn("text-base font-bold", critical ? "text-critical" : "text-warning")}
                >
                  {f.condition}
                </h3>
                <p className="mt-1 text-sm text-foreground">{f.finding}</p>
                <div className="mt-3 rounded-lg bg-card p-3">
                  <p className="text-xs font-medium text-muted-foreground">What to do</p>
                  <p className="mt-0.5 text-sm font-medium text-foreground">{f.action}</p>
                </div>
              </section>
            );
          })}
        </div>

        <div className="border-t border-border bg-card p-5">
          <button
            onClick={onDismiss}
            className="min-h-12 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground transition active:scale-[0.99]"
          >
            I have reviewed this, continue
          </button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            This is a decision support tool. It does not replace your clinical judgment.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

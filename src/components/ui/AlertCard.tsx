import { AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Severity = "critical" | "warning" | "info" | "success";

const config = {
  critical: {
    bg: "bg-critical-soft border-critical-line text-critical",
    Icon: AlertTriangle,
  },
  warning: {
    bg: "bg-warning-soft border-warning-line text-warning",
    Icon: AlertTriangle,
  },
  info: {
    bg: "bg-primary/5 border-primary/20 text-primary",
    Icon: Info,
  },
  success: {
    bg: "bg-success-soft border-success-line text-success",
    Icon: CheckCircle2,
  },
};

export function AlertCard({
  severity,
  title,
  description,
}: {
  severity: Severity;
  title: string;
  description?: string;
}) {
  const { bg, Icon } = config[severity];
  return (
    <div className={cn("flex items-start gap-3 rounded-xl border p-4", bg)}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        {description && <p className="mt-1 text-sm opacity-90">{description}</p>}
      </div>
    </div>
  );
}

import { AlertTriangle, X, AlertOctagon } from "lucide-react";
import type { ClinicalFlag } from "@/lib/clinicalFlags";

export function ClinicalFlagModal({
  visible,
  flags,
  onDismiss,
}: {
  visible: boolean;
  flags: ClinicalFlag[];
  onDismiss: () => void;
}) {
  if (!visible || flags.length === 0) return null;

  const criticalCount = flags.filter((f) => f.severity === "critical").length;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div
          className={`flex items-center gap-3 p-4 ${
            criticalCount > 0
              ? "bg-gradient-to-r from-red-600 to-red-500"
              : "bg-gradient-to-r from-orange-500 to-amber-500"
          } text-white`}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20">
            {criticalCount > 0 ? (
              <AlertOctagon className="h-6 w-6" />
            ) : (
              <AlertTriangle className="h-6 w-6" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-black uppercase tracking-wide">
              {criticalCount > 0
                ? `🚨 ${criticalCount} Critical Finding${criticalCount > 1 ? "s" : ""}`
                : "⚠️ Clinical Warning"}
            </p>
            <p className="text-xs opacity-95">Clinical decision support — review before saving</p>
          </div>
          <button
            onClick={onDismiss}
            className="rounded-full bg-white/20 p-2 transition hover:bg-white/30"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] space-y-3 overflow-y-auto p-4">
          {flags.map((f, i) => (
            <div
              key={i}
              className={`rounded-xl border-2 p-4 ${
                f.severity === "critical"
                  ? "border-red-300 bg-red-50"
                  : "border-orange-300 bg-orange-50"
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg leading-none">
                  {f.severity === "critical" ? "🚨" : "⚠️"}
                </span>
                <div className="flex-1">
                  <p
                    className={`text-xs font-black uppercase tracking-wide ${
                      f.severity === "critical" ? "text-red-700" : "text-orange-700"
                    }`}
                  >
                    {f.condition}
                  </p>
                  <p className="mt-1 text-xs font-medium text-gray-700">{f.finding}</p>
                  <div className="mt-3 rounded-lg bg-white/70 p-3">
                    <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">
                      Recommended Action
                    </p>
                    <p className="mt-1 text-xs font-bold text-gray-900">{f.action}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-gray-100 bg-gray-50 p-4">
          <button
            onClick={onDismiss}
            className="flex-1 rounded-xl bg-purple-600 py-3 text-sm font-bold text-white shadow-md transition active:scale-[0.98]"
          >
            I've reviewed — continue
          </button>
        </div>

        <p className="border-t border-gray-100 bg-white px-4 py-3 text-center text-[10px] italic text-gray-500">
          This is a clinical decision support tool. Final clinical judgment rests with the nurse.
        </p>
      </div>
    </div>
  );
}

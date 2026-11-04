import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, X } from "lucide-react";
import { api } from "@/lib/api";

export function ChangePinModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4) return toast.error("New PIN must be 4 digits");

    setLoading(true);
    try {
      await api.changePin(currentPin, newPin);
      toast.success("PIN updated successfully!");
      setCurrentPin("");
      setNewPin("");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to change PIN");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Change PIN</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">
              Current PIN
            </label>
            <input
              type="password"
              maxLength={4}
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded-xl border border-input bg-background px-4 py-2 text-center text-xl tracking-[0.5em]"
              placeholder="****"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">
              New 4-Digit PIN
            </label>
            <input
              type="password"
              maxLength={4}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded-xl border border-input bg-background px-4 py-2 text-center text-xl tracking-[0.5em]"
              placeholder="****"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update PIN"}
          </button>
        </form>
      </div>
    </div>
  );
}

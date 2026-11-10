import { useState } from "react";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, inputClass } from "./Field";

const digits = (v: string) => v.replace(/\D/g, "").slice(0, 4);

export function ChangePinModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setError("");
  };

  const close = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPin.length !== 4) return setError("Enter your current 4-digit PIN.");
    if (newPin.length !== 4) return setError("Your new PIN must be 4 digits.");
    if (newPin === currentPin)
      return setError("Your new PIN must be different from the current one.");
    if (newPin !== confirmPin) return setError("The new PINs do not match.");

    setLoading(true);
    setError("");
    try {
      await api.changePin(currentPin, newPin);
      toast.success("PIN updated");
      close();
    } catch (err: any) {
      setError(err.message || "Could not change your PIN. Check your current PIN and try again.");
    } finally {
      setLoading(false);
    }
  };

  const pinInput = (value: string, set: (v: string) => void, auto: string) => (
    <input
      type="password"
      inputMode="numeric"
      autoComplete={auto}
      maxLength={4}
      value={value}
      onChange={(e) => {
        set(digits(e.target.value));
        setError("");
      }}
      className={inputClass("text-center text-2xl tracking-[0.8em] font-mono")}
      placeholder="••••"
      required
    />
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-sm gap-5 rounded-2xl p-6">
        <DialogHeader className="space-y-3 text-left">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
            <KeyRound className="h-5 w-5" aria-hidden />
          </span>
          <div className="space-y-1">
            <DialogTitle className="text-lg">Change your PIN</DialogTitle>
            <DialogDescription>
              You use this PIN to sign in. Do not share it with anyone.
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Current PIN">
            {pinInput(currentPin, setCurrentPin, "current-password")}
          </Field>
          <Field label="New PIN">{pinInput(newPin, setNewPin, "new-password")}</Field>
          <Field label="Confirm new PIN">
            {pinInput(confirmPin, setConfirmPin, "new-password")}
          </Field>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-critical-line bg-critical-soft px-3 py-2 text-sm text-critical"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="min-h-12 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground transition-opacity disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update PIN"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

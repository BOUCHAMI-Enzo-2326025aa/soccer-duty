"use client";

import { useState } from "react";
import { changePassword, dismissPasswordReminder } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

function validatePassword(value: string): string {
  if (value.length < 8) return "Le mot de passe doit contenir au moins 8 caractères";
  if (!/[A-Za-z]/.test(value)) return "Le mot de passe doit contenir au moins une lettre";
  if (!/[0-9]/.test(value)) return "Le mot de passe doit contenir au moins un chiffre";
  return "";
}

export default function ChangePasswordPrompt() {
  const { hasTemporaryPassword, clearTemporaryPasswordFlag } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [error, setError] = useState("");

  if (!hasTemporaryPassword) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validatePassword(newPassword);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await changePassword(newPassword);
      clearTemporaryPasswordFlag();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors du changement",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismiss = async () => {
    setDismissing(true);
    try {
      await dismissPasswordReminder();
    } catch {
      // Rappel secondaire : un échec ici ne doit pas bloquer l'utilisateur.
    } finally {
      setDismissing(false);
      clearTemporaryPasswordFlag();
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45" />

      <div className="relative w-full max-w-sm bg-card rounded-2xl border border-border-custom shadow-xl">
        <div className="px-5 py-4 border-b border-border-custom">
          <h2 className="font-syne text-base font-bold text-navy">
            Choisir votre mot de passe
          </h2>
          <p className="text-xs text-muted mt-1">
            Vous utilisez actuellement un mot de passe temporaire. Vous pouvez
            en choisir un autre maintenant, ou plus tard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-3">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-custom">
              {error}
            </div>
          )}

          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-semibold text-muted">
              Nouveau mot de passe
            </span>
            <input
              type="password"
              className="w-full rounded-lg border border-border-custom bg-white px-2.5 py-2 text-sm text-text-custom outline-none"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 caractères, lettres et chiffres"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-semibold text-muted">
              Confirmer le mot de passe
            </span>
            <input
              type="password"
              className="w-full rounded-lg border border-border-custom bg-white px-2.5 py-2 text-sm text-text-custom outline-none"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </label>

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={handleDismiss}
              disabled={submitting || dismissing}
              className="rounded-lg border border-border-custom px-3.5 py-2 text-sm font-semibold text-text-custom disabled:opacity-60"
            >
              Plus tard
            </button>
            <button
              type="submit"
              disabled={submitting || dismissing}
              className="rounded-lg bg-green-custom px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? "Enregistrement..." : "Changer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

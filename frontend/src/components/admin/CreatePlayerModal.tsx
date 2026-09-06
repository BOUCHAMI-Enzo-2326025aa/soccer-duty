"use client";

import { useState } from "react";
import {
  createAdminPlayer,
  type CreatedAdminPlayer,
  type University,
} from "@/lib/api";

export default function CreatePlayerModal({
  universities,
  onClose,
  onCreated,
}: {
  universities: University[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [universityId, setUniversityId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [created, setCreated] = useState<CreatedAdminPlayer | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setSubmitError("Prénom, nom et email sont obligatoires.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const result = await createAdminPlayer({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        university_id: universityId ? Number(universityId) : null,
      });
      setCreated(result);
      onCreated();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Erreur lors de la création",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.temporary_password);
      setCopied(true);
    } catch {
      // Le presse-papier n'est pas toujours disponible (permissions, contexte
      // non sécurisé) : l'admin peut toujours sélectionner le texte à la main.
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/45"
        onClick={created ? onClose : undefined}
      />

      <div className="relative w-full max-w-md bg-card rounded-2xl border border-border-custom shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-custom">
          <h2 className="font-syne text-base font-bold text-navy">
            {created ? "Joueur créé" : "Nouveau joueur"}
          </h2>
          {created && (
            <button
              type="button"
              onClick={onClose}
              className="text-muted hover:text-text-custom text-lg"
            >
              ✕
            </button>
          )}
        </div>

        {created ? (
          <div className="p-5 flex flex-col gap-3">
            <p className="text-sm text-text-custom">
              Le compte de <strong>{created.first_name} {created.last_name}</strong>{" "}
              a été créé. Communique-lui ce mot de passe temporaire — il ne
              sera plus jamais affiché.
            </p>

            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg border border-border-custom bg-sd-bg px-3 py-2 text-sm font-semibold text-navy">
                {created.temporary_password}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-lg border border-border-custom px-3 py-2 text-xs font-semibold text-text-custom hover:bg-sd-bg"
              >
                {copied ? "Copié ✓" : "Copier"}
              </button>
            </div>

            {created.university_id === null && (
              <div className="rounded-lg border border-orange-custom/30 bg-[#FFF3EC] px-3 py-2 text-xs text-orange-custom">
                Aucune université renseignée — pense à la renseigner
                rapidement depuis le tableau des joueurs.
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="mt-2 rounded-lg bg-navy px-3.5 py-2 text-sm font-semibold text-white"
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-3">
            {submitError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-custom">
                {submitError}
              </div>
            )}

            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-semibold text-muted">
                Prénom *
              </span>
              <input
                type="text"
                required
                className="w-full rounded-lg border border-border-custom bg-white px-2.5 py-2 text-sm text-text-custom outline-none"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enzo"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-semibold text-muted">
                Nom *
              </span>
              <input
                type="text"
                required
                className="w-full rounded-lg border border-border-custom bg-white px-2.5 py-2 text-sm text-text-custom outline-none"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Zidane"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-semibold text-muted">
                Email *
              </span>
              <input
                type="email"
                required
                className="w-full rounded-lg border border-border-custom bg-white px-2.5 py-2 text-sm text-text-custom outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="joueur@email.com"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-semibold text-muted">
                Université (optionnel)
              </span>
              <select
                className="w-full rounded-lg border border-border-custom bg-white px-2.5 py-2 text-sm text-text-custom outline-none"
                value={universityId}
                onChange={(e) => setUniversityId(e.target.value)}
              >
                <option value="">Non renseignée</option>
                {universities.map((university) => (
                  <option key={university.id} value={university.id}>
                    {university.name}
                  </option>
                ))}
              </select>
            </label>

            <p className="text-[11px] text-muted">
              Un mot de passe temporaire sera généré automatiquement — il te
              sera affiché une seule fois après la création.
            </p>

            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-lg border border-border-custom px-3.5 py-2 text-sm font-semibold text-text-custom disabled:opacity-60"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-green-custom px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {submitting ? "Création..." : "Créer le joueur"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

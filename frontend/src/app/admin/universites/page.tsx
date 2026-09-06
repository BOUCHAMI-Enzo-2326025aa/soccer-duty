"use client";

import { useEffect, useState } from "react";
import {
  createUniversity,
  getAdminUniversities,
  type University,
} from "@/lib/api";

type FormState = {
  name: string;
  logo: string;
  address: string;
  city: string;
  state: string;
  division: string;
  website: string;
  conference: string;
  contact_email: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  logo: "",
  address: "",
  city: "",
  state: "",
  division: "",
  website: "",
  conference: "",
  contact_email: "",
};

const INITIALS_STOPWORDS = new Set([
  "of",
  "the",
  "and",
  "de",
  "des",
  "du",
  "la",
  "le",
  "les",
]);

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";

  const words = trimmed.replace(/[(),]/g, " ").split(/\s+/).filter(Boolean);

  // Un mot deja tout en majuscules ("UCLA", "NYU", "IMT") est un abrege
  // fourni par l'etablissement lui-meme : on le reprend tel quel (jusqu'a
  // 4 lettres) plutot que d'en tirer des initiales artificielles.
  const acronym = words.find((word) => {
    const letters = word.replace(/[^A-Za-z]/g, "");
    return letters.length >= 2 && letters === letters.toUpperCase();
  });
  if (acronym) {
    const letters = acronym.replace(/[^A-Za-z]/g, "");
    return letters.length <= 4 ? letters : letters.slice(0, 2);
  }

  const meaningfulWords = words.filter(
    (word) => !INITIALS_STOPWORDS.has(word.toLowerCase()),
  );

  return (
    meaningfulWords
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("") || "?"
  );
}

export default function AdminUniversitiesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [universities, setUniversities] = useState<University[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [selectedUniversity, setSelectedUniversity] =
    useState<University | null>(null);

  const loadUniversities = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getAdminUniversities();
      setUniversities(response.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUniversities();
  }, []);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm(EMPTY_FORM);
    setSubmitError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setSubmitError("Le nom est obligatoire.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const created = await createUniversity({
        name: form.name.trim(),
        logo: form.logo.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        division: form.division.trim() || null,
        website: form.website.trim() || null,
        conference: form.conference.trim() || null,
        contact_email: form.contact_email.trim() || null,
      });

      setUniversities((prev) => [...prev, created]);
      closeModal();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Erreur lors de la création",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section>
      <div className="mb-4 md:mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-syne text-xl md:text-2xl font-extrabold text-navy">
            Universités
          </h1>
          <p className="text-sm text-muted mt-1">
            Liste des universités enregistrées ({universities.length})
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="shrink-0 rounded-lg bg-green-custom px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
        >
          + Nouveau
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-custom">
          Connexion API impossible: {error}
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border-custom overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-4xl w-full text-sm">
            <thead className="bg-sd-bg border-b border-border-custom">
              <tr>
                <th className="px-3 py-3 text-left font-syne text-[12px] uppercase tracking-[0.6px] text-muted">
                  Logo
                </th>
                <th className="px-3 py-3 text-left font-syne text-[12px] uppercase tracking-[0.6px] text-muted">
                  Nom
                </th>
                <th className="px-3 py-3 text-left font-syne text-[12px] uppercase tracking-[0.6px] text-muted">
                  Adresse
                </th>
                <th className="px-3 py-3 text-left font-syne text-[12px] uppercase tracking-[0.6px] text-muted">
                  État
                </th>
                <th className="px-3 py-3 text-left font-syne text-[12px] uppercase tracking-[0.6px] text-muted">
                  Division
                </th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-muted">
                    Chargement des universités...
                  </td>
                </tr>
              )}

              {!loading && universities.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-muted">
                    Aucune université enregistrée.
                  </td>
                </tr>
              )}

              {!loading &&
                universities.map((university) => (
                  <tr
                    key={university.id}
                    onClick={() => setSelectedUniversity(university)}
                    className="border-b border-border-custom/70 last:border-b-0 cursor-pointer hover:bg-sd-bg transition-colors"
                  >
                    <td className="px-3 py-3">
                      {university.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={university.logo}
                          alt={university.name}
                          className="w-8 h-8 rounded-full object-cover border border-border-custom"
                        />
                      ) : (
                        (() => {
                          const initials = getInitials(university.name);
                          return (
                            <div
                              className={`w-8 h-8 rounded-full bg-gradient-to-br from-navy-light to-navy text-white flex items-center justify-center font-syne font-bold ${initials.length > 2 ? "text-[8px]" : "text-[11px]"}`}
                            >
                              {initials}
                            </div>
                          );
                        })()
                      )}
                    </td>
                    <td className="px-3 py-3 font-semibold text-text-custom">
                      {university.name}
                    </td>
                    <td className="px-3 py-3 text-text-custom">
                      {[university.address, university.city]
                        .filter(Boolean)
                        .join(", ") || "-"}
                    </td>
                    <td className="px-3 py-3 text-text-custom">
                      {university.state || "-"}
                    </td>
                    <td className="px-3 py-3 text-text-custom">
                      {university.division || "-"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUniversity && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/45"
            onClick={() => setSelectedUniversity(null)}
          />

          <div className="relative w-full max-w-md bg-card rounded-2xl border border-border-custom shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border-custom">
              {selectedUniversity.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedUniversity.logo}
                  alt={selectedUniversity.name}
                  className="w-10 h-10 rounded-full object-cover border border-border-custom shrink-0"
                />
              ) : (
                (() => {
                  const initials = getInitials(selectedUniversity.name);
                  return (
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br from-navy-light to-navy text-white flex items-center justify-center font-syne font-bold shrink-0 ${initials.length > 2 ? "text-[9px]" : "text-xs"}`}
                    >
                      {initials}
                    </div>
                  );
                })()
              )}
              <h2 className="font-syne text-base font-bold text-navy flex-1">
                {selectedUniversity.name}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedUniversity(null)}
                className="text-muted hover:text-text-custom text-lg shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="p-5 flex flex-col gap-3">
              {[
                { label: "Adresse", value: selectedUniversity.address },
                { label: "Ville", value: selectedUniversity.city },
                { label: "État", value: selectedUniversity.state },
                { label: "Division", value: selectedUniversity.division },
                {
                  label: "Conférence sportive",
                  value: selectedUniversity.conference,
                },
                {
                  label: "Site web",
                  value: selectedUniversity.website,
                  href: selectedUniversity.website,
                },
                {
                  label: "Email de contact",
                  value: selectedUniversity.contact_email,
                  href: selectedUniversity.contact_email
                    ? `mailto:${selectedUniversity.contact_email}`
                    : undefined,
                },
              ].map((field) => (
                <div key={field.label} className="flex flex-col gap-0.5">
                  <span className="text-[12px] font-semibold text-muted">
                    {field.label}
                  </span>
                  {field.value ? (
                    field.href ? (
                      <a
                        href={field.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-custom font-medium break-all"
                      >
                        {field.value}
                      </a>
                    ) : (
                      <span className="text-sm text-text-custom">
                        {field.value}
                      </span>
                    )
                  ) : (
                    <span className="text-sm text-muted italic">
                      Non renseigné
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/45" onClick={closeModal} />

          <div className="relative w-full max-w-md bg-card rounded-2xl border border-border-custom shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-custom">
              <h2 className="font-syne text-base font-bold text-navy">
                Nouvelle université
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-muted hover:text-text-custom text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-3">
              {submitError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-custom">
                  {submitError}
                </div>
              )}

              <label className="flex flex-col gap-1">
                <span className="text-[12px] font-semibold text-muted">
                  Nom *
                </span>
                <input
                  type="text"
                  required
                  className="w-full rounded-lg border border-border-custom bg-white px-2.5 py-2 text-sm text-text-custom outline-none"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Eastern Florida State College"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[12px] font-semibold text-muted">
                  Logo (URL)
                </span>
                <input
                  type="text"
                  className="w-full rounded-lg border border-border-custom bg-white px-2.5 py-2 text-sm text-text-custom outline-none"
                  value={form.logo}
                  onChange={(e) => updateField("logo", e.target.value)}
                  placeholder="https://..."
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[12px] font-semibold text-muted">
                  Adresse
                </span>
                <input
                  type="text"
                  className="w-full rounded-lg border border-border-custom bg-white px-2.5 py-2 text-sm text-text-custom outline-none"
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder="1519 Clearlake Rd"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[12px] font-semibold text-muted">
                    Ville
                  </span>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-border-custom bg-white px-2.5 py-2 text-sm text-text-custom outline-none"
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    placeholder="Cocoa"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-[12px] font-semibold text-muted">
                    État
                  </span>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-border-custom bg-white px-2.5 py-2 text-sm text-text-custom outline-none"
                    value={form.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    placeholder="Floride"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-[12px] font-semibold text-muted">
                  Division
                </span>
                <input
                  type="text"
                  className="w-full rounded-lg border border-border-custom bg-white px-2.5 py-2 text-sm text-text-custom outline-none"
                  value={form.division}
                  onChange={(e) => updateField("division", e.target.value)}
                  placeholder="NCAA D1, NJCAA..."
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[12px] font-semibold text-muted">
                  Site web
                </span>
                <input
                  type="text"
                  className="w-full rounded-lg border border-border-custom bg-white px-2.5 py-2 text-sm text-text-custom outline-none"
                  value={form.website}
                  onChange={(e) => updateField("website", e.target.value)}
                  placeholder="https://..."
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[12px] font-semibold text-muted">
                  Conférence sportive
                </span>
                <input
                  type="text"
                  className="w-full rounded-lg border border-border-custom bg-white px-2.5 py-2 text-sm text-text-custom outline-none"
                  value={form.conference}
                  onChange={(e) => updateField("conference", e.target.value)}
                  placeholder="SEC, Big Ten, ACC..."
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[12px] font-semibold text-muted">
                  Email de contact
                </span>
                <input
                  type="email"
                  className="w-full rounded-lg border border-border-custom bg-white px-2.5 py-2 text-sm text-text-custom outline-none"
                  value={form.contact_email}
                  onChange={(e) =>
                    updateField("contact_email", e.target.value)
                  }
                  placeholder="contact@universite.edu"
                />
              </label>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-border-custom px-3.5 py-2 text-sm font-semibold text-text-custom"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-navy px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {submitting ? "Création..." : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

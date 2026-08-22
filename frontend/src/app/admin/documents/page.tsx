"use client";

import { useEffect, useState } from "react";
import {
  createDocumentTemplate,
  deleteDocumentTemplate,
  getAdminDocumentTemplates,
  getAdminUniversities,
  getUserIdFromCookie,
  updateDocumentTemplate,
  type DocumentApplicationScope,
  type DocumentCategory,
  type DocumentTemplate,
  type SaveDocumentTemplatePayload,
  type University,
} from "@/lib/api";

type FormState = {
  name: string;
  category: DocumentCategory;
  is_required_by_default: boolean;
  description_for_player: string;
  external_url: string;
  application_scope: DocumentApplicationScope;
  target_university_ids: number[];
  delay_appointment_days: number;
  delay_completion_days: number;
  delay_processing_days: number;
};

const EMPTY_FORM: FormState = {
  name: "",
  category: "IDENTITE",
  is_required_by_default: true,
  description_for_player: "",
  external_url: "",
  application_scope: "GENERIC",
  target_university_ids: [],
  delay_appointment_days: 0,
  delay_completion_days: 0,
  delay_processing_days: 0,
};

const CATEGORY_OPTIONS: DocumentCategory[] = [
  "IDENTITE",
  "ACADEMIQUE",
  "MEDICAL",
  "VISA",
  "SPORT",
  "FINANCIER",
];

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  IDENTITE: "Identité",
  ACADEMIQUE: "Académique",
  MEDICAL: "Médical",
  VISA: "Visa",
  SPORT: "Sport",
  FINANCIER: "Financier",
};

const CATEGORY_BADGE_CLASSES: Record<DocumentCategory, string> = {
  IDENTITE: "bg-[#EEF4FF] text-blue-custom",
  ACADEMIQUE: "bg-[#E8F8F2] text-[#00876a]",
  MEDICAL: "bg-[#FDECEC] text-red-custom",
  VISA: "bg-[#FFF3EC] text-orange-custom",
  SPORT: "bg-[#F1EEFD] text-[#6a4fd1]",
  FINANCIER: "bg-sd-bg text-navy",
};

function DelaySlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-muted">{label}</span>
        <span className="text-xs font-bold text-navy">{value} j</span>
      </div>
      <input
        type="range"
        min={0}
        max={60}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-green-custom"
      />
    </div>
  );
}

export default function AdminDocumentsPage() {
  const [adminUserId, setAdminUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [activeTab, setActiveTab] =
    useState<DocumentApplicationScope>("GENERIC");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<DocumentTemplate | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [previewTutorial, setPreviewTutorial] =
    useState<DocumentTemplate | null>(null);
  const [previewUniversities, setPreviewUniversities] =
    useState<DocumentTemplate | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const userId = getUserIdFromCookie();
        if (!userId) {
          throw new Error("Session admin introuvable. Reconnectez-vous.");
        }
        setAdminUserId(userId);

        const [templatesResponse, universitiesResponse] = await Promise.all([
          getAdminDocumentTemplates(userId),
          getAdminUniversities(),
        ]);
        setTemplates(templatesResponse.items);
        setUniversities(universitiesResponse.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const updateField = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleTargetUniversity = (universityId: number) => {
    setForm((prev) => ({
      ...prev,
      target_university_ids: prev.target_university_ids.includes(
        universityId,
      )
        ? prev.target_university_ids.filter((id) => id !== universityId)
        : [...prev.target_university_ids, universityId],
    }));
  };

  const openCreateDrawer = () => {
    setEditingTemplate(null);
    setForm({ ...EMPTY_FORM, application_scope: activeTab });
    setSubmitError("");
    setDrawerOpen(true);
  };

  const openEditDrawer = (template: DocumentTemplate) => {
    setEditingTemplate(template);
    setForm({
      name: template.name,
      category: template.category,
      is_required_by_default: template.is_required_by_default,
      description_for_player: template.description_for_player || "",
      external_url: template.external_url || "",
      application_scope: template.application_scope,
      target_university_ids: template.target_universities.map((u) => u.id),
      delay_appointment_days: template.delay_appointment_days ?? 0,
      delay_completion_days: template.delay_completion_days ?? 0,
      delay_processing_days: template.delay_processing_days ?? 0,
    });
    setSubmitError("");
    setDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!adminUserId) {
      setSubmitError("Session admin introuvable. Reconnectez-vous.");
      return;
    }
    if (!form.name.trim()) {
      setSubmitError("Le nom est obligatoire.");
      return;
    }
    if (
      form.application_scope === "SPECIFIC" &&
      form.target_university_ids.length === 0
    ) {
      setSubmitError(
        "Sélectionnez au moins une université pour un document spécifique.",
      );
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const payload: SaveDocumentTemplatePayload = {
        name: form.name.trim(),
        category: form.category,
        is_required_by_default: form.is_required_by_default,
        description_for_player: form.description_for_player.trim() || null,
        external_url: form.external_url.trim() || null,
        application_scope: form.application_scope,
        target_university_ids:
          form.application_scope === "SPECIFIC"
            ? form.target_university_ids
            : [],
        delay_appointment_days: form.delay_appointment_days,
        delay_completion_days: form.delay_completion_days,
        delay_processing_days: form.delay_processing_days,
      };

      if (editingTemplate) {
        const updated = await updateDocumentTemplate(
          editingTemplate.id,
          payload,
          adminUserId,
        );
        setTemplates((prev) =>
          prev.map((t) => (t.id === updated.id ? updated : t)),
        );
      } else {
        const created = await createDocumentTemplate(payload, adminUserId);
        setTemplates((prev) => [...prev, created]);
      }

      setDrawerOpen(false);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Erreur lors de l'enregistrement",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (template: DocumentTemplate) => {
    if (!adminUserId) {
      setError("Session admin introuvable. Reconnectez-vous.");
      return;
    }
    if (!window.confirm(`Supprimer le document "${template.name}" ?`)) {
      return;
    }

    setDeletingId(template.id);
    try {
      await deleteDocumentTemplate(template.id, adminUserId);
      setTemplates((prev) => prev.filter((t) => t.id !== template.id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la suppression",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const genericTemplates = templates.filter(
    (t) => t.application_scope === "GENERIC",
  );
  const specificTemplates = templates.filter(
    (t) => t.application_scope === "SPECIFIC",
  );
  const visibleTemplates =
    activeTab === "GENERIC" ? genericTemplates : specificTemplates;

  return (
    <section>
      <div className="mb-4 md:mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-syne text-xl md:text-2xl font-extrabold text-navy">
            Documents
          </h1>
          <p className="text-sm text-muted mt-1">
            {templates.length} modèle{templates.length > 1 ? "s" : ""} de
            document configuré{templates.length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateDrawer}
          className="shrink-0 rounded-lg bg-green-custom px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
        >
          + Nouveau document
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-custom">
          Connexion API impossible: {error}
        </div>
      )}

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scbar-hidden">
        <button
          type="button"
          onClick={() => setActiveTab("GENERIC")}
          className={`px-4 py-2 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap transition-all ${
            activeTab === "GENERIC"
              ? "bg-navy text-white"
              : "bg-white border border-border-custom text-muted hover:bg-sd-bg"
          }`}
        >
          Documents Génériques ({genericTemplates.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("SPECIFIC")}
          className={`px-4 py-2 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap transition-all ${
            activeTab === "SPECIFIC"
              ? "bg-navy text-white"
              : "bg-white border border-border-custom text-muted hover:bg-sd-bg"
          }`}
        >
          Documents Spécifiques ({specificTemplates.length})
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-border-custom overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-5xl w-full text-sm">
            <thead className="bg-sd-bg border-b border-border-custom">
              <tr>
                <th className="px-3 py-3 text-left font-syne text-[12px] uppercase tracking-[0.6px] text-muted">
                  Nom du document
                </th>
                <th className="px-3 py-3 text-left font-syne text-[12px] uppercase tracking-[0.6px] text-muted">
                  Site associé
                </th>
                <th className="px-3 py-3 text-left font-syne text-[12px] uppercase tracking-[0.6px] text-muted">
                  Tutoriel
                </th>
                <th className="px-3 py-3 text-left font-syne text-[12px] uppercase tracking-[0.6px] text-muted">
                  Délais
                </th>
                {activeTab === "SPECIFIC" && (
                  <th className="px-3 py-3 text-left font-syne text-[12px] uppercase tracking-[0.6px] text-muted">
                    Universités cibles
                  </th>
                )}
                <th className="px-3 py-3 text-left font-syne text-[12px] uppercase tracking-[0.6px] text-muted">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={activeTab === "SPECIFIC" ? 6 : 5}
                    className="px-3 py-8 text-center text-muted"
                  >
                    Chargement des documents...
                  </td>
                </tr>
              )}

              {!loading && visibleTemplates.length === 0 && (
                <tr>
                  <td
                    colSpan={activeTab === "SPECIFIC" ? 6 : 5}
                    className="px-3 py-8 text-center text-muted"
                  >
                    {activeTab === "SPECIFIC"
                      ? "Aucun document spécifique configuré."
                      : "Aucun document générique configuré."}
                  </td>
                </tr>
              )}

              {!loading &&
                visibleTemplates.map((template) => (
                  <tr
                    key={template.id}
                    className="border-b border-border-custom/70 last:border-b-0"
                  >
                    <td className="px-3 py-3">
                      <div className="font-semibold text-text-custom">
                        {template.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CATEGORY_BADGE_CLASSES[template.category]}`}
                        >
                          {CATEGORY_LABELS[template.category]}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            template.is_required_by_default
                              ? "bg-[#FFF3EC] text-orange-custom"
                              : "bg-sd-bg text-muted"
                          }`}
                        >
                          {template.is_required_by_default
                            ? "Obligatoire"
                            : "Facultatif"}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {template.external_url ? (
                        <a
                          href={template.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-custom font-semibold hover:underline"
                        >
                          🔗 Ouvrir le site
                        </a>
                      ) : (
                        <span className="text-xs text-muted">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {template.description_for_player ? (
                        <div className="flex items-center gap-1.5 max-w-[220px]">
                          <span className="text-xs text-text-custom truncate">
                            {template.description_for_player}
                          </span>
                          <button
                            type="button"
                            onClick={() => setPreviewTutorial(template)}
                            className="shrink-0 text-muted hover:text-navy"
                            title="Voir le tutoriel complet"
                          >
                            👁
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {template.delay_total_days !== null ? (
                        <span
                          className="inline-block text-xs font-semibold px-2 py-1 rounded-full bg-[#EEF4FF] text-blue-custom cursor-help"
                          title={`Prise de RDV : ${template.delay_appointment_days ?? 0} j\nComplétion joueur : ${template.delay_completion_days ?? 0} j\nTraitement externe : ${template.delay_processing_days ?? 0} j`}
                        >
                          ⏱ {template.delay_total_days} j
                        </span>
                      ) : (
                        <span className="text-xs text-muted">-</span>
                      )}
                    </td>
                    {activeTab === "SPECIFIC" && (
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => setPreviewUniversities(template)}
                          className="text-xs font-semibold px-2 py-1 rounded-full bg-[#E8F8F2] text-[#00876a] hover:opacity-80"
                        >
                          {template.target_universities.length} université
                          {template.target_universities.length > 1 ? "s" : ""}
                        </button>
                      </td>
                    )}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditDrawer(template)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-border-custom hover:bg-sd-bg"
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(template)}
                          disabled={deletingId === template.id}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-border-custom text-red-custom hover:bg-red-50 disabled:opacity-50"
                          title="Supprimer"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TUTORIAL PREVIEW MODAL */}
      {previewTutorial && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/45"
            onClick={() => setPreviewTutorial(null)}
          />
          <div className="relative w-full max-w-md bg-card rounded-2xl border border-border-custom shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-custom">
              <h2 className="font-syne text-base font-bold text-navy">
                {previewTutorial.name}
              </h2>
              <button
                type="button"
                onClick={() => setPreviewTutorial(null)}
                className="text-muted hover:text-text-custom text-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-5 text-sm text-text-custom whitespace-pre-wrap">
              {previewTutorial.description_for_player}
            </div>
          </div>
        </div>
      )}

      {/* TARGET UNIVERSITIES PREVIEW MODAL */}
      {previewUniversities && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/45"
            onClick={() => setPreviewUniversities(null)}
          />
          <div className="relative w-full max-w-md bg-card rounded-2xl border border-border-custom shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-custom">
              <h2 className="font-syne text-base font-bold text-navy">
                Universités concernées
              </h2>
              <button
                type="button"
                onClick={() => setPreviewUniversities(null)}
                className="text-muted hover:text-text-custom text-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-5 flex flex-col gap-2">
              {previewUniversities.target_universities.length === 0 ? (
                <span className="text-sm text-muted">
                  Aucune université associée.
                </span>
              ) : (
                previewUniversities.target_universities.map((u) => (
                  <div
                    key={u.id}
                    className="text-sm text-text-custom px-3 py-2 rounded-lg bg-sd-bg"
                  >
                    🎓 {u.name}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT DRAWER */}
      <div className={`fixed inset-0 z-[300] ${drawerOpen ? "" : "pointer-events-none"}`}>
        <div
          className={`absolute inset-0 bg-black/45 transition-opacity duration-300 ${drawerOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setDrawerOpen(false)}
        />
        <div
          className={`absolute top-0 right-0 h-full w-full max-w-md bg-card border-l border-border-custom shadow-xl flex flex-col transition-transform duration-300 ease-in-out ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-custom shrink-0">
            <h2 className="font-syne text-base font-bold text-navy">
              {editingTemplate ? "Modifier le document" : "Nouveau document"}
            </h2>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="text-muted hover:text-text-custom text-lg"
            >
              ✕
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto p-5 flex flex-col gap-4"
          >
            {submitError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-custom">
                {submitError}
              </div>
            )}

            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-semibold text-muted">
                Nom du document *
              </span>
              <input
                type="text"
                required
                className="w-full rounded-lg border border-border-custom bg-white px-2.5 py-2 text-sm text-text-custom outline-none"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Passeport en cours de validité"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-semibold text-muted">
                Catégorie
              </span>
              <select
                className="w-full rounded-lg border border-border-custom bg-white px-2.5 py-2 text-sm text-text-custom outline-none"
                value={form.category}
                onChange={(e) =>
                  updateField("category", e.target.value as DocumentCategory)
                }
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {CATEGORY_LABELS[option]}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-semibold text-muted">
                Statut
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateField("is_required_by_default", true)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${
                    form.is_required_by_default
                      ? "border-orange-custom bg-[#FFF3EC] text-orange-custom"
                      : "border-border-custom bg-white text-muted"
                  }`}
                >
                  Obligatoire
                </button>
                <button
                  type="button"
                  onClick={() => updateField("is_required_by_default", false)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${
                    !form.is_required_by_default
                      ? "border-navy bg-sd-bg text-navy"
                      : "border-border-custom bg-white text-muted"
                  }`}
                >
                  Facultatif
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-semibold text-muted">
                Type d&apos;application
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateField("application_scope", "GENERIC")}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${
                    form.application_scope === "GENERIC"
                      ? "border-navy bg-navy text-white"
                      : "border-border-custom bg-white text-muted"
                  }`}
                >
                  Générique
                </button>
                <button
                  type="button"
                  onClick={() => updateField("application_scope", "SPECIFIC")}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${
                    form.application_scope === "SPECIFIC"
                      ? "border-navy bg-navy text-white"
                      : "border-border-custom bg-white text-muted"
                  }`}
                >
                  Spécifique
                </button>
              </div>
            </div>

            {form.application_scope === "SPECIFIC" && (
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-semibold text-muted">
                  Universités concernées ({form.target_university_ids.length}{" "}
                  sélectionnée
                  {form.target_university_ids.length > 1 ? "s" : ""})
                </span>
                <div className="max-h-40 overflow-y-auto rounded-lg border border-border-custom p-1.5">
                  {universities.length === 0 ? (
                    <div className="px-2 py-3 text-xs text-muted text-center">
                      Aucune université enregistrée.
                    </div>
                  ) : (
                    universities.map((university) => (
                      <label
                        key={university.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-sd-bg cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={form.target_university_ids.includes(
                            university.id,
                          )}
                          onChange={() =>
                            toggleTargetUniversity(university.id)
                          }
                        />
                        <span className="text-sm text-text-custom">
                          {university.name}
                          {university.state ? ` (${university.state})` : ""}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}

            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-semibold text-muted">
                Lien URL du service officiel
              </span>
              <input
                type="text"
                className="w-full rounded-lg border border-border-custom bg-white px-2.5 py-2 text-sm text-text-custom outline-none"
                value={form.external_url}
                onChange={(e) => updateField("external_url", e.target.value)}
                placeholder="https://..."
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-semibold text-muted">
                Tutoriel / guide explicatif
              </span>
              <textarea
                rows={4}
                className="w-full rounded-lg border border-border-custom bg-white px-2.5 py-2 text-sm text-text-custom outline-none resize-none"
                value={form.description_for_player}
                onChange={(e) =>
                  updateField("description_for_player", e.target.value)
                }
                placeholder="Explique au joueur comment obtenir ce document..."
              />
            </label>

            <div className="flex flex-col gap-3 rounded-lg border border-border-custom p-3">
              <span className="text-[12px] font-semibold text-muted">
                Délais (en jours)
              </span>
              <DelaySlider
                label="Prise de rendez-vous"
                value={form.delay_appointment_days}
                onChange={(v) => updateField("delay_appointment_days", v)}
              />
              <DelaySlider
                label="Complétion par le joueur"
                value={form.delay_completion_days}
                onChange={(v) => updateField("delay_completion_days", v)}
              />
              <DelaySlider
                label="Traitement externe"
                value={form.delay_processing_days}
                onChange={(v) => updateField("delay_processing_days", v)}
              />
              <div className="flex items-center justify-between pt-1 border-t border-border-custom">
                <span className="text-xs font-semibold text-muted">
                  Délai total estimé
                </span>
                <span className="text-sm font-bold text-navy">
                  {form.delay_appointment_days +
                    form.delay_completion_days +
                    form.delay_processing_days}{" "}
                  jours
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 sticky bottom-0 bg-card pb-1">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg border border-border-custom px-3.5 py-2 text-sm font-semibold text-text-custom"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-navy px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {submitting
                  ? "Enregistrement..."
                  : editingTemplate
                    ? "Modifier"
                    : "Créer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

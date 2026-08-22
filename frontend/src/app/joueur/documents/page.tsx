"use client";

import { useEffect, useState } from "react";
import {
  getApiFileUrl,
  getPlayerDocuments,
  getUserIdFromCookie,
  uploadPlayerDocument,
  type DocumentApplicationScope,
  type DocumentCategory,
  type PlayerDocumentItem,
} from "@/lib/api";

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

function StatusBadge({ status }: { status: PlayerDocumentItem["status"] }) {
  if (status === "VALIDATED") {
    return (
      <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#E8F8F2] text-[#00876a]">
        ✓ Validé
      </span>
    );
  }
  if (status === "PENDING") {
    return (
      <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#FFF3EC] text-orange-custom">
        🕐 En attente
      </span>
    );
  }
  if (status === "REJECTED") {
    return (
      <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#FDECEC] text-red-custom">
        ✗ Refusé
      </span>
    );
  }
  return (
    <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-sd-bg text-muted">
      Non envoyé
    </span>
  );
}

export default function JoueurDocumentsPage() {
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [documents, setDocuments] = useState<PlayerDocumentItem[]>([]);
  const [activeTab, setActiveTab] =
    useState<DocumentApplicationScope>("GENERIC");
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState("");

  const loadDocuments = async (id: number) => {
    const response = await getPlayerDocuments(id);
    setDocuments(response.items);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const id = getUserIdFromCookie();
        if (!id) {
          throw new Error("Session incomplète: reconnectez-vous.");
        }
        setUserId(id);
        await loadDocuments(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleUpload = async (documentTemplateId: number, file: File) => {
    if (!userId) {
      setUploadError("Session incomplète: reconnectez-vous.");
      return;
    }

    setUploadError("");
    setUploadingId(documentTemplateId);

    try {
      await uploadPlayerDocument(userId, documentTemplateId, file);
      await loadDocuments(userId);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Erreur lors de l'envoi",
      );
    } finally {
      setUploadingId(null);
    }
  };

  const genericDocuments = documents.filter(
    (doc) => doc.application_scope === "GENERIC",
  );
  const specificDocuments = documents.filter(
    (doc) => doc.application_scope === "SPECIFIC",
  );
  const visibleDocuments =
    activeTab === "GENERIC" ? genericDocuments : specificDocuments;
  const missingCount = documents.filter(
    (doc) => doc.status === "MISSING",
  ).length;

  return (
    <section>
      <div className="mb-4 md:mb-5">
        <h1 className="font-syne text-xl md:text-2xl font-extrabold text-navy">
          Documents
        </h1>
        <p className="text-sm text-muted mt-1">
          {documents.length} document{documents.length > 1 ? "s" : ""}{" "}
          demandé{documents.length > 1 ? "s" : ""}
          {missingCount > 0
            ? ` · ${missingCount} restant${missingCount > 1 ? "s" : ""} à fournir`
            : " · tout est envoyé 🎉"}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-custom">
          Connexion API impossible: {error}
        </div>
      )}
      {uploadError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-custom">
          {uploadError}
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
          Documents Génériques ({genericDocuments.length})
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
          Documents Spécifiques ({specificDocuments.length})
        </button>
      </div>

      {loading && (
        <div className="bg-card rounded-2xl border border-border-custom p-8 text-center text-muted text-sm">
          Chargement de vos documents...
        </div>
      )}

      {!loading && visibleDocuments.length === 0 && (
        <div className="bg-card rounded-2xl border border-border-custom p-8 text-center text-muted text-sm">
          {activeTab === "SPECIFIC"
            ? "Aucun document spécifique n'est demandé pour votre université."
            : "Aucun document générique n'est demandé pour le moment."}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {!loading &&
          visibleDocuments.map((doc) => (
            <div
              key={doc.document_template_id}
              className="bg-card rounded-2xl border border-border-custom p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-syne font-bold text-sm text-navy">
                    {doc.name}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CATEGORY_BADGE_CLASSES[doc.category]}`}
                    >
                      {CATEGORY_LABELS[doc.category]}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        doc.is_required_by_default
                          ? "bg-[#FFF3EC] text-orange-custom"
                          : "bg-sd-bg text-muted"
                      }`}
                    >
                      {doc.is_required_by_default ? "Obligatoire" : "Facultatif"}
                    </span>
                  </div>
                </div>
                <StatusBadge status={doc.status} />
              </div>

              {doc.description_for_player && (
                <p className="text-[13px] text-text-custom leading-relaxed mt-2.5">
                  {doc.description_for_player}
                </p>
              )}

              <div className="flex items-center gap-2 flex-wrap mt-2.5">
                {doc.delay_total_days !== null && (
                  <span
                    className="inline-block text-xs font-semibold px-2 py-1 rounded-full bg-[#EEF4FF] text-blue-custom cursor-help"
                    title={`Prise de RDV : ${doc.delay_appointment_days ?? 0} j\nComplétion : ${doc.delay_completion_days ?? 0} j\nTraitement : ${doc.delay_processing_days ?? 0} j`}
                  >
                    ⏱ {doc.delay_total_days} j au total
                  </span>
                )}
                {doc.external_url && (
                  <a
                    href={doc.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-blue-custom hover:underline"
                  >
                    🔗 Site officiel
                  </a>
                )}
                {doc.file_url && (
                  <a
                    href={getApiFileUrl(doc.file_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-navy hover:underline"
                  >
                    📄 Voir mon fichier
                  </a>
                )}
              </div>

              <label className="mt-3 flex items-center justify-center gap-2 border-2 border-dashed border-border-custom rounded-xl px-3 py-3 text-center cursor-pointer transition-all hover:border-green-custom hover:bg-[#F0FFF8]">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  disabled={uploadingId === doc.document_template_id}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleUpload(doc.document_template_id, file);
                    }
                    e.target.value = "";
                  }}
                />
                <span className="text-base">📤</span>
                <span className="text-[12.5px] text-muted">
                  {uploadingId === doc.document_template_id
                    ? "Envoi en cours..."
                    : doc.file_url
                      ? "Remplacer le fichier (PDF, JPG, PNG · 10 Mo max)"
                      : "Déposer votre document (PDF, JPG, PNG · 10 Mo max)"}
                </span>
              </label>
            </div>
          ))}
      </div>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  getApiFileUrl,
  getUserIdFromCookie,
  uploadPlayerDocument,
  type PlayerDocumentItem,
  type PlayerDocumentStatus,
} from "@/lib/api";
import { usePlayerDocuments } from "@/lib/player-documents-context";
import {
  CATEGORY_BADGE_CLASSES,
  CATEGORY_LABELS,
} from "@/lib/document-categories";

// Heuristique de tri provisoire, en attendant qu'AIDEN pilote la vraie
// priorisation. Refusé d'abord, puis manquant (délai total le plus long en
// premier : moins de marge, donc plus urgent à démarrer), puis en attente,
// puis validé. L'appelant ci-dessous n'aura pas à changer quand la vraie
// logique arrivera.
const URGENCY_STATUS_RANK: Record<PlayerDocumentStatus, number> = {
  REJECTED: 0,
  MISSING: 1,
  PENDING: 2,
  VALIDATED: 3,
};

function sortDocumentsByUrgency(
  items: PlayerDocumentItem[],
): PlayerDocumentItem[] {
  return [...items].sort((a, b) => {
    const rankDiff = URGENCY_STATUS_RANK[a.status] - URGENCY_STATUS_RANK[b.status];
    if (rankDiff !== 0) return rankDiff;

    if (a.delay_total_days === null && b.delay_total_days === null) return 0;
    if (a.delay_total_days === null) return 1;
    if (b.delay_total_days === null) return -1;
    return b.delay_total_days - a.delay_total_days;
  });
}

function StatusBadge({ status }: { status: PlayerDocumentStatus }) {
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

function DocumentRow({
  doc,
  isSelected,
  onClick,
}: {
  doc: PlayerDocumentItem;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-card rounded-xl p-3.5 flex items-center gap-3 cursor-pointer transition-all hover:shadow-[0_3px_14px_rgba(15,28,63,0.07)] ${
        isSelected
          ? "border border-green-custom shadow-[0_0_0_2px_rgba(0,196,140,0.15)]"
          : "border border-border-custom hover:border-[#c0cbdf]"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="font-syne font-bold text-sm text-navy truncate">
          {doc.name}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CATEGORY_BADGE_CLASSES[doc.category]}`}
          >
            {CATEGORY_LABELS[doc.category]}
          </span>
          {doc.delay_total_days !== null && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EEF4FF] text-blue-custom">
              ⏱ {doc.delay_total_days} j
            </span>
          )}
        </div>
      </div>
      <StatusBadge status={doc.status} />
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
}

function DocumentDetail({
  doc,
  uploading,
  uploadError,
  draftFile,
  onDraftFileSelected,
  onValidateDraft,
  onDiscardDraft,
}: {
  doc: PlayerDocumentItem | null;
  uploading: boolean;
  uploadError: string;
  draftFile: File | null;
  onDraftFileSelected: (file: File) => void;
  onValidateDraft: () => void;
  onDiscardDraft: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);

  if (!doc) {
    return (
      <div className="p-6 text-center text-muted text-sm">
        Sélectionnez un document dans la liste pour voir le détail.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-syne font-extrabold text-base text-navy">
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
        <div className="mt-4">
          <div className="font-syne text-[11.5px] font-bold uppercase tracking-[0.7px] text-muted mb-2">
            Tutoriel
          </div>
          <p className="text-[13.5px] leading-[1.65] text-text-custom whitespace-pre-wrap">
            {doc.description_for_player}
          </p>
        </div>
      )}

      {doc.admin_comment && (
        <div className="mt-4">
          <div className="font-syne text-[11.5px] font-bold uppercase tracking-[0.7px] text-muted mb-2">
            Commentaire de l&apos;agence
          </div>
          <p
            className={`text-[13.5px] leading-[1.65] rounded-lg border px-3 py-2.5 whitespace-pre-wrap ${
              doc.status === "REJECTED"
                ? "border-red-200 bg-red-50 text-red-custom"
                : "border-border-custom bg-sd-bg text-text-custom"
            }`}
          >
            {doc.admin_comment}
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap mt-4">
        {doc.delay_total_days !== null && (
          <span
            className="inline-block text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#EEF4FF] text-blue-custom cursor-help"
            title={`Prise de RDV : ${doc.delay_appointment_days ?? 0} j\nComplétion : ${doc.delay_completion_days ?? 0} j\nTraitement : ${doc.delay_processing_days ?? 0} j`}
          >
            ⏱ {doc.delay_total_days} j au total (survolez pour le détail)
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

      <div className="mt-4">
        <div className="font-syne text-[11.5px] font-bold uppercase tracking-[0.7px] text-muted mb-2">
          Déposer votre document
        </div>

        {uploadError && (
          <div className="mb-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-custom">
            {uploadError}
          </div>
        )}

        {draftFile ? (
          <div className="rounded-xl border-2 border-blue-custom/40 bg-[#EEF4FF] p-3.5">
            <div className="flex items-center gap-2.5">
              <span className="text-xl shrink-0">📎</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-navy truncate">
                  {draftFile.name}
                </div>
                <div className="text-[11px] text-muted">
                  {formatFileSize(draftFile.size)} · Brouillon, pas encore
                  envoyé
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={onValidateDraft}
                disabled={uploading}
                className="flex-1 rounded-lg bg-green-custom px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {uploading ? "Envoi en cours..." : "✓ Valider l'envoi"}
              </button>
              <button
                type="button"
                onClick={onDiscardDraft}
                disabled={uploading}
                className="rounded-lg border border-border-custom px-3 py-2 text-sm font-semibold text-text-custom disabled:opacity-60"
              >
                Supprimer
              </button>
            </div>
          </div>
        ) : (
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) onDraftFileSelected(file);
            }}
            className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-xl px-3 py-5 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-green-custom bg-[#F0FFF8]"
                : "border-border-custom hover:border-green-custom hover:bg-[#F0FFF8]"
            }`}
          >
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onDraftFileSelected(file);
                e.target.value = "";
              }}
            />
            <div className="text-center">
              <div className="text-2xl mb-1">📤</div>
              <div className="text-[13px] text-muted">
                {doc.file_url
                  ? "Remplacer le fichier"
                  : "Glissez votre fichier ici ou appuyez pour parcourir"}
              </div>
              <div className="text-[11px] text-muted mt-1">
                PDF · JPG · PNG · 10 Mo max
              </div>
            </div>
          </label>
        )}
      </div>
    </div>
  );
}

export default function JoueurPage() {
  const { documents, loading, error, refresh } = usePlayerDocuments();
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    null,
  );
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [draftFile, setDraftFile] = useState<File | null>(null);

  // Auto-sélectionne le document le plus urgent au premier chargement
  // uniquement — les rafraîchissements suivants (après upload) ne doivent
  // pas déplacer la sélection courante du joueur.
  useEffect(() => {
    if (selectedTemplateId === null && documents.length > 0) {
      const first = sortDocumentsByUrgency(documents)[0];
      setSelectedTemplateId(first.document_template_id);
    }
  }, [documents, selectedTemplateId]);

  const handleUpload = async (documentTemplateId: number, file: File) => {
    const userId = getUserIdFromCookie();
    if (!userId) {
      setUploadError("Session incomplète: reconnectez-vous.");
      return;
    }

    setUploadError("");
    setUploadingId(documentTemplateId);

    try {
      await uploadPlayerDocument(userId, documentTemplateId, file);
      await refresh();
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Erreur lors de l'envoi",
      );
    } finally {
      setUploadingId(null);
    }
  };

  const selectDocument = (documentTemplateId: number) => {
    setSelectedTemplateId(documentTemplateId);
    setUploadError("");
    setDraftFile(null);
    setMobileDetailOpen(true);
  };

  const handleValidateDraft = async () => {
    if (!selectedDocument || !draftFile) return;
    await handleUpload(selectedDocument.document_template_id, draftFile);
    setDraftFile(null);
  };

  const handleDiscardDraft = () => {
    setDraftFile(null);
    setUploadError("");
  };

  const sorted = sortDocumentsByUrgency(documents);
  const selectedDocument =
    sorted.find((d) => d.document_template_id === selectedTemplateId) ?? null;

  return (
    <>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-custom">
          Connexion API impossible: {error}
        </div>
      )}

      {loading && (
        <div className="bg-card rounded-2xl border border-border-custom p-8 text-center text-muted text-sm">
          Chargement de vos documents...
        </div>
      )}

      {!loading && documents.length === 0 && (
        <div className="bg-card rounded-2xl border border-border-custom p-8 text-center text-muted text-sm">
          Aucun document n&apos;est demandé pour le moment.
        </div>
      )}

      {!loading && documents.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4 lg:gap-[18px] items-start">
          {/* LIST */}
          <div className="flex flex-col gap-2.5">
            {sorted.map((doc) => (
              <DocumentRow
                key={doc.document_template_id}
                doc={doc}
                isSelected={selectedTemplateId === doc.document_template_id}
                onClick={() => selectDocument(doc.document_template_id)}
              />
            ))}
          </div>

          {/* DETAIL PANEL (desktop) */}
          <div className="hidden lg:block bg-card rounded-[14px] border border-border-custom overflow-hidden sticky top-[220px] max-h-[calc(100vh-240px)] overflow-y-auto">
            <DocumentDetail
              doc={selectedDocument}
              uploading={uploadingId === selectedDocument?.document_template_id}
              uploadError={uploadError}
              draftFile={draftFile}
              onDraftFileSelected={setDraftFile}
              onValidateDraft={handleValidateDraft}
              onDiscardDraft={handleDiscardDraft}
            />
          </div>
        </div>
      )}

      {/* MOBILE DETAIL DRAWER */}
      <div
        className={`fixed inset-0 z-[300] flex-col lg:hidden ${mobileDetailOpen ? "flex" : "hidden"}`}
      >
        <div
          className="flex-[0_0_60px] bg-black/40"
          onClick={() => setMobileDetailOpen(false)}
        ></div>
        <div className="flex-1 bg-card overflow-y-auto rounded-t-[20px]">
          <div className="w-10 h-1 bg-border-custom rounded-full mx-auto mt-2.5"></div>
          <DocumentDetail
            doc={selectedDocument}
            uploading={uploadingId === selectedDocument?.document_template_id}
            uploadError={uploadError}
            draftFile={draftFile}
            onDraftFileSelected={setDraftFile}
            onValidateDraft={handleValidateDraft}
            onDiscardDraft={handleDiscardDraft}
          />
        </div>
      </div>
    </>
  );
}

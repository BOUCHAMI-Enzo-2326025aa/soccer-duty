"use client";

import { useEffect, useState } from "react";
import {
  getApiFileUrl,
  getDocumentReview,
  markNotificationUnread,
  reviewDocument,
  type DocumentReviewDetail,
  type DocumentReviewStatus,
} from "@/lib/api";
import {
  CATEGORY_BADGE_CLASSES,
  CATEGORY_LABELS,
} from "@/lib/document-categories";

export default function DocumentReviewModal({
  documentId,
  notificationId = null,
  onClose,
  onReviewed,
}: {
  documentId: number | null;
  notificationId?: number | null;
  onClose: () => void;
  onReviewed: () => void;
}) {
  const [detail, setDetail] = useState<DocumentReviewDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionMode, setActionMode] = useState<DocumentReviewStatus | null>(
    null,
  );
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [markingUnread, setMarkingUnread] = useState(false);
  const [markedUnread, setMarkedUnread] = useState(false);

  useEffect(() => {
    if (documentId === null) {
      setDetail(null);
      setActionMode(null);
      setComment("");
      setError("");
      setMarkedUnread(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getDocumentReview(documentId);
        setDetail(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [documentId]);

  if (documentId === null) return null;

  const handleMarkNotificationUnread = async () => {
    if (!notificationId) return;

    setMarkingUnread(true);
    try {
      await markNotificationUnread(notificationId);
      setMarkedUnread(true);
    } catch {
      // Action secondaire : un échec ici ne doit pas bloquer la révision du document.
    } finally {
      setMarkingUnread(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!detail || !actionMode) return;

    setSubmitting(true);
    setError("");
    try {
      await reviewDocument(detail.document_id, {
        status: actionMode,
        admin_comment: comment.trim() || null,
      });
      onReviewed();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de l'enregistrement",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-card rounded-2xl border border-border-custom shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-custom">
          <h2 className="font-syne text-base font-bold text-navy">
            Révision du document
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-text-custom text-lg"
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          {loading && (
            <div className="text-sm text-muted text-center py-8">
              Chargement...
            </div>
          )}

          {error && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-custom">
              {error}
            </div>
          )}

          {!loading && detail && (
            <>
              <div className="text-xs font-semibold text-muted">
                {detail.player_name}
              </div>
              <div className="font-syne text-lg font-extrabold text-navy mt-0.5">
                {detail.document_name}
              </div>
              <span
                className={`inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${CATEGORY_BADGE_CLASSES[detail.category]}`}
              >
                {CATEGORY_LABELS[detail.category]}
              </span>

              {detail.description_for_player && (
                <p className="mt-3 text-[13px] text-text-custom leading-relaxed">
                  {detail.description_for_player}
                </p>
              )}

              <div className="flex items-center gap-2 flex-wrap mt-3">
                {detail.file_url && (
                  <a
                    href={getApiFileUrl(detail.file_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-navy hover:underline"
                  >
                    📄 Voir le fichier envoyé
                  </a>
                )}
                {detail.external_url && (
                  <a
                    href={detail.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-blue-custom hover:underline"
                  >
                    🔗 Site officiel
                  </a>
                )}
              </div>

              {detail.submitted_at && (
                <div className="text-[11px] text-muted mt-2">
                  Envoyé le{" "}
                  {new Date(detail.submitted_at).toLocaleString("fr-FR")}
                </div>
              )}

              {notificationId && (
                <button
                  type="button"
                  onClick={handleMarkNotificationUnread}
                  disabled={markingUnread || markedUnread}
                  className="mt-2 text-xs font-semibold text-muted hover:text-navy disabled:opacity-60 disabled:hover:text-muted"
                >
                  {markedUnread
                    ? "✓ Notification marquée comme non lue"
                    : markingUnread
                      ? "..."
                      : "🔔 Marquer la notification comme non lue"}
                </button>
              )}

              <div className="mt-5 pt-4 border-t border-border-custom">
                {detail.status === "PENDING" ? (
                  <>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setActionMode("VALIDATED")}
                        className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all ${
                          actionMode === "VALIDATED"
                            ? "border-green-custom bg-[#E8F8F2] text-[#00876a]"
                            : "border-border-custom bg-white text-text-custom hover:border-green-custom"
                        }`}
                      >
                        ✓ Valider
                      </button>
                      <button
                        type="button"
                        onClick={() => setActionMode("REJECTED")}
                        className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all ${
                          actionMode === "REJECTED"
                            ? "border-red-custom bg-[#FDECEC] text-red-custom"
                            : "border-border-custom bg-white text-text-custom hover:border-red-custom"
                        }`}
                      >
                        ✗ Refuser
                      </button>
                    </div>

                    {actionMode && (
                      <div className="mt-3">
                        <label className="text-[12px] font-semibold text-muted">
                          Commentaire{" "}
                          {actionMode === "REJECTED"
                            ? "— pourquoi ce refus ? (visible par le joueur)"
                            : "(facultatif, visible par le joueur)"}
                        </label>
                        <textarea
                          rows={3}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder={
                            actionMode === "REJECTED"
                              ? "Ex : document illisible, date de validité expirée..."
                              : "Un mot pour le joueur (optionnel)..."
                          }
                          className="mt-1 w-full rounded-lg border border-border-custom bg-white px-2.5 py-2 text-sm text-text-custom outline-none resize-none"
                        />
                        <div className="flex justify-end gap-2 mt-2.5">
                          <button
                            type="button"
                            onClick={() => setActionMode(null)}
                            disabled={submitting}
                            className="rounded-lg border border-border-custom px-3.5 py-2 text-sm font-semibold text-text-custom disabled:opacity-60"
                          >
                            Annuler
                          </button>
                          <button
                            type="button"
                            onClick={handleSubmitReview}
                            disabled={submitting}
                            className={`rounded-lg px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-60 ${
                              actionMode === "REJECTED"
                                ? "bg-red-custom"
                                : "bg-green-custom"
                            }`}
                          >
                            {submitting
                              ? "Envoi..."
                              : actionMode === "REJECTED"
                                ? "Confirmer le refus"
                                : "Confirmer la validation"}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                          detail.status === "VALIDATED"
                            ? "bg-[#E8F8F2] text-[#00876a]"
                            : "bg-[#FDECEC] text-red-custom"
                        }`}
                      >
                        {detail.status === "VALIDATED" ? "✓ Validé" : "✗ Refusé"}
                      </span>
                      {detail.reviewed_at && (
                        <span className="text-[11px] text-muted">
                          le{" "}
                          {new Date(detail.reviewed_at).toLocaleString(
                            "fr-FR",
                          )}
                        </span>
                      )}
                    </div>
                    {detail.admin_comment && (
                      <p className="mt-2.5 text-[13px] text-text-custom bg-sd-bg rounded-lg px-3 py-2 whitespace-pre-wrap">
                        {detail.admin_comment}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

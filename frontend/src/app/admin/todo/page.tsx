"use client";

import { useEffect, useState } from "react";
import {
  getAdminTodo,
  getUserIdFromCookie,
  type AdminPendingDocument,
} from "@/lib/api";
import DocumentReviewModal from "@/components/admin/DocumentReviewModal";

export default function AdminTodoPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingDocuments, setPendingDocuments] = useState<
    AdminPendingDocument[]
  >([]);
  const [openDocumentId, setOpenDocumentId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const adminUserId = getUserIdFromCookie();
      const response = await getAdminTodo(adminUserId);
      setPendingDocuments(response.pending_documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <section>
      <div className="mb-4 md:mb-5">
        <h1 className="font-syne text-xl md:text-2xl font-extrabold text-navy">
          To-Do List
        </h1>
        <p className="text-sm text-muted mt-1">
          {pendingDocuments.length} tâche{pendingDocuments.length > 1 ? "s" : ""}{" "}
          à traiter
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-custom">
          Connexion API impossible: {error}
        </div>
      )}

      <div className="font-syne text-[11.5px] font-bold uppercase tracking-[0.7px] text-muted mb-2">
        Notifications
      </div>

      <div className="flex flex-col gap-2">
        {loading && (
          <div className="bg-card rounded-xl border border-border-custom p-6 text-center text-muted text-sm">
            Chargement...
          </div>
        )}

        {!loading && pendingDocuments.length === 0 && (
          <div className="bg-card rounded-xl border border-border-custom p-6 text-center text-muted text-sm">
            Aucune validation de document en attente.
          </div>
        )}

        {!loading &&
          pendingDocuments.map((doc) => (
            <div
              key={doc.document_id}
              onClick={() => setOpenDocumentId(doc.document_id)}
              className="bg-card rounded-xl border border-border-custom p-3.5 flex items-center gap-3 cursor-pointer transition-all hover:border-[#c0cbdf]"
            >
              <span className="text-lg shrink-0">📄</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-navy">
                  Document en attente de validation
                </div>
                <div className="text-[12.5px] text-text-custom mt-0.5 truncate">
                  {doc.player_name} — {doc.document_name}
                </div>
              </div>
              {doc.submitted_at && (
                <span className="text-[11px] text-muted shrink-0">
                  {new Date(doc.submitted_at).toLocaleDateString("fr-FR")}
                </span>
              )}
            </div>
          ))}
      </div>

      <DocumentReviewModal
        documentId={openDocumentId}
        onClose={() => {
          setOpenDocumentId(null);
          load();
        }}
        onReviewed={load}
      />
    </section>
  );
}

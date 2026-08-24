"use client";

import { useEffect, useState } from "react";
import {
  getAdminNotifications,
  getUserIdFromCookie,
  type AdminNotification,
} from "@/lib/api";
import DocumentReviewModal from "@/components/admin/DocumentReviewModal";

export default function AdminNotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [openDocumentId, setOpenDocumentId] = useState<number | null>(null);
  const [openNotificationId, setOpenNotificationId] = useState<number | null>(
    null,
  );

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const adminUserId = getUserIdFromCookie();
      const response = await getAdminNotifications(adminUserId);
      setNotifications(response.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <section>
      <div className="mb-4 md:mb-5">
        <h1 className="font-syne text-xl md:text-2xl font-extrabold text-navy">
          Notifications
        </h1>
        <p className="text-sm text-muted mt-1">
          {notifications.length} notification
          {notifications.length > 1 ? "s" : ""}
          {unreadCount > 0
            ? ` · ${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
            : ""}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-custom">
          Connexion API impossible: {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {loading && (
          <div className="bg-card rounded-xl border border-border-custom p-6 text-center text-muted text-sm">
            Chargement...
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="bg-card rounded-xl border border-border-custom p-6 text-center text-muted text-sm">
            Aucune notification pour le moment.
          </div>
        )}

        {!loading &&
          notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => {
                if (notification.related_document_id) {
                  setOpenDocumentId(notification.related_document_id);
                  setOpenNotificationId(notification.id);
                }
              }}
              className={`rounded-xl border p-3.5 flex items-start gap-3 transition-all ${
                notification.related_document_id
                  ? "cursor-pointer hover:border-[#c0cbdf]"
                  : ""
              } ${
                notification.is_read
                  ? "bg-sd-bg border-border-custom opacity-60 hover:opacity-100"
                  : "border-blue-custom/40 bg-[#EEF4FF]"
              }`}
            >
              <span className="text-lg shrink-0">📄</span>
              <div className="flex-1 min-w-0">
                <div
                  className={`text-sm font-semibold ${notification.is_read ? "text-muted" : "text-navy"}`}
                >
                  {notification.title}
                </div>
                <div
                  className={`text-[13px] mt-0.5 ${notification.is_read ? "text-muted" : "text-text-custom"}`}
                >
                  {notification.content}
                </div>
                {notification.created_at && (
                  <div className="text-[11px] text-muted mt-1">
                    {new Date(notification.created_at).toLocaleString(
                      "fr-FR",
                    )}
                  </div>
                )}
              </div>
              {!notification.is_read && (
                <div className="w-2 h-2 rounded-full bg-blue-custom shrink-0 mt-1.5"></div>
              )}
            </div>
          ))}
      </div>

      <DocumentReviewModal
        documentId={openDocumentId}
        notificationId={openNotificationId}
        onClose={() => {
          setOpenDocumentId(null);
          setOpenNotificationId(null);
          load();
        }}
        onReviewed={load}
      />
    </section>
  );
}

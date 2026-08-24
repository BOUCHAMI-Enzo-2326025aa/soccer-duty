"use client";

import { useEffect, useState } from "react";
import {
  getPlayerNotifications,
  getUserIdFromCookie,
  markNotificationRead,
  markNotificationUnread,
  type PlayerNotification,
} from "@/lib/api";

export default function JoueurNotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState<PlayerNotification[]>(
    [],
  );
  const [selected, setSelected] = useState<PlayerNotification | null>(null);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const userId = getUserIdFromCookie();
      if (!userId) {
        throw new Error("Session incomplète: reconnectez-vous.");
      }

      const response = await getPlayerNotifications(userId);
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

  const openNotification = async (notification: PlayerNotification) => {
    setSelected(notification);

    if (!notification.is_read) {
      try {
        const updated = await markNotificationRead(notification.id);
        setSelected(updated);
        setNotifications((prev) =>
          prev.map((n) => (n.id === updated.id ? updated : n)),
        );
      } catch {
        // Le popup reste ouvert même si le marquage "lu" échoue.
      }
    }
  };

  const handleMarkUnread = async () => {
    if (!selected) return;

    setUpdating(true);
    try {
      const updated = await markNotificationUnread(selected.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === updated.id ? updated : n)),
      );
      setSelected(null);
    } catch {
      // Rien de plus à faire : la liste garde son état précédent.
    } finally {
      setUpdating(false);
    }
  };

  return (
    <section>
      <div className="mb-4 md:mb-5">
        <h1 className="font-syne text-xl md:text-2xl font-extrabold text-navy">
          Notifications
        </h1>
        <p className="text-sm text-muted mt-1">
          {notifications.length} notification
          {notifications.length > 1 ? "s" : ""}
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
              onClick={() => openNotification(notification)}
              className={`rounded-xl border p-3.5 flex items-start gap-3 cursor-pointer transition-all ${
                notification.is_read
                  ? "bg-sd-bg border-border-custom opacity-60 hover:opacity-100"
                  : "border-blue-custom/40 bg-[#EEF4FF] hover:border-blue-custom"
              }`}
            >
              <span className="text-lg shrink-0">🔔</span>
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

      {selected && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/45"
            onClick={() => setSelected(null)}
          />
          <div className="relative w-full max-w-md bg-card rounded-2xl border border-border-custom shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-custom">
              <h2 className="font-syne text-base font-bold text-navy">
                {selected.title}
              </h2>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-muted hover:text-text-custom text-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-text-custom leading-relaxed whitespace-pre-wrap">
                {selected.content}
              </p>
              {selected.created_at && (
                <div className="text-[11px] text-muted mt-3">
                  {new Date(selected.created_at).toLocaleString("fr-FR")}
                </div>
              )}
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={handleMarkUnread}
                  disabled={updating}
                  className="rounded-lg border border-border-custom px-3.5 py-2 text-sm font-semibold text-text-custom disabled:opacity-60"
                >
                  {updating ? "..." : "Marquer comme non lu"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

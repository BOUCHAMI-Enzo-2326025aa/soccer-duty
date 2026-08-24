"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  getPlayerDocuments,
  getUserIdFromCookie,
  type PlayerDocumentItem,
} from "./api";

type PlayerDocumentsContextValue = {
  documents: PlayerDocumentItem[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
};

const PlayerDocumentsContext = createContext<PlayerDocumentsContextValue | null>(
  null,
);

export function PlayerDocumentsProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<PlayerDocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const userId = getUserIdFromCookie();
    if (!userId) {
      setError("Session incomplète: reconnectez-vous.");
      return;
    }

    try {
      const response = await getPlayerDocuments(userId);
      setDocuments(response.items);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await refresh();
      setLoading(false);
    };

    load();
  }, [refresh]);

  return (
    <PlayerDocumentsContext.Provider value={{ documents, loading, error, refresh }}>
      {children}
    </PlayerDocumentsContext.Provider>
  );
}

export function usePlayerDocuments(): PlayerDocumentsContextValue {
  const ctx = useContext(PlayerDocumentsContext);
  if (!ctx) {
    throw new Error(
      "usePlayerDocuments doit être utilisé à l'intérieur d'un <PlayerDocumentsProvider>",
    );
  }
  return ctx;
}

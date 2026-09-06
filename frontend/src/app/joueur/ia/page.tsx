"use client";

import { useState } from "react";
import { callAiden } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
  degraded?: boolean;
};

type AiGenerateResult = {
  text: string;
  model_id: string;
  trust?: { degraded?: boolean };
};

export default function JoueurIaPage() {
  const { tenant } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sendQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setError("");
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setLoading(true);

    try {
      const response = await callAiden<AiGenerateResult>("ai_generate", {
        task: "questions_joueur",
        agency_id: tenant ?? "GLOBAL",
        user_input: question,
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: response.result.text,
          degraded: response.result.trust?.degraded,
        },
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "L'assistant IA est momentanément indisponible.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <div className="mb-4 md:mb-5">
        <h1 className="font-syne text-xl md:text-2xl font-extrabold text-navy">
          Assistant IA
        </h1>
        <p className="text-sm text-muted mt-1">
          Pose tes questions sur ton dossier, les documents ou les démarches.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-custom">
          {error}
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border-custom flex flex-col h-[70vh] max-h-[640px]">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-sm text-muted text-center mt-10">
              Pose une question — ex. « Quels documents dois-je fournir pour
              mon dossier NCAA ? »
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm ${
                  msg.role === "user"
                    ? "bg-navy text-white"
                    : "bg-sd-bg text-text-custom border border-border-custom"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
                {msg.role === "assistant" && msg.degraded && (
                  <div className="mt-1.5 text-[10px] text-muted">
                    Réponse générée automatiquement — vérifie les points
                    importants avec ton agence.
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="text-xs text-muted">L&apos;assistant réfléchit...</div>
          )}
        </div>

        <form
          onSubmit={sendQuestion}
          className="flex gap-2 border-t border-border-custom p-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pose ta question..."
            className="flex-1 rounded-lg border border-border-custom bg-white px-3 py-2 text-sm outline-none focus:border-green-custom"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-lg bg-green-custom px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Envoyer
          </button>
        </form>
      </div>
    </section>
  );
}

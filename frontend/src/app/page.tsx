"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login as loginRequest } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

  // États pour stocker ce que l'utilisateur tape
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Empêche la page de se recharger
    setError("");
    setIsLoading(true);

    try {
      const data = await loginRequest(email, password);

      // --- On sauvegarde le badge dans les cookies (valable 1 jour) ---
      document.cookie = `token=${data.token}; path=/; max-age=86400`;
      document.cookie = `role=${data.role}; path=/; max-age=86400`;
      document.cookie = `user_id=${data.user_id}; path=/; max-age=86400`;

      // LA MAGIE OPÈRE ICI : Redirection selon le rôle !
      if (data.role === "AGENCY_ADMIN") {
        router.push("/admin");
      } else if (data.role === "PLAYER") {
        router.push("/joueur");
      } else {
        setError("Rôle non reconnu.");
        setIsLoading(false);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de se connecter au serveur. Vérifie que FastAPI tourne.",
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-border-custom w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-navy font-syne mb-2">
            Soccer Duty
          </h1>
          <p className="text-muted text-sm">Connectez-vous à votre espace</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 text-slate-900">
          <div>
            <label className="block text-sm font-semibold text-text-custom mb-1.5">
              Adresse email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border-custom bg-sd-bg outline-none focus:border-green-custom transition-colors"
              placeholder="prenom.nom@soccerduty.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-custom mb-1.5">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border-custom bg-sd-bg outline-none focus:border-green-custom transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-custom text-sm font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-custom text-white font-bold py-3 rounded-lg hover:bg-opacity-90 transition-opacity mt-4 flex justify-center items-center"
          >
            {isLoading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}

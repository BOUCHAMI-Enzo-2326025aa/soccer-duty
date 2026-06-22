// frontend/src/lib/api.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// Fonction pour récupérer toutes les agences
export async function getAgencies() {
  // Le cache: 'no-store' permet d'avoir les données en temps réel (pas de mise en cache)
  const response = await fetch(`${API_URL}/agencies/`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Erreur lors de la récupération des agences");
  }

  return response.json();
}

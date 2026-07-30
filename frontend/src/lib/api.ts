const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000" || "http://localhost:8000";

type ApiRequestOptions = RequestInit & {
  auth?: boolean;
};

export type LoginResponse = {
  message: string;
  user_id: number;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "PLAYER" | "DEVELOPER" | "SUPPORT" | "AI";
  token: string;
  tenant: string; // Ajout du tenant AIDEN (ex: "GLOBAL" ou "1")
};

type AdminHomeResponse = {
  users_count: number;
  players_count: number;
  documents_count: number;
};

export type AdminPlayer = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  university_id: number | null;
  university_name: string;
  progress_percentage: number;
  dossier_stage: "Trad" | "Eval" | "Done";
  recruitment_status:
    | "Prospection"
    | "Offres en attente"
    | "NLI Signée"
    | "Paiement en attente"
    | "I-20 reçu"
    | "Immigration effectuée"
    | "Visa reçu";
  service_plan: "Formule A" | "Formule B";
  acquisition_channel:
    | "Instagram"
    | "TikTok"
    | "Bouche à oreille"
    | "Formulaire";
  intake_period: "Spring" | "Fall";
};

export type UpdateAdminPlayerPayload = {
  phone: string | null;
  dossier_stage: "Trad" | "Eval" | "Done";
  recruitment_status:
    | "Prospection"
    | "Offres en attente"
    | "NLI Signée"
    | "Paiement en attente"
    | "I-20 reçu"
    | "Immigration effectuée"
    | "Visa reçu";
  service_plan: "Formule A" | "Formule B";
  acquisition_channel:
    | "Instagram"
    | "TikTok"
    | "Bouche à oreille"
    | "Formulaire";
  intake_period: "Spring" | "Fall";
};

type ListResponse<T> = {
  count: number;
  items: T[];
};

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;

  const row = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!row) return null;
  return decodeURIComponent(row.split("=").slice(1).join("="));
}

export function getUserIdFromCookie(): number | null {
  const value = getCookieValue("user_id");
  if (!value) return null;

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function getTokenFromCookie(): string | null {
  return getCookieValue("token");
}

async function apiFetch<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { auth = true, headers, ...rest } = options;
  const finalHeaders = new Headers(headers || {});

  if (auth) {
    const token = getTokenFromCookie();
    if (!token) {
      throw new Error("Token introuvable. Merci de vous reconnecter.");
    }
    finalHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    let detail = `Erreur API (${response.status})`;
    try {
      const data = await response.json();
      if (data?.detail) {
        // Si c'est un texte simple, on l'affiche directement
        if (typeof data.detail === "string") {
          detail = data.detail;
        } else {
          // Si c'est un objet ou tableau (erreur FastAPI 422 par exemple)
          // on le transforme en texte lisible pour ne pas avoir "[object Object]"
          detail = JSON.stringify(data.detail);
        }
      }
    } catch {
      // Garder le message générique si la réponse n'est pas du JSON
    }
    throw new Error(detail);
  }

  return response.json() as Promise<T>;
}

export async function login(email: string, password: string) {
  return apiFetch<LoginResponse>("/auth/login", {
    auth: false,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
}

export async function getAgencies() {
  return apiFetch<Array<{ id: number; name: string; created_at: string }>>(
    "/agencies/",
  );
}

export async function getAdminHome() {
  return apiFetch<AdminHomeResponse>("/admin/accueil");
}

export async function getAdminUniversities() {
  return apiFetch<ListResponse<{ id: number }>>("/admin/universites");
}

export async function getAdminTodo() {
  return apiFetch<{
    pending_documents: Array<{ id: number }>;
    upcoming_milestones: Array<{ id: number }>;
    rejected_documents: Array<{ id: number }>;
    ready_players: Array<{ id: number }>;
  }>("/admin/todo");
}

export async function getAdminPlayers(adminUserId?: number | null) {
  const query =
    adminUserId && Number.isFinite(adminUserId)
      ? `?admin_user_id=${adminUserId}`
      : "";
  return apiFetch<ListResponse<AdminPlayer>>(`/admin/joueurs${query}`);
}

export async function updateAdminPlayer(
  playerId: number,
  payload: UpdateAdminPlayerPayload,
  adminUserId: number,
) {
  return apiFetch<AdminPlayer>(
    `/admin/joueurs/${playerId}?admin_user_id=${adminUserId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
}

export async function getAdminNotifications() {
  return apiFetch<ListResponse<{ id: number }>>("/admin/notifications");
}

export async function getPlayerDossier(userId: number) {
  return apiFetch<{
    player: {
      profile_id: number;
      first_name: string;
      last_name: string;
      progress_percentage: number;
    };
    documents: Array<{
      id: number;
      status: string;
      document_template_id: number;
    }>;
    milestones: Array<{ id: number; name: string; status: string }>;
  }>(`/player/dossier/${userId}`);
}

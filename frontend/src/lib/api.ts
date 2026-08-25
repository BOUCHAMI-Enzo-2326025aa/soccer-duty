const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000" || "http://localhost:8000";

export function getApiFileUrl(path: string): string {
  return `${API_URL}${path}`;
}

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
  university_logo: string | null;
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
  pending_documents_count: number;
  documents_total: number;
  documents_validated: number;
  documents_pending: number;
  progress_percentage_real: number;
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

export function getRoleFromCookie(): LoginResponse["role"] | null {
  return getCookieValue("role") as LoginResponse["role"] | null;
}

export function getTenantFromCookie(): string | null {
  return getCookieValue("tenant");
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

export async function logout() {
  return apiFetch<{ message: string }>("/auth/logout", {
    auth: false,
    method: "POST",
  });
}

export type AidenOperation =
  | "ai_generate"
  | "context"
  | "memory"
  | "workflow"
  | "notify"
  | "ocr"
  | "process_document"
  | "review_action"
  | "compose"
  | "decide"
  | "analytics"
  | "product"
  | "mission";

// Appelle le proxy /aiden/{operation} du backend. La session AIDEN vit dans
// des cookies httpOnly posés au login : pas de token à gérer ici, apiFetch
// envoie déjà les cookies via credentials: "include".
export async function callAiden<T = unknown>(
  operation: AidenOperation,
  payload: Record<string, unknown> = {},
) {
  return apiFetch<{ result: T; security_context_sig: string }>(
    `/aiden/${operation}`,
    {
      auth: false,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ payload }),
    },
  );
}

export async function getAgencies() {
  return apiFetch<Array<{ id: number; name: string; created_at: string }>>(
    "/agencies/",
  );
}

export async function getAdminHome() {
  return apiFetch<AdminHomeResponse>("/admin/accueil");
}

export type University = {
  id: number;
  name: string;
  logo: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  division: string | null;
  website: string | null;
  conference: string | null;
  contact_email: string | null;
};

export type CreateUniversityPayload = {
  name: string;
  logo: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  division: string | null;
  website: string | null;
  conference: string | null;
  contact_email: string | null;
};

export async function getAdminUniversities() {
  return apiFetch<ListResponse<University>>("/admin/universites");
}

export async function createUniversity(payload: CreateUniversityPayload) {
  return apiFetch<University>("/universities/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export type DocumentCategory =
  | "IDENTITE"
  | "ACADEMIQUE"
  | "MEDICAL"
  | "VISA"
  | "SPORT"
  | "FINANCIER";

export type DocumentApplicationScope = "GENERIC" | "SPECIFIC";

export type DocumentTemplate = {
  id: number;
  agency_id: number | null;
  name: string;
  category: DocumentCategory;
  is_required_by_default: boolean;
  description_for_player: string | null;
  external_url: string | null;
  application_scope: DocumentApplicationScope;
  delay_appointment_days: number | null;
  delay_completion_days: number | null;
  delay_processing_days: number | null;
  delay_total_days: number | null;
  target_universities: Array<{ id: number; name: string }>;
};

export type SaveDocumentTemplatePayload = {
  name: string;
  category: DocumentCategory;
  is_required_by_default: boolean;
  description_for_player: string | null;
  external_url: string | null;
  application_scope: DocumentApplicationScope;
  target_university_ids: number[];
  delay_appointment_days: number | null;
  delay_completion_days: number | null;
  delay_processing_days: number | null;
};

export async function getAdminDocumentTemplates() {
  return apiFetch<ListResponse<DocumentTemplate>>("/admin/documents");
}

export async function createDocumentTemplate(
  payload: SaveDocumentTemplatePayload,
) {
  return apiFetch<DocumentTemplate>("/admin/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateDocumentTemplate(
  templateId: number,
  payload: SaveDocumentTemplatePayload,
) {
  return apiFetch<DocumentTemplate>(`/admin/documents/${templateId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteDocumentTemplate(templateId: number) {
  return apiFetch<{ message: string }>(`/admin/documents/${templateId}`, {
    method: "DELETE",
  });
}

export type AdminPendingDocument = {
  document_id: number;
  player_id: number;
  player_name: string;
  document_template_id: number;
  document_name: string;
  category: DocumentCategory;
  submitted_at: string | null;
};

export async function getAdminTodo() {
  return apiFetch<{
    pending_documents: AdminPendingDocument[];
    upcoming_milestones: Array<{ id: number }>;
    rejected_documents: Array<{ id: number }>;
    ready_players: Array<{ id: number }>;
  }>("/admin/todo");
}

export async function getAdminPlayers() {
  return apiFetch<ListResponse<AdminPlayer>>("/admin/joueurs");
}

export async function getAdminPlayerDocuments(playerId: number) {
  return apiFetch<ListResponse<PlayerDocumentItem>>(
    `/admin/joueurs/${playerId}/documents`,
  );
}

export async function updateAdminPlayer(
  playerId: number,
  payload: UpdateAdminPlayerPayload,
) {
  return apiFetch<AdminPlayer>(`/admin/joueurs/${playerId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export type AdminNotification = {
  id: number;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string | null;
  related_document_id: number | null;
};

export async function getAdminNotifications() {
  return apiFetch<ListResponse<AdminNotification>>("/admin/notifications");
}

export type PlayerNotification = AdminNotification;

export async function getPlayerNotifications(userId: number) {
  return apiFetch<ListResponse<PlayerNotification>>(
    `/player/notifications/${userId}`,
  );
}

export async function markNotificationRead(notificationId: number) {
  return apiFetch<PlayerNotification>(
    `/notifications/${notificationId}/read`,
    { method: "PATCH" },
  );
}

export async function markNotificationUnread(notificationId: number) {
  return apiFetch<PlayerNotification>(
    `/notifications/${notificationId}/unread`,
    { method: "PATCH" },
  );
}

export type PlayerProfileResponse = {
  profile: {
    id: number;
    first_name: string;
    last_name: string;
    date_of_birth: string | null;
    university_id: number | null;
  };
  university: { id: number; name: string } | null;
};

export async function getPlayerProfile(userId: number) {
  return apiFetch<PlayerProfileResponse>(`/player/profil/${userId}`);
}

export type DocumentReviewStatus = "VALIDATED" | "REJECTED";

export type DocumentReviewDetail = {
  document_id: number;
  status: PlayerDocumentStatus;
  file_url: string | null;
  admin_comment: string | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  submitted_at: string | null;
  player_id: number;
  player_name: string;
  document_template_id: number;
  document_name: string;
  category: DocumentCategory;
  description_for_player: string | null;
  external_url: string | null;
};

export async function getDocumentReview(documentId: number) {
  return apiFetch<DocumentReviewDetail>(`/documents/${documentId}`);
}

export async function reviewDocument(
  documentId: number,
  payload: { status: DocumentReviewStatus; admin_comment: string | null },
) {
  return apiFetch<DocumentReviewDetail>(`/documents/${documentId}/review`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
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

export type PlayerDocumentStatus =
  | "MISSING"
  | "PENDING"
  | "VALIDATED"
  | "REJECTED";

export type PlayerDocumentItem = {
  document_template_id: number;
  name: string;
  category: DocumentCategory;
  is_required_by_default: boolean;
  description_for_player: string | null;
  external_url: string | null;
  application_scope: DocumentApplicationScope;
  delay_appointment_days: number | null;
  delay_completion_days: number | null;
  delay_processing_days: number | null;
  delay_total_days: number | null;
  document_id: number | null;
  status: PlayerDocumentStatus;
  file_url: string | null;
  admin_comment: string | null;
  updated_at: string | null;
};

export async function getPlayerDocuments(userId: number) {
  return apiFetch<ListResponse<PlayerDocumentItem>>(
    `/player/documents/${userId}`,
  );
}

export async function uploadPlayerDocument(
  userId: number,
  documentTemplateId: number,
  file: File,
) {
  const formData = new FormData();
  formData.append("user_id", String(userId));
  formData.append("document_template_id", String(documentTemplateId));
  formData.append("file", file);

  return apiFetch<{
    id: number;
    player_id: number;
    document_template_id: number;
    status: PlayerDocumentStatus;
    s3_url: string | null;
  }>("/documents/upload", {
    method: "POST",
    body: formData,
  });
}

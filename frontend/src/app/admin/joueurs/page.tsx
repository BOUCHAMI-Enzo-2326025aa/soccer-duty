"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getAdminPlayers,
  getAdminTodo,
  getAdminUniversities,
  getUserIdFromCookie,
  updateAdminPlayer,
  type AdminPendingDocument,
  type AdminPlayer,
  type University,
} from "@/lib/api";
import DocumentReviewModal from "@/components/admin/DocumentReviewModal";
import CreatePlayerModal from "@/components/admin/CreatePlayerModal";

type DossierOption = "Trad" | "Eval" | "Done";
type StatutOption =
  | "Prospection"
  | "Offres en attente"
  | "NLI Signée"
  | "Paiement en attente"
  | "I-20 reçu"
  | "Immigration effectuée"
  | "Visa reçu";
type ServiceOption = "Formule A" | "Formule B";
type CanalOption =
  | "Instagram"
  | "TikTok"
  | "Bouche à oreille"
  | "Formulaire";
type PeriodeOption = "Spring" | "Fall";

type RowSelection = {
  phone: string;
  dossier: DossierOption;
  statut: StatutOption;
  service: ServiceOption;
  canal: CanalOption;
  periode: PeriodeOption;
  universityId: number | null;
};

const DOSSIER_OPTIONS: DossierOption[] = ["Trad", "Eval", "Done"];
const STATUT_OPTIONS: StatutOption[] = [
  "Prospection",
  "Offres en attente",
  "NLI Signée",
  "Paiement en attente",
  "I-20 reçu",
  "Immigration effectuée",
  "Visa reçu",
];
const SERVICE_OPTIONS: ServiceOption[] = ["Formule A", "Formule B"];
const CANAL_OPTIONS: CanalOption[] = [
  "Instagram",
  "TikTok",
  "Bouche à oreille",
  "Formulaire",
];
const PERIODE_OPTIONS: PeriodeOption[] = ["Spring", "Fall"];

const INITIALS_STOPWORDS = new Set([
  "of",
  "the",
  "and",
  "de",
  "des",
  "du",
  "la",
  "le",
  "les",
]);

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";

  const words = trimmed.replace(/[(),]/g, " ").split(/\s+/).filter(Boolean);

  // Un mot deja tout en majuscules ("UCLA", "NYU", "IMT") est un abrege
  // fourni par l'etablissement lui-meme : on le reprend tel quel (jusqu'a
  // 4 lettres) plutot que d'en tirer des initiales artificielles.
  const acronym = words.find((word) => {
    const letters = word.replace(/[^A-Za-z]/g, "");
    return letters.length >= 2 && letters === letters.toUpperCase();
  });
  if (acronym) {
    const letters = acronym.replace(/[^A-Za-z]/g, "");
    return letters.length <= 4 ? letters : letters.slice(0, 2);
  }

  const meaningfulWords = words.filter(
    (word) => !INITIALS_STOPWORDS.has(word.toLowerCase()),
  );

  return (
    meaningfulWords
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("") || "?"
  );
}

const DEFAULT_SELECTION: RowSelection = {
  phone: "",
  dossier: "Trad",
  statut: "Prospection",
  service: "Formule A",
  canal: "Formulaire",
  periode: "Spring",
  universityId: null,
};

function getDossierClasses(value: DossierOption): string {
  switch (value) {
    case "Done":
      return "border-green-custom/30 bg-[#E8F8F2] text-[#00876a]";
    case "Eval":
      return "border-blue-custom/30 bg-[#EEF4FF] text-blue-custom";
    case "Trad":
    default:
      return "border-orange-custom/30 bg-[#FFF3EC] text-orange-custom";
  }
}

function getStatutClasses(value: StatutOption): string {
  switch (value) {
    case "Visa reçu":
    case "Immigration effectuée":
    case "I-20 reçu":
      return "border-green-custom/30 bg-[#E8F8F2] text-[#00876a]";
    case "NLI Signée":
    case "Paiement en attente":
    case "Offres en attente":
      return "border-blue-custom/30 bg-[#EEF4FF] text-blue-custom";
    case "Prospection":
    default:
      return "border-orange-custom/30 bg-[#FFF3EC] text-orange-custom";
  }
}

export default function AdminPlayersPage() {
  const [adminUserId, setAdminUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [players, setPlayers] = useState<AdminPlayer[]>([]);
  const [selections, setSelections] = useState<Record<number, RowSelection>>({});
  const [savingRows, setSavingRows] = useState<Record<number, boolean>>({});
  const [saveInfo, setSaveInfo] = useState<Record<number, string>>({});
  const [pendingDocuments, setPendingDocuments] = useState<
    AdminPendingDocument[]
  >([]);
  const [openDocumentId, setOpenDocumentId] = useState<number | null>(null);
  const [universities, setUniversities] = useState<University[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const loadPlayers = async () => {
    setLoading(true);
    setError("");

    try {
      const userId = getUserIdFromCookie();
      if (!userId) {
        throw new Error("Session admin introuvable. Reconnectez-vous.");
      }

      setAdminUserId(userId);
      const [response, todo, universitiesResponse] = await Promise.all([
        getAdminPlayers(),
        getAdminTodo(),
        getAdminUniversities(),
      ]);
      setPlayers(response.items);
      setPendingDocuments(todo.pending_documents);
      setUniversities(universitiesResponse.items);

      const initialSelections: Record<number, RowSelection> = {};
      for (const player of response.items) {
        initialSelections[player.id] = {
          phone: player.phone || "",
          dossier: player.dossier_stage,
          statut: player.recruitment_status,
          service: player.service_plan,
          canal: player.acquisition_channel,
          periode: player.intake_period,
          universityId: player.university_id,
        };
      }
      setSelections(initialSelections);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  const openOldestPendingDocument = (playerId: number) => {
    // La liste vient déjà triée du plus ancien au plus récent (voir /admin/todo).
    const oldest = pendingDocuments.find((doc) => doc.player_id === playerId);
    if (oldest) setOpenDocumentId(oldest.document_id);
  };

  const playersCount = useMemo(() => players.length, [players]);

  const updateSelection = <K extends keyof RowSelection>(
    playerId: number,
    field: K,
    value: RowSelection[K],
  ) => {
    setSaveInfo((prev) => ({ ...prev, [playerId]: "" }));
    setSelections((prev) => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] ?? DEFAULT_SELECTION),
        [field]: value,
      },
    }));
  };

  const saveRow = async (playerId: number) => {
    if (!adminUserId) {
      setError("Session admin introuvable. Reconnectez-vous.");
      return;
    }

    const row = selections[playerId] ?? DEFAULT_SELECTION;
    setSavingRows((prev) => ({ ...prev, [playerId]: true }));
    setSaveInfo((prev) => ({ ...prev, [playerId]: "" }));

    try {
      const payload = {
        phone: row.phone.trim() ? row.phone.trim() : null,
        dossier_stage: row.dossier,
        recruitment_status: row.statut,
        service_plan: row.service,
        acquisition_channel: row.canal,
        intake_period: row.periode,
        university_id: row.universityId,
      };

      const updated = await updateAdminPlayer(playerId, payload);

      setPlayers((prev) =>
        prev.map((player) => (player.id === playerId ? updated : player)),
      );
      setSelections((prev) => ({
        ...prev,
        [playerId]: {
          phone: updated.phone || "",
          dossier: updated.dossier_stage,
          statut: updated.recruitment_status,
          service: updated.service_plan,
          canal: updated.acquisition_channel,
          periode: updated.intake_period,
          universityId: updated.university_id,
        },
      }));
      setSaveInfo((prev) => ({ ...prev, [playerId]: "Sauvegarde OK" }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur de sauvegarde";
      setSaveInfo((prev) => ({ ...prev, [playerId]: message }));
    } finally {
      setSavingRows((prev) => ({ ...prev, [playerId]: false }));
    }
  };

  return (
    <section>
      <div className="mb-4 md:mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-syne text-xl md:text-2xl font-extrabold text-navy">
            Joueurs
          </h1>
          <p className="text-sm text-muted mt-1">
            Liste des joueurs de l'agence associee ({playersCount})
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="shrink-0 rounded-lg bg-green-custom px-3.5 py-2 text-xs font-semibold text-white"
        >
          + Ajouter un joueur
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-custom">
          Connexion API impossible: {error}
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border-custom overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-7xl w-full text-sm">
            <thead className="bg-sd-bg border-b border-border-custom">
              <tr>
                <th className="px-3 py-3 text-left font-syne text-[12px] uppercase tracking-[0.6px] text-muted">
                  Nom
                </th>
                <th className="px-3 py-3 text-left font-syne text-[12px] uppercase tracking-[0.6px] text-muted">
                  Prenom
                </th>
                <th className="px-3 py-3 text-left font-syne text-[12px] uppercase tracking-[0.6px] text-muted">
                  Telephone
                </th>
                <th className="px-3 py-3 text-left font-syne text-[12px] uppercase tracking-[0.6px] text-muted">
                  Email
                </th>
                <th className="px-3 py-3 text-left font-syne text-[12px] uppercase tracking-[0.6px] text-muted">
                  Universite
                </th>
                <th className="px-3 py-3 text-left font-syne text-[12px] uppercase tracking-[0.6px] text-muted">
                  Dossier
                </th>
                <th className="px-3 py-3 text-left font-syne text-[12px] uppercase tracking-[0.6px] text-muted">
                  Statut
                </th>
                <th className="px-3 py-3 text-left font-syne text-[12px] uppercase tracking-[0.6px] text-muted">
                  Service
                </th>
                <th className="px-3 py-3 text-left font-syne text-[12px] uppercase tracking-[0.6px] text-muted">
                  Canal d&apos;acquisition
                </th>
                <th className="px-3 py-3 text-left font-syne text-[12px] uppercase tracking-[0.6px] text-muted">
                  Periode
                </th>
                <th className="px-3 py-3 text-left font-syne text-[12px] uppercase tracking-[0.6px] text-muted">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={11} className="px-3 py-8 text-center text-muted">
                    Chargement des joueurs...
                  </td>
                </tr>
              )}

              {!loading && players.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-3 py-8 text-center text-muted">
                    Aucun joueur trouve pour cette agence.
                  </td>
                </tr>
              )}

              {!loading &&
                players.map((player) => {
                  const row = selections[player.id] ?? DEFAULT_SELECTION;
                  return (
                    <tr key={player.id} className="border-b border-border-custom/70 last:border-b-0">
                      <td className="px-3 py-3 font-semibold text-text-custom">
                        <div className="flex items-center gap-1.5">
                          {player.last_name}
                          {player.pending_documents_count > 0 && (
                            <button
                              type="button"
                              onClick={() => openOldestPendingDocument(player.id)}
                              title={`${player.pending_documents_count} document${player.pending_documents_count > 1 ? "s" : ""} en attente de validation`}
                              className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-custom text-white text-[10px] font-bold shrink-0"
                            >
                              {player.pending_documents_count}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-text-custom">{player.first_name}</td>
                      <td className="px-3 py-3 text-text-custom">
                        <input
                          type="text"
                          className="w-full rounded-lg border border-border-custom bg-white px-2.5 py-2 text-xs text-text-custom outline-none"
                          value={row.phone}
                          placeholder="Numero"
                          onChange={(e) =>
                            updateSelection(player.id, "phone", e.target.value)
                          }
                        />
                      </td>
                      <td className="px-3 py-3 text-text-custom">{player.email}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-1.5 min-w-[140px]">
                          <div className="relative w-8 h-8 shrink-0">
                            {player.university_logo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={player.university_logo}
                                alt={player.university_name}
                                title={player.university_name}
                                className="w-8 h-8 rounded-full object-cover border border-border-custom"
                              />
                            ) : (
                              (() => {
                                const initials = getInitials(player.university_name);
                                return (
                                  <div
                                    title={player.university_name}
                                    className={`w-8 h-8 rounded-full bg-gradient-to-br from-navy-light to-navy text-white flex items-center justify-center font-syne font-bold ${initials.length > 2 ? "text-[8px]" : "text-[11px]"}`}
                                  >
                                    {initials}
                                  </div>
                                );
                              })()
                            )}
                            {row.universityId === null && (
                              <span
                                title="Université non renseignée"
                                className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-custom border border-white"
                              />
                            )}
                          </div>
                          <select
                            className="w-full rounded-lg border border-border-custom bg-white px-2 py-1.5 text-[11px] text-text-custom outline-none"
                            value={row.universityId ?? ""}
                            onChange={(e) =>
                              updateSelection(
                                player.id,
                                "universityId",
                                e.target.value ? Number(e.target.value) : null,
                              )
                            }
                          >
                            <option value="">Non renseignée</option>
                            {universities.map((university) => (
                              <option key={university.id} value={university.id}>
                                {university.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <select
                          className={`w-full rounded-lg border px-2.5 py-2 text-xs font-semibold outline-none ${getDossierClasses(row.dossier)}`}
                          value={row.dossier}
                          onChange={(e) =>
                            updateSelection(
                              player.id,
                              "dossier",
                              e.target.value as DossierOption,
                            )
                          }
                        >
                          {DOSSIER_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <select
                          className={`w-full rounded-lg border px-2.5 py-2 text-xs font-semibold outline-none ${getStatutClasses(row.statut)}`}
                          value={row.statut}
                          onChange={(e) =>
                            updateSelection(
                              player.id,
                              "statut",
                              e.target.value as StatutOption,
                            )
                          }
                        >
                          {STATUT_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <select
                          className="w-full rounded-lg border border-border-custom bg-white px-2.5 py-2 text-xs text-text-custom outline-none"
                          value={row.service}
                          onChange={(e) =>
                            updateSelection(
                              player.id,
                              "service",
                              e.target.value as ServiceOption,
                            )
                          }
                        >
                          {SERVICE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <select
                          className="w-full rounded-lg border border-border-custom bg-white px-2.5 py-2 text-xs text-text-custom outline-none"
                          value={row.canal}
                          onChange={(e) =>
                            updateSelection(
                              player.id,
                              "canal",
                              e.target.value as CanalOption,
                            )
                          }
                        >
                          {CANAL_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <select
                          className="w-full rounded-lg border border-border-custom bg-white px-2.5 py-2 text-xs text-text-custom outline-none"
                          value={row.periode}
                          onChange={(e) =>
                            updateSelection(
                              player.id,
                              "periode",
                              e.target.value as PeriodeOption,
                            )
                          }
                        >
                          {PERIODE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => saveRow(player.id)}
                            disabled={!!savingRows[player.id]}
                            className="rounded-lg bg-navy px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                          >
                            {savingRows[player.id] ? "Sauvegarde..." : "Enregistrer"}
                          </button>
                          {saveInfo[player.id] && (
                            <span className="text-[11px] text-muted">{saveInfo[player.id]}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <DocumentReviewModal
        documentId={openDocumentId}
        onClose={() => {
          setOpenDocumentId(null);
          loadPlayers();
        }}
        onReviewed={loadPlayers}
      />

      {createModalOpen && (
        <CreatePlayerModal
          universities={universities}
          onClose={() => setCreateModalOpen(false)}
          onCreated={loadPlayers}
        />
      )}
    </section>
  );
}

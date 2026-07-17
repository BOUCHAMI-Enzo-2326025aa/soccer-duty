"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getAdminPlayers,
  getUserIdFromCookie,
  updateAdminPlayer,
  type AdminPlayer,
} from "@/lib/api";

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

const DEFAULT_SELECTION: RowSelection = {
  phone: "",
  dossier: "Trad",
  statut: "Prospection",
  service: "Formule A",
  canal: "Formulaire",
  periode: "Spring",
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

  useEffect(() => {
    const loadPlayers = async () => {
      setLoading(true);
      setError("");

      try {
        const userId = getUserIdFromCookie();
        if (!userId) {
          throw new Error("Session admin introuvable. Reconnectez-vous.");
        }

        setAdminUserId(userId);
        const response = await getAdminPlayers(userId);
        setPlayers(response.items);

        const initialSelections: Record<number, RowSelection> = {};
        for (const player of response.items) {
          initialSelections[player.id] = {
            phone: player.phone || "",
            dossier: player.dossier_stage,
            statut: player.recruitment_status,
            service: player.service_plan,
            canal: player.acquisition_channel,
            periode: player.intake_period,
          };
        }
        setSelections(initialSelections);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };

    loadPlayers();
  }, []);

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
      };

      const updated = await updateAdminPlayer(playerId, payload, adminUserId);

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
      <div className="mb-4 md:mb-5">
        <h1 className="font-syne text-xl md:text-2xl font-extrabold text-navy">
          Joueurs
        </h1>
        <p className="text-sm text-muted mt-1">
          Liste des joueurs de l'agence associee ({playersCount})
        </p>
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
                  <td colSpan={10} className="px-3 py-8 text-center text-muted">
                    Chargement des joueurs...
                  </td>
                </tr>
              )}

              {!loading && players.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-muted">
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
                        {player.last_name}
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
    </section>
  );
}

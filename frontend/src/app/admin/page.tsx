"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getAdminHome,
  getAdminNotifications,
  getAdminPlayerDocuments,
  getAdminPlayers,
  getAdminTodo,
  getAdminUniversities,
  type AdminPlayer,
  type PlayerDocumentItem,
} from "@/lib/api";
import DocumentReviewModal from "@/components/admin/DocumentReviewModal";

type FilterMode =
  | "tous"
  | "action_requise"
  | "en_attente"
  | "complet"
  | "progression"
  | "az";

const FILTERS: Array<{ key: FilterMode; label: string }> = [
  { key: "tous", label: "Tous" },
  { key: "action_requise", label: "⚠ Action requise" },
  { key: "en_attente", label: "🕐 En attente" },
  { key: "complet", label: "✅ Complets" },
  { key: "progression", label: "↑ Progression" },
  { key: "az", label: "A → Z" },
];

function DocumentPill({
  doc,
  onOpenReview,
}: {
  doc: PlayerDocumentItem;
  onOpenReview: (documentId: number) => void;
}) {
  const classes =
    doc.status === "VALIDATED"
      ? "bg-[#E8F8F2] text-[#00876a]"
      : doc.status === "PENDING"
        ? "bg-[#EEF4FF] text-blue-custom"
        : doc.status === "REJECTED"
          ? "bg-[#FDECEC] text-red-custom"
          : "bg-sd-bg text-muted";

  if (!doc.document_id) {
    return (
      <div className={`rounded-md px-1.5 py-1 text-[11px] mb-1 truncate ${classes}`}>
        {doc.name}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpenReview(doc.document_id as number)}
      className={`w-full text-left rounded-md px-1.5 py-1 text-[11px] mb-1 truncate transition-opacity hover:opacity-80 ${classes}`}
    >
      {doc.name}
    </button>
  );
}

function PlayerDossierContent({
  player,
  documents,
  loadingDocuments,
  formatDate,
  getInitials,
  onOpenReview,
}: {
  player: AdminPlayer | null;
  documents: PlayerDocumentItem[];
  loadingDocuments: boolean;
  formatDate: (isoDate: string | null) => string;
  getInitials: (player: AdminPlayer) => string;
  onOpenReview: (documentId: number) => void;
}) {
  const validated = documents.filter((d) => d.status === "VALIDATED");
  const pending = documents.filter((d) => d.status === "PENDING");
  const toSend = documents.filter(
    (d) => d.status === "MISSING" || d.status === "REJECTED",
  );

  return (
    <>
      <div className="bg-navy p-[18px]">
        <div className="w-[50px] h-[50px] rounded-full bg-green-custom text-white font-syne font-extrabold text-lg flex items-center justify-center mb-2.5">
          {player ? getInitials(player) : "--"}
        </div>
        <div className="text-white font-syne font-bold text-base">
          {player ? `${player.first_name} ${player.last_name}` : "Aucun joueur"}
        </div>
        <div className="text-white/50 text-xs mt-0.5">
          📅 {player ? formatDate(player.date_of_birth) : "-"}
        </div>
        <div className="text-green-custom text-xs font-medium mt-0.5">
          🎓 {player?.university_name || "Université non renseignée"}
        </div>
        <div className="flex items-center gap-2 mt-2.5">
          <div className="flex-1 h-[6px] bg-white/15 rounded-[3px] overflow-hidden">
            <div
              className="h-full bg-green-custom rounded-[3px]"
              style={{
                width: `${Math.max(0, Math.min(100, player?.progress_percentage_real ?? 0))}%`,
              }}
            ></div>
          </div>
          <div className="text-white font-bold text-[13px]">
            {player?.progress_percentage_real ?? 0}%
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="mb-3.5">
          <div className="font-syne text-[11px] font-bold uppercase tracking-[0.8px] text-muted mb-2">
            Documents
          </div>
          {loadingDocuments ? (
            <div className="text-xs text-muted">Chargement...</div>
          ) : documents.length === 0 ? (
            <div className="text-xs text-muted">
              Aucun document applicable à ce joueur.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              <div>
                <div className="text-[9.5px] font-bold uppercase tracking-[0.5px] text-[#00876a] mb-1">
                  ✅ Validés
                </div>
                {validated.length === 0 && (
                  <div className="text-[10px] text-muted">—</div>
                )}
                {validated.map((doc) => (
                  <DocumentPill
                    key={doc.document_template_id}
                    doc={doc}
                    onOpenReview={onOpenReview}
                  />
                ))}
              </div>
              <div>
                <div className="text-[9.5px] font-bold uppercase tracking-[0.5px] text-blue-custom mb-1">
                  🕐 En attente
                </div>
                {pending.length === 0 && (
                  <div className="text-[10px] text-muted">—</div>
                )}
                {pending.map((doc) => (
                  <DocumentPill
                    key={doc.document_template_id}
                    doc={doc}
                    onOpenReview={onOpenReview}
                  />
                ))}
              </div>
              <div>
                <div className="text-[9.5px] font-bold uppercase tracking-[0.5px] text-red-custom mb-1">
                  📤 Manquants
                </div>
                {toSend.length === 0 && (
                  <div className="text-[10px] text-muted">—</div>
                )}
                {toSend.map((doc) => (
                  <DocumentPill
                    key={doc.document_template_id}
                    doc={doc}
                    onOpenReview={onOpenReview}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mb-3.5">
          <div className="font-syne text-[11px] font-bold uppercase tracking-[0.8px] text-muted mb-2">
            Messagerie
          </div>
          <div className="bg-sd-bg dark:bg-navy-light rounded-lg p-2.5 mb-2 text-xs max-h-[120px] overflow-y-auto">
            <div className="mb-2 text-text-custom dark:text-white">
              <strong>{player?.first_name || "Joueur"}</strong>{" "}
              <span className="text-muted dark:text-white/60 text-[10px]">
                12/06 14:22
              </span>
              <br />
              Bonjour, j&apos;ai envoyé mes relevés de notes.
            </div>
            <div className="text-right text-text-custom dark:text-white">
              <strong className="text-green-custom">Vous</strong>{" "}
              <span className="text-muted dark:text-white/60 text-[10px]">
                12/06 15:10
              </span>
              <br />
              Reçus, en cours de validation !
            </div>
          </div>
          <div className="flex gap-1.5 mt-2.5">
            <input
              className="flex-1 px-2.5 py-2 rounded-lg border border-border-custom text-xs outline-none bg-white placeholder-muted font-inter"
              placeholder={`Répondre à ${player?.first_name || "..."}…`}
            />
            <button className="px-3 py-1.5 rounded-lg text-xs font-semibold border-none bg-green-custom text-white">
              Envoyer
            </button>
          </div>
        </div>

        <div className="mb-3.5">
          <div className="font-syne text-[11px] font-bold uppercase tracking-[0.8px] text-muted mb-2">
            Actions rapides
          </div>
          <div className="flex gap-1.5 flex-wrap mt-2.5">
            <button className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border-custom bg-transparent text-text-custom hover:bg-gray-50">
              ✏️ Modifier
            </button>
            <button className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border-custom bg-transparent text-text-custom hover:bg-gray-50">
              🏢 Changer agence
            </button>
            <button className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border-custom bg-transparent text-text-custom hover:bg-gray-50">
              📥 Télécharger
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AdminHomePage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [players, setPlayers] = useState<AdminPlayer[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<AdminPlayer | null>(
    null,
  );
  const [activeFilter, setActiveFilter] = useState<FilterMode>("tous");
  const [playerDocuments, setPlayerDocuments] = useState<PlayerDocumentItem[]>(
    [],
  );
  const [loadingPlayerDocuments, setLoadingPlayerDocuments] = useState(false);
  const [reviewDocumentId, setReviewDocumentId] = useState<number | null>(
    null,
  );
  const [todoStats, setTodoStats] = useState({
    pendingDocuments: 0,
    upcomingMilestones: 0,
    rejectedDocuments: 0,
    readyPlayers: 0,
  });
  const [stats, setStats] = useState({
    players: 0,
    universities: 0,
    completed: 0,
    ongoing: 0,
    docsToValidate: 0,
  });

  const loadStats = async () => {
    setLoadingStats(true);
    setStatsError("");

    try {
      const [home, universities, todo, notifications, playersResponse] =
        await Promise.all([
          getAdminHome(),
          getAdminUniversities(),
          getAdminTodo(),
          getAdminNotifications(),
          getAdminPlayers(),
        ]);

      const docsToValidate = todo.pending_documents.length;
      const completed = playersResponse.items.filter(
        (p) => p.progress_percentage_real >= 100,
      ).length;
      const ongoing = playersResponse.items.length - completed;

      setStats({
        players: home.players_count,
        universities: universities.count,
        completed,
        ongoing,
        docsToValidate: Math.max(notifications.count, docsToValidate),
      });
      setPlayers(playersResponse.items);
      setSelectedPlayer((prev) => {
        if (prev) {
          return (
            playersResponse.items.find((p) => p.id === prev.id) ?? prev
          );
        }
        return playersResponse.items[0] ?? null;
      });
      setTodoStats({
        pendingDocuments: todo.pending_documents.length,
        upcomingMilestones: todo.upcoming_milestones.length,
        rejectedDocuments: todo.rejected_documents.length,
        readyPlayers: todo.ready_players.length,
      });
    } catch (err) {
      setStatsError(
        err instanceof Error ? err.message : "Erreur de chargement",
      );
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (!selectedPlayer) {
      setPlayerDocuments([]);
      return;
    }

    const loadPlayerDocuments = async () => {
      setLoadingPlayerDocuments(true);
      try {
        const response = await getAdminPlayerDocuments(selectedPlayer.id);
        setPlayerDocuments(response.items);
      } catch {
        setPlayerDocuments([]);
      } finally {
        setLoadingPlayerDocuments(false);
      }
    };

    loadPlayerDocuments();
  }, [selectedPlayer?.id]);

  const filteredPlayers = useMemo(() => {
    switch (activeFilter) {
      case "action_requise":
        return players.filter((p) => p.documents_pending > 0);
      case "en_attente":
        return players.filter(
          (p) => p.documents_pending === 0 && p.progress_percentage_real < 100,
        );
      case "complet":
        return players.filter((p) => p.progress_percentage_real >= 100);
      case "progression":
        return [...players].sort(
          (a, b) => b.progress_percentage_real - a.progress_percentage_real,
        );
      case "az":
        return [...players].sort((a, b) =>
          a.last_name.localeCompare(b.last_name, "fr"),
        );
      default:
        return players;
    }
  }, [players, activeFilter]);

  const handleReviewed = () => {
    loadStats();
    if (selectedPlayer) {
      getAdminPlayerDocuments(selectedPlayer.id)
        .then((response) => setPlayerDocuments(response.items))
        .catch(() => {});
    }
  };

  const formatDate = (isoDate: string | null) => {
    if (!isoDate) return "Date inconnue";
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return "Date inconnue";
    return date.toLocaleDateString("fr-FR");
  };

  const getStatus = (player: AdminPlayer) => {
    if (player.documents_pending > 0) {
      return {
        label: "Action requise",
        className: "bg-[#FFF3EC] text-orange-custom",
        bar: "bg-gradient-to-r from-orange-custom to-[#e05a28]",
      };
    }

    if (player.progress_percentage_real >= 100) {
      return {
        label: "Complet",
        className: "bg-[#E8F8F2] text-[#00876a]",
        bar: "bg-gradient-to-r from-green-custom to-[#00876a]",
      };
    }

    return {
      label: "En attente",
      className: "bg-[#EEF4FF] text-blue-custom",
      bar: "bg-gradient-to-r from-blue-custom to-[#3a75c4]",
    };
  };

  const getInitials = (player: AdminPlayer) => {
    const a = player.first_name?.[0] || "?";
    const b = player.last_name?.[0] || "?";
    return `${a}${b}`.toUpperCase();
  };

  return (
    <>
      {/* MOBILE DETAIL DRAWER */}
      <div
        className={`fixed inset-0 z-[300] flex-col md:hidden flex ${drawerOpen ? "block" : "hidden"}`}
      >
        <div
          className="flex-[0_0_60px] bg-black/40"
          onClick={() => setDrawerOpen(false)}
        ></div>
        <div className="flex-1 bg-card overflow-y-auto rounded-t-[20px]">
          <div className="w-10 h-1 bg-border-custom rounded-full mx-auto mt-2.5"></div>
          <PlayerDossierContent
            player={selectedPlayer}
            documents={playerDocuments}
            loadingDocuments={loadingPlayerDocuments}
            formatDate={formatDate}
            getInitials={getInitials}
            onOpenReview={setReviewDocumentId}
          />
        </div>
      </div>

      {/* STATS */}
      {statsError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-custom">
          Connexion API impossible: {statsError}
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-2.5 lg:gap-3 mb-4 md:mb-5 lg:mb-6">
        <div className="bg-card rounded-xl border border-border-custom p-3 md:p-4 pb-2.5 md:pb-3">
          <div className="text-lg md:text-xl mb-1.5">👤</div>
          <div className="font-syne text-[22px] md:text-2xl font-extrabold text-navy">
            {loadingStats ? "..." : stats.players}
          </div>
          <div className="text-[11px] text-muted mt-0.5 font-medium">
            Joueurs inscrits
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border-custom p-3 md:p-4 pb-2.5 md:pb-3">
          <div className="text-lg md:text-xl mb-1.5">🎓</div>
          <div className="font-syne text-[22px] md:text-2xl font-extrabold text-navy">
            {loadingStats ? "..." : stats.universities}
          </div>
          <div className="text-[11px] text-muted mt-0.5 font-medium">
            Universités
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border-custom p-3 md:p-4 pb-2.5 md:pb-3">
          <div className="text-lg md:text-xl mb-1.5">✅</div>
          <div className="font-syne text-[22px] md:text-2xl font-extrabold text-navy">
            {loadingStats ? "..." : stats.completed}
          </div>
          <div className="text-[11px] text-muted mt-0.5 font-medium">
            Dossiers terminés
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border-custom p-3 md:p-4 pb-2.5 md:pb-3">
          <div className="text-lg md:text-xl mb-1.5">📂</div>
          <div className="font-syne text-[22px] md:text-2xl font-extrabold text-navy">
            {loadingStats ? "..." : stats.ongoing}
          </div>
          <div className="text-[11px] text-muted mt-0.5 font-medium">
            Dossiers en cours
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border-custom p-3 md:p-4 pb-2.5 md:pb-3">
          <div className="text-lg md:text-xl mb-1.5">⚠️</div>
          <div className="font-syne text-[22px] md:text-2xl font-extrabold text-orange-custom">
            {loadingStats ? "..." : stats.docsToValidate}
          </div>
          <div className="text-[11px] text-muted mt-0.5 font-medium">
            Docs à valider
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 lg:gap-[18px] items-start">
        {/* LIST */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="font-syne text-[15px] font-bold text-navy dark:text-white">
              Joueurs
            </div>
            <span className="text-[12.5px] text-green-custom font-semibold cursor-pointer">
              + Ajouter
            </span>
          </div>

          <div className="flex gap-[7px] mb-3.5 overflow-x-auto pb-1 scbar-hidden">
            {FILTERS.map((filter) => (
              <button
                type="button"
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`px-[13px] py-1 text-xs font-medium cursor-pointer border rounded-full whitespace-nowrap shrink-0 transition-all ${
                  activeFilter === filter.key
                    ? "border-navy bg-navy text-white"
                    : "border-border-custom bg-white text-muted hover:bg-gray-50"
                }`}
              >
                {filter.key === "tous"
                  ? `Tous (${loadingStats ? "..." : players.length})`
                  : filter.label}
              </button>
            ))}
          </div>

          {filteredPlayers.length === 0 ? (
            <div className="bg-card rounded-xl border border-border-custom p-4 text-sm text-muted">
              {players.length === 0
                ? "Aucun joueur trouvé en base de données."
                : "Aucun joueur ne correspond à ce filtre."}
            </div>
          ) : (
            filteredPlayers.map((player) => {
              const status = getStatus(player);
              const isSelected = selectedPlayer?.id === player.id;

              return (
                <div
                  key={player.id}
                  className={`bg-card rounded-xl p-3.5 md:p-4 mb-2.5 flex items-center gap-3 cursor-pointer transition-all hover:shadow-[0_3px_14px_rgba(15,28,63,0.07)] ${
                    isSelected
                      ? "border border-green-custom shadow-[0_0_0_2px_rgba(0,196,140,0.15)]"
                      : "border border-border-custom hover:border-[#c0cbdf]"
                  }`}
                  onClick={() => {
                    setSelectedPlayer(player);
                    setDrawerOpen(true);
                  }}
                >
                  <div className="w-[42px] h-[42px] rounded-full bg-gradient-to-br from-navy-light to-navy text-white flex items-center justify-center font-syne font-bold text-sm shrink-0">
                    {getInitials(player)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-navy">
                      {player.first_name} {player.last_name}
                    </div>
                    <div className="text-[11px] text-muted mt-px">
                      {formatDate(player.date_of_birth)}
                    </div>
                    <div className="text-[11px] text-blue-custom font-medium mt-px overflow-hidden text-ellipsis whitespace-nowrap">
                      🎓 {player.university_name}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <div className="w-20 h-[5px] bg-border-custom rounded-[3px] overflow-hidden">
                        <div
                          className={`h-full rounded-[3px] ${status.bar}`}
                          style={{
                            width: `${Math.max(0, Math.min(100, player.progress_percentage_real))}%`,
                          }}
                        ></div>
                      </div>
                      <div className="text-xs font-bold text-navy">
                        {player.progress_percentage_real}%
                      </div>
                    </div>
                    <div
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${status.className}`}
                    >
                      {status.label}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* TODO WIDGET */}
          <div className="bg-card rounded-xl border border-border-custom p-4 mt-4">
            <div className="flex items-center justify-between mb-2.5">
              <div className="font-syne text-sm font-bold text-navy">
                ✅ To-Do List
                <span className="bg-orange-custom text-white text-[10px] px-[7px] py-[1px] rounded-full align-middle ml-1">
                  {todoStats.pendingDocuments +
                    todoStats.rejectedDocuments +
                    todoStats.readyPlayers}
                </span>
              </div>
              <span className="text-xs text-green-custom font-semibold cursor-pointer">
                Tout voir
              </span>
            </div>
            <div className="flex items-center gap-2 py-2 border-b border-border-custom text-[13px] text-slate-900">
              <div className="w-[7px] h-[7px] rounded-full bg-orange-custom shrink-0"></div>
              Documents à valider
              <div className="ml-auto font-bold text-[13px] text-navy">
                {todoStats.pendingDocuments}
              </div>
            </div>
            <div className="flex items-center gap-2 py-2 border-b border-border-custom text-[13px] text-slate-900">
              <div className="w-[7px] h-[7px] rounded-full bg-blue-custom shrink-0"></div>
              Jalons à venir
              <div className="ml-auto font-bold text-[13px] text-navy">
                {todoStats.upcomingMilestones}
              </div>
            </div>
            <div className="flex items-center gap-2 py-2 border-b border-border-custom text-[13px] text-slate-900">
              <div className="w-[7px] h-[7px] rounded-full bg-red-custom shrink-0"></div>
              Documents refusés à suivre
              <div className="ml-auto font-bold text-[13px] text-navy">
                {todoStats.rejectedDocuments}
              </div>
            </div>
            <div className="flex items-center gap-2 py-2 text-[13px] text-slate-900">
              <div className="w-[7px] h-[7px] rounded-full bg-orange-custom shrink-0"></div>
              Dossiers prêts pour validation
              <div className="ml-auto font-bold text-[13px] text-navy">
                {todoStats.readyPlayers}
              </div>
            </div>
          </div>
        </div>

        {/* DETAIL PANEL (Desktop) */}
        <div className="hidden lg:block bg-card rounded-[14px] border border-border-custom overflow-hidden sticky top-[72px] max-h-[calc(100vh-92px)] overflow-y-auto">
          <PlayerDossierContent
            player={selectedPlayer}
            documents={playerDocuments}
            loadingDocuments={loadingPlayerDocuments}
            formatDate={formatDate}
            getInitials={getInitials}
            onOpenReview={setReviewDocumentId}
          />
        </div>
      </div>

      <DocumentReviewModal
        documentId={reviewDocumentId}
        onClose={() => setReviewDocumentId(null)}
        onReviewed={handleReviewed}
      />
    </>
  );
}

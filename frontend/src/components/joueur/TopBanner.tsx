"use client";

import { useEffect, useState } from "react";
import { getPlayerProfile, getUserIdFromCookie } from "@/lib/api";
import { usePlayerDocuments } from "@/lib/player-documents-context";

export default function TopBanner({
  openSidebar,
}: {
  openSidebar: () => void;
}) {
  const { documents, loading: loadingStats } = usePlayerDocuments();

  const [profile, setProfile] = useState<{
    firstName: string;
    lastName: string;
    dateOfBirth: string | null;
    universityName: string | null;
  } | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userId = getUserIdFromCookie();
        if (!userId) return;
        const response = await getPlayerProfile(userId);
        setProfile({
          firstName: response.profile.first_name,
          lastName: response.profile.last_name,
          dateOfBirth: response.profile.date_of_birth,
          universityName: response.university?.name ?? null,
        });
      } catch {
        // Garde l'en-tête minimal si l'API est indisponible.
      }
    };

    loadProfile();
  }, []);

  const initials = profile
    ? `${profile.firstName[0] ?? ""}${profile.lastName[0] ?? ""}`.toUpperCase()
    : "--";
  const fullName = profile
    ? `${profile.firstName} ${profile.lastName}`.toUpperCase()
    : "...";
  const dateOfBirthLabel = profile?.dateOfBirth
    ? new Date(profile.dateOfBirth).toLocaleDateString("fr-FR")
    : "-";

  const total = documents.length;
  const validatedCount = documents.filter((d) => d.status === "VALIDATED").length;
  const pendingCount = documents.filter((d) => d.status === "PENDING").length;
  const missingCount = documents.filter(
    (d) => d.status === "MISSING" || d.status === "REJECTED",
  ).length;
  const progressPct = total > 0 ? Math.round((validatedCount / total) * 100) : 0;

  const lastUpdatedLabel = (() => {
    const timestamps = documents
      .map((d) => d.updated_at)
      .filter((value): value is string => Boolean(value))
      .map((value) => new Date(value).getTime())
      .filter((value) => !Number.isNaN(value));

    if (timestamps.length === 0) return "-";
    const mostRecent = new Date(Math.max(...timestamps));
    return mostRecent.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
    });
  })();

  return (
    <header className="bg-navy sticky top-0 z-[90]">
      <div className="flex items-center gap-3.5 px-4 md:px-6 py-3 md:pb-3 md:pt-3.5">
        <button
          className="md:hidden text-xl text-white/70 shrink-0"
          onClick={openSidebar}
        >
          ☰
        </button>
        <div className="w-[46px] h-[46px] rounded-full bg-gradient-to-br from-green-custom to-[#00876a] flex items-center justify-center text-white font-syne font-extrabold text-base shrink-0 border-2 border-green-custom/40">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-syne font-extrabold text-white text-[15px] whitespace-nowrap overflow-hidden text-ellipsis">
            {fullName}
          </div>
          <div className="text-white/50 text-[11px]">📅 {dateOfBirthLabel}</div>
          <div className="text-green-custom text-[11px] font-medium whitespace-nowrap overflow-hidden text-ellipsis">
            🎓 {profile?.universityName || "Université non renseignée"}
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 pb-3 flex items-center gap-3">
        <div className="flex-1 h-[7px] bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-custom to-[#00e0a0] rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          ></div>
        </div>
        <div className="text-white font-syne font-extrabold text-[15px] shrink-0">
          {loadingStats ? "..." : `${progressPct}%`}
        </div>
      </div>

      <div className="flex border-t border-white/10">
        <div className="flex-1 text-center py-2 px-1 md:px-1.5 border-r border-white/10">
          <div className="font-syne font-bold text-[17px] sm:text-[15px] text-green-custom">
            {loadingStats ? "..." : `${validatedCount}/${total}`}
          </div>
          <div className="text-white/40 text-[9.5px] sm:text-[8.5px] font-medium">
            Validés
          </div>
        </div>
        <div className="flex-1 text-center py-2 px-1 md:px-1.5 border-r border-white/10">
          <div className="font-syne font-bold text-[17px] sm:text-[15px] text-orange-custom">
            {loadingStats ? "..." : pendingCount}
          </div>
          <div className="text-white/40 text-[9.5px] sm:text-[8.5px] font-medium">
            En attente
          </div>
        </div>
        <div className="flex-1 text-center py-2 px-1 md:px-1.5 border-r border-white/10">
          <div className="font-syne font-bold text-[17px] sm:text-[15px] text-[#fc8181]">
            {loadingStats ? "..." : missingCount}
          </div>
          <div className="text-white/40 text-[9.5px] sm:text-[8.5px] font-medium">
            Manquants
          </div>
        </div>
        <div className="flex-1 text-center py-2 px-1 md:px-1.5">
          <div className="font-syne font-bold text-[17px] sm:text-[15px] text-white/70 text-[13px]">
            {loadingStats ? "..." : lastUpdatedLabel}
          </div>
          <div className="text-white/40 text-[9.5px] sm:text-[8.5px] font-medium">
            Dernière MAJ
          </div>
        </div>
      </div>

      <div className="bg-navy-light px-4 md:px-6 py-2 flex gap-5 items-center border-t border-white/10 overflow-x-auto scbar-hidden">
        <span className="text-white/60 text-[11px] font-semibold whitespace-nowrap">
          COMMENT ÇA MARCHE ?
        </span>
        <span className="text-white/40 text-[11.5px] cursor-pointer whitespace-nowrap shrink-0 hover:text-green-custom transition-colors">
          📖 Guide complet
        </span>
        <span className="text-white/40 text-[11.5px] cursor-pointer whitespace-nowrap shrink-0 hover:text-green-custom transition-colors">
          ▶ Vidéo
        </span>
        <span className="text-white/40 text-[11.5px] cursor-pointer whitespace-nowrap shrink-0 hover:text-green-custom transition-colors">
          🗺 Infographie
        </span>
      </div>
    </header>
  );
}

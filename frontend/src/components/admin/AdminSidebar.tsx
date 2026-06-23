"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation"; // <-- Ajout de useRouter

export default function AdminSidebar({
  isOpen,
  closeSidebar,
}: {
  isOpen: boolean;
  closeSidebar: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter(); // <-- Initialisation du router

  // --- NOUVEAU : La fonction de déconnexion ---
  const handleLogout = () => {
    // On détruit les cookies
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    // On renvoie à l'accueil
    router.push("/");
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/45 z-[199] md:hidden ${isOpen ? "block" : "hidden"}`}
        onClick={closeSidebar}
      />
      {/* CORRECTION : Remplacement de md:w-[230px] par md:w-[220px] pour aligner avec le joueur */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-[240px] md:w-[220px] bg-navy flex flex-col z-[200] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="p-4 pt-5 flex items-center gap-2.5 border-b border-white/10">
          <div className="w-9 h-9 rounded-[9px] bg-gradient-to-br from-green-custom to-[#00876a] flex items-center justify-center text-white font-syne font-extrabold text-[13px] shrink-0">
            SD
          </div>
          <div>
            <div className="font-syne text-white font-bold text-sm">
              Soccer Duty
            </div>
            <div className="text-white/40 text-[10px]">
              Espace Administrateur
            </div>
          </div>
          <button
            className="md:hidden ml-auto text-white/40 text-xl"
            onClick={closeSidebar}
          >
            ✕
          </button>
        </div>

        {/* J'ai ajouté flex flex-col pour pouvoir gérer l'espacement si besoin */}
        <div className="flex-1 overflow-y-auto pt-1.5 flex flex-col">
          <div className="flex-1">
            <Link
              href="/admin"
              className={`flex items-center gap-2.5 px-4 py-[11px] cursor-pointer text-[13.5px] font-medium transition-all relative ${pathname === "/admin" ? "text-white bg-green-custom/10" : "text-white/60 hover:text-white hover:bg-white/5"}`}
            >
              {pathname === "/admin" && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-green-custom rounded-r-sm"></div>
              )}
              <span className="text-base w-5 text-center shrink-0">🏠</span>
              Accueil
            </Link>

            <div className="text-white/25 text-[10px] font-semibold tracking-[1px] uppercase px-4 pt-3 pb-1">
              Gestion
            </div>

            <Link
              href="/admin/joueurs"
              className={`flex items-center gap-2.5 px-4 py-[11px] cursor-pointer text-[13.5px] font-medium transition-all relative ${pathname.startsWith("/admin/joueurs") ? "text-white bg-green-custom/10" : "text-white/60 hover:text-white hover:bg-white/5"}`}
            >
              {pathname.startsWith("/admin/joueurs") && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-green-custom rounded-r-sm"></div>
              )}
              <span className="text-base w-5 text-center shrink-0">👤</span>
              Joueurs
              <span className="ml-auto bg-orange-custom text-white text-[10px] font-bold px-[7px] py-[1px] rounded-full">
                52
              </span>
            </Link>

            <Link
              href="/admin/universites"
              className={`flex items-center gap-2.5 px-4 py-[11px] cursor-pointer text-[13.5px] font-medium transition-all relative ${pathname.startsWith("/admin/universites") ? "text-white bg-green-custom/10" : "text-white/60 hover:text-white hover:bg-white/5"}`}
            >
              {pathname.startsWith("/admin/universites") && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-green-custom rounded-r-sm"></div>
              )}
              <span className="text-base w-5 text-center shrink-0">🎓</span>
              Universités
              <span className="ml-auto bg-blue-custom text-white text-[10px] font-bold px-[7px] py-[1px] rounded-full">
                31
              </span>
            </Link>

            <div className="text-white/25 text-[10px] font-semibold tracking-[1px] uppercase px-4 pt-3 pb-1">
              Suivi
            </div>

            <Link
              href="/admin/todo"
              className={`flex items-center gap-2.5 px-4 py-[11px] cursor-pointer text-[13.5px] font-medium transition-all relative ${pathname.startsWith("/admin/todo") ? "text-white bg-green-custom/10" : "text-white/60 hover:text-white hover:bg-white/5"}`}
            >
              {pathname.startsWith("/admin/todo") && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-green-custom rounded-r-sm"></div>
              )}
              <span className="text-base w-5 text-center shrink-0">✅</span>
              To-Do List
              <span className="ml-auto bg-orange-custom text-white text-[10px] font-bold px-[7px] py-[1px] rounded-full">
                9
              </span>
            </Link>

            <Link
              href="/admin/notifications"
              className={`flex items-center gap-2.5 px-4 py-[11px] cursor-pointer text-[13.5px] font-medium transition-all relative ${pathname.startsWith("/admin/notifications") ? "text-white bg-green-custom/10" : "text-white/60 hover:text-white hover:bg-white/5"}`}
            >
              <span className="text-base w-5 text-center shrink-0">🔔</span>
              Notifications
              <span className="ml-auto bg-orange-custom text-white text-[10px] font-bold px-[7px] py-[1px] rounded-full">
                27
              </span>
            </Link>

            <Link
              href="/admin/messages"
              className={`flex items-center gap-2.5 px-4 py-[11px] cursor-pointer text-[13.5px] font-medium transition-all relative ${pathname.startsWith("/admin/messages") ? "text-white bg-green-custom/10" : "text-white/60 hover:text-white hover:bg-white/5"}`}
            >
              <span className="text-base w-5 text-center shrink-0">💬</span>
              Messagerie
              <span className="ml-auto bg-orange-custom text-white text-[10px] font-bold px-[7px] py-[1px] rounded-full">
                3
              </span>
            </Link>

            <div className="text-white/25 text-[10px] font-semibold tracking-[1px] uppercase px-4 pt-3 pb-1">
              Outils
            </div>

            <Link
              href="/admin/ia"
              className="flex items-center gap-2.5 px-4 py-[11px] cursor-pointer text-[13.5px] font-medium transition-all text-white/60 hover:text-white hover:bg-white/5"
            >
              <span className="text-base w-5 text-center shrink-0">🤖</span> IA
              Assistante
            </Link>
            <Link
              href="/admin/aide"
              className="flex items-center gap-2.5 px-4 py-[11px] cursor-pointer text-[13.5px] font-medium transition-all text-white/60 hover:text-white hover:bg-white/5"
            >
              <span className="text-base w-5 text-center shrink-0">❓</span>{" "}
              Aide
            </Link>
            <Link
              href="/admin/parametres"
              className="flex items-center gap-2.5 px-4 py-[11px] cursor-pointer text-[13.5px] font-medium transition-all text-white/60 hover:text-white hover:bg-white/5"
            >
              <span className="text-base w-5 text-center shrink-0">⚙️</span>{" "}
              Paramètres
            </Link>
          </div>

          {/* --- NOUVEAU : Bouton Déconnexion (Adapté au dark theme) --- */}
          <div className="mt-4 mb-4">
            <button
              onClick={handleLogout}
              className="flex items-center w-full gap-2.5 px-4 py-[11px] cursor-pointer text-[13.5px] font-medium transition-all text-red-custom hover:bg-white/5"
            >
              <span className="text-base w-5 text-center shrink-0">🚪</span>
              Déconnexion
            </button>
          </div>
        </div>

        <div className="mt-auto px-4 py-3.5 border-t border-white/10 flex items-center gap-2">
          <div className="w-7 h-7 bg-green-custom rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0">
            SD
          </div>
          <div>
            <div className="text-white text-xs font-semibold">Soccer Duty</div>
            <div className="text-white/40 text-[10px]">Admin principal</div>
          </div>
          <button
            className="ml-auto text-white/30 cursor-pointer hidden md:block"
            onClick={closeSidebar}
          >
            ◀
          </button>
        </div>
      </aside>
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation"; // <-- Ajout de useRouter
import { logout } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function Sidebar({
  isOpen,
  closeSidebar,
}: {
  isOpen: boolean;
  closeSidebar: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter(); // <-- Initialisation du router
  const { clearAuth } = useAuth();

  const navItems = [
    { name: "Mon Dossier", icon: "📂", path: "/joueur" },
    { name: "Mon Profil", icon: "👤", path: "/joueur/profil" },
    { name: "Documents", icon: "📄", path: "/joueur/documents" },
    { name: "Messagerie", icon: "💬", path: "/joueur/messages" },
    { name: "Aide", icon: "❓", path: "/joueur/aide" },
  ];

  // --- La fonction de déconnexion ---
  const handleLogout = async () => {
    try {
      // Efface côté serveur les cookies httpOnly AIDEN (inaccessibles en JS)
      await logout();
    } catch {
      // On déconnecte quand même côté client si l'API est indisponible
    }

    clearAuth();
    router.push("/");
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/45 z-[199] md:hidden ${isOpen ? "block" : "hidden"}`}
        onClick={closeSidebar}
      />
      <aside
        className={`fixed top-0 left-0 bottom-0 w-[240px] md:w-[220px] bg-card border-r border-border-custom flex flex-col z-[200] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="p-4 pt-5 flex items-center gap-2.5 border-b border-border-custom">
          <div className="w-9 h-9 rounded-[9px] bg-gradient-to-br from-green-custom to-[#00876a] flex items-center justify-center text-white font-syne font-extrabold text-[13px] shrink-0">
            SD
          </div>
          <div>
            <div className="font-syne text-navy font-bold text-sm">
              Soccer Duty
            </div>
            <div className="text-muted text-[10px]">Espace Joueur</div>
          </div>
          <button
            className="md:hidden ml-auto text-muted text-xl"
            onClick={closeSidebar}
          >
            ✕
          </button>
        </div>

        {/* J'ai ajouté flex et flex-col ici pour pouvoir pousser le bouton en bas */}
        <div className="flex-1 overflow-y-auto pt-1.5 flex flex-col">
          <div className="flex-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.path ||
                (item.path !== "/joueur" && pathname.startsWith(item.path));
              return (
                <Link
                  href={item.path}
                  key={item.name}
                  className={`flex items-center gap-2.5 px-4 py-3 cursor-pointer text-[13.5px] transition-all relative ${
                    isActive
                      ? "text-navy bg-[#EEF4FF] font-semibold"
                      : "text-muted font-medium hover:text-navy hover:bg-sd-bg"
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-green-custom rounded-r-sm"></div>
                  )}
                  <span className="text-base w-5 text-center shrink-0">
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* --- NOUVEAU : Bouton Déconnexion --- */}
          <div className="px-2 mt-4 mb-2">
            <button
              onClick={handleLogout}
              className="flex items-center w-full gap-2.5 px-2 py-2.5 cursor-pointer text-[13.5px] transition-all text-red-custom font-medium hover:bg-red-50 rounded-lg"
            >
              <span className="text-base w-5 text-center shrink-0">🚪</span>
              Déconnexion
            </button>
          </div>
        </div>

        <div className="m-3.5 mb-4 bg-gradient-to-br from-navy to-navy-light text-white rounded-[10px] p-3 cursor-pointer text-center">
          <div className="text-[13px] font-semibold">🤖 Chatbot IA</div>
          <div className="text-[10px] text-white/50 mt-0.5">
            Posez vos questions
          </div>
        </div>
      </aside>
    </>
  );
}

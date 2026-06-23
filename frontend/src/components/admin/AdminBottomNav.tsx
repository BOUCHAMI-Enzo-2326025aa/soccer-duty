"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminBottomNav({
  openSidebar,
}: {
  openSidebar: () => void;
}) {
  const pathname = usePathname();

  const navItems = [
    { name: "Accueil", icon: "🏠", path: "/admin" },
    { name: "Joueurs", icon: "👤", path: "/admin/joueurs", badge: 52 },
    { name: "To-Do", icon: "✅", path: "/admin/todo", badge: 9 },
    { name: "Messages", icon: "💬", path: "/admin/messages", badge: 3 },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-navy z-[150] pt-2 pb-[env(safe-area-inset-bottom,8px)] border-t border-white/10">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const isActive =
            pathname === item.path ||
            (item.path !== "/admin" && pathname.startsWith(item.path));
          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex flex-col items-center gap-[3px] py-1 px-2 relative min-w-[50px] ${
                isActive ? "text-green-custom" : "text-white/45"
              }`}
            >
              <div className="text-xl leading-none">{item.icon}</div>
              <div className="text-[10px] font-medium">{item.name}</div>
              {item.badge && (
                <div className="absolute top-0 right-1 bg-orange-custom text-white text-[9px] font-bold px-[5px] py-[1px] rounded-full">
                  {item.badge}
                </div>
              )}
            </Link>
          );
        })}
        <button
          onClick={openSidebar}
          className="flex flex-col items-center gap-[3px] py-1 px-2 relative min-w-[50px] text-white/45"
        >
          <div className="text-xl leading-none">☰</div>
          <div className="text-[10px] font-medium">Menu</div>
        </button>
      </div>
    </nav>
  );
}

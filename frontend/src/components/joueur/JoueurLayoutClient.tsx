"use client";

import { useState } from "react";
import Sidebar from "@/components/joueur/Sidebar";
import BottomNav from "@/components/joueur/BottomNav";
import TopBanner from "@/components/joueur/TopBanner";

export default function JoueurLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Sidebar
        isOpen={sidebarOpen}
        closeSidebar={() => setSidebarOpen(false)}
      />
      <div className="md:ml-[220px] flex flex-col min-h-screen pb-[calc(64px+20px)] md:pb-0">
        <TopBanner openSidebar={() => setSidebarOpen(true)} />
        <main className="p-4 md:p-5 flex-1 max-w-full">{children}</main>
      </div>
      <BottomNav openSidebar={() => setSidebarOpen(true)} />
    </>
  );
}

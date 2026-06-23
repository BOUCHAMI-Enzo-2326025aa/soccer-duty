"use client";

import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import AdminTopBar from "@/components/admin/AdminTopBar";

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <AdminSidebar
        isOpen={sidebarOpen}
        closeSidebar={() => setSidebarOpen(false)}
      />
      <div className="md:ml-[230px] flex flex-col min-h-screen pb-[64px] md:pb-0">
        <AdminTopBar openSidebar={() => setSidebarOpen(true)} title="ACCUEIL" />
        <main className="p-3.5 md:p-6 flex-1 max-w-full">{children}</main>
      </div>
      <AdminBottomNav openSidebar={() => setSidebarOpen(true)} />
    </>
  );
}

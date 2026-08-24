"use client";

export default function AdminTopBar({
  openSidebar,
  title = "ACCUEIL",
}: {
  openSidebar: () => void;
  title?: string;
}) {
  return (
    <header className="bg-white border-b border-border-custom px-3.5 md:px-6 py-[11px] md:py-[13px] flex items-center gap-3 sticky top-0 z-[90]">
      <button
        className="md:hidden text-xl text-navy shrink-0"
        onClick={openSidebar}
      >
        ☰
      </button>
      <div className="font-syne text-base font-bold text-navy whitespace-nowrap">
        {title}{" "}
        <span className="hidden md:inline text-muted text-xs font-inter">
          — Soccer Duty
        </span>
      </div>

      <div className="flex-1 max-w-none md:max-w-[360px] ml-2 md:ml-4 flex items-center gap-2 bg-sd-bg border border-border-custom rounded-[10px] px-3 py-2">
        <span className="text-muted">🔍</span>
        <input
          type="text"
          placeholder="Rechercher un joueur…"
          className="bg-transparent border-none outline-none text-[13px] text-text-custom w-full font-inter placeholder-muted"
        />
      </div>
    </header>
  );
}

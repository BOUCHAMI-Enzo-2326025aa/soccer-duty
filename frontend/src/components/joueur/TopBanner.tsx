"use client";

export default function TopBanner({
  openSidebar,
}: {
  openSidebar: () => void;
}) {
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
          ND
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-syne font-extrabold text-white text-[15px] whitespace-nowrap overflow-hidden text-ellipsis">
            NOAH DJEBALI
          </div>
          <div className="text-white/50 text-[11px]">📅 30/07/2005</div>
          <div className="text-green-custom text-[11px] font-medium whitespace-nowrap overflow-hidden text-ellipsis">
            🎓 Eastern Florida State College
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button className="relative bg-white/10 rounded-lg w-[34px] h-[34px] flex items-center justify-center text-[15px]">
            💬
            <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-orange-custom rounded-full"></div>
          </button>
          <button className="relative bg-white/10 rounded-lg w-[34px] h-[34px] flex items-center justify-center text-[15px]">
            🔔
          </button>
        </div>
      </div>

      <div className="px-4 md:px-6 pb-3 flex items-center gap-3">
        <div className="flex-1 h-[7px] bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-custom to-[#00e0a0] rounded-full"
            style={{ width: "72%" }}
          ></div>
        </div>
        <div className="text-white font-syne font-extrabold text-[15px] shrink-0">
          72%
        </div>
      </div>

      <div className="flex border-t border-white/10">
        <div className="flex-1 text-center py-2 px-1 md:px-1.5 border-r border-white/10">
          <div className="font-syne font-bold text-[17px] sm:text-[15px] text-green-custom">
            8/12
          </div>
          <div className="text-white/40 text-[9.5px] sm:text-[8.5px] font-medium">
            Validés
          </div>
        </div>
        <div className="flex-1 text-center py-2 px-1 md:px-1.5 border-r border-white/10">
          <div className="font-syne font-bold text-[17px] sm:text-[15px] text-orange-custom">
            2
          </div>
          <div className="text-white/40 text-[9.5px] sm:text-[8.5px] font-medium">
            En attente
          </div>
        </div>
        <div className="flex-1 text-center py-2 px-1 md:px-1.5 border-r border-white/10">
          <div className="font-syne font-bold text-[17px] sm:text-[15px] text-[#fc8181]">
            2
          </div>
          <div className="text-white/40 text-[9.5px] sm:text-[8.5px] font-medium">
            Manquants
          </div>
        </div>
        <div className="flex-1 text-center py-2 px-1 md:px-1.5">
          <div className="font-syne font-bold text-[17px] sm:text-[15px] text-white/70 text-[13px]">
            12/06
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

export default function JoueurPage() {
  const steps = [
    { label: "Passeport", status: "done", icon: "✓" },
    { label: "Relevés", status: "done", icon: "✓" },
    { label: "Anglais", status: "done", icon: "✓" },
    { label: "NCAA", status: "current", icon: "🏛" },
    { label: "I-20", status: "upcoming", icon: "📋" },
    { label: "Visa F1", status: "upcoming", icon: "🛂" },
    { label: "Départ", status: "upcoming", icon: "✈️" },
  ];

  return (
    <>
      <div className="overflow-x-auto scbar-hidden mb-5">
        <div className="flex items-start min-w-max pb-1">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center min-w-[80px] cursor-pointer"
            >
              <div className="flex items-center w-full">
                <div
                  className={`w-[30px] h-[30px] rounded-full flex items-center justify-center text-[13px] shrink-0 border-2 transition-all 
                    ${step.status === "done" ? "bg-green-custom text-white border-transparent" : ""}
                    ${step.status === "current" ? "bg-white border-orange-custom text-orange-custom shadow-[0_0_0_4px_rgba(255,107,53,0.15)]" : ""}
                    ${step.status === "upcoming" ? "bg-white border-border-custom text-muted" : ""}
                  `}
                >
                  {step.icon}
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-[2px] min-w-[20px] ${step.status === "done" ? "bg-green-custom" : "bg-border-custom"}`}
                  ></div>
                )}
              </div>
              <div
                className={`text-[10.5px] font-semibold mt-1.5 text-center 
                  ${step.status === "done" ? "text-green-custom" : ""}
                  ${step.status === "current" ? "text-orange-custom" : ""}
                  ${step.status === "upcoming" ? "text-muted" : ""}
                `}
              >
                {step.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border-custom overflow-hidden">
        <div className="bg-gradient-to-br from-navy to-navy-light p-5 md:p-[22px]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center text-white font-syne font-extrabold text-[15px] shrink-0">
              4
            </div>
            <div className="flex-1">
              <div className="text-white/50 text-[10px] font-semibold tracking-[0.8px] uppercase mb-1">
                Étape en cours
              </div>
              <div className="text-white font-syne font-extrabold text-base md:text-lg leading-[1.2]">
                NCAA — Inscription athlétique
              </div>
            </div>
          </div>
          <div className="mt-2.5 inline-flex items-center gap-1.5 bg-orange-custom/20 text-[#ffb89a] px-3 py-1.5 rounded-full text-[11.5px] font-semibold sm:text-[10.5px]">
            🕐 En attente de validation
          </div>
        </div>

        <div className="p-4 md:p-[22px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[22px]">
            {/* L COL */}
            <div>
              <div className="mb-4">
                <div className="font-syne text-[11.5px] font-bold uppercase tracking-[0.7px] text-muted mb-2">
                  Description
                </div>
                <p className="text-[13.5px] leading-[1.65] text-text-custom">
                  La NCAA régit le sport universitaire américain. Votre
                  inscription est obligatoire pour pouvoir participer aux
                  compétitions interuniversitaires.
                </p>
              </div>

              <div className="mb-4">
                <div className="font-syne text-[11.5px] font-bold uppercase tracking-[0.7px] text-muted mb-2">
                  Pourquoi ce document ?
                </div>
                <p className="text-[13.5px] leading-[1.65] text-text-custom">
                  Sans clearance NCAA, vous ne pouvez pas jouer pour votre
                  équipe universitaire. Cette étape valide votre éligibilité
                  sportive et académique.
                </p>
              </div>

              <div className="mb-4">
                <div className="font-syne text-[11.5px] font-bold uppercase tracking-[0.7px] text-muted mb-2">
                  Comment l&apos;obtenir
                </div>
                <ul className="list-none space-y-1">
                  <li className="text-[13px] text-slate-900 flex items-start gap-2">
                    <span className="text-green-custom font-bold">→</span> Créer
                    un compte sur <strong>eligibilitycenter.org</strong>
                  </li>
                  <li className="text-[13px] text-slate-900 flex items-start gap-2">
                    <span className="text-green-custom font-bold">→</span>{" "}
                    Renseigner votre parcours scolaire complet
                  </li>
                  <li className="text-[13px] text-slate-900 flex items-start gap-2">
                    <span className="text-green-custom font-bold">→</span>{" "}
                    Envoyer vos relevés de notes officiels à la NCAA
                  </li>
                  <li className="text-[13px] text-slate-900 flex items-start gap-2">
                    <span className="text-green-custom font-bold">→</span>{" "}
                    Attendre la confirmation de Soccer Duty
                  </li>
                </ul>
              </div>

              <div className="mb-4">
                <div className="font-syne text-[11.5px] font-bold uppercase tracking-[0.7px] text-muted mb-2">
                  Délai estimé
                </div>
                <div className="inline-flex items-center gap-1.5 bg-[#EEF4FF] text-blue-custom px-3 py-1.5 rounded-lg text-[13px] font-semibold">
                  ⏱ 3 à 6 semaines
                </div>
              </div>

              <div className="mb-4">
                <div className="font-syne text-[11.5px] font-bold uppercase tracking-[0.7px] text-muted mb-2">
                  Erreurs fréquentes
                </div>
                <ul className="list-none space-y-1">
                  <li className="text-[13px] text-slate-900 flex items-start gap-2">
                    <span className="text-red-custom font-bold">✗</span> Oublier
                    de déclarer un cours hors établissement
                  </li>
                  <li className="text-[13px] text-slate-900 flex items-start gap-2">
                    <span className="text-red-custom font-bold">✗</span> Relevés
                    de notes non certifiés
                  </li>
                  <li className="text-[13px] text-slate-900 flex items-start gap-2">
                    <span className="text-red-custom font-bold">✗</span> Email
                    de confirmation non vérifié
                  </li>
                </ul>
              </div>

              <div className="flex gap-2 flex-wrap mt-3">
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sd-bg border border-border-custom text-[12px] font-medium text-text-custom whitespace-nowrap hover:border-navy hover:text-navy transition-all">
                  📄 Guide PDF
                </button>
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sd-bg border border-border-custom text-[12px] font-medium text-text-custom whitespace-nowrap hover:border-navy hover:text-navy transition-all">
                  ▶ Vidéo
                </button>
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sd-bg border border-border-custom text-[12px] font-medium text-text-custom whitespace-nowrap hover:border-navy hover:text-navy transition-all">
                  🔗 eligibilitycenter.org
                </button>
              </div>
            </div>

            {/* R COL */}
            <div>
              <div className="font-syne text-[11.5px] font-bold uppercase tracking-[0.7px] text-muted mb-2">
                Déposer votre document
              </div>
              <div className="border-2 border-dashed border-border-custom rounded-xl p-6 text-center cursor-pointer transition-all hover:border-green-custom hover:bg-[#F0FFF8]">
                <div className="text-3xl mb-1.5">📤</div>
                <div className="text-[13px] text-muted">
                  Glissez votre fichier ici ou{" "}
                  <strong className="text-text-custom">
                    appuyez pour parcourir
                  </strong>
                </div>
                <div className="text-[11px] text-muted mt-1">
                  PDF · JPG · PNG acceptés
                </div>
              </div>

              <div className="mt-4">
                <div className="font-syne text-[11.5px] font-bold uppercase tracking-[0.7px] text-muted mb-2">
                  Statut de vos documents
                </div>

                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-sd-bg border border-border-custom mb-2 text-[13px]">
                  <div className="w-[7px] h-[7px] rounded-full bg-green-custom shrink-0"></div>
                  <div className="flex-1 text-slate-900">Relevés envoyés à la NCAA</div>
                  <div className="text-[10.5px] font-semibold whitespace-nowrap text-green-custom">
                    ✓ Validé
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#FFF3EC] border border-[#ffd3be] mb-2 text-[13px]">
                  <div className="w-[7px] h-[7px] rounded-full bg-orange-custom shrink-0"></div>
                  <div className="flex-1 text-slate-900">
                    Confirmation eligibilitycenter.org
                  </div>
                  <div className="text-[10.5px] font-semibold whitespace-nowrap text-orange-custom">
                    🕐 Attente
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-sd-bg border border-border-custom mb-2 text-[13px]">
                  <div className="w-[7px] h-[7px] rounded-full bg-muted shrink-0"></div>
                  <div className="flex-1 text-slate-900">Clearance finale NCAA</div>
                  <div className="text-[10.5px] font-semibold whitespace-nowrap text-muted">
                    Non envoyé
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-navy to-[#2a3f7a] rounded-xl p-3.5 mt-4 flex items-center gap-3">
                <div className="text-[22px]">🤖</div>
                <div className="text-white/70 text-[13px] flex-1">
                  <strong className="text-white block text-[13.5px] mb-px">
                    Demander à l&apos;IA
                  </strong>
                  Je suis sur l&apos;étape NCAA — posez votre question
                </div>
                <button className="bg-green-custom text-white px-3.5 py-2 rounded-lg text-[12px] font-semibold whitespace-nowrap shrink-0">
                  Poser une question
                </button>
              </div>

              <div className="mt-5">
                <div className="font-syne text-[11.5px] font-bold uppercase tracking-[0.7px] text-muted mb-2">
                  Contacter Soccer Duty
                </div>
                <div className="bg-sd-bg rounded-lg p-2.5 mb-2 text-[12.5px] max-h-[130px] overflow-y-auto">
                  <div className="mb-2">
                    <span className="font-semibold text-[11px] text-slate-900">Noah</span>
                    <span className="text-muted text-[10px] ml-1">
                      12/06 14:22
                    </span>
                    <div className="text-[12.5px] mt-0.5 text-slate-900">
                      Bonjour, j&apos;ai envoyé mes relevés de notes.
                    </div>
                  </div>
                  <div className="mb-2 text-right">
                    <span className="font-semibold text-[11px] text-green-custom">
                      Soccer Duty
                    </span>
                    <span className="text-muted text-[10px] ml-1">
                      12/06 15:10
                    </span>
                    <div className="text-[12.5px] mt-0.5 text-slate-900">
                      Reçus, en cours de validation !
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 rounded-lg bg-white border border-border-custom text-[13px] outline-none"
                    placeholder="Votre message…"
                  />
                  <button className="bg-navy text-white border-none rounded-lg px-4 py-2 text-[12.5px] font-semibold whitespace-nowrap">
                    Envoyer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-[22px] pt-[18px] border-t border-border-custom gap-3">
        <button className="flex items-center gap-2 px-5 py-3 rounded-[10px] text-sm font-semibold bg-sd-bg border border-border-custom text-muted transition-all">
          ← Test d&apos;anglais
        </button>
        <button className="flex items-center justify-center flex-1 gap-2 px-5 py-3 rounded-[10px] text-sm font-semibold bg-navy text-white hover:bg-navy-light transition-all cursor-pointer">
          I-20 →
        </button>
      </div>
    </>
  );
}

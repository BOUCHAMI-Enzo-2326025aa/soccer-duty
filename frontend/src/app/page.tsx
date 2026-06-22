import { getAgencies } from "../lib/api";

export default async function Home() {
  // On appelle notre backend !
  const agencies = await getAgencies();

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">
          Bienvenue sur Soccer Duty
        </h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4 text-slate-800">
            Agences connectées à la base de données :
          </h2>

          {agencies.length === 0 ? (
            <p className="text-gray-500">Aucune agence trouvée.</p>
          ) : (
            <ul className="space-y-3">
              {agencies.map((agency: any) => (
                <li
                  key={agency.id}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold">
                    {agency.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{agency.name}</p>
                    <p className="text-xs text-slate-500">
                      ID: {agency.id} | Créée le :{" "}
                      {new Date(agency.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

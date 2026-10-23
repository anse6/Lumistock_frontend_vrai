// Barre du haut (caissier) : état de la caisse, à la place de la recherche de l'admin.
import { NavLink } from "react-router-dom";
import { Vault } from "lucide-react";
import { argent, heure } from "./api";
import { useContexteCaisse } from "./hooks";

export default function EtatCaisse() {
  const { data: ctx } = useContexteCaisse();
  const session = ctx?.session;
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-950 sm:flex">
        <Vault size={19} />
      </span>
      {ctx &&
        (session ? (
          <NavLink to="/caisse/session" className="min-w-0 rounded-xl px-1 hover:bg-slate-50">
            <span className="flex items-center gap-2 text-sm font-semibold !text-emerald-800">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Caisse ouverte depuis {heure(session.ouverte_le)}
            </span>
            <span className="block truncate text-xs text-slate-500">
              Espèces attendues : {argent(session.resume.especes_attendues)}
            </span>
          </NavLink>
        ) : (
          <NavLink to="/caisse/ventes/nouvelle" className="min-w-0 rounded-xl px-1 hover:bg-slate-50">
            <span className="flex items-center gap-2 text-sm font-semibold !text-amber-800">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Caisse fermée
            </span>
            <span className="block truncate text-xs text-slate-500">Ouvrez-la pour commencer à vendre</span>
          </NavLink>
        ))}
    </div>
  );
}

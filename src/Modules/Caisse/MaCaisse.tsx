// Caisse du caissier : chiffres de la session en direct, fermeture avec comptage, historique.
// Mêmes pièces que le tableau de bord admin (tuiles, cartes, barres).
import { useState } from "react";
import { App, Input, InputNumber, Spin } from "antd";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowDownLeft, ArrowUpRight, Banknote, History, Lock, ShoppingBag, TrendingUp, Vault, Wallet } from "lucide-react";
import PageTitle from "../../Components/PageTitle";
import { TuileKpi } from "../../Components/admin/Dashboard/Synthese";
import { Barre, Carte, MessageVide } from "../../Components/dashboard/ui";
import { montantEnParties } from "../../Components/dashboard/theme";
import type { SessionCaisse } from "./api";
import { api, argent, dateHeure, devise, heure, messageErreur, symboleDevise } from "./api";
import { useRafraichirCaisse } from "./hooks";
import { formatterMontant, parserMontant } from "./pos/OuvertureCaisse";

const gros = (n: number) => {
  const p = montantEnParties(n, devise());
  return (
    <>
      <span className="whitespace-nowrap">{p.nombre}</span>{" "}
      <span className="whitespace-nowrap text-xs font-semibold opacity-70 sm:text-sm">{p.devise}</span>
    </>
  );
};

export const Ecart = ({ ecart }: { ecart: number | null }) => {
  if (ecart === null || ecart === undefined) return <span className="text-slate-400">—</span>;
  if (Math.abs(ecart) < 1) return <span className="inline-flex rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-800">Juste</span>;
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${ecart < 0 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>
      {ecart < 0 ? "Manque " : "Excédent "}{argent(Math.abs(ecart))}
    </span>
  );
};

/** Chiffres d'une session : utilisé par le caissier (Ma caisse) et par l'admin (page Caisses). */
export function ResumeSessionCaisse({ s }: { s: SessionCaisse }) {
  const r = s.resume;
  const max = Math.max(...r.modes.map((m) => m.net), 0);
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-4">
        <TuileKpi titre="Ventes" valeur={r.ventes} icone={<ShoppingBag size={17} />} comparaison=""
          detail={`${r.articles} article(s)${r.annulations ? ` · ${r.annulations} annulée(s)` : ""}`} />
        <TuileKpi titre="Chiffre d'affaires" valeur={gros(r.chiffre_affaires)} icone={<TrendingUp size={17} />} comparaison=""
          detail={`panier moyen ${argent(r.panier_moyen)}`} />
        <TuileKpi titre="Fond de caisse" valeur={gros(r.fond_initial)} icone={<Vault size={17} />} comparaison=""
          detail={`caisse ouverte à ${heure(s.ouverte_le)}`} />
        <TuileKpi titre="Espèces attendues" valeur={gros(r.especes_attendues)} icone={<Banknote size={17} />} comparaison=""
          detail="ce qui doit se trouver dans le tiroir" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <Carte titre="Argent par mode de paiement" sousTitre="Reçu moins rendu, depuis l'ouverture" icone={<Wallet size={18} />}>
          {r.modes.length === 0 ? <MessageVide texte="Aucun encaissement pour l'instant." /> : (
            <div className="space-y-4">
              {r.modes.map((m) => (
                <Barre key={m.mode} libelle={m.libelle} valeur={m.net} max={max} texteValeur={argent(m.net)}
                  detail={m.sorties > 0 ? `${argent(m.entrees)} reçus · ${argent(m.sorties)} rendus` : undefined} />
              ))}
            </div>
          )}
          <div className="mt-5 rounded-xl bg-purple-50/70 p-3 text-xs leading-relaxed text-slate-600">
            <p className="flex items-center justify-between text-sm font-semibold text-purple-950">
              <span>Espèces attendues</span><span className="tabular-nums">{argent(r.especes_attendues)}</span>
            </p>
            Fond {argent(r.fond_initial)} + espèces reçues {argent(r.especes_entrees)} − espèces rendues {argent(r.especes_sorties)}.
            Le mobile money et la banque ne sont pas dans le tiroir.
          </div>
        </Carte>

        <Carte titre="Derniers mouvements" sousTitre="Paiements reçus et argent rendu" icone={<History size={18} />}>
          {r.operations.length === 0 ? <MessageVide texte="Aucun mouvement pour l'instant." /> : (
            <ul className="max-h-[320px] divide-y divide-slate-100 overflow-y-auto scrollbar-hide">
              {[...r.operations].reverse().map((o, i) => (
                <li key={i} className="flex items-center gap-3 py-2.5">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${o.sens === "entree" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>
                    {o.sens === "entree" ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{o.nature} · {o.facture}</p>
                    <p className="text-xs text-slate-500">{heure(o.date)} · {o.mode_libelle}</p>
                  </div>
                  <span className={`shrink-0 text-sm font-semibold tabular-nums ${o.sens === "entree" ? "text-slate-900" : "text-red-700"}`}>
                    {o.sens === "sortie" ? "− " : ""}{argent(o.montant)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Carte>
      </div>
    </div>
  );
}

export default function MaCaisse() {
  const { message, modal } = App.useApp();
  const rafraichir = useRafraichirCaisse();
  const session = useQuery({ queryKey: ["caisse", "session"], queryFn: api.session, refetchInterval: 30_000 });
  const historique = useQuery({ queryKey: ["caisse", "sessions"], queryFn: () => api.sessions() });
  const [compte, setCompte] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const s = session.data;
  const attendu = s?.resume.especes_attendues ?? 0;
  const ecart = compte === null ? null : Math.round((compte - attendu) * 100) / 100;
  const passees = (historique.data?.sessions ?? []).filter((x) => x.statut === "fermee");

  const fermer = () => {
    if (compte === null) return;
    modal.confirm({
      title: "Fermer la caisse ?",
      content: ecart && Math.abs(ecart) >= 1
        ? `Écart de ${argent(Math.abs(ecart))} (${ecart < 0 ? "manque" : "excédent"}). Il sera visible par votre manager.`
        : "Le comptage correspond aux espèces attendues.",
      okText: "Fermer la caisse",
      cancelText: "Recompter",
      okButtonProps: { style: { backgroundColor: "#3b0764" } },
      onOk: async () => {
        setEnvoi(true);
        try {
          await api.fermer(compte, note.trim() || undefined);
          message.success("Caisse fermée. Bonne fin de journée !");
          setCompte(null); setNote("");
          rafraichir();
        } catch (e) { message.error(messageErreur(e)); } finally { setEnvoi(false); }
      },
    });
  };

  return (
    <>
      <PageTitle>Ma caisse</PageTitle>
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 sm:gap-6">
        {session.isLoading ? (
          <div className="flex justify-center py-20"><Spin /></div>
        ) : s ? (
          <>
            <p className="text-sm text-slate-500">Ouverte le {dateHeure(s.ouverte_le)} · chiffres mis à jour en direct</p>
            <div className="grid grid-cols-1 gap-4 sm:gap-6 2xl:grid-cols-[minmax(0,1fr)_380px]">
              <ResumeSessionCaisse s={s} />
              <Carte titre="Fermer la caisse" sousTitre="Comptez les billets et pièces du tiroir" icone={<Lock size={18} />} className="h-fit">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700">Espèces comptées</label>
                  <InputNumber<number> size="large" min={0} value={compte ?? undefined} onChange={(v) => setCompte(v === null ? null : Number(v))}
                    formatter={formatterMontant} parser={parserMontant} className="!w-full" suffix={symboleDevise()} placeholder="0" />
                  {compte !== null && (
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
                      <span className="text-slate-600">Attendu {argent(attendu)}</span>
                      <Ecart ecart={ecart} />
                    </div>
                  )}
                  <Input.TextArea value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} autoSize={{ minRows: 2 }}
                    placeholder={ecart && Math.abs(ecart) >= 1 ? "Expliquez l'écart (conseillé)" : "Note (facultatif)"} />
                  <button onClick={fermer} disabled={compte === null || envoi}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-950 py-3 text-sm font-bold text-white shadow-md shadow-purple-950/20 transition hover:bg-purple-900 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none">
                    <Lock size={16} /> Fermer la caisse
                  </button>
                </div>
              </Carte>
            </div>
          </>
        ) : (
          <Carte titre="Aucune caisse ouverte" sousTitre="Ouvrez votre caisse pour commencer à vendre" icone={<Vault size={18} />}>
            <Link to="/caisse/ventes/nouvelle" style={{ backgroundColor: "#3b0764", color: "#fff" }}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold !text-white shadow-md shadow-purple-950/20 hover:opacity-90">
              <Vault size={16} /> Ouvrir ma caisse
            </Link>
          </Carte>
        )}

        <Carte titre="Mes fermetures précédentes" sousTitre="Comptage et écart de chaque journée" icone={<History size={18} />}>
          {passees.length === 0 ? <MessageVide texte="Aucune caisse fermée pour l'instant." /> : (
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full min-w-[620px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th className="pb-2 font-medium">Journée</th>
                    <th className="pb-2 text-right font-medium">Ventes</th>
                    <th className="pb-2 text-right font-medium">Chiffre d'affaires</th>
                    <th className="pb-2 text-right font-medium">Attendu</th>
                    <th className="pb-2 text-right font-medium">Compté</th>
                    <th className="pb-2 text-right font-medium">Écart</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {passees.slice(0, 30).map((x) => (
                    <tr key={x.id}>
                      <td className="py-2.5 text-slate-700">{dateHeure(x.ouverte_le)} → {heure(x.fermee_le)}</td>
                      <td className="py-2.5 text-right tabular-nums">{x.resume.ventes}</td>
                      <td className="py-2.5 text-right font-semibold tabular-nums text-slate-900">{argent(x.resume.chiffre_affaires)}</td>
                      <td className="py-2.5 text-right tabular-nums">{argent(x.resume.especes_attendues)}</td>
                      <td className="py-2.5 text-right tabular-nums">{argent(x.montant_compte)}</td>
                      <td className="py-2.5 text-right"><Ecart ecart={x.ecart} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Carte>
      </div>
    </>
  );
}

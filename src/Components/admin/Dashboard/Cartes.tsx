// Cartes du tableau de bord admin : paiements, classements, créances, équipe, stock, ventes récentes, IA.
import React from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import {
  Boxes, CheckCircle2, ChevronRight, CircleAlert, CircleDashed, CreditCard, HandCoins, Phone,
  Receipt, Sparkles, Trophy, UserRound, UsersRound,
} from "lucide-react";
import type { VueMagasin } from "./api";
import { fetchConseilsIA, messageErreurServeur } from "./api";
import { Barre, Carte, MessageVide } from "../../dashboard/ui";
import { COULEURS, formatMontant, formatNombre } from "../../dashboard/theme";
import { useTextes } from "./textes";

const lienFin = "inline-flex items-center text-sm font-semibold !text-purple-950 hover:!text-purple-700";

/* ------------------------------------------------------------------ */
/* Paiements                                                            */
/* ------------------------------------------------------------------ */

export const PaiementsCard: React.FC<{ data: VueMagasin }> = ({ data }) => {
  const { t } = useTextes();
  const { statuts, methodes } = data.paiements;
  const total = statuts.reduce((s, x) => s + x.nombre, 0);
  const max = Math.max(...methodes.map((m) => m.montant), 0);
  const styles = {
    "payé": { libelle: t.payees, couleur: COULEURS.bon, icone: <CheckCircle2 size={15} /> },
    "partiellement payé": { libelle: t.partielles, couleur: COULEURS.attention, icone: <CircleDashed size={15} /> },
    "non payé": { libelle: t.nonPayees, couleur: COULEURS.critique, icone: <CircleAlert size={15} /> },
  } as const;

  return (
    <Carte titre={t.paiements} sousTitre={t.libellePeriode[data.periode.jours]} icone={<CreditCard size={18} />}>
      {total === 0 ? (
        <MessageVide texte={t.aucuneVente} />
      ) : (
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">{t.statutVentes(total)}</p>
            <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full" role="img"
              aria-label={statuts.map((s) => `${styles[s.statut].libelle} : ${s.nombre}`).join(", ")}>
              {statuts.filter((s) => s.nombre > 0).map((s) => (
                <div key={s.statut} style={{ width: `${(s.nombre / total) * 100}%`, background: styles[s.statut].couleur }} />
              ))}
            </div>
            <ul className="mt-3 space-y-2">
              {statuts.map((s) => (
                <li key={s.statut} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2 text-slate-700">
                    <span style={{ color: styles[s.statut].couleur }}>{styles[s.statut].icone}</span>
                    <span className="truncate">{styles[s.statut].libelle}</span>
                  </span>
                  <span className="shrink-0 tabular-nums">
                    <span className="font-semibold text-slate-900">{s.nombre}</span>
                    <span className="ml-1.5 text-xs text-slate-400">{Math.round((s.nombre / total) * 100)} %</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">{t.moyens}</p>
            {max === 0 ? (
              <p className="text-sm text-slate-400">{t.aucunEncaissement}</p>
            ) : (
              <div className="space-y-3">
                {methodes.map((m) => (
                  <Barre key={m.methode} libelle={t.methodes[m.methode] ?? m.methode} valeur={m.montant} max={max}
                    texteValeur={formatMontant(m.montant, data.magasin.devise)} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Carte>
  );
};

/* ------------------------------------------------------------------ */
/* Classements                                                          */
/* ------------------------------------------------------------------ */

const Rang: React.FC<{ n: number }> = ({ n }) => (
  <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
    n === 0 ? "bg-purple-950 text-white" : "bg-purple-50 text-purple-950"}`}>{n + 1}</span>
);

export const TopProduitsCard: React.FC<{ data: VueMagasin }> = ({ data }) => {
  const { t } = useTextes();
  const max = data.top_produits[0]?.montant ?? 0;
  return (
    <Carte titre={t.topProduits} sousTitre={t.topProduitsSous} icone={<Trophy size={18} />}>
      {data.top_produits.length === 0 ? <MessageVide texte={t.aucuneDonnee} /> : (
        <ol className="space-y-4">
          {data.top_produits.map((p, i) => (
            <li key={p.id} className="flex items-start gap-3">
              <Rang n={i} />
              <div className="min-w-0 flex-1">
                <Barre libelle={p.nom} valeur={p.montant} max={max} texteValeur={formatMontant(p.montant, data.magasin.devise)}
                  detail={t.unites(formatNombre(p.quantite))} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </Carte>
  );
};

export const TopClientsCard: React.FC<{ data: VueMagasin }> = ({ data }) => {
  const { t } = useTextes();
  const max = data.top_clients[0]?.ca ?? 0;
  return (
    <Carte titre={t.topClients} sousTitre={t.topClientsSous} icone={<UserRound size={18} />}>
      {data.top_clients.length === 0 ? <MessageVide texte={t.aucuneDonnee} /> : (
        <ol className="space-y-4">
          {data.top_clients.map((c, i) => (
            <li key={c.id} className="flex items-start gap-3">
              <Rang n={i} />
              <div className="min-w-0 flex-1">
                <Barre
                  libelle={<>{c.nom}{c.par_defaut && <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{t.clientPassage}</span>}</>}
                  valeur={c.ca} max={max} texteValeur={formatMontant(c.ca, data.magasin.devise)} detail={t.ventesN(c.ventes)} />
              </div>
            </li>
          ))}
        </ol>
      )}
      <div className="mt-4 border-t border-slate-100 pt-3">
        <Link to="/admin/dashboard/customers" className={lienFin}>{t.voir} <ChevronRight size={16} /></Link>
      </div>
    </Carte>
  );
};

export const DebiteursCard: React.FC<{ data: VueMagasin }> = ({ data }) => {
  const { t } = useTextes();
  return (
    <Carte titre={t.debiteurs} sousTitre={t.debiteursSous} icone={<HandCoins size={18} />}>
      {data.debiteurs.length === 0 ? <MessageVide texte={t.aucunDebiteur} /> : (
        <ul className="divide-y divide-slate-100">
          {data.debiteurs.map((d) => {
            const retard = d.jours !== null && d.jours > 30;
            return (
              <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{d.nom}</p>
                  <p className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                    <span>{t.ventesN(d.ventes)}</span>
                    {d.jours !== null && <span className={retard ? "font-medium text-red-700" : ""}>{retard ? "⚠ " : ""}{t.depuis(d.jours)}</span>}
                    {d.telephone && (
                      <a href={`tel:${d.telephone}`} className="inline-flex items-center gap-1 !text-purple-900 hover:underline">
                        <Phone size={11} /> {d.telephone}
                      </a>
                    )}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-red-700">{formatMontant(d.reste, data.magasin.devise)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </Carte>
  );
};

export const VendeursCard: React.FC<{ data: VueMagasin }> = ({ data }) => {
  const { t } = useTextes();
  const max = data.vendeurs[0]?.ca ?? 0;
  return (
    <Carte titre={t.vendeurs} sousTitre={t.vendeursSous} icone={<UsersRound size={18} />}>
      {data.vendeurs.length === 0 ? <MessageVide texte={t.aucuneDonnee} /> : (
        <div className="space-y-4">
          {data.vendeurs.map((v) => (
            <Barre key={v.id}
              libelle={<>{v.nom}{v.role && <span className="ml-1.5 text-xs text-slate-400">· {t.roles[v.role] ?? v.role}</span>}</>}
              valeur={v.ca} max={max} texteValeur={formatMontant(v.ca, data.magasin.devise)}
              detail={`${t.ventesN(v.ventes)} · ${t.unites(formatNombre(v.articles))}`} />
          ))}
        </div>
      )}
    </Carte>
  );
};

/* ------------------------------------------------------------------ */
/* Stock                                                                */
/* ------------------------------------------------------------------ */

export const StockCard: React.FC<{ data: VueMagasin }> = ({ data }) => {
  const { t } = useTextes();
  const s = data.stock;
  const chiffres = [
    { libelle: t.produitsRef, valeur: formatNombre(s.produits), alerte: false },
    { libelle: t.ruptures, valeur: formatNombre(s.ruptures), alerte: s.ruptures > 0 },
    { libelle: t.stockBas, valeur: formatNombre(s.stock_bas), alerte: s.stock_bas > 0 },
    { libelle: t.perimes, valeur: formatNombre(s.perimes), alerte: s.perimes > 0 },
    { libelle: t.bientot, valeur: formatNombre(s.bientot_perimes), alerte: s.bientot_perimes > 0 },
  ];
  return (
    <Carte titre={t.stock} sousTitre={t.stockSous} icone={<Boxes size={18} />}>
      <div className="mb-4 rounded-xl bg-purple-50/60 p-3">
        <p className="text-xs text-slate-500">{t.valeurStock}</p>
        <p className="text-xl font-bold text-purple-950">{formatMontant(s.valeur, data.magasin.devise)}</p>
      </div>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {chiffres.map((c) => (
          <div key={c.libelle} className="rounded-xl border border-slate-100 px-2.5 py-2">
            <dt className="text-[11px] leading-tight text-slate-500">{c.libelle}</dt>
            <dd className={`text-base font-bold ${c.alerte ? "text-amber-700" : "text-slate-900"}`}>{c.alerte ? "⚠ " : ""}{c.valeur}</dd>
          </div>
        ))}
      </dl>
      <p className="mb-2 mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">{t.aReappro}</p>
      {s.a_reapprovisionner.length === 0 ? (
        <p className="text-sm text-slate-400">{t.aucunReappro}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {s.a_reapprovisionner.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-2">
              <Link to={`/admin/dashboard/produits_approvisionnements/add_product/productdetail/${p.id}`}
                className="min-w-0 truncate text-sm !text-slate-800 hover:!text-purple-800">{p.nom}</Link>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                p.quantite <= 0 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>
                {p.quantite <= 0 ? t.rupture : t.restant(formatNombre(p.quantite), p.seuil)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {s.stock_bas === 0 && <p className="mt-3 text-[11px] text-slate-400">{t.seuilAide}</p>}
    </Carte>
  );
};

/* ------------------------------------------------------------------ */
/* Ventes récentes                                                      */
/* ------------------------------------------------------------------ */

export const VentesRecentesCard: React.FC<{ data: VueMagasin }> = ({ data }) => {
  const { t, locale } = useTextes();
  const badge = (statut?: string) =>
    statut === "payé" ? "bg-green-50 text-green-800" : statut === "partiellement payé" ? "bg-amber-50 text-amber-800" : "bg-red-50 text-red-700";
  return (
    <Carte titre={t.recentes} icone={<Receipt size={18} />}
      action={<Link to="/admin/dashboard/deliverys" className={lienFin}>{t.toutes} <ChevronRight size={16} /></Link>}>
      {data.ventes_recentes.length === 0 ? <MessageVide texte={t.aucuneVente} /> : (
        <ul className="divide-y divide-slate-100">
          {data.ventes_recentes.map((v) => (
            <li key={v.id}>
              <Link to={`/admin/dashboard/deliverys/detaillivrason/${v.id}`}
                className="flex items-center justify-between gap-3 py-2.5 !text-slate-800 hover:!text-purple-900">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{v.client}</p>
                  <p className="text-xs text-slate-500">
                    {v.date ? new Date(v.date).toLocaleString(locale, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums text-slate-900">{formatMontant(v.montant, data.magasin.devise)}</p>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge(v.statut_paiement)}`}>
                    {t.statutsPaiement[v.statut_paiement ?? ""] ?? v.statut_paiement}
                    {v.reste > 0 && v.statut_paiement !== "non payé" ? ` · ${t.reste(formatMontant(v.reste, data.magasin.devise))}` : ""}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Carte>
  );
};

/* ------------------------------------------------------------------ */
/* Conseils de l'IA (à la demande : l'analyse a un coût)                */
/* ------------------------------------------------------------------ */

export const ConseilsIACard: React.FC = () => {
  const { t, locale } = useTextes();
  const analyse = useMutation({ mutationFn: (forcer: boolean) => fetchConseilsIA(forcer) });
  const resultat = analyse.data;
  return (
    <Carte titre={t.ia} sousTitre={t.iaSous} icone={<Sparkles size={18} />}
      action={
        <button type="button" onClick={() => analyse.mutate(Boolean(resultat))} disabled={analyse.isPending}
          className="inline-flex h-9 items-center gap-2 rounded-xl bg-purple-950 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-purple-900 disabled:opacity-60">
          <Sparkles size={15} /> {analyse.isPending ? t.iaChargement : resultat ? t.iaRelancer : t.iaBouton}
        </button>
      }>
      {analyse.isError && (
        // Message exact du serveur : IA non configurée, fournisseur indisponible…
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <CircleAlert size={17} className="mt-0.5 shrink-0" />
          <span>{messageErreurServeur(analyse.error, t.iaErreur)}</span>
        </div>
      )}
      {analyse.isPending && (
        <div className="space-y-2">
          {[90, 75, 82, 60].map((l) => <div key={l} className="h-3 animate-pulse rounded bg-slate-100" style={{ width: `${l}%` }} />)}
        </div>
      )}
      {resultat && !analyse.isPending && (
        <>
          <p className="mb-3 text-xs text-slate-400">
            {t.iaGenereLe(new Date(resultat.genere_le).toLocaleString(locale, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }))}
            {resultat.depuis_cache && ` · ${t.iaCache}`}
          </p>
          <div className="max-w-none text-sm leading-relaxed text-slate-700 [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-purple-950 [&_h2:first-child]:mt-0 [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1.5 [&_strong]:text-slate-900 [&_ul]:list-disc [&_ul]:pl-5">
            <ReactMarkdown>{resultat.insights}</ReactMarkdown>
          </div>
        </>
      )}
      <div className="mt-3">
        <Link to="/admin/dashboard/ia" className={lienFin}>{t.iaDiscuter} <ChevronRight size={16} /></Link>
      </div>
    </Carte>
  );
};

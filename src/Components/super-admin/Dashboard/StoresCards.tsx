// Classement des magasins et suivi de leur santé (activité, licence, stock).
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, HeartPulse, Trophy } from "lucide-react";
import type { MagasinDetail, VueEnsemble } from "./api";
import { Barre, Carte, Evolution, MessageVide, Segment } from "../../dashboard/ui";
import { COULEURS, LIBELLES_PERIODE, formatMontant, formatNombre, variation } from "../../dashboard/theme";

const lienMagasin = (id: string) => `/superadmin/dashboard/magasin/view/${id}`;

/* ------------------------------------------------------------------ */
/* Meilleurs magasins                                                   */
/* ------------------------------------------------------------------ */

export const TopStoresCard: React.FC<{ data: VueEnsemble }> = ({ data }) => {
  // Les chiffres d'affaires ne s'additionnent pas entre devises : un classement par devise.
  const [devise, setDevise] = useState(data.devises[0] ?? "XAF");
  const deviseActive = data.devises.includes(devise) ? devise : data.devises[0] ?? "XAF";

  const classement = useMemo(
    () =>
      data.magasins
        .filter((m) => m.devise === deviseActive && m.chiffre_affaire > 0)
        .sort((a, b) => b.chiffre_affaire - a.chiffre_affaire)
        .slice(0, 6),
    [data.magasins, deviseActive],
  );
  const max = classement[0]?.chiffre_affaire ?? 0;

  return (
    <Carte
      titre="Meilleurs magasins"
      sousTitre={`Chiffre d'affaires HT · ${LIBELLES_PERIODE[data.periode.jours]}`}
      icone={<Trophy size={18} />}
      action={
        data.devises.length > 1 ? (
          <Segment libelle="Devise" options={data.devises.map((d) => ({ valeur: d, libelle: d }))} valeur={deviseActive} onChange={setDevise} />
        ) : undefined
      }
    >
      {classement.length === 0 ? (
        <MessageVide texte="Aucune vente sur la période." />
      ) : (
        <ol className="space-y-4">
          {classement.map((m, i) => (
            <li key={m.id} className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  i === 0 ? "bg-purple-950 text-white" : "bg-purple-50 text-purple-950"
                }`}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <Barre
                  libelle={
                    <Link to={lienMagasin(m.id)} className="font-medium !text-slate-800 hover:!text-purple-800">
                      {m.denomination}
                    </Link>
                  }
                  valeur={m.chiffre_affaire}
                  max={max}
                  texteValeur={formatMontant(m.chiffre_affaire, m.devise)}
                  detail={
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      {formatNombre(m.ventes)} vente(s){m.ville ? ` · ${m.ville}` : ""}
                      <Evolution valeur={variation(m.chiffre_affaire, m.chiffre_affaire_prec)} />
                    </span>
                  }
                />
              </div>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
        Hors TVA et hors dettes reportées. Les ventes annulées ou à la corbeille ne sont pas comptées.
      </p>
    </Carte>
  );
};

/* ------------------------------------------------------------------ */
/* Santé des magasins                                                   */
/* ------------------------------------------------------------------ */

const SEUIL_INACTIVITE = 14; // jours sans connexion ni vente

const aSurveiller = (m: MagasinDetail) =>
  m.statut === "desactive" ||
  m.jours_sans_activite === null ||
  m.jours_sans_activite > SEUIL_INACTIVITE ||
  m.produits_rupture > 0;

const BadgeStatut: React.FC<{ statut: MagasinDetail["statut"] }> = ({ statut }) =>
  statut === "actif" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-800">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: COULEURS.bon }} /> Actif
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Désactivé
    </span>
  );

const Activite: React.FC<{ jours: number | null }> = ({ jours }) => {
  if (jours === null) return <span className="text-xs font-medium text-red-700">⚠ Jamais utilisé</span>;
  const texte = jours === 0 ? "Aujourd'hui" : jours === 1 ? "Hier" : `Il y a ${jours} j`;
  if (jours > SEUIL_INACTIVITE) return <span className="text-xs font-medium text-amber-700">⚠ {texte}</span>;
  return <span className="text-xs text-slate-600">{texte}</span>;
};

/** Jauge « utilisés / autorisés par la licence ». */
const Jauge: React.FC<{ libelle: string; utilise: number; max: number | null }> = ({ libelle, utilise, max }) => {
  const plein = max !== null && utilise >= max;
  return (
    <div className="min-w-[96px]" title={`${libelle} : ${utilise}${max !== null ? ` sur ${max} autorisé(s)` : ""}`}>
      <div className="flex justify-between text-[11px] text-slate-500">
        <span>{libelle}</span>
        <span className={`tabular-nums ${plein ? "font-semibold text-purple-950" : ""}`}>
          {utilise}/{max ?? "∞"}
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full" style={{ background: COULEURS.piste }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${max ? Math.min((utilise / max) * 100, 100) : 0}%`, background: COULEURS.serie1 }}
        />
      </div>
    </div>
  );
};

export const StoresHealthCard: React.FC<{ data: VueEnsemble }> = ({ data }) => {
  const [filtre, setFiltre] = useState<"tous" | "surveiller">("tous");
  const nbSurveiller = data.magasins.filter(aSurveiller).length;
  const liste = filtre === "tous" ? data.magasins : data.magasins.filter(aSurveiller);

  return (
    <Carte
      titre="Santé des magasins"
      sousTitre={`Ventes et CA sur les ${LIBELLES_PERIODE[data.periode.jours].toLowerCase()} · alerte si désactivé, inactif depuis ${SEUIL_INACTIVITE} j ou en rupture`}
      icone={<HeartPulse size={18} />}
      action={
        <Segment
          libelle="Filtre des magasins"
          options={[
            { valeur: "tous", libelle: `Tous (${data.magasins.length})` },
            { valeur: "surveiller", libelle: `À surveiller (${nbSurveiller})` },
          ]}
          valeur={filtre}
          onChange={setFiltre}
        />
      }
    >
      {liste.length === 0 ? (
        <MessageVide texte={filtre === "tous" ? "Aucun magasin." : "Aucun magasin à surveiller. Tout va bien."} />
      ) : (
        <>
          {/* Mobile : une carte par magasin */}
          <ul className="space-y-3 md:hidden">
            {liste.map((m) => (
              <li key={m.id} className="rounded-xl border border-slate-100 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link to={lienMagasin(m.id)} className="block truncate font-semibold !text-slate-900 hover:!text-purple-800">
                      {m.denomination}
                    </Link>
                    <p className="text-xs text-slate-500">{m.ville || "—"}</p>
                  </div>
                  <BadgeStatut statut={m.statut} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                  <div>
                    <dt className="text-slate-500">Ventes</dt>
                    <dd className="font-semibold text-slate-900">{formatNombre(m.ventes)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Chiffre d'affaires HT</dt>
                    <dd className="font-semibold text-slate-900">{formatMontant(m.chiffre_affaire, m.devise)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Produits</dt>
                    <dd className="text-slate-900">
                      {formatNombre(m.produits)}
                      {m.produits_rupture > 0 && <span className="ml-1 text-amber-700">· {m.produits_rupture} en rupture</span>}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Dernière activité</dt>
                    <dd><Activite jours={m.jours_sans_activite} /></dd>
                  </div>
                </dl>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Jauge libelle="Managers" utilise={m.managers} max={m.max_managers} />
                  <Jauge libelle="Gérants" utilise={m.gerants} max={m.max_gerants} />
                </div>
              </li>
            ))}
          </ul>

          {/* Tablette et ordinateur : tableau */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-3 font-medium">Magasin</th>
                  <th className="px-3 py-2 font-medium">Statut</th>
                  <th className="px-3 py-2 text-right font-medium">Ventes</th>
                  <th className="px-3 py-2 text-right font-medium">CA HT</th>
                  <th className="px-3 py-2 text-right font-medium">Produits</th>
                  <th className="px-3 py-2 font-medium">Licence</th>
                  <th className="py-2 pl-3 font-medium">Dernière activité</th>
                </tr>
              </thead>
              <tbody>
                {liste.map((m) => (
                  <tr key={m.id} className="border-b border-slate-50 last:border-0 hover:bg-purple-50/40">
                    <td className="py-3 pr-3">
                      <Link to={lienMagasin(m.id)} className="font-semibold !text-slate-900 hover:!text-purple-800">
                        {m.denomination}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {m.ville || "—"} · {formatNombre(m.clients)} client(s)
                      </p>
                    </td>
                    <td className="px-3 py-3"><BadgeStatut statut={m.statut} /></td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      <span className="font-semibold text-slate-900">{formatNombre(m.ventes)}</span>
                      <div className="mt-0.5"><Evolution valeur={variation(m.ventes, m.ventes_prec)} /></div>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-900">{formatMontant(m.chiffre_affaire, m.devise)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      <span className="text-slate-900">{formatNombre(m.produits)}</span>
                      {m.produits_rupture > 0 && <p className="text-xs text-amber-700">⚠ {m.produits_rupture} en rupture</p>}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-3">
                        <Jauge libelle="Managers" utilise={m.managers} max={m.max_managers} />
                        <Jauge libelle="Gérants" utilise={m.gerants} max={m.max_gerants} />
                      </div>
                    </td>
                    <td className="py-3 pl-3"><Activite jours={m.jours_sans_activite} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <Link
        to="/superadmin/dashboard/magasin"
        className="mt-4 inline-flex items-center text-sm font-semibold !text-purple-950 hover:!text-purple-700"
      >
        Gérer les magasins <ChevronRight size={16} className="ml-0.5" />
      </Link>
    </Carte>
  );
};

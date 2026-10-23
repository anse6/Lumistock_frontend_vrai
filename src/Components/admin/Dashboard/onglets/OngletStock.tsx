// Onglet « Stock » : valeur et évolution du stock, entrées / sorties, catégories, ruptures à venir, stock qui dort.
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { TooltipProps } from "recharts";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, Treemap, XAxis, YAxis,
} from "recharts";
import { Archive, ArrowDownUp, Boxes, Hourglass, LayoutGrid, Moon, PackageX, RefreshCcw, TrendingUp, Truck } from "lucide-react";
import type { FamilleFlux, OngletStock as Donnees } from "./api";
import { Barre, Carte, MessageVide, Segment } from "../../../dashboard/ui";
import { COULEURS, COULEURS_FLUX, couleurChaleur, formatCompact, formatMontant, formatNombre } from "../../../dashboard/theme";
import { Bulle, GrilleTuiles, GrosMontant, Tuile } from "./communs";
import { libellesIntervalle } from "./dates";
import { useTextesOnglets } from "./textes";

const lienProduit = (id: string) => `/admin/dashboard/produits_approvisionnements/add_product/productdetail/${id}`;
const FAMILLES: FamilleFlux[] = ["approvisionnements", "retours", "ventes", "pertes", "ajustements"];

/* ---------------- Évolution de la valeur ----------------
 * Le stock total se compte en centaines de millions et bouge de quelques
 * centaines de milliers : un axe partant de zéro donnerait une ligne plate.
 * L'axe est donc resserré sur les variations (indiqué sous le titre), et le
 * stock des gérants, d'un tout autre ordre de grandeur, a son propre petit
 * graphique (jamais deux échelles sur le même graphique). */
const Evolution: React.FC<{ d: Donnees }> = ({ d }) => {
  const { t, locale } = useTextesOnglets();
  const points = useMemo(
    () => d.evolution.map((p) => ({ ...p, total: p.magasin + p.gerants, ...libellesIntervalle(p.date, d.periode.granularite, locale) })),
    [d, locale],
  );
  const m = (n: number) => formatMontant(n, d.devise);
  const totaux = points.map((p) => p.total);
  const min = Math.min(...totaux);
  const max = Math.max(...totaux);
  const marge = Math.max((max - min) * 0.25, max * 0.002, 1);
  const avecGerants = points.some((p) => p.gerants > 0);
  const axeX = <XAxis dataKey="axe" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: COULEURS.axe }} interval="preserveStartEnd" minTickGap={12} />;
  const bulle = ({ active, payload }: TooltipProps<number, string>) => {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload as (typeof points)[number];
    return (
      <Bulle titre={p.titre} lignes={[
        { couleur: COULEURS.serie1, libelle: "Total", valeur: m(p.total) },
        { libelle: t.stock.magasin, valeur: m(p.magasin) },
        { couleur: COULEURS.serie3, libelle: t.stock.gerants, valeur: m(p.gerants) },
      ]} />
    );
  };
  return (
    <Carte titre={t.stock.evolution} sousTitre={t.stock.evolutionSous} icone={<TrendingUp size={18} />}>
      <div className="h-[230px] w-full sm:h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 8, right: 6, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="degradeStock" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COULEURS.serie1} stopOpacity={0.3} />
                <stop offset="100%" stopColor={COULEURS.serie1} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={COULEURS.grille} />
            {axeX}
            <YAxis axisLine={false} tickLine={false} width={52} domain={[Math.max(min - marge, 0), max + marge]}
              tick={{ fontSize: 11, fill: COULEURS.axe }} tickFormatter={(v: number) => formatCompact(v)} />
            <Tooltip content={bulle} />
            <Area type="monotone" dataKey="total" baseValue="dataMin" stroke={COULEURS.serie1} strokeWidth={2.5} fill="url(#degradeStock)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {avecGerants && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COULEURS.serie3 }} /> {t.stock.gerants}
          </p>
          <div className="h-[90px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={COULEURS.grille} />
                <XAxis dataKey="axe" hide />
                <YAxis axisLine={false} tickLine={false} width={52} tick={{ fontSize: 10, fill: COULEURS.axe }} tickCount={3} tickFormatter={(v: number) => formatCompact(v)} />
                <Tooltip content={bulle} />
                <Area type="stepAfter" dataKey="gerants" stroke={COULEURS.serie3} strokeWidth={2} fill={COULEURS.serie3} fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </Carte>
  );
};

/* ---------------- Entrées / sorties (barres divergentes empilées) ---------------- */
const Flux: React.FC<{ d: Donnees }> = ({ d }) => {
  const { t, locale } = useTextesOnglets();
  const [mesure, setMesure] = useState<"unites" | "valeur">("unites");
  const points = useMemo(
    () => d.flux.map((p) => ({
      ...libellesIntervalle(p.debut, d.periode.granularite, locale),
      ...Object.fromEntries(FAMILLES.map((f) => [f, p[f][mesure]])),
    })),
    [d, mesure, locale],
  );
  const vide = FAMILLES.every((f) => d.totaux_flux[f].unites === 0);
  const format = (n: number) => (mesure === "valeur" ? formatMontant(n, d.devise) : formatNombre(n));
  return (
    <Carte
      titre={t.stock.flux}
      sousTitre={t.stock.fluxSous}
      icone={<ArrowDownUp size={18} />}
      action={<Segment libelle="Mesure" options={[{ valeur: "unites", libelle: t.unites }, { valeur: "valeur", libelle: t.valeur }]} valeur={mesure} onChange={setMesure} />}
    >
      {/* Totaux de la période, une pastille par famille (lecture sans survol) */}
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {FAMILLES.map((f) => (
          <div key={f} className="min-w-0 rounded-lg border border-slate-100 px-2.5 py-1.5">
            <p className="flex items-center gap-1.5 text-[11px] leading-tight text-slate-500">
              <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: COULEURS_FLUX[f] }} /> {t.stock.familles[f]}
            </p>
            <p className="text-sm font-semibold tabular-nums text-slate-900">
              {d.totaux_flux[f][mesure] > 0 ? "+" : ""}{format(d.totaux_flux[f][mesure])}
            </p>
          </div>
        ))}
      </div>
      <div className="h-[240px] w-full sm:h-[280px]">
        {vide ? <MessageVide texte={t.vide} /> : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={points} stackOffset="sign" margin={{ top: 8, right: 6, left: 0, bottom: 0 }} barCategoryGap="22%">
              <CartesianGrid vertical={false} stroke={COULEURS.grille} />
              <XAxis dataKey="axe" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: COULEURS.axe }} interval="preserveStartEnd" minTickGap={12} />
              <YAxis axisLine={false} tickLine={false} width={44} tick={{ fontSize: 11, fill: COULEURS.axe }} tickFormatter={(v: number) => formatCompact(v)} />
              <ReferenceLine y={0} stroke="#94a3b8" />
              <Tooltip
                cursor={{ fill: "rgba(59, 7, 100, 0.05)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as Record<string, number | string>;
                  return (
                    <Bulle titre={String(p.titre)} lignes={FAMILLES.filter((f) => Number(p[f]) !== 0).map((f) => ({
                      couleur: COULEURS_FLUX[f], libelle: t.stock.familles[f], valeur: `${Number(p[f]) > 0 ? "+" : ""}${format(Number(p[f]))}`,
                    }))} />
                  );
                }}
              />
              {FAMILLES.map((f) => (
                <Bar key={f} dataKey={f} stackId="flux" fill={COULEURS_FLUX[f]} maxBarSize={34} stroke="#fff" strokeWidth={1} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Carte>
  );
};

/* ---------------- Catégories (carte proportionnelle) ---------------- */
interface CaseProps { x?: number; y?: number; width?: number; height?: number; name?: string; ratio?: number; part?: number }
const Case: React.FC<CaseProps> = ({ x = 0, y = 0, width = 0, height = 0, name, ratio = 0, part = 0 }) => {
  const fond = couleurChaleur(0.25 + ratio * 0.75);
  const texteClair = ratio > 0.3;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={6} fill={fond} stroke="#fff" strokeWidth={2} />
      {width > 70 && height > 34 && (
        <>
          <text x={x + 8} y={y + 18} fontSize={12} fontWeight={600} fill={texteClair ? "#fff" : "#3b0764"}>
            {String(name).length > Math.floor(width / 7.5) ? `${String(name).slice(0, Math.floor(width / 7.5) - 1)}…` : name}
          </text>
          <text x={x + 8} y={y + 33} fontSize={11} fill={texteClair ? "rgba(255,255,255,0.85)" : "#6b21a8"}>{part.toLocaleString("fr-FR")} %</text>
        </>
      )}
    </g>
  );
};

const Categories: React.FC<{ d: Donnees }> = ({ d }) => {
  const { t } = useTextesOnglets();
  const total = d.categories.reduce((s, c) => s + c.valeur, 0);
  const max = d.categories[0]?.valeur ?? 0;
  const cases = d.categories.filter((c) => c.valeur > 0).map((c) => ({
    name: c.nom, size: c.valeur, ratio: max ? c.valeur / max : 0, part: total ? Math.round((c.valeur / total) * 1000) / 10 : 0, ...c,
  }));
  return (
    <Carte titre={t.stock.categories} sousTitre={t.stock.categoriesSous} icone={<LayoutGrid size={18} />}>
      {cases.length === 0 ? <MessageVide texte={t.vide} /> : (
        <>
          <div className="h-[240px] w-full sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap data={cases} dataKey="size" isAnimationActive={false} content={<Case />}>
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const c = payload[0].payload as (typeof cases)[number];
                  return <Bulle titre={c.nom} lignes={[
                    { libelle: t.valeur, valeur: formatMontant(c.valeur, d.devise) },
                    { libelle: t.unites, valeur: formatNombre(c.unites) },
                  ]} note={`${t.stock.produitsN(c.produits)} · ${c.part} %`} />;
                }} />
              </Treemap>
            </ResponsiveContainer>
          </div>
          {/* Tableau de lecture (les petites cases n'ont pas la place d'afficher leur nom) */}
          <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
            {cases.slice(0, 8).map((c) => (
              <li key={c.nom} className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: couleurChaleur(0.25 + c.ratio * 0.75) }} />
                  <span className="truncate text-slate-700">{c.nom}</span>
                </span>
                <span className="shrink-0 tabular-nums text-slate-900">{formatMontant(c.valeur, d.devise)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Carte>
  );
};

/* ---------------- Produits qui vont manquer (jauges de couverture) ---------------- */
const Couverture: React.FC<{ d: Donnees }> = ({ d }) => {
  const { t } = useTextesOnglets();
  const plafond = 60; // jours : au-delà, la jauge est pleine
  return (
    <Carte titre={t.stock.couverture} sousTitre={t.stock.couvertureSous} icone={<Hourglass size={18} />}>
      {d.couverture.length === 0 ? <MessageVide texte={t.stock.couvertureVide} /> : (
        <ul className="space-y-3.5">
          {d.couverture.map((p) => {
            const urgence = p.jours < 7 ? "critique" : p.jours < 14 ? "attention" : "ok";
            const couleur = urgence === "critique" ? COULEURS.critique : urgence === "attention" ? COULEURS.attention : COULEURS.serie1;
            return (
              <li key={p.id}>
                <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                  <Link to={lienProduit(p.id)} className="min-w-0 truncate !text-slate-800 hover:!text-purple-800">{p.nom}</Link>
                  <span className={`shrink-0 text-xs font-semibold ${urgence === "critique" ? "text-red-700" : urgence === "attention" ? "text-amber-700" : "text-slate-700"}`}>
                    {urgence !== "ok" ? "⚠ " : ""}{t.stock.restants(formatNombre(p.jours))}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: COULEURS.piste }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.max(Math.min(p.jours / plafond, 1) * 100, 3)}%`, background: couleur }} />
                </div>
                <p className="mt-0.5 text-[11px] text-slate-500">{t.stock.rythme(formatNombre(p.stock), formatNombre(p.par_jour))}</p>
              </li>
            );
          })}
        </ul>
      )}
    </Carte>
  );
};

/* ---------------- Produits qui dorment ---------------- */
const Dormants: React.FC<{ d: Donnees }> = ({ d }) => {
  const { t } = useTextesOnglets();
  return (
    <Carte titre={t.stock.dormants} sousTitre={t.stock.dormantsSous} icone={<Moon size={18} />}>
      {d.dormants.length === 0 ? <MessageVide texte={t.stock.dormantsVide} /> : (
        <ul className="divide-y divide-slate-100">
          {d.dormants.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <Link to={lienProduit(p.id)} className="block truncate text-sm !text-slate-800 hover:!text-purple-800">{p.nom}</Link>
                <p className="text-xs text-slate-500">{formatNombre(p.stock)} · {p.jamais_vendu ? t.stock.jamais : t.stock.depuis(p.jours)}</p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">{formatMontant(p.valeur, d.devise)}</span>
            </li>
          ))}
        </ul>
      )}
    </Carte>
  );
};

/* ---------------- Stock chez les gérants ---------------- */
const Gerants: React.FC<{ d: Donnees }> = ({ d }) => {
  const { t } = useTextesOnglets();
  const max = d.gerants[0]?.valeur ?? 0;
  return (
    <Carte titre={t.stock.parGerant} sousTitre={t.stock.parGerantSous} icone={<Truck size={18} />}>
      {d.gerants.length === 0 || max === 0 ? <MessageVide texte={t.stock.aucunGerant} /> : (
        <div className="space-y-4">
          {d.gerants.map((g) => (
            <Barre key={g.id} libelle={g.nom} valeur={g.valeur} max={max} couleur={COULEURS.serie3}
              texteValeur={formatMontant(g.valeur, d.devise)} detail={`${formatNombre(g.unites)} ${t.unites.toLowerCase()}`} />
          ))}
        </div>
      )}
    </Carte>
  );
};

/* ---------------- Onglet ---------------- */
const OngletStock: React.FC<{ d: Donnees }> = ({ d }) => {
  const { t } = useTextesOnglets();
  const k = d.kpis;
  const m = (n: number) => formatMontant(n, d.devise);
  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <GrilleTuiles>
        <Tuile titre={t.stock.valeurTotale} icone={<Boxes size={17} />} valeur={<GrosMontant valeur={k.valeur_totale} devise={d.devise} />}
          detail={t.stock.valeurDetail(m(k.valeur_magasin), m(k.valeur_gerants))} evolution={k.variation} libelleEvolution={t.vsDebut} />
        <Tuile titre={t.stock.unites} icone={<Archive size={17} />} valeur={formatNombre(k.unites)} detail={t.stock.unitesDetail(k.produits, k.en_stock)} />
        <Tuile titre={t.stock.rotation} icone={<RefreshCcw size={17} />} aide={t.stock.rotationAide}
          valeur={k.rotation !== null ? `× ${k.rotation.toLocaleString("fr-FR")}` : "—"}
          detail={k.jours_de_stock !== null ? t.stock.rotationDetail(formatNombre(k.jours_de_stock)) : t.stock.rotationAide} />
        <Tuile titre={t.stock.ruptures} icone={<PackageX size={17} />} valeur={formatNombre(k.ruptures)} ton={k.ruptures > 0 ? "alerte" : "normal"}
          detail={t.stock.rupturesDetail(k.sous_seuil, k.avec_seuil)} />
        <Tuile titre={t.stock.dormant} icone={<Moon size={17} />} valeur={<GrosMontant valeur={k.valeur_dormante} devise={d.devise} />}
          ton={k.dormants > 0 ? "alerte" : "normal"} detail={t.stock.dormantDetail(k.dormants)} />
      </GrilleTuiles>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-2">
        <Evolution d={d} />
        <Flux d={d} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2"><Categories d={d} /></div>
        <Couverture d={d} />
      </div>
      <div className="grid grid-cols-1 items-start gap-4 sm:gap-5 md:grid-cols-2">
        <Dormants d={d} />
        <Gerants d={d} />
      </div>
    </div>
  );
};

export default OngletStock;

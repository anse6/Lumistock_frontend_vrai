// Onglet « Ventes » : moments forts, rythme, catégories, volume/marge des produits, retours.
import React, { useMemo } from "react";
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis,
} from "recharts";
import { CalendarClock, Crosshair, Flame, Layers, Percent, RotateCcw, ShoppingBasket, Tags, TrendingUp } from "lucide-react";
import type { OngletVentes as Donnees } from "./api";
import { Barre, Carte, MessageVide } from "../../../dashboard/ui";
import { COULEURS, couleurChaleur, formatCompact, formatMontant, formatNombre } from "../../../dashboard/theme";
import { Bulle, GrilleTuiles, GrosMontant, Tuile } from "./communs";
import { libellesIntervalle } from "./dates";
import { useTextesOnglets } from "./textes";

/* ---------------- Carte de chaleur jour × heure ---------------- */
const Chaleur: React.FC<{ d: Donnees }> = ({ d }) => {
  const { t } = useTextesOnglets();
  // Heures affichées : au moins 7 h – 21 h, élargies si des ventes ont lieu en dehors.
  const heuresActives = d.chaleur.flatMap((ligne) => ligne.map((c, h) => (c.ventes ? h : null))).filter((h): h is number => h !== null);
  const debut = Math.min(7, ...heuresActives);
  const fin = Math.max(21, ...heuresActives);
  const heures = Array.from({ length: fin - debut + 1 }, (_, i) => debut + i);
  const max = Math.max(...d.chaleur.flat().map((c) => c.ventes), 0);

  return (
    <Carte titre={t.ventes.chaleur} sousTitre={t.ventes.chaleurSous} icone={<Flame size={18} />}>
      {max === 0 ? <MessageVide texte={t.vide} /> : (
        <>
          <div className="w-full overflow-x-auto">
            <div className="grid gap-[2px] sm:gap-[3px]" style={{ gridTemplateColumns: `30px repeat(${heures.length}, minmax(0, 1fr))` }}>
              <span />
              {heures.map((h) => (
                <span key={h} className="text-center text-[9px] text-slate-400 sm:text-[10px]">{h % 2 === 0 ? `${h}h` : ""}</span>
              ))}
              {d.chaleur.map((ligne, jour) => (
                <React.Fragment key={jour}>
                  <span className="flex items-center text-[11px] text-slate-500">{t.jours[jour]}</span>
                  {heures.map((h) => {
                    const c = ligne[h];
                    return (
                      <span
                        key={h}
                        className="aspect-square rounded-[4px] transition-transform hover:scale-110"
                        style={{ background: couleurChaleur(max ? c.ventes / max : 0) }}
                        title={`${t.joursLongs[jour]} ${h}h–${h + 1}h : ${c.ventes} · ${formatMontant(c.ca, d.devise)}`}
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-end gap-2 text-[11px] text-slate-500">
            {t.ventes.moins}
            {[0.05, 0.25, 0.5, 0.75, 1].map((r) => <span key={r} className="h-3 w-3 rounded-[3px]" style={{ background: couleurChaleur(r) }} />)}
            {t.ventes.plus}
          </div>
        </>
      )}
    </Carte>
  );
};

/* ---------------- Rythme : petits multiples (ventes, panier moyen) ---------------- */
const Rythme: React.FC<{ d: Donnees }> = ({ d }) => {
  const { t, locale } = useTextesOnglets();
  const points = useMemo(() => d.evolution.map((p) => ({ ...p, ...libellesIntervalle(p.debut, d.periode.granularite, locale) })), [d, locale]);
  const axeX = <XAxis dataKey="axe" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: COULEURS.axe }} interval="preserveStartEnd" minTickGap={14} />;
  return (
    <Carte titre={t.ventes.rythme} icone={<TrendingUp size={18} />}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-medium text-slate-600">{t.ventes.nbVentes}</p>
          <div className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={points} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={COULEURS.grille} />
                {axeX}
                <YAxis axisLine={false} tickLine={false} width={28} allowDecimals={false} tick={{ fontSize: 10, fill: COULEURS.axe }} />
                <Tooltip cursor={{ fill: "rgba(59,7,100,0.05)" }} content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as (typeof points)[number];
                  return <Bulle titre={p.titre} lignes={[{ couleur: COULEURS.serie1, libelle: t.ventes.nbVentes, valeur: formatNombre(p.ventes) }]} />;
                }} />
                <Bar dataKey="ventes" fill={COULEURS.serie1} radius={[3, 3, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="min-w-0">
          <p className="mb-1 text-xs font-medium text-slate-600">{t.ventes.panier}</p>
          <div className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={COULEURS.grille} />
                {axeX}
                <YAxis axisLine={false} tickLine={false} width={40} tick={{ fontSize: 10, fill: COULEURS.axe }} tickFormatter={(v: number) => formatCompact(v)} />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as (typeof points)[number];
                  return <Bulle titre={p.titre} lignes={[{ couleur: COULEURS.serie2, trait: true, libelle: t.ventes.panier, valeur: p.panier_moyen !== null ? formatMontant(p.panier_moyen, d.devise) : "—" }]} />;
                }} />
                <Line type="monotone" dataKey="panier_moyen" stroke={COULEURS.serie2} strokeWidth={2} connectNulls dot={{ r: 3, fill: COULEURS.serie2, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Carte>
  );
};

/* ---------------- Catégories ---------------- */
const Categories: React.FC<{ d: Donnees }> = ({ d }) => {
  const { t } = useTextesOnglets();
  const max = d.categories[0]?.ca ?? 0;
  return (
    <Carte titre={t.ventes.categories} sousTitre={t.ventes.categoriesSous} icone={<Layers size={18} />}>
      {d.categories.length === 0 ? <MessageVide texte={t.vide} /> : (
        <div className="space-y-4">
          {d.categories.slice(0, 8).map((c) => (
            <Barre key={c.nom} libelle={c.nom} valeur={c.ca} max={max} texteValeur={formatMontant(c.ca, d.devise)}
              detail={<span className="flex flex-wrap gap-x-2">
                <span>{formatNombre(c.quantite)} {t.unites.toLowerCase()}</span>
                <span className={c.taux_marge !== null && c.taux_marge < 5 ? "font-medium text-amber-700" : ""}>
                  · {t.ventes.marge(c.taux_marge !== null ? `${c.taux_marge.toLocaleString("fr-FR")} %` : "—")}
                </span>
              </span>} />
          ))}
        </div>
      )}
    </Carte>
  );
};

/* ---------------- Nuage volume × marge ---------------- */
const Nuage: React.FC<{ d: Donnees }> = ({ d }) => {
  const { t } = useTextesOnglets();
  const points = d.produits.filter((p) => p.taux_marge !== null).map((p) => ({ ...p, x: p.quantite, y: p.taux_marge as number, z: p.ca }));
  return (
    <Carte titre={t.ventes.nuage} sousTitre={t.ventes.nuageSous} icone={<Crosshair size={18} />}>
      {points.length === 0 ? <MessageVide texte={t.vide} /> : (
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 12, left: 0, bottom: 14 }}>
              <CartesianGrid stroke={COULEURS.grille} />
              <XAxis type="number" dataKey="x" name={t.ventes.quantite} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: COULEURS.axe }}
                label={{ value: t.ventes.quantite, position: "insideBottom", offset: -8, fontSize: 11, fill: COULEURS.texteSecondaire }} />
              <YAxis type="number" dataKey="y" name={t.ventes.tauxMarge} unit=" %" axisLine={false} tickLine={false} width={46} tick={{ fontSize: 11, fill: COULEURS.axe }} />
              <ZAxis type="number" dataKey="z" range={[50, 400]} />
              <Tooltip cursor={{ strokeDasharray: "0", stroke: "#cbd5e1" }} content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as (typeof points)[number];
                return <Bulle titre={p.nom} lignes={[
                  { libelle: t.ventes.quantite, valeur: formatNombre(p.quantite) },
                  { libelle: t.ventes.tauxMarge, valeur: `${p.y.toLocaleString("fr-FR")} %` },
                  { libelle: "CA", valeur: formatMontant(p.ca, d.devise) },
                ]} />;
              }} />
              <Scatter data={points} fill={COULEURS.serie1} fillOpacity={0.65} stroke="#fff" strokeWidth={2} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </Carte>
  );
};

/* ---------------- Retours ---------------- */
const Retours: React.FC<{ d: Donnees }> = ({ d }) => {
  const { t } = useTextesOnglets();
  const max = d.retours_produits[0]?.quantite ?? 0;
  return (
    <Carte titre={t.ventes.retoursProduits} icone={<RotateCcw size={18} />}>
      {d.retours_produits.length === 0 ? <MessageVide texte={t.ventes.aucunRetour} /> : (
        <div className="space-y-4">
          {d.retours_produits.map((p) => (
            <Barre key={p.id} libelle={p.nom} valeur={p.quantite} max={max} couleur={COULEURS.serie2} texteValeur={formatNombre(p.quantite)}
              detail={t.ventes.unitesRetournees(formatNombre(p.quantite))} />
          ))}
        </div>
      )}
    </Carte>
  );
};

/* ---------------- Onglet ---------------- */
const OngletVentes: React.FC<{ d: Donnees }> = ({ d }) => {
  const { t } = useTextesOnglets();
  const k = d.kpis;
  const c = k.meilleur_creneau;
  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <GrilleTuiles>
        <Tuile titre="CA HT" icone={<Tags size={17} />} valeur={<GrosMontant valeur={k.ca} devise={d.devise} />} detail={t.ventes.ventesN(k.ventes)} />
        <Tuile titre={t.ventes.panier} icone={<ShoppingBasket size={17} />} valeur={<GrosMontant valeur={k.panier_moyen} devise={d.devise} />}
          detail={t.ventes.panierDetail(k.articles_par_vente.toLocaleString("fr-FR"))} />
        <Tuile titre={t.ventes.remises} icone={<Percent size={17} />} valeur={<GrosMontant valeur={k.remises} devise={d.devise} />}
          detail={t.ventes.remisesDetail(`${k.taux_remise.toLocaleString("fr-FR")} %`)} />
        <Tuile titre={t.ventes.retours} icone={<RotateCcw size={17} />} valeur={<GrosMontant valeur={k.montant_retours} devise={d.devise} />}
          ton={k.taux_retour > 10 ? "alerte" : "normal"} detail={t.ventes.retoursDetail(k.retours, `${k.taux_retour.toLocaleString("fr-FR")} %`)} />
        <Tuile titre={t.ventes.creneau} icone={<CalendarClock size={17} />}
          valeur={c ? <span className="capitalize">{t.joursLongs[c.jour]} {c.heure}h</span> : "—"}
          detail={c ? t.ventes.creneauDetail(c.ventes) : t.ventes.aucunCreneau} />
      </GrilleTuiles>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-2">
        <Chaleur d={d} />
        <Rythme d={d} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-3">
        <Categories d={d} />
        <div className="min-w-0 xl:col-span-2"><Nuage d={d} /></div>
      </div>
      <Retours d={d} />
    </div>
  );
};

export default OngletVentes;

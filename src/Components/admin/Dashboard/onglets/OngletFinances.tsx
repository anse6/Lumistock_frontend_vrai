// Onglet « Finances » : cascade du résultat, 12 mois, charges, trésorerie, seuil de rentabilité, TVA.
import React, { useMemo } from "react";
import { Grid } from "antd";
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, LabelList, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Landmark, LineChart as IconeCourbe, Receipt, Scale, Target, Wallet, Waves } from "lucide-react";
import type { OngletFinances as Donnees } from "./api";
import { Barre, Carte, MessageVide } from "../../../dashboard/ui";
import { COULEURS, COULEURS_CASCADE, formatCompact, formatMontant, libelleMois } from "../../../dashboard/theme";
import { Bulle, GrilleTuiles, GrosMontant, Legende, Tuile } from "./communs";
import { useTextesOnglets } from "./textes";

/* ---------------- Cascade (barres flottantes horizontales : lisibles sur mobile) ---------------- */
const Cascade: React.FC<{ d: Donnees }> = ({ d }) => {
  const { t } = useTextesOnglets();
  const ecrans = Grid.useBreakpoint();
  const largeurLibelle = ecrans.sm ? 170 : 112;
  const maxCaracteres = ecrans.sm ? 28 : 15;
  const etapes = useMemo(() => {
    let courant = 0;
    return d.cascade.map((e) => {
      let bas: number;
      let haut: number;
      if (e.type === "total") {
        courant = e.montant;
        bas = Math.min(0, e.montant);
        haut = Math.max(0, e.montant);
      } else {
        const avant = courant;
        courant += e.montant;
        bas = Math.min(avant, courant);
        haut = Math.max(avant, courant);
      }
      const couleur = e.type === "total" ? COULEURS_CASCADE.total : e.montant >= 0 ? COULEURS_CASCADE.hausse : COULEURS_CASCADE.baisse;
      return { ...e, plage: [bas, haut] as [number, number], couleur };
    });
  }, [d.cascade]);
  const hauteur = Math.max(etapes.length * 38 + 30, 220);
  const vide = etapes.every((e) => e.montant === 0);
  return (
    <Carte titre={t.finances.cascade} sousTitre={t.finances.cascadeSous} icone={<Waves size={18} />}>
      <Legende items={[
        { couleur: COULEURS_CASCADE.total, libelle: t.finances.total },
        { couleur: COULEURS_CASCADE.hausse, libelle: t.finances.ajoute },
        { couleur: COULEURS_CASCADE.baisse, libelle: t.finances.retire },
      ]} />
      {vide ? <MessageVide texte={t.vide} /> : (
        <div className="w-full" style={{ height: hauteur }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={etapes} layout="vertical" margin={{ top: 4, right: ecrans.sm ? 64 : 48, left: 0, bottom: 4 }} barCategoryGap="22%">
              <CartesianGrid horizontal={false} stroke={COULEURS.grille} />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: COULEURS.axe }} tickFormatter={(v: number) => formatCompact(v)} />
              <YAxis type="category" dataKey="libelle" axisLine={false} tickLine={false} width={largeurLibelle}
                tick={({ x, y, payload }) => {
                  const e = etapes.find((s) => s.libelle === payload.value);
                  return (
                    <text x={x} y={y} dy={4} textAnchor="end" fontSize={11} fontWeight={e?.type === "total" ? 700 : 400} fill={e?.type === "total" ? "#3b0764" : "#475569"}>
                      {String(payload.value).length > maxCaracteres ? `${String(payload.value).slice(0, maxCaracteres - 1)}…` : payload.value}
                    </text>
                  );
                }} />
              <ReferenceLine x={0} stroke="#94a3b8" />
              <Tooltip cursor={{ fill: "rgba(59,7,100,0.05)" }} content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const e = payload[0].payload as (typeof etapes)[number];
                return <Bulle titre={e.libelle} lignes={[{ couleur: e.couleur, libelle: e.type === "total" ? t.finances.total : e.montant >= 0 ? t.finances.ajoute : t.finances.retire, valeur: formatMontant(e.montant, d.devise) }]} />;
              }} />
              <Bar dataKey="plage" radius={4} maxBarSize={22}>
                {etapes.map((e) => <Cell key={e.cle} fill={e.couleur} />)}
                <LabelList dataKey="montant" position="right" fontSize={10} fill="#334155" formatter={(v: number) => formatCompact(v)} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Carte>
  );
};

/* ---------------- 12 derniers mois ---------------- */
const Mois: React.FC<{ d: Donnees }> = ({ d }) => {
  const { t } = useTextesOnglets();
  const points = d.mois.map((m) => ({ ...m, axe: libelleMois(m.mois), titre: libelleMois(m.mois, true) }));
  const vide = points.every((p) => !p.ca && !p.charges);
  return (
    <Carte titre={t.finances.mois} sousTitre={t.finances.moisSous} icone={<IconeCourbe size={18} />}>
      <Legende items={[
        { couleur: COULEURS.serie1, libelle: t.finances.ca },
        { couleur: COULEURS.serie2, libelle: t.finances.charges },
        { couleur: COULEURS.marque, libelle: t.finances.resultatSerie, trait: true },
      ]} />
      <div className="h-[260px] w-full sm:h-[300px]">
        {vide ? <MessageVide texte={t.vide} /> : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={points} margin={{ top: 8, right: 6, left: 0, bottom: 0 }} barGap={2} barCategoryGap="24%">
              <CartesianGrid vertical={false} stroke={COULEURS.grille} />
              <XAxis dataKey="axe" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: COULEURS.axe }} interval="preserveStartEnd" minTickGap={4} />
              <YAxis axisLine={false} tickLine={false} width={44} tick={{ fontSize: 11, fill: COULEURS.axe }} tickFormatter={(v: number) => formatCompact(v)} />
              <ReferenceLine y={0} stroke="#94a3b8" />
              <Tooltip cursor={{ fill: "rgba(59,7,100,0.05)" }} content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as (typeof points)[number];
                return <Bulle titre={p.titre} lignes={[
                  { couleur: COULEURS.serie1, libelle: t.finances.ca, valeur: formatMontant(p.ca, d.devise) },
                  { couleur: COULEURS.serie2, libelle: t.finances.charges, valeur: formatMontant(p.charges, d.devise) },
                  { couleur: COULEURS.marque, trait: true, libelle: t.finances.resultatSerie, valeur: formatMontant(p.resultat, d.devise) },
                ]} />;
              }} />
              <Bar dataKey="ca" fill={COULEURS.serie1} radius={[3, 3, 0, 0]} maxBarSize={18} />
              <Bar dataKey="charges" fill={COULEURS.serie2} radius={[3, 3, 0, 0]} maxBarSize={18} />
              <Line type="monotone" dataKey="resultat" stroke={COULEURS.marque} strokeWidth={2.5} dot={{ r: 3, fill: COULEURS.marque, strokeWidth: 0 }} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </Carte>
  );
};

/* ---------------- Charges par catégorie ---------------- */
const Charges: React.FC<{ d: Donnees }> = ({ d }) => {
  const { t } = useTextesOnglets();
  const max = d.charges[0]?.montant ?? 0;
  return (
    <Carte titre={t.finances.chargesCat} icone={<Receipt size={18} />}>
      {d.charges.length === 0 ? <MessageVide texte={t.finances.chargesVide} /> : (
        <div className="space-y-4">
          {d.charges.map((c) => (
            <Barre key={c.categorie} libelle={c.libelle} valeur={c.montant} max={max} couleur={COULEURS.serie2} texteValeur={formatMontant(c.montant, d.devise)} />
          ))}
        </div>
      )}
    </Carte>
  );
};

/* ---------------- Trésorerie ---------------- */
const Tresorerie: React.FC<{ d: Donnees }> = ({ d }) => {
  const { t } = useTextesOnglets();
  const tr = d.tresorerie;
  const max = Math.max(tr.entrees, tr.total_sorties, 0);
  return (
    <Carte titre={t.finances.tresorerie} sousTitre={t.finances.tresorerieSous} icone={<Wallet size={18} />}>
      <div className="space-y-4">
        <Barre libelle={<span className="font-medium">{t.finances.entrees}</span>} valeur={tr.entrees} max={max} couleur={COULEURS.serie3}
          texteValeur={`+ ${formatMontant(tr.entrees, d.devise)}`} />
        {tr.sorties.map((s) => (
          <Barre key={s.cle} libelle={t.finances.sorties[s.cle] ?? s.cle} valeur={s.montant} max={max} couleur={COULEURS.serie2}
            texteValeur={`− ${formatMontant(s.montant, d.devise)}`} />
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
        <span className="text-sm font-medium text-slate-700">{t.finances.soldeNet}</span>
        <span className={`text-lg font-bold tabular-nums ${tr.net < 0 ? "text-red-700" : "text-green-800"}`}>
          {tr.net > 0 ? "+ " : ""}{formatMontant(tr.net, d.devise)}
        </span>
      </div>
    </Carte>
  );
};

const OngletFinances: React.FC<{ d: Donnees }> = ({ d }) => {
  const { t } = useTextesOnglets();
  const k = d.kpis;
  const m = (n: number) => formatMontant(n, d.devise);
  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <GrilleTuiles>
        <Tuile titre={t.finances.resultat} icone={<Scale size={17} />} valeur={<GrosMontant valeur={k.resultat} devise={d.devise} />}
          ton={k.resultat < 0 ? "negatif" : "normal"} evolution={k.resultat_variation} detail={`${t.finances.charges} : ${m(k.charges)}`} />
        <Tuile titre={t.finances.marge} icone={<Landmark size={17} />} valeur={<GrosMontant valeur={k.marge} devise={d.devise} />}
          detail={k.taux_marge !== null ? t.finances.margeDetail(`${k.taux_marge.toLocaleString("fr-FR")} %`) : "—"} />
        <Tuile titre={t.finances.seuil} icone={<Target size={17} />}
          valeur={k.seuil_rentabilite !== null ? <GrosMontant valeur={k.seuil_rentabilite} devise={d.devise} /> : "—"}
          ton={k.seuil_rentabilite !== null && k.seuil_rentabilite > k.ca ? "alerte" : "normal"}
          detail={k.seuil_rentabilite !== null ? t.finances.seuilDetail : t.finances.seuilAucun} />
        <Tuile titre={t.finances.tva} icone={<Receipt size={17} />} valeur={<GrosMontant valeur={k.tva_a_payer} devise={d.devise} />}
          detail={t.finances.tvaDetail(m(k.tva_collectee), m(k.tva_deductible))} />
        <Tuile titre={t.finances.dettes} icone={<Wallet size={17} />} valeur={<GrosMontant valeur={k.dettes_fournisseurs} devise={d.devise} />}
          ton={k.dettes_fournisseurs > 0 ? "alerte" : "normal"} detail={t.finances.dettesDetail} />
      </GrilleTuiles>
      <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-2">
        <Cascade d={d} />
        <Mois d={d} />
      </div>
      <div className="grid grid-cols-1 items-start gap-4 sm:gap-5 md:grid-cols-2">
        <Charges d={d} />
        <Tresorerie d={d} />
      </div>
    </div>
  );
};

export default OngletFinances;

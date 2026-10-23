// Onglet « Clients » : acquisition et fidélité, créances par ancienneté, clients à relancer, villes.
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BellRing, ChevronRight, Clock, HandCoins, Heart, MapPin, Repeat, Trophy, UserPlus, Users } from "lucide-react";
import type { OngletClients as Donnees } from "./api";
import { Barre, Carte, MessageVide } from "../../../dashboard/ui";
import { COULEURS, RAMPE_VIOLETTE, formatMontant, formatNombre } from "../../../dashboard/theme";
import { Bulle, GrilleTuiles, GrosMontant, Legende, Tuile } from "./communs";
import { libellesIntervalle } from "./dates";
import { useTextesOnglets } from "./textes";

const Evolution: React.FC<{ d: Donnees }> = ({ d }) => {
  const { t, locale } = useTextesOnglets();
  const points = useMemo(() => d.evolution.map((p) => ({ ...p, ...libellesIntervalle(p.debut, d.periode.granularite, locale) })), [d, locale]);
  const vide = points.every((p) => p.nouveaux + p.fideles === 0);
  return (
    <Carte titre={t.clients.evolution} sousTitre={t.clients.evolutionSous} icone={<Repeat size={18} />}>
      <Legende items={[{ couleur: COULEURS.serie3, libelle: t.clients.nouveaux }, { couleur: COULEURS.serie1, libelle: t.clients.fideles }]} />
      <div className="h-[240px] w-full sm:h-[280px]">
        {vide ? <MessageVide texte={t.vide} /> : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={points} margin={{ top: 8, right: 6, left: 0, bottom: 0 }} barCategoryGap="22%">
              <CartesianGrid vertical={false} stroke={COULEURS.grille} />
              <XAxis dataKey="axe" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: COULEURS.axe }} interval="preserveStartEnd" minTickGap={12} />
              <YAxis axisLine={false} tickLine={false} width={28} allowDecimals={false} tick={{ fontSize: 11, fill: COULEURS.axe }} />
              <Tooltip cursor={{ fill: "rgba(59,7,100,0.05)" }} content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as (typeof points)[number];
                return <Bulle titre={p.titre} lignes={[
                  { couleur: COULEURS.serie3, libelle: t.clients.nouveaux, valeur: formatNombre(p.nouveaux) },
                  { couleur: COULEURS.serie1, libelle: t.clients.fideles, valeur: formatNombre(p.fideles) },
                ]} />;
              }} />
              <Bar dataKey="nouveaux" stackId="c" fill={COULEURS.serie3} maxBarSize={30} stroke="#fff" strokeWidth={1} />
              <Bar dataKey="fideles" stackId="c" fill={COULEURS.serie1} maxBarSize={30} radius={[4, 4, 0, 0]} stroke="#fff" strokeWidth={1} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Carte>
  );
};

/** Barre 100 % par ancienneté (du plus clair = récent au plus foncé = ancien), puis le détail chiffré. */
const Creances: React.FC<{ d: Donnees }> = ({ d }) => {
  const { t } = useTextesOnglets();
  const total = d.creances.reduce((s, c) => s + c.montant, 0);
  return (
    <Carte titre={t.clients.creances} sousTitre={t.clients.creancesSous} icone={<Clock size={18} />}>
      {total === 0 ? <MessageVide texte={t.clients.creancesVide} /> : (
        <>
          <p className="mb-2 text-2xl font-bold text-purple-950"><GrosMontant valeur={total} devise={d.devise} /></p>
          <div className="flex h-4 w-full gap-[2px] overflow-hidden rounded-full" role="img"
            aria-label={d.creances.map((c) => `${c.tranche} : ${formatMontant(c.montant, d.devise)}`).join(", ")}>
            {d.creances.map((c, i) => c.montant > 0 && (
              <div key={c.tranche} style={{ width: `${(c.montant / total) * 100}%`, background: RAMPE_VIOLETTE[i] }} />
            ))}
          </div>
          <ul className="mt-4 space-y-2.5">
            {d.creances.map((c, i) => (
              <li key={c.tranche} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 text-slate-700">
                  <span className="h-3 w-3 rounded-sm" style={{ background: RAMPE_VIOLETTE[i] }} />
                  {c.tranche}
                  <span className="text-xs text-slate-400">({c.ventes})</span>
                </span>
                <span className={`tabular-nums ${i >= 2 && c.montant > 0 ? "font-semibold text-red-700" : "font-semibold text-slate-900"}`}>
                  {formatMontant(c.montant, d.devise)}
                  <span className="ml-1.5 text-xs font-normal text-slate-400">{total ? Math.round((c.montant / total) * 100) : 0} %</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Carte>
  );
};

const ARelancer: React.FC<{ d: Donnees }> = ({ d }) => {
  const { t } = useTextesOnglets();
  return (
    <Carte titre={t.clients.relancer} sousTitre={t.clients.relancerSous} icone={<BellRing size={18} />}
      action={d.a_relancer.length > 0 ? (
        <Link to="/admin/dashboard/messages" className="inline-flex items-center text-sm font-semibold !text-purple-950 hover:!text-purple-700">
          {t.clients.relancerAction} <ChevronRight size={16} />
        </Link>
      ) : undefined}>
      {d.a_relancer.length === 0 ? <MessageVide texte={t.clients.relancerVide} /> : (
        <ul className="divide-y divide-slate-100">
          {d.a_relancer.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 py-2">
              <span className="min-w-0 truncate text-sm text-slate-800">{c.nom}</span>
              <span className="shrink-0 text-xs text-slate-500">{t.clients.inactif(c.jours)}</span>
            </li>
          ))}
        </ul>
      )}
    </Carte>
  );
};

const Villes: React.FC<{ d: Donnees }> = ({ d }) => {
  const { t } = useTextesOnglets();
  const max = d.villes[0]?.clients ?? 0;
  return (
    <Carte titre={t.clients.villes} sousTitre={t.clients.villesSous} icone={<MapPin size={18} />}>
      {d.villes.length === 0 ? <MessageVide texte={t.vide} /> : (
        <div className="space-y-3.5">
          {d.villes.map((v) => (
            <Barre key={v.ville} libelle={v.ville} valeur={v.clients} max={max} texteValeur={formatNombre(v.clients)}
              couleur={v.ville === "Non renseignée" ? "#cbd5e1" : COULEURS.serie1} />
          ))}
        </div>
      )}
    </Carte>
  );
};

const Meilleurs: React.FC<{ d: Donnees }> = ({ d }) => {
  const { t, locale } = useTextesOnglets();
  const max = d.meilleurs[0]?.ca ?? 0;
  return (
    <Carte titre={t.clients.meilleurs} icone={<Trophy size={18} />}>
      {d.meilleurs.length === 0 ? <MessageVide texte={t.vide} /> : (
        <div className="space-y-4">
          {d.meilleurs.map((c) => (
            <Barre key={c.id} libelle={c.nom} valeur={c.ca} max={max} texteValeur={formatMontant(c.ca, d.devise)}
              detail={`${c.ventes} · ${t.clients.derniere(new Date(c.derniere).toLocaleDateString(locale, { day: "numeric", month: "short" }))}`} />
          ))}
        </div>
      )}
    </Carte>
  );
};

const OngletClients: React.FC<{ d: Donnees }> = ({ d }) => {
  const { t } = useTextesOnglets();
  const k = d.kpis;
  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <GrilleTuiles>
        <Tuile titre={t.clients.clients} icone={<Users size={17} />} valeur={formatNombre(k.clients)} detail={t.clients.clientsDetail(k.nouveaux)} />
        <Tuile titre={t.clients.acheteurs} icone={<UserPlus size={17} />} valeur={formatNombre(k.acheteurs)} detail={t.clients.acheteursDetail(k.fideles)} />
        <Tuile titre={t.clients.fidelite} icone={<Heart size={17} />}
          valeur={k.taux_fidelite !== null ? `${k.taux_fidelite.toLocaleString("fr-FR")} %` : "—"} detail={t.clients.fideliteDetail} />
        <Tuile titre={t.clients.passage} icone={<Users size={17} />} valeur={`${k.part_passage.toLocaleString("fr-FR")} %`} detail={t.clients.passageDetail} />
        <Tuile titre={t.clients.relancer} icone={<HandCoins size={17} />} valeur={formatNombre(k.a_relancer)}
          ton={k.a_relancer > 0 ? "alerte" : "normal"} detail={t.clients.relancerSous} />
      </GrilleTuiles>
      <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2"><Evolution d={d} /></div>
        <Creances d={d} />
      </div>
      <div className="grid grid-cols-1 items-start gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
        <Meilleurs d={d} />
        <ARelancer d={d} />
        <div className="min-w-0 md:col-span-2 xl:col-span-1"><Villes d={d} /></div>
      </div>
    </div>
  );
};

export default OngletClients;

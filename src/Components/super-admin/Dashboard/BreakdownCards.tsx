// Répartitions : statut et moyens de paiement des ventes, utilisateurs par rôle.
import React from "react";
import { CheckCircle2, CircleAlert, CircleDashed, CreditCard, UsersRound } from "lucide-react";
import type { VueEnsemble } from "./api";
import { Barre, Carte, MessageVide } from "../../dashboard/ui";
import { COULEURS, LIBELLES_PERIODE, formatNombre } from "../../dashboard/theme";

const STATUTS = {
  "payé": { libelle: "Payées", couleur: COULEURS.bon, icone: <CheckCircle2 size={15} /> },
  "partiellement payé": { libelle: "Partiellement payées", couleur: COULEURS.attention, icone: <CircleDashed size={15} /> },
  "non payé": { libelle: "Non payées", couleur: COULEURS.critique, icone: <CircleAlert size={15} /> },
} as const;

const METHODES: Record<string, string> = {
  cash: "Espèces",
  om: "Orange Money",
  momo: "MTN Mobile Money",
  bancaire: "Virement / carte",
};

const pourcent = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);

export const PaymentsCard: React.FC<{ data: VueEnsemble }> = ({ data }) => {
  const { statuts, methodes } = data.paiements;
  const total = statuts.reduce((s, x) => s + x.nombre, 0);
  const maxMethode = Math.max(...methodes.map((m) => m.nombre), 0);

  return (
    <Carte titre="Paiements des ventes" sousTitre={LIBELLES_PERIODE[data.periode.jours]} icone={<CreditCard size={18} />}>
      {total === 0 ? (
        <MessageVide texte="Aucune vente sur la période." />
      ) : (
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Statut ({formatNombre(total)} ventes)</p>
            {/* Barre empilée 100 % : un trait blanc sépare les segments */}
            <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full" role="img"
              aria-label={statuts.map((s) => `${STATUTS[s.statut].libelle} : ${s.nombre}`).join(", ")}>
              {statuts.filter((s) => s.nombre > 0).map((s) => (
                <div key={s.statut} style={{ width: `${(s.nombre / total) * 100}%`, background: STATUTS[s.statut].couleur }} />
              ))}
            </div>
            <ul className="mt-3 space-y-2">
              {statuts.map((s) => (
                <li key={s.statut} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2 text-slate-700">
                    <span style={{ color: STATUTS[s.statut].couleur }}>{STATUTS[s.statut].icone}</span>
                    <span className="truncate">{STATUTS[s.statut].libelle}</span>
                  </span>
                  <span className="shrink-0 tabular-nums">
                    <span className="font-semibold text-slate-900">{formatNombre(s.nombre)}</span>
                    <span className="ml-1.5 text-xs text-slate-400">{pourcent(s.nombre, total)} %</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Moyens de paiement (encaissements)</p>
            {maxMethode === 0 ? (
              <p className="text-sm text-slate-400">Aucun encaissement sur la période.</p>
            ) : (
              <div className="space-y-3">
                {methodes.map((m) => (
                  <Barre
                    key={m.methode}
                    libelle={METHODES[m.methode] ?? m.methode}
                    valeur={m.nombre}
                    max={maxMethode}
                    texteValeur={formatNombre(m.nombre)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Carte>
  );
};

const ROLES: Record<string, string> = {
  admin: "Administrateurs",
  manager: "Managers",
  gerant: "Gérants",
};

export const RolesCard: React.FC<{ data: VueEnsemble }> = ({ data }) => {
  const max = Math.max(...data.roles.map((r) => r.total), 0);
  const total = data.roles.reduce((s, r) => s + r.total, 0);
  const actifs = data.roles.reduce((s, r) => s + r.actifs, 0);

  return (
    <Carte
      titre="Utilisateurs par rôle"
      sousTitre={`${formatNombre(actifs)} actifs sur ${formatNombre(total)} comptes`}
      icone={<UsersRound size={18} />}
    >
      {total === 0 ? (
        <MessageVide texte="Aucun utilisateur." />
      ) : (
        <>
          <div className="space-y-4">
            {data.roles.map((r) => {
              const inactifs = r.total - r.actifs;
              return (
                <div key={r.role} title={`${ROLES[r.role]} : ${r.actifs} actif(s), ${inactifs} inactif(s)`}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-slate-700">{ROLES[r.role]}</span>
                    <span className="tabular-nums">
                      <span className="font-semibold text-slate-900">{formatNombre(r.total)}</span>
                      {inactifs > 0 && <span className="ml-1.5 text-xs text-slate-400">dont {inactifs} inactif(s)</span>}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: COULEURS.piste }}>
                    <div className="flex h-full gap-[2px]" style={{ width: `${max ? (r.total / max) * 100 : 0}%` }}>
                      {r.actifs > 0 && <div className="h-full rounded-full" style={{ flex: r.actifs, background: COULEURS.serie1 }} />}
                      {inactifs > 0 && <div className="h-full rounded-full" style={{ flex: inactifs, background: COULEURS.serieClaire }} />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: COULEURS.serie1 }} /> Actifs
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: COULEURS.serieClaire }} /> Inactifs (compte ou magasin désactivé)
            </span>
          </div>
        </>
      )}
    </Carte>
  );
};

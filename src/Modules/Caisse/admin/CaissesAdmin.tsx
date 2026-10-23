// Suivi des caisses pour l'admin et le manager : caissiers, caisses ouvertes, fermetures et écarts, réglages.
import { useMemo, useState } from "react";
import { App, DatePicker, Drawer, Input, InputNumber, Select, Spin, Switch } from "antd";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { Dayjs } from "dayjs";
import { BadgePercent, Lock, UserPlus, Vault } from "lucide-react";
import PageTitle from "../../../Components/PageTitle";
import type { SessionCaisse } from "../api";
import { api, argent, dateHeure, heure, messageErreur, symboleDevise } from "../api";
import { Ecart, ResumeSessionCaisse } from "../MaCaisse";
import { formatterMontant, parserMontant } from "../pos/OuvertureCaisse";
import useCompteConnecte, { EVENEMENT_DROITS } from "../../../hooks/useCompteConnecte";

function DetailSession({ session, onFermer, onMaj }: { session: SessionCaisse | null; onFermer: () => void; onMaj: () => void }) {
  const { message } = App.useApp();
  const [compte, setCompte] = useState<number | null>(null);
  const [motif, setMotif] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const fermer = async () => {
    if (!session || compte === null) return;
    setEnvoi(true);
    try {
      await api.fermerPourCaissier(session.id, compte, motif.trim());
      message.success(`Caisse de ${session.caissier} fermée`);
      setCompte(null); setMotif("");
      onMaj();
    } catch (e) { message.error(messageErreur(e)); } finally { setEnvoi(false); }
  };

  return (
    <Drawer open={!!session} onClose={onFermer} width={Math.min(760, window.innerWidth)}
      title={session ? `Caisse de ${session.caissier}` : ""}>
      {session && (
        <div className="space-y-5">
          <p className="text-sm text-slate-500">
            Ouverte le {dateHeure(session.ouverte_le)}
            {session.fermee_le && ` · fermée à ${heure(session.fermee_le)}${session.fermee_par && !session.fermee_par_caissier ? ` par ${session.fermee_par}` : ""}`}
          </p>
          {session.statut === "fermee" && (
            <div className="grid grid-cols-3 gap-3 rounded-2xl bg-slate-50 p-4 text-sm ring-1 ring-slate-100">
              <div><p className="text-xs text-slate-500">Attendu</p><p className="font-bold">{argent(session.resume.especes_attendues)}</p></div>
              <div><p className="text-xs text-slate-500">Compté</p><p className="font-bold">{argent(session.montant_compte)}</p></div>
              <div><p className="text-xs text-slate-500">Écart</p><Ecart ecart={session.ecart} /></div>
              {session.note_fermeture && <p className="col-span-3 text-xs text-slate-600">Note : « {session.note_fermeture} »</p>}
            </div>
          )}
          <ResumeSessionCaisse s={session} />
          {session.statut === "ouverte" && (
            <div className="space-y-3 rounded-2xl bg-amber-50/60 p-4 ring-1 ring-amber-200">
              <p className="flex items-center gap-2 text-sm font-semibold text-amber-900"><Lock size={16} /> Fermer cette caisse à la place du caissier</p>
              <p className="text-xs text-amber-900/80">À utiliser si le caissier est parti sans fermer. Comptez le tiroir et indiquez le motif.</p>
              <InputNumber<number> min={0} value={compte ?? undefined} onChange={(v) => setCompte(v === null ? null : Number(v))}
                formatter={formatterMontant} parser={parserMontant} className="!w-full" suffix={symboleDevise()} placeholder="Espèces comptées" />
              <Input value={motif} onChange={(e) => setMotif(e.target.value)} maxLength={300} placeholder="Motif (obligatoire)" />
              <button onClick={fermer} disabled={compte === null || !motif.trim() || envoi}
                className="w-full cursor-pointer rounded-xl !bg-purple-950 py-2.5 text-sm font-semibold !text-white hover:!bg-purple-900 disabled:opacity-50">
                Fermer la caisse
              </button>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}

export default function CaissesAdmin() {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [caissierId, setCaissierId] = useState<string | undefined>();
  const [statut, setStatut] = useState<string | undefined>();
  const [plage, setPlage] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [choisie, setChoisie] = useState<SessionCaisse | null>(null);

  const equipe = useQuery({ queryKey: ["caisse", "admin", "caissiers"], queryFn: api.caissiers, refetchInterval: 60_000 });
  const parametres = useQuery({ queryKey: ["caisse", "admin", "parametres"], queryFn: api.parametres });
  const params = useMemo(() => ({
    caissier_id: caissierId, statut,
    debut: plage?.[0]?.format("YYYY-MM-DD"), fin: plage?.[1]?.format("YYYY-MM-DD"),
  }), [caissierId, statut, plage]);
  const sessions = useQuery({ queryKey: ["caisse", "admin", "sessions", params], queryFn: () => api.sessions(params) });

  const rafraichir = async () => {
    await qc.invalidateQueries({ queryKey: ["caisse", "admin"] });
    if (choisie) {
      const maj = (await api.sessions({ caissier_id: choisie.caissier_id })).sessions.find((s) => s.id === choisie.id);
      setChoisie(maj ?? null);
    }
  };

  // Droit d'accès du caissier : seul l'admin le règle (aussi dans Paramètres > Accès).
  const { estAdmin } = useCompteConnecte();
  const changerRemises = async (v: boolean) => {
    try {
      await api.modifierParametres(v);
      window.dispatchEvent(new Event(EVENEMENT_DROITS));
      message.success(v ? "Les caissiers peuvent faire des remises." : "Remises désactivées pour les caissiers.");
      parametres.refetch();
    } catch (e) { message.error(messageErreur(e)); }
  };

  const t = sessions.data?.totaux;
  const limite = equipe.data ? `${equipe.data.utilises} / ${equipe.data.limite}` : "…";

  return (
    <>
      <PageTitle>Caisses</PageTitle>
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">Vos caissiers, leurs caisses du jour et les écarts de fermeture.</p>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-900 ring-1 ring-purple-200">Licence : {limite} caissiers</span>
            <Link to="/admin/dashboard/users/addusersadmin"
              className="inline-flex items-center gap-2 rounded-xl !bg-purple-950 px-3.5 py-2 text-sm font-semibold !text-white hover:!bg-purple-900">
              <UserPlus size={16} /> Ajouter un caissier
            </Link>
          </div>
        </div>

        {/* Caissiers et état de leur caisse */}
        {equipe.isLoading ? (
          <div className="flex justify-center py-10"><Spin /></div>
        ) : equipe.data && equipe.data.caissiers.length === 0 ? (
          <div className="flex flex-col items-center rounded-3xl bg-white px-6 py-12 text-center shadow-sm ring-1 ring-purple-100/70">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-800"><Vault size={26} /></span>
            <p className="mt-3 font-semibold text-slate-800">Aucun caissier pour l'instant</p>
            <p className="mt-1 max-w-md text-sm text-slate-500">Un caissier vend au comptoir depuis le stock du magasin et ne voit que ses propres ventes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {equipe.data?.caissiers.map((c) => (
              <div key={c.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-purple-100/70">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{c.nom}</p>
                    <p className="truncate text-xs text-slate-500">{c.email}</p>
                  </div>
                  {!c.actif ? (
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">Désactivé</span>
                  ) : c.session ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Ouverte · {heure(c.session.ouverte_le)}
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">Fermée</span>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-slate-50 py-2"><p className="text-[11px] text-slate-500">Ventes du jour</p><p className="font-bold text-slate-900">{c.aujourdhui.ventes}</p></div>
                  <div className="col-span-2 rounded-xl bg-slate-50 py-2"><p className="text-[11px] text-slate-500">Chiffre d'affaires du jour</p><p className="font-bold text-slate-900">{argent(c.aujourdhui.chiffre_affaires)}</p></div>
                </div>
                {c.session && (
                  <button onClick={() => setChoisie(c.session)} className="mt-3 flex w-full cursor-pointer items-center justify-between rounded-xl bg-purple-950 px-3 py-2.5 text-sm text-white hover:bg-purple-900">
                    <span>Espèces attendues</span><span className="font-bold">{argent(c.session.resume.especes_attendues)}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Réglages */}
        <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-purple-100/70 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fuchsia-50 text-fuchsia-700"><BadgePercent size={19} /></span>
            <div>
              <p className="font-semibold text-slate-900">Autoriser les remises à la caisse</p>
              <p className="text-sm text-slate-500">Désactivé : les caissiers vendent toujours au prix du catalogue. Les annulations restent possibles 15 minutes après la vente.{!estAdmin && " Seul l'administrateur change ce réglage."}</p>
            </div>
          </div>
          <Switch checked={!!parametres.data?.remises_autorisees} loading={parametres.isLoading} disabled={!estAdmin} onChange={changerRemises} />
        </div>

        {/* Historique des sessions */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-purple-100/70">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-semibold text-slate-900">Ouvertures et fermetures</p>
              {t && (
                <p className="text-xs text-slate-500">
                  {t.sessions} session{t.sessions > 1 ? "s" : ""} · {argent(t.chiffre_affaires)} vendus ·{" "}
                  <span className={t.sessions_avec_ecart ? "font-semibold text-rose-700" : ""}>
                    {t.sessions_avec_ecart} avec écart (total {argent(t.ecart_total)})
                  </span>
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Select allowClear placeholder="Tous les caissiers" className="w-48" value={caissierId} onChange={setCaissierId}
                options={equipe.data?.caissiers.map((c) => ({ value: c.id, label: c.nom }))} />
              <Select allowClear placeholder="Toutes" className="w-32" value={statut} onChange={setStatut}
                options={[{ value: "ouverte", label: "Ouvertes" }, { value: "fermee", label: "Fermées" }]} />
              <DatePicker.RangePicker value={plage} onChange={(v) => setPlage(v as [Dayjs | null, Dayjs | null] | null)} format="DD/MM/YYYY" />
            </div>
          </div>
          {sessions.isLoading ? (
            <div className="flex justify-center py-12"><Spin /></div>
          ) : (sessions.data?.sessions.length ?? 0) === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">Aucune session sur cette sélection.</p>
          ) : (
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-semibold">Caissier</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Ouverture</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Fermeture</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Ventes</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Chiffre d'affaires</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Espèces attendues</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Compté</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Écart</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sessions.data?.sessions.map((s) => (
                    <tr key={s.id} onClick={() => setChoisie(s)} className="cursor-pointer hover:bg-purple-50/50">
                      <td className="px-4 py-3 font-medium text-slate-900">{s.caissier}</td>
                      <td className="px-4 py-3 text-slate-600">{dateHeure(s.ouverte_le)}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {s.fermee_le ? heure(s.fermee_le) : <span className="font-semibold text-emerald-700">En cours</span>}
                        {s.fermee_par && !s.fermee_par_caissier && <span className="ml-1 text-xs text-amber-700">(par {s.fermee_par})</span>}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{s.resume.ventes}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">{argent(s.resume.chiffre_affaires)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{argent(s.resume.especes_attendues)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{s.montant_compte === null ? "—" : argent(s.montant_compte)}</td>
                      <td className="px-4 py-3 text-right">{s.statut === "fermee" ? <Ecart ecart={s.ecart} /> : <span className="text-slate-400">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <DetailSession session={choisie} onFermer={() => setChoisie(null)} onMaj={rafraichir} />
    </>
  );
}

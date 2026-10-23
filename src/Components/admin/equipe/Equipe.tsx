// Équipe du magasin : chiffres, filtres, cartes ou tableau, fiche détaillée, modification,
// activation / désactivation et actions sur le compte (invitation, mot de passe, suppression).
import { useMemo, useState } from "react";
import { App, ConfigProvider, Drawer, Dropdown, Empty, Pagination, Skeleton, Tooltip } from "antd";
import type { MenuProps } from "antd";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  BadgeCheck, Briefcase, CalendarDays, Eye, IdCard, KeyRound, LayoutGrid, List, Mail, MapPin, MoreVertical, NotebookPen,
  Pencil, Search, Send, ShieldAlert, Store, Trash2, UserCheck, UserPlus, UserX, Users, ShieldCheck as ShieldCheck2fa, ShieldOff,
} from "lucide-react";
import PageTitle from "../../PageTitle";
import AvatarWithPopover from "../../super-admin/users.tsx/components/AvatarWithPopover";
import StatusToggle from "../../super-admin/users.tsx/components/StatusToggle";
import { Segment } from "../../dashboard/ui";
import { Drapeau, NumeroAvecDrapeau, nomPays } from "../livaision/livraisonfinal/TelephoneInternational";
import FormulaireMembre from "./FormulaireMembre";
import type { FormMembre, Membre } from "./equipe";
import useCompteConnecte from "../../../hooks/useCompteConnecte";
import { reinitialiserMembre } from "../../../services/deuxFacteurs";
import {
  ROLES, apiEquipe, corpsDepuisForm, dateCreation, formDepuisMembre, messageErreur, nomComplet, roleDe, verifierForm,
} from "./equipe";

const PURPLE_950 = "#3b0764";
const PAR_PAGE = 12;
type FiltreRole = "tous" | "admin" | "manager" | "gerant" | "caissier";
type FiltreStatut = "tous" | "actifs" | "inactifs";

const BadgeRole = ({ role, court }: { role: string; court?: boolean }) => {
  const c = ROLES[roleDe(role)];
  return <span className={`inline-flex shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${c.badge}`}>{court ? c.court : c.libelle}</span>;
};

const lieu = (m: Membre) => [m.quartier, m.ville, m.pays ? nomPays(m.pays) : ""].filter(Boolean).join(", ");
const versDate = (iso?: string) => {
  const d = iso ? new Date(`${String(iso).slice(0, 10)}T00:00:00`) : null;
  return d && !isNaN(d.getTime()) ? d : null;
};
const jour = (iso?: string) => versDate(iso)?.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) ?? "";
/** Âge, seulement s'il est plausible (une ancienne donnée erronée n'affiche pas « 0 ans »). */
const age = (iso?: string) => {
  const n = versDate(iso), a = new Date();
  if (!n) return null;
  const ans = a.getFullYear() - n.getFullYear() - (a < new Date(a.getFullYear(), n.getMonth(), n.getDate()) ? 1 : 0);
  return ans >= 14 && ans <= 100 ? ans : null;
};

/** Ligne « libellé : valeur » de la fiche détaillée. */
const Info = ({ icone, libelle, children }: { icone: React.ReactNode; libelle: string; children: React.ReactNode }) => (
  <div className="flex min-w-0 items-start gap-3">
    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-950">{icone}</span>
    <div className="min-w-0">
      <p className="text-xs text-slate-500">{libelle}</p>
      <div className="break-words text-sm font-medium text-slate-900">{children || <span className="font-normal italic text-slate-400">Non renseigné</span>}</div>
    </div>
  </div>
);

const Bloc = ({ titre, children }: { titre: string; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-purple-100 bg-white p-4">
    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">{titre}</p>
    <div className="grid gap-4 sm:grid-cols-2">{children}</div>
  </section>
);


/** Indicateur : ce membre a activé la double authentification. */
function Badge2fa() {
  return (
    <Tooltip title="Double authentification activée">
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-200">
        <ShieldCheck2fa size={12} /> 2FA
      </span>
    </Tooltip>
  );
}

export default function Equipe() {
  const { message, modal } = App.useApp();
  const qc = useQueryClient();
  const moiId = localStorage.getItem("user_id");
  const monRole = localStorage.getItem("role");
  const membres = useQuery({ queryKey: ["equipe", "liste"], queryFn: apiEquipe.liste });
  const licence = useQuery({ queryKey: ["equipe", "licence"], queryFn: apiEquipe.licence });

  const [recherche, setRecherche] = useState("");
  const [filtreRole, setFiltreRole] = useState<FiltreRole>("tous");
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>("tous");
  const [vue, setVue] = useState<"cartes" | "tableau">(() => (localStorage.getItem("equipe_vue") === "tableau" ? "tableau" : "cartes"));
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<Membre | null>(null);
  const [edition, setEdition] = useState<{ membre: Membre; valeurs: FormMembre } | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const liste = membres.data ?? [];
  const rafraichir = () => qc.invalidateQueries({ queryKey: ["equipe"] });

  const filtres = useMemo(() => {
    const r = recherche.trim().toLowerCase();
    return liste
      .filter((m) => filtreRole === "tous" || roleDe(m.role) === filtreRole)
      .filter((m) => filtreStatut === "tous" || (filtreStatut === "actifs" ? m.is_active !== false : m.is_active === false))
      .filter((m) => !r || [nomComplet(m), m.email, m.telephone, m.fonction, m.ville, m.nom_boutique, m.boutique?.nom]
        .some((x) => (x || "").toLowerCase().includes(r)))
      .sort((a, b) => (a.role === "admin" ? -1 : b.role === "admin" ? 1 : nomComplet(a).localeCompare(nomComplet(b), "fr")));
  }, [liste, recherche, filtreRole, filtreStatut]);
  const pageMembres = filtres.slice((page - 1) * PAR_PAGE, page * PAR_PAGE);

  const compte = (r: FiltreRole) => liste.filter((m) => roleDe(m.role) === r).length;
  const actifs = liste.filter((m) => m.is_active !== false).length;
  const l = licence.data;

  // Un manager ne gère pas un administrateur ; personne ne désactive ou supprime son propre compte.
  // Droit « Gérer l'équipe » (Paramètres > Accès) ; un manager ne touche jamais au compte admin.
  const { peut } = useCompteConnecte();
  const peutGerer = peut("equipe.gerer");
  const gerable = (m: Membre) => peutGerer && !(monRole === "manager" && m.role === "admin");
  const estMoi = (m: Membre) => m._id === moiId;

  const majStatutLocal = (id: string, actif: boolean) => {
    qc.setQueryData<Membre[]>(["equipe", "liste"], (ls) => ls?.map((m) => (m._id === id ? { ...m, is_active: actif } : m)));
    setDetail((d) => (d && d._id === id ? { ...d, is_active: actif } : d));
  };

  const action = async (fn: () => Promise<{ message?: string }>, succes: string) => {
    try {
      const r = await fn();
      message.success(r?.message || succes);
      rafraichir();
    } catch (e) {
      message.error(messageErreur(e));
    }
  };

  const supprimer = (m: Membre) =>
    modal.confirm({
      title: `Supprimer le compte de ${nomComplet(m)} ?`,
      content: "Cette action est définitive. Pour garder l'historique de ses ventes, désactivez plutôt le compte.",
      okText: "Supprimer", okType: "danger", cancelText: "Annuler",
      onOk: async () => {
        try {
          await apiEquipe.supprimer(m._id);
          message.success("Compte supprimé");
          setDetail(null);
          rafraichir();
        } catch (e) {
          message.error(messageErreur(e));
        }
      },
    });

  const menu = (m: Membre): MenuProps["items"] => [
    { key: "voir", icon: <Eye size={15} />, label: "Voir la fiche", onClick: () => setDetail(m) },
    ...(gerable(m) ? [
      { key: "modifier", icon: <Pencil size={15} />, label: "Modifier", onClick: () => setEdition({ membre: m, valeurs: formDepuisMembre(m) }) },
      { type: "divider" as const },
      { key: "invitation", icon: <Send size={15} />, label: "Renvoyer l'invitation",
        onClick: () => action(() => apiEquipe.invitation(m._id), "Invitation renvoyée") },
      { key: "mdp", icon: <KeyRound size={15} />, label: "Réinitialiser le mot de passe",
        onClick: () => action(() => apiEquipe.reinitialiser(m._id), "Un lien de réinitialisation a été envoyé") },
      ...(m.deux_facteurs && !estMoi(m) ? [
        { key: "2fa", icon: <ShieldOff size={15} />, label: "Désactiver sa double authentification",
          onClick: () => modal.confirm({
            title: `Désactiver la double authentification de ${nomComplet(m)} ?`,
            content: "À faire seulement si cette personne a perdu son téléphone et ses codes de secours. Elle pourra la réactiver depuis ses paramètres.",
            okText: "Désactiver",
            okButtonProps: { danger: true },
            cancelText: "Annuler",
            onOk: () => action(() => reinitialiserMembre(m._id), "Double authentification désactivée"),
          }) },
      ] : []),
      ...(!estMoi(m) ? [
        { type: "divider" as const },
        { key: "supprimer", icon: <Trash2 size={15} />, label: "Supprimer le compte", danger: true, onClick: () => supprimer(m) },
      ] : []),
    ] : []),
  ];

  const enregistrerEdition = async () => {
    if (!edition) return;
    const role = roleDe(edition.membre.role);
    const probleme = verifierForm(edition.valeurs, role);
    if (probleme) { message.error(probleme); return; }
    setEnvoi(true);
    try {
      await apiEquipe.modifier(edition.membre._id, corpsDepuisForm(edition.valeurs, role));
      message.success("Fiche mise à jour");
      setEdition(null);
      setDetail(null);
      rafraichir();
    } catch (e) {
      message.error(messageErreur(e, "La fiche n'a pas pu être enregistrée."));
    } finally {
      setEnvoi(false);
    }
  };

  const Statut = ({ m }: { m: Membre }) =>
    estMoi(m) ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-semibold text-purple-950 ring-1 ring-purple-200">
        <BadgeCheck size={12} /> Vous
      </span>
    ) : gerable(m) ? (
      <StatusToggle userId={m._id} initialStatus={m.is_active !== false} onStatusChange={(a) => majStatutLocal(m._id, a)} />
    ) : (
      <span className="text-xs text-slate-400">{m.is_active === false ? "Inactif" : "Actif"}</span>
    );

  const tuiles = [
    { libelle: "Membres", valeur: liste.length, detail: `${actifs} actif(s)`, icone: <Users size={17} /> },
    { libelle: "Actifs", valeur: actifs, detail: "peuvent se connecter", icone: <UserCheck size={17} /> },
    { libelle: "Désactivés", valeur: liste.length - actifs, detail: "accès suspendu", icone: <UserX size={17} /> },
  ];
  const quotas = [
    { r: "manager" as const, utilises: compte("manager"), max: l?.max_managers },
    { r: "gerant" as const, utilises: compte("gerant"), max: l?.max_gerants },
    { r: "caissier" as const, utilises: compte("caissier"), max: l?.max_caissiers },
  ];

  return (
    <ConfigProvider theme={{ token: { colorPrimary: PURPLE_950, borderRadius: 10 } }}>
      <PageTitle>Équipe</PageTitle>
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">Les personnes qui travaillent avec vous, leurs rôles et leurs accès.</p>
          {peutGerer && <Link to="/admin/dashboard/users/addusersadmin" style={{ backgroundColor: PURPLE_950, color: "#fff" }}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold !text-white shadow-md shadow-purple-950/20 hover:opacity-90">
            <UserPlus size={17} /> Ajouter un membre
          </Link>}
        </div>

        {/* Chiffres et licence */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-6">
          {tuiles.map((t) => (
            <div key={t.libelle} className="flex min-w-0 flex-col rounded-2xl border border-purple-100/70 bg-white p-3.5 shadow-sm sm:p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-slate-500 sm:text-sm">{t.libelle}</p>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-950">{t.icone}</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-purple-950">{membres.isLoading ? "…" : t.valeur}</p>
              <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">{t.detail}</p>
            </div>
          ))}
          {quotas.map((q) => {
            const c = ROLES[q.r];
            const ratio = q.max ? Math.min(q.utilises / q.max, 1) : 0;
            const plein = q.max !== null && q.max !== undefined && q.utilises >= q.max;
            return (
              <div key={q.r} className="flex min-w-0 flex-col rounded-2xl border border-purple-100/70 bg-white p-3.5 shadow-sm sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-slate-500 sm:text-sm">{c.court}s</p>
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${c.fond} ${c.texte}`}>
                    {q.r === "manager" ? <BadgeCheck size={17} /> : q.r === "gerant" ? <Store size={17} /> : <IdCard size={17} />}
                  </span>
                </div>
                <p className="mt-2 text-2xl font-bold text-purple-950">{q.utilises}<span className="text-sm font-semibold text-slate-400"> / {q.max ?? "∞"}</span></p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${plein ? "bg-red-600" : "bg-purple-700"}`} style={{ width: `${ratio * 100}%` }} />
                </div>
                <p className={`mt-1 text-[11px] sm:text-xs ${plein ? "font-medium text-red-700" : "text-slate-500"}`}>{plein ? "limite de la licence atteinte" : "selon votre licence"}</p>
              </div>
            );
          })}
        </div>

        {/* Filtres */}
        <div className="overflow-hidden rounded-2xl border border-purple-100/70 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-sm">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={recherche} onChange={(e) => { setRecherche(e.target.value); setPage(1); }}
                placeholder="Nom, email, téléphone, ville, boutique…"
                className="w-full rounded-xl border border-purple-100 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-purple-300 focus:bg-white focus:ring-2 focus:ring-purple-100" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Segment libelle="Rôle" valeur={filtreRole} onChange={(v) => { setFiltreRole(v); setPage(1); }} options={[
                { valeur: "tous", libelle: `Tous (${liste.length})` }, { valeur: "admin", libelle: "Admin" },
                { valeur: "manager", libelle: `Managers (${compte("manager")})` }, { valeur: "gerant", libelle: `Gérants (${compte("gerant")})` },
                { valeur: "caissier", libelle: `Caissiers (${compte("caissier")})` },
              ]} />
              <Segment libelle="Statut" valeur={filtreStatut} onChange={(v) => { setFiltreStatut(v); setPage(1); }} options={[
                { valeur: "tous", libelle: "Tous" }, { valeur: "actifs", libelle: "Actifs" }, { valeur: "inactifs", libelle: "Désactivés" },
              ]} />
              <div className="flex rounded-xl bg-slate-100 p-1">
                {(["cartes", "tableau"] as const).map((v) => (
                  <Tooltip key={v} title={v === "cartes" ? "Vue en cartes" : "Vue en tableau"}>
                    <button onClick={() => { setVue(v); try { localStorage.setItem("equipe_vue", v); } catch { /* */ } }}
                      className={`rounded-lg p-1.5 ${vue === v ? "bg-purple-950 text-white" : "text-slate-500 hover:bg-white"}`}>
                      {v === "cartes" ? <LayoutGrid size={16} /> : <List size={16} />}
                    </button>
                  </Tooltip>
                ))}
              </div>
            </div>
          </div>

          {membres.isLoading ? (
            <div className="p-5"><Skeleton active avatar paragraph={{ rows: 4 }} /></div>
          ) : membres.isError ? (
            <div className="p-10 text-center text-sm text-red-700">{messageErreur(membres.error, "Impossible de charger l'équipe.")}</div>
          ) : filtres.length === 0 ? (
            <Empty className="py-16" description="Aucun membre ne correspond à ces filtres" />
          ) : vue === "cartes" ? (
            <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 2xl:grid-cols-3">
              {pageMembres.map((m) => (
                <div key={m._id} className={`flex min-w-0 flex-col rounded-2xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${m.is_active === false ? "border-slate-200 opacity-80" : "border-purple-100"}`}>
                  <div className="flex items-start gap-3">
                    <AvatarWithPopover name={nomComplet(m)} email={m.email} size={48} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold text-slate-900">{nomComplet(m)}</p>
                      <p className="truncate text-xs text-slate-500">{m.fonction || ROLES[roleDe(m.role)].libelle}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5"><BadgeRole role={m.role} /><Statut m={m} />{m.deux_facteurs && <Badge2fa />}</div>
                    </div>
                    <Dropdown menu={{ items: menu(m) }} trigger={["click"]} placement="bottomRight">
                      <button className="rounded-lg p-1.5 text-slate-400 hover:bg-purple-50 hover:text-purple-950"><MoreVertical size={18} /></button>
                    </Dropdown>
                  </div>
                  <div className="mb-4 mt-4 space-y-2 text-sm text-slate-600">
                    <p className="flex min-w-0 items-center gap-2"><Mail size={14} className="shrink-0 text-purple-700" /><span className="truncate">{m.email}</span></p>
                    <p className="flex items-center gap-2">
                      {m.telephone ? <NumeroAvecDrapeau numero={m.telephone} /> : (
                        <><IdCard size={14} className="shrink-0 text-purple-700" /><span className="italic text-slate-400">Téléphone non renseigné</span></>
                      )}
                    </p>
                    <p className="flex min-w-0 items-center gap-2"><MapPin size={14} className="shrink-0 text-purple-700" />
                      <span className="truncate">{lieu(m) || <span className="italic text-slate-400">Adresse non renseignée</span>}</span></p>
                    {roleDe(m.role) === "gerant" && (
                      <p className="flex min-w-0 items-center gap-2"><Store size={14} className="shrink-0 text-purple-700" />
                        <span className="truncate">{m.boutique?.nom || m.nom_boutique || "Boutique"}{m.boutique?.type ? ` · ${m.boutique.type}` : ""}</span></p>
                    )}
                  </div>
                  <div className="mt-auto flex gap-2 border-t border-purple-50 pt-3">
                    <button onClick={() => setDetail(m)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-purple-200 py-2 text-sm font-semibold text-purple-950 hover:bg-purple-50">
                      <Eye size={15} /> Fiche
                    </button>
                    {gerable(m) && (
                      <button onClick={() => setEdition({ membre: m, valeurs: formDepuisMembre(m) })} style={{ backgroundColor: PURPLE_950 }}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold text-white hover:opacity-90">
                        <Pencil size={15} /> Modifier
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full min-w-[960px] text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Membre</th><th className="px-4 py-3">Rôle</th><th className="px-4 py-3">Téléphone</th>
                    <th className="px-4 py-3">Localisation</th><th className="px-4 py-3">Boutique / poste</th>
                    <th className="px-4 py-3">Statut</th><th className="px-4 py-3">Membre depuis</th><th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pageMembres.map((m) => (
                    <tr key={m._id} className={`hover:bg-purple-50/40 ${m.is_active === false ? "text-slate-400" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <AvatarWithPopover name={nomComplet(m)} email={m.email} size={38} />
                          <div className="min-w-0">
                            <button onClick={() => setDetail(m)} className="block max-w-[220px] truncate text-left font-semibold text-slate-900 hover:text-purple-800">{nomComplet(m)}</button>
                            <p className="max-w-[220px] truncate text-xs text-slate-500">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><BadgeRole role={m.role} court /></td>
                      <td className="px-4 py-3"><NumeroAvecDrapeau numero={m.telephone} className="text-slate-700" /></td>
                      <td className="px-4 py-3">
                        {m.ville || m.pays ? (
                          <span className="flex items-center gap-1.5 text-slate-700">{m.pays && <Drapeau code={m.pays} />}{m.ville || nomPays(m.pays)}</span>
                        ) : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-slate-700">
                        {roleDe(m.role) === "gerant" ? (m.boutique?.nom || m.nom_boutique || "—") : (m.poste_caisse || m.fonction || "—")}
                      </td>
                      <td className="px-4 py-3"><div className="flex flex-wrap items-center gap-1.5"><Statut m={m} />{m.deux_facteurs && <Badge2fa />}</div></td>
                      <td className="px-4 py-3 text-slate-600">{dateCreation(m)?.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <Dropdown menu={{ items: menu(m) }} trigger={["click"]} placement="bottomRight">
                          <button className="rounded-lg p-1.5 text-slate-400 hover:bg-purple-50 hover:text-purple-950"><MoreVertical size={18} /></button>
                        </Dropdown>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filtres.length > PAR_PAGE && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
              <span>{(page - 1) * PAR_PAGE + 1}–{Math.min(page * PAR_PAGE, filtres.length)} sur {filtres.length} membres</span>
              <Pagination size="small" current={page} pageSize={PAR_PAGE} total={filtres.length} onChange={setPage} showSizeChanger={false} />
            </div>
          )}
        </div>
      </div>

      {/* Fiche détaillée */}
      <Drawer open={!!detail} onClose={() => setDetail(null)} width={Math.min(620, window.innerWidth)} closable={false}
        styles={{ body: { padding: 0, background: "#faf9fc" } }}>
        {detail && (
          <div>
            <div className="relative overflow-hidden px-6 pb-6 pt-7 text-white" style={{ backgroundColor: PURPLE_950 }}>
              <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-purple-900/70" />
              <div className="relative flex items-center gap-4">
                <AvatarWithPopover name={nomComplet(detail)} email={detail.email} size={64} />
                <div className="min-w-0">
                  <p className="truncate text-xl font-bold">{nomComplet(detail)}</p>
                  <p className="truncate text-sm text-purple-200">{detail.fonction || ROLES[roleDe(detail.role)].libelle}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2"><BadgeRole role={detail.role} /><Statut m={detail} /></div>
                </div>
              </div>
            </div>
            <div className="space-y-4 p-5">
              <Bloc titre="Coordonnées">
                <Info icone={<Mail size={15} />} libelle="Email"><a href={`mailto:${detail.email}`} className="!text-purple-900 hover:underline">{detail.email}</a></Info>
                <Info icone={<IdCard size={15} />} libelle="Téléphone">{detail.telephone && <a href={`tel:${detail.telephone}`}><NumeroAvecDrapeau numero={detail.telephone} /></a>}</Info>
                <Info icone={<MapPin size={15} />} libelle="Adresse">
                  {lieu(detail) && <span className="flex items-center gap-1.5">{detail.pays && <Drapeau code={detail.pays} />}{lieu(detail)}</span>}
                  {detail.adresse && <span className="block text-xs font-normal text-slate-500">{detail.adresse}</span>}
                </Info>
              </Bloc>
              <Bloc titre="Identité">
                <Info icone={<Users size={15} />} libelle="Sexe">{detail.sexe}</Info>
                <Info icone={<CalendarDays size={15} />} libelle="Date de naissance">
                  {detail.date_naissance && `${jour(detail.date_naissance)}${age(detail.date_naissance) ? ` · ${age(detail.date_naissance)} ans` : ""}`}
                </Info>
                <Info icone={<IdCard size={15} />} libelle="Pièce d'identité">
                  {detail.piece_identite?.type && `${detail.piece_identite.type}${detail.piece_identite.numero ? ` n° ${detail.piece_identite.numero}` : ""}`}
                </Info>
              </Bloc>
              <Bloc titre="Poste">
                <Info icone={<Briefcase size={15} />} libelle="Fonction">{detail.fonction}</Info>
                <Info icone={<CalendarDays size={15} />} libelle="Dans l'entreprise depuis">{detail.date_embauche && jour(detail.date_embauche)}</Info>
                {roleDe(detail.role) === "caissier" && <Info icone={<IdCard size={15} />} libelle="Poste de caisse">{detail.poste_caisse}</Info>}
                <Info icone={<BadgeCheck size={15} />} libelle="Compte créé le">{dateCreation(detail)?.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</Info>
              </Bloc>
              {roleDe(detail.role) === "gerant" && (
                <Bloc titre="Sous-boutique">
                  <Info icone={<Store size={15} />} libelle="Nom">{(detail.boutique?.nom || detail.nom_boutique) && `${detail.boutique?.nom || detail.nom_boutique}${detail.boutique?.type ? ` · ${detail.boutique.type}` : ""}`}</Info>
                  <Info icone={<IdCard size={15} />} libelle="Téléphone de la boutique">{detail.boutique?.telephone && <NumeroAvecDrapeau numero={detail.boutique.telephone} />}</Info>
                  <Info icone={<MapPin size={15} />} libelle="Adresse">
                    {(detail.boutique?.ville || detail.boutique?.pays) && (
                      <span className="flex items-center gap-1.5">{detail.boutique?.pays && <Drapeau code={detail.boutique.pays} />}
                        {[detail.boutique?.quartier, detail.boutique?.ville, detail.boutique?.pays ? nomPays(detail.boutique.pays) : ""].filter(Boolean).join(", ")}</span>
                    )}
                    {detail.boutique?.adresse && <span className="block text-xs font-normal text-slate-500">{detail.boutique.adresse}</span>}
                  </Info>
                  <Info icone={<CalendarDays size={15} />} libelle="Horaires">{detail.boutique?.horaires}</Info>
                  {detail.boutique?.description && <div className="sm:col-span-2"><Info icone={<NotebookPen size={15} />} libelle="Description">{detail.boutique.description}</Info></div>}
                </Bloc>
              )}
              <Bloc titre="Contact d'urgence">
                <Info icone={<ShieldAlert size={15} />} libelle="Personne à prévenir">
                  {detail.contact_urgence?.nom && `${detail.contact_urgence.nom}${detail.contact_urgence.lien ? ` (${detail.contact_urgence.lien})` : ""}`}
                </Info>
                <Info icone={<IdCard size={15} />} libelle="Téléphone">{detail.contact_urgence?.telephone && <NumeroAvecDrapeau numero={detail.contact_urgence.telephone} />}</Info>
              </Bloc>
              {detail.notes && (
                <section className="rounded-2xl border border-purple-100 bg-white p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Notes internes</p>
                  <p className="whitespace-pre-line text-sm text-slate-700">{detail.notes}</p>
                </section>
              )}
              {gerable(detail) && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <button onClick={() => setEdition({ membre: detail, valeurs: formDepuisMembre(detail) })} style={{ backgroundColor: PURPLE_950 }}
                    className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"><Pencil size={15} /> Modifier la fiche</button>
                  <button onClick={() => action(() => apiEquipe.invitation(detail._id), "Invitation renvoyée")}
                    className="flex items-center gap-1.5 rounded-xl border border-purple-200 bg-white px-4 py-2.5 text-sm font-semibold text-purple-950 hover:bg-purple-50"><Send size={15} /> Renvoyer l'invitation</button>
                  {!estMoi(detail) && (
                    <button onClick={() => supprimer(detail)}
                      className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"><Trash2 size={15} /> Supprimer</button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Modification */}
      <Drawer open={!!edition} onClose={() => !envoi && setEdition(null)} width={Math.min(860, window.innerWidth)}
        title={edition ? `Modifier ${nomComplet(edition.membre)}` : ""} styles={{ body: { background: "#faf9fc" } }}
        extra={edition && <BadgeRole role={edition.membre.role} />}
        footer={
          <div className="flex justify-end gap-2 py-1">
            <button onClick={() => setEdition(null)} disabled={envoi} className="rounded-xl border border-purple-200 px-5 py-2.5 text-sm font-semibold text-purple-950 hover:bg-purple-50">Annuler</button>
            <button onClick={enregistrerEdition} disabled={envoi} style={{ backgroundColor: PURPLE_950 }}
              className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60">
              {envoi && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />} Enregistrer
            </button>
          </div>
        }>
        {edition && (
          <FormulaireMembre edition role={roleDe(edition.membre.role)} valeurs={edition.valeurs} disabled={envoi}
            onChange={(valeurs) => setEdition((e) => (e ? { ...e, valeurs } : e))} />
        )}
      </Drawer>
    </ConfigProvider>
  );
}

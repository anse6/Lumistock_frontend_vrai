// Ajout d'un membre de l'équipe : choix du rôle, puis fiche complète (identité, coordonnées,
// adresse, poste, sous-boutique pour un gérant, contact d'urgence). Invitation envoyée par email.
import { useMemo, useState } from "react";
import { App, ConfigProvider } from "antd";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Mail, MapPin, ScanBarcode, Send, ShieldCheck, Store, UserPlus } from "lucide-react";
import PageTitle from "../../PageTitle";
import AvatarWithPopover from "../../super-admin/users.tsx/components/AvatarWithPopover";
import { Drapeau, nomPays, numeroInternational } from "../livaision/livraisonfinal/TelephoneInternational";
import { useTvaMagasin } from "../livaision/selectionproduct/Clients/tva";
import FormulaireMembre, { Section } from "./FormulaireMembre";
import type { Licence, RoleCreable } from "./equipe";
import { ROLES, apiEquipe, corpsDepuisForm, formVide, messageErreur, verifierForm } from "./equipe";

const PURPLE_950 = "#3b0764";
const ICONES: Record<RoleCreable, React.ReactNode> = {
  manager: <ShieldCheck size={26} />, gerant: <Store size={26} />, caissier: <ScanBarcode size={26} />,
};

const quota = (l: Licence | null | undefined, role: RoleCreable) => {
  if (!l) return null;
  if (role === "manager") return { utilises: l.managers, max: l.max_managers };
  if (role === "gerant") return { utilises: l.gerants, max: l.max_gerants };
  return { utilises: l.caissiers ?? 0, max: l.max_caissiers ?? null };
};

export default function AjouterMembre() {
  const { message, notification } = App.useApp();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { tva } = useTvaMagasin();
  const licence = useQuery({ queryKey: ["equipe", "licence"], queryFn: apiEquipe.licence });
  const [role, setRole] = useState<RoleCreable | null>(null);
  const [valeurs, setValeurs] = useState(() => formVide());
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const choisir = (r: RoleCreable) => {
    const pays = (tva?.code as never) || undefined;
    setRole(r);
    setValeurs((v) => (v.name || v.email ? v : formVide(pays)));
    setErreur(null);
  };

  const nom = `${valeurs.first_name} ${valeurs.name}`.trim();
  const telephone = useMemo(
    () => (valeurs.telephone.chiffres ? numeroInternational(valeurs.telephone.pays, valeurs.telephone.chiffres) : ""),
    [valeurs.telephone],
  );

  const enregistrer = async () => {
    if (!role) return;
    const probleme = verifierForm(valeurs, role);
    if (probleme) { setErreur(probleme); message.error(probleme); return; }
    setEnvoi(true);
    setErreur(null);
    try {
      const r = await apiEquipe.creer(role, corpsDepuisForm(valeurs, role));
      qc.invalidateQueries({ queryKey: ["equipe"] });
      if (r?.invitation_envoyee === false) notification.warning({ message: r.message, duration: 8 });
      else notification.success({ message: `${ROLES[role].libelle} ajouté`, description: `Une invitation a été envoyée à ${valeurs.email.trim()} pour choisir son mot de passe.` });
      navigate("/admin/dashboard/users");
    } catch (e) {
      const texte = messageErreur(e, "Le compte n'a pas pu être créé.");
      setErreur(texte);
      message.error(texte);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <ConfigProvider theme={{ token: { colorPrimary: PURPLE_950, borderRadius: 10 } }}>
      <PageTitle>Ajouter un membre</PageTitle>
      <div className="min-h-screen w-full bg-white p-4 pb-16 sm:p-6">
        {/* Fil d'Ariane */}
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm font-medium">
          <Link to="/admin/dashboard/users" style={{ backgroundColor: PURPLE_950 }}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold !text-white shadow-sm hover:opacity-90">
            <ArrowLeft size={14} /> Équipe
          </Link>
          <span className="font-bold text-gray-300">›</span>
          <button onClick={() => setRole(null)} className={`rounded-xl px-3 py-1.5 text-xs ${role ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-purple-100 font-semibold text-purple-950"}`}>
            Type de compte
          </button>
          {role && (
            <>
              <span className="font-bold text-gray-300">›</span>
              <span className="rounded-xl bg-purple-100 px-3 py-1.5 text-xs font-semibold text-purple-950">{ROLES[role].libelle}</span>
            </>
          )}
        </div>

        {/* En-tête */}
        <div className="mb-5 flex items-center gap-4 rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md shadow-purple-950/20" style={{ backgroundColor: PURPLE_950 }}>
            <UserPlus size={22} />
          </span>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-purple-900/70">Étape {role ? 2 : 1} sur 2</div>
            <h1 className="text-lg font-bold text-purple-950">{role ? `Nouveau ${ROLES[role].libelle.toLowerCase()}` : "Quel type de compte voulez-vous créer ?"}</h1>
            <p className="text-xs text-slate-500">
              {role ? "Aucun mot de passe à saisir : le membre reçoit un lien par email pour choisir le sien." : "Chaque rôle a ses propres droits dans l'application."}
            </p>
          </div>
        </div>

        {!role ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {(["manager", "gerant", "caissier"] as RoleCreable[]).map((r) => {
              const c = ROLES[r];
              const q = quota(licence.data, r);
              const plein = !!q && q.max !== null && q.max !== undefined && q.utilises >= q.max;
              return (
                <button key={r} onClick={() => !plein && choisir(r)} disabled={plein}
                  className="group flex flex-col rounded-2xl border border-purple-100 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0">
                  <div className="flex items-start justify-between gap-3">
                    <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${c.fond} ${c.texte}`}>{ICONES[r]}</span>
                    {q && (
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${plein ? "bg-red-50 text-red-700 ring-red-200" : "bg-slate-50 text-slate-600 ring-slate-200"}`}>
                        {q.utilises} / {q.max ?? "∞"}
                      </span>
                    )}
                  </div>
                  <h2 className="mt-4 text-base font-bold text-slate-900 group-hover:text-purple-950">{c.libelle}</h2>
                  <p className="mt-1 text-sm text-slate-500">{c.description}</p>
                  <ul className="mt-4 space-y-1.5">
                    {c.droits.map((d) => (
                      <li key={d} className="flex items-start gap-2 text-xs text-slate-600"><Check size={14} className="mt-0.5 shrink-0 text-emerald-600" /> {d}</li>
                    ))}
                  </ul>
                  <span className={`mt-5 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold ${plein ? "bg-slate-100 text-slate-500" : "bg-purple-950 text-white group-hover:bg-purple-900"}`}>
                    {plein ? "Limite de la licence atteinte" : `Créer un ${c.court.toLowerCase()}`}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="lg:order-2 lg:col-span-1">
              <div className="space-y-5 lg:sticky lg:top-4">
                <Section icone={<UserPlus size={18} />} titre="Aperçu" sousTitre="Ce que verra l'équipe">
                  <div className="flex flex-col items-center rounded-xl bg-purple-50/50 px-4 py-6 text-center">
                    <AvatarWithPopover name={nom || "Nouveau membre"} email={valeurs.email || null} size={72} />
                    <p className="mt-3 text-base font-bold text-slate-900">{nom || "Prénom Nom"}</p>
                    <span className={`mt-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${ROLES[role].badge}`}>{ROLES[role].libelle}</span>
                    {valeurs.fonction && <p className="mt-2 text-xs text-slate-500">{valeurs.fonction}</p>}
                    <div className="mt-4 w-full space-y-2 text-left text-sm text-slate-600">
                      <p className="flex items-center gap-2 truncate"><Mail size={14} className="shrink-0 text-purple-700" /> {valeurs.email || "Email"}</p>
                      <p className="flex items-center gap-2"><Drapeau code={valeurs.telephone.pays} /> {telephone || "Téléphone"}</p>
                      <p className="flex items-center gap-2 truncate"><MapPin size={14} className="shrink-0 text-purple-700" />
                        {[valeurs.quartier, valeurs.ville, nomPays(valeurs.telephone.pays)].filter(Boolean).join(", ")}</p>
                      {role === "gerant" && valeurs.boutique.nom && (
                        <p className="flex items-center gap-2 truncate"><Store size={14} className="shrink-0 text-purple-700" /> {valeurs.boutique.nom}</p>
                      )}
                    </div>
                  </div>
                  <ul className="mt-4 space-y-1.5">
                    {ROLES[role].droits.map((d) => (
                      <li key={d} className="flex items-start gap-2 text-xs text-slate-600"><Check size={14} className="mt-0.5 shrink-0 text-emerald-600" /> {d}</li>
                    ))}
                  </ul>
                </Section>
              </div>
            </div>

            <div className="space-y-5 lg:order-1 lg:col-span-2">
              <FormulaireMembre role={role} valeurs={valeurs} onChange={setValeurs} disabled={envoi} />
              {erreur && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{erreur}</div>}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setRole(null)} disabled={envoi}
                  className="rounded-xl border border-purple-200 px-5 py-2.5 text-sm font-semibold text-purple-950 hover:bg-purple-50 disabled:opacity-50">
                  Changer de rôle
                </button>
                <button type="button" onClick={enregistrer} disabled={envoi} style={{ backgroundColor: PURPLE_950 }}
                  className="flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-purple-950/20 hover:opacity-90 disabled:cursor-wait disabled:opacity-60">
                  {envoi ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Send size={16} />}
                  Créer le compte et envoyer l'invitation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ConfigProvider>
  );
}

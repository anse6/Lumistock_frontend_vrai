// Formulaire d'un membre de l'équipe (création et modification), dans le style des formulaires
// Lumistock : cartes de section, libellés en petites capitales, violet de la marque.
import React from "react";
import { AutoComplete, DatePicker, Input, Segmented, Select } from "antd";
import dayjs from "dayjs";
import {
  BadgeCheck, Briefcase, CalendarDays, IdCard, Mail, MapPin, NotebookPen, Phone, ShieldAlert, Store, User,
} from "lucide-react";
import type { CountryCode } from "libphonenumber-js";
import TelephoneInternational, { Drapeau, nomPays } from "../livaision/livraisonfinal/TelephoneInternational";
import VilleQuartier from "../livaision/Customer/VilleQuartier";
import type { FormMembre, RoleCreable, Tel } from "./equipe";
import { LIENS_URGENCE, PIECES, ROLES, TYPES_BOUTIQUE } from "./equipe";

export const Section: React.FC<{ icone: React.ReactNode; titre: string; sousTitre?: string; children: React.ReactNode }> = ({
  icone, titre, sousTitre, children,
}) => (
  <section className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-950">{icone}</span>
      <div className="min-w-0">
        <h2 className="text-sm font-bold text-purple-950">{titre}</h2>
        {sousTitre && <p className="text-xs text-slate-500">{sousTitre}</p>}
      </div>
    </div>
    {children}
  </section>
);

export const Libelle: React.FC<{ texte: string; obligatoire?: boolean; children: React.ReactNode; aide?: string }> = ({
  texte, obligatoire, children, aide,
}) => (
  <label className="block min-w-0">
    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
      {texte} {obligatoire && <span className="text-red-500">*</span>}
    </span>
    {children}
    {aide && <span className="mt-1 block text-xs text-slate-500">{aide}</span>}
  </label>
);

const BandeauPays: React.FC<{ code: CountryCode; texte: string }> = ({ code, texte }) => (
  <div className="mb-4 flex items-center gap-2 rounded-xl bg-purple-50 px-3 py-2 text-sm">
    <Drapeau code={code} />
    <span className="font-semibold text-purple-950">{nomPays(code)}</span>
    <span className="text-xs text-slate-500">· {texte}</span>
  </div>
);

interface Props {
  role: RoleCreable | "admin";
  valeurs: FormMembre;
  onChange: (v: FormMembre) => void;
  disabled?: boolean;
  /** Modification : l'email reste modifiable, mais on le signale. */
  edition?: boolean;
}

export default function FormulaireMembre({ role, valeurs: v, onChange, disabled, edition }: Props) {
  const maj = (champ: Partial<FormMembre>) => onChange({ ...v, ...champ });
  const majBoutique = (champ: Partial<FormMembre["boutique"]>) => onChange({ ...v, boutique: { ...v.boutique, ...champ } });

  const changerTelephone = (pays: CountryCode, chiffres: string) => {
    // Autre pays : la ville et le quartier saisis ne lui appartiennent plus.
    const autrePays = pays !== v.telephone.pays;
    onChange({
      ...v, telephone: { pays, chiffres },
      ...(autrePays ? { ville: "", quartier: "" } : {}),
      // Le contact d'urgence suit le pays tant qu'aucun numéro n'est saisi.
      urgence_tel: v.urgence_tel.chiffres ? v.urgence_tel : { pays, chiffres: "" },
      boutique: v.boutique.tel.chiffres || v.boutique.ville ? v.boutique : { ...v.boutique, tel: { pays, chiffres: "" } },
    });
  };
  const changerTelBoutique = (pays: CountryCode, chiffres: string) =>
    majBoutique({ tel: { pays, chiffres }, ...(pays !== v.boutique.tel.pays ? { ville: "", quartier: "" } : {}) });

  const date = (valeur: string) => (valeur ? dayjs(valeur) : null);
  const config = ROLES[role];

  return (
    <div className="space-y-5">
      <Section icone={<User size={18} />} titre="Identité" sousTitre="Telle qu'elle figure sur la pièce d'identité">
        <div className="grid gap-4 sm:grid-cols-2">
          <Libelle texte="Prénom" obligatoire>
            <Input size="large" value={v.first_name} onChange={(e) => maj({ first_name: e.target.value })} maxLength={60}
              placeholder="Ex. Alice" disabled={disabled} />
          </Libelle>
          <Libelle texte="Nom" obligatoire>
            <Input size="large" value={v.name} onChange={(e) => maj({ name: e.target.value })} maxLength={60}
              placeholder="Ex. Ngono" disabled={disabled} />
          </Libelle>
          <Libelle texte="Sexe">
            <Segmented block size="large" value={v.sexe || "—"} disabled={disabled}
              onChange={(s) => maj({ sexe: s === "—" ? "" : String(s) })}
              options={[{ label: "Non précisé", value: "—" }, { label: "Femme", value: "Femme" }, { label: "Homme", value: "Homme" }]} />
          </Libelle>
          <Libelle texte="Date de naissance">
            <DatePicker size="large" className="!w-full" format="DD/MM/YYYY" placeholder="JJ/MM/AAAA" disabled={disabled}
              value={date(v.date_naissance)} onChange={(d) => maj({ date_naissance: d ? d.format("YYYY-MM-DD") : "" })}
              disabledDate={(d) => d.isAfter(dayjs().subtract(16, "year")) || d.isBefore(dayjs().subtract(100, "year"))}
              defaultPickerValue={dayjs().subtract(25, "year")} />
          </Libelle>
          <Libelle texte="Pièce d'identité">
            <Select size="large" className="w-full" allowClear placeholder="Type de pièce" value={v.piece_type || undefined}
              disabled={disabled} onChange={(t) => maj({ piece_type: t || "" })} options={PIECES.map((p) => ({ value: p, label: p }))} />
          </Libelle>
          <Libelle texte="Numéro de la pièce">
            <Input size="large" prefix={<IdCard size={15} className="text-purple-400" />} value={v.piece_numero} maxLength={50}
              onChange={(e) => maj({ piece_numero: e.target.value })} placeholder="Ex. 112233445" disabled={disabled} />
          </Libelle>
        </div>
      </Section>

      <Section icone={<Phone size={18} />} titre="Coordonnées"
        sousTitre={edition ? "Changer l'email change l'adresse de connexion" : "Le lien d'invitation est envoyé à cet email"}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Libelle texte="Téléphone" obligatoire aide="Le pays choisi ici est aussi celui du membre.">
            <TelephoneInternational pays={v.telephone.pays} chiffres={v.telephone.chiffres} onChange={changerTelephone} disabled={disabled} />
          </Libelle>
          <Libelle texte="Email" obligatoire>
            <Input size="large" type="email" prefix={<Mail size={15} className="text-purple-400" />} value={v.email}
              onChange={(e) => maj({ email: e.target.value })} maxLength={120} placeholder="prenom.nom@exemple.com" disabled={disabled} />
          </Libelle>
        </div>
      </Section>

      <Section icone={<MapPin size={18} />} titre="Adresse" sousTitre="Les villes du pays sont proposées, puis les quartiers de la ville choisie">
        <BandeauPays code={v.telephone.pays} texte="pays choisi avec le numéro de téléphone" />
        <VilleQuartier pays={v.telephone.pays} ville={v.ville} quartier={v.quartier} disabled={disabled}
          onChange={({ ville, quartier }) => maj({ ville, quartier })} />
        <div className="mt-4">
          <Libelle texte="Adresse précise ou repère">
            <Input size="large" value={v.adresse} onChange={(e) => maj({ adresse: e.target.value })} maxLength={200}
              placeholder="Ex. Face pharmacie du Port, 2e portail à gauche" disabled={disabled} />
          </Libelle>
        </div>
      </Section>

      <Section icone={<Briefcase size={18} />} titre="Poste" sousTitre={config.description}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Libelle texte="Fonction">
            <AutoComplete size="large" className="w-full" value={v.fonction} disabled={disabled}
              onChange={(f) => maj({ fonction: f })} options={config.fonctions.map((f) => ({ value: f }))}
              placeholder={config.fonctions[0] || "Ex. Responsable"} filterOption={(s, o) => !!o?.value.toLowerCase().includes(s.toLowerCase())} />
          </Libelle>
          <Libelle texte="Date d'entrée dans l'entreprise">
            <DatePicker size="large" className="!w-full" format="DD/MM/YYYY" placeholder="JJ/MM/AAAA" disabled={disabled}
              value={date(v.date_embauche)} onChange={(d) => maj({ date_embauche: d ? d.format("YYYY-MM-DD") : "" })}
              disabledDate={(d) => d.isAfter(dayjs())} suffixIcon={<CalendarDays size={15} />} />
          </Libelle>
          {role === "caissier" && (
            <Libelle texte="Poste de caisse" aide="Facultatif : utile quand le magasin a plusieurs caisses.">
              <Input size="large" value={v.poste_caisse} onChange={(e) => maj({ poste_caisse: e.target.value })} maxLength={50}
                placeholder="Ex. Caisse 1" disabled={disabled} />
            </Libelle>
          )}
        </div>
      </Section>

      {role === "gerant" && (
        <Section icone={<Store size={18} />} titre="La sous-boutique" sousTitre="Le point de vente que ce gérant va tenir">
          <div className="grid gap-4 sm:grid-cols-2">
            <Libelle texte="Nom de la boutique" obligatoire>
              <Input size="large" value={v.boutique.nom} onChange={(e) => majBoutique({ nom: e.target.value })} maxLength={120}
                placeholder="Ex. Boutique Akwa" disabled={disabled} />
            </Libelle>
            <Libelle texte="Type de point de vente">
              <Select size="large" className="w-full" value={v.boutique.type || undefined} disabled={disabled}
                onChange={(t) => majBoutique({ type: t })} options={TYPES_BOUTIQUE.map((t) => ({ value: t, label: t }))} />
            </Libelle>
            <Libelle texte="Téléphone de la boutique" aide="Si la boutique a son propre numéro.">
              <TelephoneInternational pays={v.boutique.tel.pays} chiffres={v.boutique.tel.chiffres} onChange={changerTelBoutique} disabled={disabled} />
            </Libelle>
            <Libelle texte="Horaires d'ouverture">
              <Input size="large" value={v.boutique.horaires} onChange={(e) => majBoutique({ horaires: e.target.value })} maxLength={150}
                placeholder="Ex. Lun–Sam 8 h–20 h, Dim 10 h–14 h" disabled={disabled} />
            </Libelle>
          </div>
          <div className="mt-5">
            <BandeauPays code={v.boutique.tel.pays} texte="pays de la boutique (celui de son téléphone)" />
            <VilleQuartier pays={v.boutique.tel.pays} ville={v.boutique.ville} quartier={v.boutique.quartier} disabled={disabled}
              onChange={({ ville, quartier }) => majBoutique({ ville, quartier })} />
          </div>
          <div className="mt-4 grid gap-4">
            <Libelle texte="Adresse précise ou repère">
              <Input size="large" value={v.boutique.adresse} onChange={(e) => majBoutique({ adresse: e.target.value })} maxLength={200}
                placeholder="Ex. Marché central, allée B, stand 14" disabled={disabled} />
            </Libelle>
            <Libelle texte="Description">
              <Input.TextArea value={v.boutique.description} onChange={(e) => majBoutique({ description: e.target.value })} maxLength={300}
                autoSize={{ minRows: 2, maxRows: 4 }} showCount placeholder="Ce que vend la boutique, sa clientèle…" disabled={disabled} />
            </Libelle>
          </div>
        </Section>
      )}

      <Section icone={<ShieldAlert size={18} />} titre="Contact d'urgence" sousTitre="Facultatif · la personne à prévenir en cas de besoin">
        <div className="grid gap-4 sm:grid-cols-2">
          <Libelle texte="Nom complet">
            <Input size="large" value={v.urgence_nom} onChange={(e) => maj({ urgence_nom: e.target.value })} maxLength={120}
              placeholder="Ex. Paul Ngono" disabled={disabled} />
          </Libelle>
          <Libelle texte="Lien">
            <Select size="large" className="w-full" allowClear placeholder="Ex. Frère" value={v.urgence_lien || undefined}
              disabled={disabled} onChange={(l) => maj({ urgence_lien: l || "" })} options={LIENS_URGENCE.map((l) => ({ value: l, label: l }))} />
          </Libelle>
          <div className="sm:col-span-2">
            <Libelle texte="Téléphone">
              <TelephoneInternational pays={v.urgence_tel.pays} chiffres={v.urgence_tel.chiffres} disabled={disabled}
                onChange={(pays: CountryCode, chiffres: string) => maj({ urgence_tel: { pays, chiffres } as Tel })} />
            </Libelle>
          </div>
        </div>
      </Section>

      <Section icone={<NotebookPen size={18} />} titre="Notes internes" sousTitre="Visibles seulement par l'administrateur et les managers">
        <Input.TextArea value={v.notes} onChange={(e) => maj({ notes: e.target.value })} maxLength={500} showCount
          autoSize={{ minRows: 2, maxRows: 5 }} placeholder="Ex. Disponible le week-end, formation caisse prévue le 12…" disabled={disabled} />
      </Section>

      <p className="flex items-center gap-1.5 text-xs text-slate-500">
        <BadgeCheck size={14} className="text-purple-700" /> Les champs marqués <span className="text-red-500">*</span> sont obligatoires.
      </p>
    </div>
  );
}

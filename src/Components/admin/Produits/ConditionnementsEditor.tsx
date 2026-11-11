// Conditionnements d'un article (pack, carton, palette…), partagé par
// « Ajouter un article » et « Modifier l'article ».
// Un conditionnement contient soit des unités (pack = 6 bouteilles), soit un
// autre conditionnement (palette = 84 packs) : le nombre d'unités est alors
// calculé. Le serveur refait les mêmes contrôles (services/conditionnements.py).
import React, { useState } from "react";
import { Button, Card, Input, InputNumber, Select, Tag, Typography } from "antd";
import { DeleteOutlined, PlusOutlined, ShoppingOutlined } from "@ant-design/icons";

const { Text } = Typography;
const APP_COLOR = "#3b1558";
const UNITE = "__unite__";

export interface ConditionnementSaisi {
  _id?: string;
  nom: string;
  facteur?: number;
  prix_conditionnement?: number;
  contenu_nom?: string | null;
  contenu_nombre?: number | null;
  code_barre?: string | null;
}

interface Props {
  value: ConditionnementSaisi[];
  onChange: (liste: ConditionnementSaisi[]) => void;
  /** Prix de vente d'une unité (pour le prix proposé et la comparaison). */
  prixUnitaire?: number;
  /** Coût d'achat d'une unité : un conditionnement ne se vend pas en dessous. */
  coutUnitaire?: number;
  /** Nom de l'unité (bouteille, sac…). */
  unite?: string;
  onError: (texte: string) => void;
}

const cle = (nom?: string | null) => (nom ?? "").trim().replace(/\s+/g, " ").toLowerCase();
const cfa = (n: number) => `${Math.round(n * 100) / 100 > 0 ? (Math.round(n * 100) / 100).toLocaleString("fr-FR") : 0} CFA`;

/** Nombre d'unités d'un conditionnement, en suivant ce qu'il contient. */
export const unitesDe = (c: ConditionnementSaisi, liste: ConditionnementSaisi[], vus = new Set<string>()): number => {
  if (!c.contenu_nom) return Number(c.facteur) || 0;
  if (vus.has(cle(c.nom))) return 0;
  vus.add(cle(c.nom));
  const contenu = liste.find((x) => cle(x.nom) === cle(c.contenu_nom));
  return contenu ? (Number(c.contenu_nombre) || 0) * unitesDe(contenu, liste, vus) : 0;
};

/** Prix d'un conditionnement (vide : prix de ce qu'il contient). */
export const prixDe = (c: ConditionnementSaisi, liste: ConditionnementSaisi[], prixUnitaire: number): number => {
  if (c.prix_conditionnement) return Number(c.prix_conditionnement);
  const contenu = c.contenu_nom ? liste.find((x) => cle(x.nom) === cle(c.contenu_nom)) : undefined;
  if (contenu && contenu !== c) return (Number(c.contenu_nombre) || 0) * prixDe(contenu, liste, prixUnitaire);
  return unitesDe(c, liste) * prixUnitaire;
};

const ConditionnementsEditor: React.FC<Props> = ({ value, onChange, prixUnitaire = 0, coutUnitaire = 0, unite, onError }) => {
  const nomUnite = unite?.trim() || "unité";
  const [ouvert, setOuvert] = useState(false);
  const [nom, setNom] = useState("");
  const [contient, setContient] = useState<string>(UNITE);
  const [nombre, setNombre] = useState<number | null>(null);
  const [prix, setPrix] = useState<number | null>(null);

  const reset = () => { setNom(""); setContient(UNITE); setNombre(null); setPrix(null); setOuvert(false); };

  const brouillon: ConditionnementSaisi = contient === UNITE
    ? { nom, facteur: nombre ?? undefined, prix_conditionnement: prix ?? undefined }
    : { nom, contenu_nom: contient, contenu_nombre: nombre ?? undefined, prix_conditionnement: prix ?? undefined };
  const unitesBrouillon = nombre ? unitesDe(brouillon, value) : 0;
  const prixBrouillon = nombre ? prixDe(brouillon, value, prixUnitaire) : 0;

  const valider = () => {
    const n = nom.trim().replace(/\s+/g, " ");
    if (!n) return onError("Donnez un nom au conditionnement (ex. : Pack, Carton, Palette).");
    if (value.some((c) => cle(c.nom) === cle(n))) return onError(`Un conditionnement s'appelle déjà « ${n} ».`);
    if (!nombre || nombre < 2 || !Number.isInteger(nombre))
      return onError("Le nombre contenu doit être un entier d'au moins 2.");
    const autre = value.find((c) => unitesDe(c, value) === unitesBrouillon);
    if (autre) return onError(`« ${autre.nom} » contient déjà ${unitesBrouillon} ${nomUnite}(s) : gardez-en un seul.`);
    if (coutUnitaire > 0 && prixBrouillon < unitesBrouillon * coutUnitaire)
      return onError(`Prix trop bas : ${unitesBrouillon} ${nomUnite}(s) vous coûtent ${cfa(unitesBrouillon * coutUnitaire)}.`);
    const contenu = value.find((c) => cle(c.nom) === cle(contient));
    onChange([
      ...value,
      contenu
        ? { nom: n, contenu_nom: contenu.nom, contenu_nombre: nombre, facteur: unitesBrouillon, prix_conditionnement: prix ?? undefined }
        : { nom: n, facteur: nombre, prix_conditionnement: prix ?? undefined },
    ]);
    reset();
  };

  const supprimer = (index: number) => {
    const cible = value[index];
    const parent = value.find((c) => cle(c.contenu_nom) === cle(cible.nom));
    if (parent) return onError(`« ${parent.nom} » contient « ${cible.nom} » : supprimez d'abord « ${parent.nom} ».`);
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <Card
      title={
        <div className="flex items-center justify-between">
          <span>Conditionnements</span>
          <Button type="dashed" icon={<PlusOutlined />} onClick={() => setOuvert(!ouvert)}
            style={{ color: APP_COLOR, borderColor: APP_COLOR }}>
            Ajouter
          </Button>
        </div>
      }
      className="!rounded-xl shadow-sm border-gray-100"
    >
      {ouvert && (
        // Pas de <Form> ici : il serait dans le formulaire de l'article (Entrée enverrait l'article).
        <div
          className="mb-4 rounded-xl border border-purple-100 bg-purple-50 p-4"
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); valider(); } }}
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Nom</span>
              <Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Pack, Carton, Palette…" maxLength={50} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Contient</span>
              <div className="flex gap-2">
                <InputNumber className="!w-24" min={2} precision={0} value={nombre} onChange={(v) => setNombre(v)} placeholder="6" />
                <Select
                  className="flex-1"
                  value={contient}
                  onChange={setContient}
                  options={[
                    { value: UNITE, label: `${nomUnite}(s)` },
                    ...value.map((c) => ({ value: c.nom, label: `${c.nom}(s) de ${unitesDe(c, value)}` })),
                  ]}
                />
              </div>
            </label>
            <label className="text-sm md:col-span-2">
              <span className="mb-1 block font-medium text-slate-700">Prix de vente du conditionnement entier</span>
              <InputNumber className="!w-full" min={1} value={prix} onChange={(v) => setPrix(v)}
                addonAfter="CFA" placeholder={prixBrouillon ? `Vide : ${cfa(prixBrouillon)}` : "Vide : prix de ce qu'il contient"} />
            </label>
          </div>
          {unitesBrouillon > 0 && (
            <p className="mt-3 text-sm text-slate-700">
              = <b>{unitesBrouillon.toLocaleString("fr-FR")} {nomUnite}(s)</b> pour {cfa(prixBrouillon)}, soit{" "}
              {cfa(prixBrouillon / unitesBrouillon)} l'{nomUnite}
              {coutUnitaire > 0 && prixBrouillon < unitesBrouillon * coutUnitaire && (
                <span className="ml-1 font-semibold text-red-600">
                  — sous le coût d'achat (minimum {cfa(unitesBrouillon * coutUnitaire)})
                </span>
              )}
            </p>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <Button className="!border-none !bg-gray-200 !text-gray-700 hover:!bg-gray-300" onClick={reset}>Annuler</Button>
            <Button type="primary" htmlType="button" onClick={valider} style={{ backgroundColor: APP_COLOR }}>Valider</Button>
          </div>
        </div>
      )}

      {value.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-gray-400">
          <ShoppingOutlined style={{ fontSize: 40, opacity: 0.2 }} className="mb-2" />
          <Text type="secondary">Aucun conditionnement configuré</Text>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {value.map((c, idx) => {
            const unites = unitesDe(c, value);
            const total = prixDe(c, value, prixUnitaire);
            return (
              <Card key={c._id ?? `${c.nom}-${idx}`} size="small" className="border-gray-200 bg-gray-50 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <Text strong className="text-lg">{c.nom}</Text>
                    <div className="text-gray-500">
                      {c.contenu_nom ? (
                        <>{c.contenu_nombre} × {c.contenu_nom} = <Tag color="purple">{unites} {nomUnite}(s)</Tag></>
                      ) : (
                        <Tag color="purple">{unites} {nomUnite}(s)</Tag>
                      )}
                    </div>
                    {total > 0 && (
                      <Text type="success" strong>
                        {cfa(total)}
                        <span className="ml-1 text-xs font-normal text-gray-500">({cfa(total / (unites || 1))} l'{nomUnite})</span>
                      </Text>
                    )}
                  </div>
                  <Button type="text" danger icon={<DeleteOutlined />} onClick={() => supprimer(idx)} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default ConditionnementsEditor;

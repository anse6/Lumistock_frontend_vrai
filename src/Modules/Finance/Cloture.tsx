// Clôture d'exercice et verrouillage des périodes : une fois une période
// verrouillée, ses ventes, charges, achats et immobilisations ne bougent plus.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { App, Button, DatePicker, Empty, InputNumber, Modal, Popconfirm, Select, Spin, Table } from "antd";
import { CalendarCheck, Lock, LockOpen, RotateCcw, ShieldCheck } from "lucide-react";
import dayjs from "dayjs";
import { argent, dateCourte, fmt, PURPLE_950, Section } from "../Reports/ReportUi";
import { genererRapportPdf, nomFichier } from "../Reports/reportPdf";
import {
  cloturerExercice,
  getClotures,
  getPolitiqueRetour,
  messageErreur,
  rouvrirExercice,
  setPolitiqueRetour,
  verrouiller,
} from "../Charges/chargeService";
import type { Cloture as ClotureType, EtatClotures, LigneResultat } from "../Charges/types";
import { lignesPdfBilan, ORDRE_ACTIF, ORDRE_PASSIF, TableauBilan } from "./BilanSyscohada";
import useCompteConnecte from "../../hooks/useCompteConnecte";

const signe = (l: LigneResultat) => (l.type === "charge" || l.type === "detail" ? -l.montant : l.montant);

const Cloture: React.FC<{ devise: string; onChange: () => void }> = ({ devise, onChange }) => {
  const { message, modal } = App.useApp();
  // Droit « Paramètres comptables » (Paramètres > Accès).
  const estAdmin = useCompteConnecte().peut("finances.parametres");
  const [etat, setEtat] = useState<EtatClotures | null>(null);
  const [chargement, setChargement] = useState(true);
  const [date, setDate] = useState<dayjs.Dayjs | null>(null);
  const [vue, setVue] = useState<ClotureType | null>(null);
  const [retenue, setRetenue] = useState<number | null>(0);
  const [retenueEnregistree, setRetenueEnregistree] = useState(0);
  useEffect(() => {
    getPolitiqueRetour()
      .then((p) => {
        setRetenue(p);
        setRetenueEnregistree(p);
      })
      .catch(() => undefined);
  }, []);
  const enregistrerRetenue = async () => {
    try {
      const p = await setPolitiqueRetour(retenue || 0);
      setRetenueEnregistree(p);
      message.success(p ? `Frais de retour fixés à ${p} %.` : "Retours remboursés intégralement.");
    } catch (err) {
      message.error(messageErreur(err));
    }
  };

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      const e = await getClotures();
      setEtat(e);
      setDate(e.date_verrouillage ? dayjs(e.date_verrouillage) : null);
    } catch (err) {
      message.error(messageErreur(err));
    } finally {
      setChargement(false);
    }
  }, [message]);

  useEffect(() => {
    charger();
  }, [charger]);

  const appliquer = async (fn: () => Promise<EtatClotures>, texte: string) => {
    try {
      const e = await fn();
      setEtat(e);
      setDate(e.date_verrouillage ? dayjs(e.date_verrouillage) : null);
      message.success(texte);
      onChange();
    } catch (err) {
      message.error(messageErreur(err));
    }
  };

  const exercices = useMemo(() => {
    const clos = new Set((etat?.clotures || []).map((c) => c.exercice));
    const dernier = Math.max(0, ...(etat?.clotures || []).map((c) => c.exercice));
    return Array.from({ length: 6 }, (_, i) => dayjs().year() - 1 - i).filter((a) => !clos.has(a) && a > dernier);
  }, [etat]);
  const [exercice, setExercice] = useState<number>();

  const cloturer = () => {
    if (!exercice) return;
    modal.confirm({
      title: `Clôturer l'exercice ${exercice} ?`,
      content: (
        <div className="text-sm text-slate-600">
          <p>Le compte de résultat et le bilan au 31/12/{exercice} seront figés.</p>
          <p className="mb-0">
            Aucune vente, charge, facture ou immobilisation datée de {exercice} ou avant ne pourra plus être créée, modifiée ni
            supprimée. Vérifiez d'abord que tout est saisi et rapproché.
          </p>
        </div>
      ),
      okText: "Clôturer",
      cancelText: "Annuler",
      onOk: () => appliquer(() => cloturerExercice(exercice), `Exercice ${exercice} clôturé.`),
    });
  };

  type LignePdf = ReturnType<typeof lignesPdfBilan>[number];
  const colonnesPdf = [
    { titre: "Compte", largeur: 12, valeur: (l: LignePdf) => ("compte" in l && l.compte) || "" },
    { titre: "Poste", largeur: 62, valeur: (l: LignePdf) => l.libelle, gras: (l: LignePdf) => l.niveau === 0 },
    { titre: `Montant (${devise})`, largeur: 26, align: "right" as const, valeur: (l: LignePdf) => fmt(l.montant), gras: true },
  ];
  const pdf = (c: ClotureType) =>
    genererRapportPdf(
      {
        fichier: `${nomFichier("Comptes annuels", String(c.exercice))}.pdf`,
        kicker: "COMPTES ANNUELS",
        titre: `EXERCICE ${c.exercice}`,
        pastille: `Clôturé le ${dateCourte(c.cloture_le)}`,
        signatures: true,
        chiffres: [
          ["Résultat net", argent(c.resultat, devise)],
          ["Total du bilan", argent(c.bilan.total, devise)],
          ["Début", dateCourte(c.date_debut)],
          ["Fin", dateCourte(c.date_fin)],
        ],
        sections: [
          {
            titre: "Compte de résultat",
            lignes: c.compte_resultat,
            colonnes: [
              { titre: "Compte", largeur: 14, valeur: (l: LigneResultat) => l.compte },
              { titre: "Rubrique", largeur: 60, valeur: (l: LigneResultat) => `${l.niveau ? "   " : ""}${l.libelle}`, gras: (l: LigneResultat) => l.type === "total" || l.type === "resultat" },
              { titre: `Montant (${devise})`, largeur: 26, align: "right", valeur: (l: LigneResultat) => fmt(signe(l)), gras: (l: LigneResultat) => l.type !== "detail" },
            ],
          },
          {
            titre: "Bilan — actif",
            lignes: lignesPdfBilan(c.bilan.actif, ORDRE_ACTIF),
            colonnes: colonnesPdf,
            total: ["", "TOTAL ACTIF", fmt(c.bilan.total_actif ?? c.bilan.total)],
          },
          {
            titre: "Bilan — passif",
            lignes: lignesPdfBilan(c.bilan.passif, ORDRE_PASSIF),
            colonnes: colonnesPdf,
            total: ["", "TOTAL PASSIF", fmt(c.bilan.total_passif ?? c.bilan.total)],
          },
        ],
      },
      "download",
    ).catch((err) => message.error(messageErreur(err, "Le PDF n'a pas pu être généré.")));

  const derniere = etat?.clotures[0];
  return (
    <Spin spinning={chargement}>
      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <Section titre="Verrouillage des périodes" note={etat?.date_verrouillage ? "Actif" : "Aucun"}>
          <div
            className="mb-3 flex items-center gap-3 rounded-xl px-4 py-3 text-sm"
            style={etat?.date_verrouillage ? { backgroundColor: PURPLE_950, color: "white" } : undefined}
          >
            {etat?.date_verrouillage ? <Lock size={18} /> : <LockOpen size={18} className="text-slate-400" />}
            <span>
              {etat?.date_verrouillage ? (
                <>
                  Tout est verrouillé jusqu'au <b>{dateCourte(etat.date_verrouillage)}</b> inclus.
                </>
              ) : (
                <span className="text-slate-600">Aucune période n'est verrouillée : toutes les opérations restent modifiables.</span>
              )}
            </span>
          </div>
          <p className="mt-0 text-xs text-slate-500">
            Verrouillez chaque mois une fois la TVA déclarée et la banque rapprochée : plus personne ne pourra modifier les chiffres
            déjà déclarés.
          </p>
          {estAdmin ? (
            <div className="flex flex-wrap items-center gap-2">
              <DatePicker
                value={date}
                onChange={setDate}
                format="DD/MM/YYYY"
                placeholder="Verrouiller jusqu'au…"
                disabledDate={(d) => !d.isBefore(dayjs(), "day")}
              />
              <Button
                type="primary"
                icon={<Lock size={14} />}
                disabled={!date}
                onClick={() => date && appliquer(() => verrouiller(date.format("YYYY-MM-DD")), "Période verrouillée.")}
              >
                Verrouiller
              </Button>
              {etat?.date_verrouillage && (
                <Popconfirm title="Retirer le verrouillage ?" okText="Déverrouiller" cancelText="Annuler" onConfirm={() => appliquer(() => verrouiller(null), "Verrouillage retiré.")}>
                  <Button icon={<LockOpen size={14} />}>Déverrouiller</Button>
                </Popconfirm>
              )}
            </div>
          ) : (
            <p className="m-0 text-xs text-slate-400">Réservé à l'administrateur.</p>
          )}
        </Section>
        <Section titre="Clôturer un exercice" note="Année civile terminée">
          <p className="mt-0 text-xs text-slate-500">
            La clôture fige le compte de résultat et le bilan de l'année, garde leur copie (comptes annuels en PDF) et verrouille
            l'exercice. Seule la dernière clôture peut être annulée.
          </p>
          {estAdmin ? (
            exercices.length ? (
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  placeholder="Exercice"
                  value={exercice}
                  onChange={setExercice}
                  options={exercices.map((a) => ({ value: a, label: `Exercice ${a}` }))}
                  className="w-40"
                />
                <Button type="primary" icon={<CalendarCheck size={14} />} disabled={!exercice} onClick={cloturer}>
                  Clôturer
                </Button>
              </div>
            ) : (
              <p className="m-0 text-sm text-slate-500">Aucun exercice terminé à clôturer.</p>
            )
          ) : (
            <p className="m-0 text-xs text-slate-400">Réservé à l'administrateur.</p>
          )}
        </Section>
      </div>

      <div className="mb-4">
        <Section titre="Retours clients" note={retenueEnregistree ? `${retenueEnregistree} % retenus par défaut` : "Remboursement intégral"}>
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-900">
              <RotateCcw size={18} />
            </span>
            <p className="m-0 min-w-0 flex-1 text-xs text-slate-500">
              Quand un client rapporte un article, le magasin peut garder un pourcentage de la valeur retournée (frais de
              retour). Ce taux est proposé à chaque retour : le vendeur peut y renoncer pour un client. Les frais retenus
              sont comptés en produits (compte 7078). Un retour sur une vente d'une période clôturée est autorisé : il est
              compté le jour du retour.
            </p>
            {estAdmin ? (
              <div className="flex items-center gap-2">
                <InputNumber min={0} max={100} step={0.5} value={retenue} onChange={setRetenue} addonAfter="%" className="w-28" />
                <Button type="primary" disabled={(retenue || 0) === retenueEnregistree} onClick={enregistrerRetenue}>
                  Enregistrer
                </Button>
              </div>
            ) : (
              <span className="text-xs text-slate-400">Réservé à l'administrateur.</span>
            )}
          </div>
        </Section>
      </div>

      <Section titre="Exercices clôturés">
        <Table
          rowKey="id"
          size="middle"
          pagination={false}
          dataSource={etat?.clotures || []}
          locale={{ emptyText: <Empty description="Aucun exercice clôturé" /> }}
          columns={[
            {
              title: "Exercice",
              dataIndex: "exercice",
              render: (a: number) => (
                <span className="flex items-center gap-2 font-semibold text-purple-950">
                  <ShieldCheck size={15} /> {a}
                </span>
              ),
            },
            { title: "Période", key: "p", render: (_, c) => `${dateCourte(c.date_debut)} – ${dateCourte(c.date_fin)}` },
            {
              title: "Résultat net",
              dataIndex: "resultat",
              align: "right",
              render: (n: number) => <b className={n < 0 ? "text-red-600" : "text-emerald-700"}>{argent(n, devise)}</b>,
            },
            { title: "Clôturé le", dataIndex: "cloture_le", render: (d: string) => dateCourte(d) },
            {
              title: "",
              key: "actions",
              align: "right",
              render: (_, c) => (
                <div className="flex justify-end gap-1">
                  <Button size="small" onClick={() => setVue(c)}>
                    Voir
                  </Button>
                  <Button size="small" onClick={() => pdf(c)}>
                    PDF
                  </Button>
                  {estAdmin && derniere?.id === c.id && (
                    <Popconfirm
                      title={`Rouvrir l'exercice ${c.exercice} ?`}
                      description="Ses opérations redeviennent modifiables."
                      okText="Rouvrir"
                      cancelText="Annuler"
                      okButtonProps={{ danger: true }}
                      onConfirm={() => appliquer(() => rouvrirExercice(c.exercice), `Exercice ${c.exercice} rouvert.`)}
                    >
                      <Button size="small" danger>
                        Rouvrir
                      </Button>
                    </Popconfirm>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Section>

      <Modal title={vue ? `Comptes de l'exercice ${vue.exercice}` : ""} open={!!vue} onCancel={() => setVue(null)} footer={null} width={760}>
        {vue && (
          <div className="space-y-4">
            <Table
              rowKey="cle"
              size="small"
              pagination={false}
              dataSource={vue.compte_resultat}
              rowClassName={(l) => (l.type === "resultat" ? "bg-purple-950 font-bold text-white" : l.type === "total" ? "bg-purple-50 font-bold" : "")}
              columns={[
                { title: "Compte", dataIndex: "compte", width: 90 },
                { title: "Rubrique", dataIndex: "libelle", render: (t: string, l) => <span style={{ paddingLeft: l.niveau * 16 }}>{t}</span> },
                { title: "Montant", key: "m", align: "right", render: (_, l) => argent(signe(l), devise) },
              ]}
            />
            <TableauBilan bilan={vue.bilan} devise={devise} />
          </div>
        )}
      </Modal>
    </Spin>
  );
};

export default Cloture;

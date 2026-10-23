// Rapprochement bancaire : le relevé de la banque (ou du compte mobile money)
// comparé aux opérations enregistrées dans Lumistock, ligne par ligne.
import React, { useMemo, useRef, useState } from "react";
import { App, Button, Checkbox, DatePicker, Empty, Input, InputNumber, Modal, Popconfirm, Segmented, Select, Spin, Table, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { CheckCircle2, CircleDashed, FileUp, Link2, Plus, Receipt, Trash2, Unlink, Wand2 } from "lucide-react";
import dayjs from "dayjs";
import { argent, CarteChiffre, dateCourte, fmt, paramsPeriode, Pastille, Section, useRapport } from "../Reports/ReportUi";
import type { Periode } from "../Reports/ReportUi";
import {
  ajouterLigneReleve,
  CATEGORIES_CHARGES,
  chargeDepuisReleve,
  COMPTES_BANCAIRES,
  getRapprochement,
  importerReleve,
  messageErreur,
  rapprocherAuto,
  rapprocherLigne,
  supprimerLigneReleve,
} from "../Charges/chargeService";
import type { CompteBancaire, EtatRapprochement, LigneReleve, OperationCompte } from "../Charges/types";

const Montant: React.FC<{ n: number | null; devise: string }> = ({ n, devise }) =>
  n == null ? <span className="text-slate-400">—</span> : (
    <b className={n < 0 ? "text-red-600" : "text-emerald-700"}>
      {n > 0 ? "+" : ""}
      {argent(n, devise)}
    </b>
  );

const Rapprochement: React.FC<{ periode: Periode; devise: string; onChange: () => void }> = ({ periode, devise, onChange }) => {
  const { message } = App.useApp();
  const fichier = useRef<HTMLInputElement>(null);
  const [compte, setCompte] = useState<CompteBancaire>("521");
  const params = paramsPeriode(periode);
  const { donnees, chargement, recharger } = useRapport<EtatRapprochement>(
    (signal) => getRapprochement(compte, params.debut, params.fin, signal),
    JSON.stringify({ ...params, compte }),
  );
  const [aRapprocher, setARapprocher] = useState<LigneReleve | null>(null);
  const [choix, setChoix] = useState<string[]>([]);
  const [enCharge, setEnCharge] = useState<LigneReleve | null>(null);
  const [categorie, setCategorie] = useState("frais_bancaires");
  const [saisie, setSaisie] = useState<{ ouvert: boolean; date: dayjs.Dayjs; libelle: string; montant: number | null }>({
    ouvert: false,
    date: dayjs(),
    libelle: "",
    montant: null,
  });

  const apres = (texte: string) => {
    message.success(texte);
    recharger();
  };
  const tenter = (fn: () => Promise<unknown>) => fn().catch((err) => message.error(messageErreur(err)));

  const importer = (liste: FileList | null) =>
    liste?.[0] &&
    tenter(async () => {
      const r = await importerReleve(compte, liste[0]);
      apres(`${r.ajoutees} ligne(s) importée(s)${r.doublons ? `, ${r.doublons} déjà présente(s)` : ""}.`);
      if (r.erreurs.length) message.warning(r.erreurs.slice(0, 3).join(" · "));
    }).finally(() => fichier.current && (fichier.current.value = ""));

  const auto = () =>
    tenter(async () => {
      const r = await rapprocherAuto(compte, params.debut, params.fin);
      apres(r.rapprochees ? `${r.rapprochees} ligne(s) rapprochée(s) automatiquement.` : "Aucune correspondance évidente trouvée.");
    });

  const sommeChoix = useMemo(
    () => (donnees?.en_attente || []).filter((o) => choix.includes(o.ref)).reduce((s, o) => s + (o.montant || 0), 0),
    [donnees, choix],
  );

  const candidats = useMemo(() => {
    if (!aRapprocher || !donnees) return [];
    // Les opérations de même sens, les plus proches en montant puis en date d'abord.
    return donnees.en_attente
      .filter((o) => Math.sign(o.montant || 0) === Math.sign(aRapprocher.montant))
      .sort(
        (a, b) =>
          Math.abs((a.montant || 0) - aRapprocher.montant) - Math.abs((b.montant || 0) - aRapprocher.montant) ||
          Math.abs(dayjs(a.date).diff(aRapprocher.date)) - Math.abs(dayjs(b.date).diff(aRapprocher.date)),
      );
  }, [aRapprocher, donnees]);

  const colonnes: ColumnsType<LigneReleve> = [
    { title: "Date", dataIndex: "date", width: 100, render: (d: string) => dateCourte(d) },
    {
      title: "Libellé du relevé",
      key: "libelle",
      render: (_, l) => (
        <div>
          <div className="font-semibold text-slate-800">{l.libelle}</div>
          {l.statut === "rapproche" ? (
            <div className="text-xs text-emerald-700">
              <Link2 size={11} className="mr-1 inline" />
              {l.operations.map((o) => o.libelle).join(" + ")}
            </div>
          ) : (
            l.reference && <div className="text-xs text-slate-400">Réf. {l.reference}</div>
          )}
        </div>
      ),
    },
    { title: "Montant", dataIndex: "montant", align: "right", render: (n: number) => <Montant n={n} devise={devise} /> },
    {
      title: "État",
      dataIndex: "statut",
      width: 120,
      render: (s: LigneReleve["statut"]) =>
        s === "rapproche" ? <Pastille ton="vert">Rapprochée</Pastille> : <Pastille ton="orange">À rapprocher</Pastille>,
    },
    {
      title: "",
      key: "actions",
      align: "right",
      width: 210,
      render: (_, l) =>
        l.statut === "rapproche" ? (
          <Popconfirm title="Annuler ce rapprochement ?" okText="Oui" cancelText="Non" onConfirm={() => tenter(async () => {
            await rapprocherLigne(l.id, []);
            apres("Rapprochement annulé.");
          })}>
            <Button size="small" type="text" icon={<Unlink size={14} />}>
              Défaire
            </Button>
          </Popconfirm>
        ) : (
          <div className="flex justify-end gap-1">
            <Button
              size="small"
              icon={<Link2 size={14} />}
              onClick={() => {
                setChoix([]);
                setARapprocher(l);
              }}
            >
              Rapprocher
            </Button>
            {l.montant < 0 && (
              <Tooltip title="Frais, agios… absents de Lumistock : créer la charge">
                <Button size="small" type="text" icon={<Receipt size={14} />} onClick={() => setEnCharge(l)} />
              </Tooltip>
            )}
            <Popconfirm title="Supprimer cette ligne du relevé ?" okText="Supprimer" cancelText="Annuler" okButtonProps={{ danger: true }}
              onConfirm={() => tenter(async () => {
                await supprimerLigneReleve(l.id);
                apres("Ligne supprimée.");
              })}>
              <Button size="small" type="text" danger icon={<Trash2 size={14} />} />
            </Popconfirm>
          </div>
        ),
    },
  ];

  const t = donnees?.totaux;
  return (
    <Spin spinning={chargement}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Segmented value={compte} onChange={(v) => setCompte(v as CompteBancaire)} options={COMPTES_BANCAIRES} />
        <input ref={fichier} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => importer(e.target.files)} />
        <Tooltip title="Fichier CSV exporté depuis votre banque : colonnes Date, Libellé, Montant (ou Débit et Crédit), Référence.">
          <Button icon={<FileUp size={15} />} onClick={() => fichier.current?.click()}>
            Importer le relevé (CSV)
          </Button>
        </Tooltip>
        <Button icon={<Plus size={15} />} onClick={() => setSaisie({ ouvert: true, date: dayjs(), libelle: "", montant: null })}>
          Saisir une ligne
        </Button>
        <Button type="primary" icon={<Wand2 size={15} />} onClick={auto} disabled={!t?.lignes_non_rapprochees}>
          Rapprocher automatiquement
        </Button>
      </div>

      {t && (
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <CarteChiffre principale libelle="Mouvements du relevé" valeur={argent(t.releve, devise)} detail={`${donnees?.lignes.length || 0} ligne(s)`} icone={<FileUp size={16} />} />
          <CarteChiffre ton="vert" libelle="Rapproché" valeur={argent(t.rapproche, devise)} icone={<CheckCircle2 size={16} />} />
          <CarteChiffre
            ton={t.lignes_non_rapprochees ? "orange" : "gris"}
            libelle="Relevé non expliqué"
            valeur={argent(t.ecart_releve, devise)}
            detail={`${t.lignes_non_rapprochees} ligne(s) à traiter`}
            icone={<CircleDashed size={16} />}
          />
          <CarteChiffre
            ton={donnees?.en_attente.length ? "orange" : "gris"}
            libelle="Absent du relevé"
            valeur={argent(t.ecart_application, devise)}
            detail={`${donnees?.en_attente.length || 0} opération(s) Lumistock`}
            icone={<CircleDashed size={16} />}
          />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[3fr_2fr]">
        <Section titre={`Relevé ${donnees?.libelle?.toLowerCase() || ""}`} note="Importez le relevé puis rapprochez chaque ligne">
          <Table
            rowKey="id"
            size="small"
            columns={colonnes}
            dataSource={donnees?.lignes || []}
            pagination={{ pageSize: 20, hideOnSinglePage: true }}
            scroll={{ x: 760 }}
            locale={{ emptyText: <Empty description="Aucune ligne de relevé sur la période" /> }}
          />
        </Section>
        <Section titre="Dans Lumistock, pas encore sur le relevé" note="Chèques non encaissés, virements en cours, oublis…">
          {donnees?.en_attente.length ? (
            <ul className="m-0 list-none divide-y divide-slate-100 p-0">
              {donnees.en_attente.map((o) => (
                <li key={o.ref} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="min-w-0">
                    <span className="text-slate-400">{dateCourte(o.date)}</span> <span className="text-slate-700">{o.libelle}</span>
                  </span>
                  <Montant n={o.montant} devise={devise} />
                </li>
              ))}
            </ul>
          ) : (
            <Empty description="Tout est rapproché" />
          )}
        </Section>
      </div>

      {/* ------------------------------------------------ rapprochement manuel */}
      <Modal
        title="Rapprocher la ligne du relevé"
        open={!!aRapprocher}
        onCancel={() => setARapprocher(null)}
        okText="Rapprocher"
        cancelText="Annuler"
        okButtonProps={{ disabled: !aRapprocher || Math.abs(sommeChoix - aRapprocher.montant) > 0.01 }}
        onOk={() =>
          aRapprocher &&
          tenter(async () => {
            await rapprocherLigne(aRapprocher.id, choix);
            setARapprocher(null);
            apres("Ligne rapprochée.");
          })
        }
        width={640}
      >
        {aRapprocher && (
          <div>
            <div className="mb-3 flex justify-between rounded-xl bg-purple-50 px-3 py-2 text-sm">
              <span>
                {dateCourte(aRapprocher.date)} · {aRapprocher.libelle}
              </span>
              <Montant n={aRapprocher.montant} devise={devise} />
            </div>
            <p className="mt-0 text-xs text-slate-500">Cochez la ou les opérations Lumistock qui correspondent (le total doit être égal).</p>
            {candidats.length ? (
              <ul className="m-0 max-h-80 list-none space-y-1 overflow-auto p-0">
                {candidats.map((o: OperationCompte) => (
                  <li key={o.ref}>
                    <Checkbox
                      checked={choix.includes(o.ref)}
                      onChange={(e) => setChoix((c) => (e.target.checked ? [...c, o.ref] : c.filter((r) => r !== o.ref)))}
                      className="w-full rounded-lg px-2 py-1 hover:bg-slate-50"
                    >
                      <span className="text-slate-400">{dateCourte(o.date)}</span> {o.libelle} · <Montant n={o.montant} devise={devise} />
                    </Checkbox>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty description="Aucune opération Lumistock de même sens en attente" />
            )}
            <div className={`mt-3 text-right text-sm ${Math.abs(sommeChoix - aRapprocher.montant) > 0.01 ? "text-orange-600" : "text-emerald-700"}`}>
              Sélection : <b>{argent(sommeChoix, devise)}</b> / relevé {argent(aRapprocher.montant, devise)}
            </div>
          </div>
        )}
      </Modal>

      {/* ------------------------------------------------ charge depuis le relevé */}
      <Modal
        title="Créer la charge manquante"
        open={!!enCharge}
        onCancel={() => setEnCharge(null)}
        okText="Créer et rapprocher"
        cancelText="Annuler"
        onOk={() =>
          enCharge &&
          tenter(async () => {
            await chargeDepuisReleve(enCharge.id, categorie, enCharge.libelle);
            setEnCharge(null);
            apres("Charge créée et rapprochée.");
            onChange();
          })
        }
      >
        {enCharge && (
          <div className="space-y-3">
            <p className="m-0 text-sm text-slate-600">
              {dateCourte(enCharge.date)} · {enCharge.libelle} · <b>{argent(-enCharge.montant, devise)}</b>, payée par{" "}
              {compte === "521" ? "la banque" : "mobile money"}.
            </p>
            <Select
              value={categorie}
              onChange={setCategorie}
              showSearch
              optionFilterProp="label"
              options={CATEGORIES_CHARGES.map((c) => ({ value: c.value, label: `${c.compte} · ${c.label}` }))}
              className="w-full"
            />
          </div>
        )}
      </Modal>

      {/* ------------------------------------------------ saisie manuelle */}
      <Modal
        title="Saisir une ligne du relevé"
        open={saisie.ouvert}
        onCancel={() => setSaisie((s) => ({ ...s, ouvert: false }))}
        okText="Ajouter"
        cancelText="Annuler"
        okButtonProps={{ disabled: !saisie.montant || !saisie.libelle.trim() }}
        onOk={() =>
          tenter(async () => {
            await ajouterLigneReleve(compte, { date: saisie.date.format("YYYY-MM-DD"), libelle: saisie.libelle.trim(), montant: saisie.montant || 0 });
            setSaisie((s) => ({ ...s, ouvert: false }));
            apres("Ligne ajoutée.");
          })
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-500">Date</div>
            <DatePicker value={saisie.date} allowClear={false} format="DD/MM/YYYY" onChange={(d) => d && setSaisie((s) => ({ ...s, date: d }))} className="w-full" />
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-500">Montant ({devise}) — négatif pour une sortie</div>
            <InputNumber value={saisie.montant} onChange={(n) => setSaisie((s) => ({ ...s, montant: n }))} className="!w-full" />
          </div>
          <div className="sm:col-span-2">
            <div className="mb-1 text-xs font-semibold text-slate-500">Libellé</div>
            <Input value={saisie.libelle} onChange={(e) => setSaisie((s) => ({ ...s, libelle: e.target.value }))} placeholder="Ex. VIR RECU CLIENT X" />
          </div>
        </div>
        <p className="mb-0 mt-3 text-xs text-slate-400">Montant : {fmt(saisie.montant || 0)}</p>
      </Modal>
    </Spin>
  );
};

export default Rapprochement;

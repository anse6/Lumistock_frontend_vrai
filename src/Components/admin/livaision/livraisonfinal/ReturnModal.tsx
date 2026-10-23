import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ConfigProvider, Input, InputNumber, Modal } from 'antd';
import { getUrlServer } from '../../../../configServer';
import { Minus, Package, Plus, RotateCcw, Undo2 } from 'lucide-react';
import { Order } from './types';
import { appliquerReductions, Reduction } from '../selectionproduct/Clients/reductions';

const { TextArea } = Input;
const PURPLE_950 = '#3b0764';

export interface ProduitRetour {
  produit_id: string;
  quantite: number; // en unités
  is_conditionne: boolean;
  conditionnement_id?: string;
}

interface ReturnModalProps {
  order: Order;
  /** Doit lever une erreur si le serveur refuse : la fenêtre reste alors ouverte. */
  onConfirm: (livraison_id: string, motif: string, produits: ProduitRetour[], retenue_pourcentage: number) => Promise<void>;
  onCancel: () => void;
}

interface Ligne {
  key: string;
  produit_id: string;
  nom: string;
  unite: string;
  prix: number; // prix unitaire
  vendu: number; // unités encore vendues sur cette ligne
  is_conditionne: boolean;
  conditionnement_id?: string;
  conditionnement_nom?: string;
  facteur: number;
  parConditionnement: boolean;
  saisie: number; // valeur saisie (unités ou conditionnements selon le mode)
}

const extraireId = (id: unknown): string => {
  if (typeof id === 'string') return id;
  if (id && typeof id === 'object' && '$oid' in id) return String((id as { $oid: string }).$oid);
  return '';
};

const fmt = (n: number) => `${Math.round(n || 0).toLocaleString('fr-FR')} CFA`;

// Retour d'articles par le client : quantités par ligne, motif, et estimation
// du montant à rembourser (même calcul que le serveur, réductions comprises).
const ReturnModal: React.FC<ReturnModalProps> = ({ order, onConfirm, onCancel }) => {
  const [motif, setMotif] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  // Frais de retour : part de la valeur retournée gardée par le magasin.
  // Pré-rempli avec la politique du magasin (Finance → Clôture et règles), modifiable ici.
  const [retenue, setRetenue] = useState(0);
  const [politique, setPolitique] = useState(0);
  useEffect(() => {
    axios
      .get(`${getUrlServer()}/compta/politique-retour`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      })
      .then((r) => {
        const p = Number(r.data?.retenue_pourcentage) || 0;
        setPolitique(p);
        setRetenue(p);
      })
      .catch(() => undefined);
  }, []);
  const [lignes, setLignes] = useState<Ligne[]>(() =>
    (order.produits || []).map((p, i) => {
      const facteur = Math.max(Number(p.facteur) || 1, 1);
      return {
        key: `${extraireId(p.produit_id)}-${extraireId(p.conditionnement_id) || 'u'}-${i}`,
        produit_id: extraireId(p.produit_id),
        nom: p.nom || `Produit ${i + 1}`,
        unite: p.unite || 'unité',
        prix: Number(p.prix) || 0,
        vendu: Number(p.quantite) || 0,
        is_conditionne: Boolean(p.is_conditionne),
        conditionnement_id: extraireId(p.conditionnement_id) || undefined,
        conditionnement_nom: p.conditionnement_nom,
        facteur,
        parConditionnement: Boolean(p.is_conditionne) && facteur > 1,
        saisie: 0,
      };
    }),
  );

  const unites = (l: Ligne) => (l.parConditionnement ? l.saisie * l.facteur : l.saisie);
  const maxSaisie = (l: Ligne) => (l.parConditionnement ? Math.floor(l.vendu / l.facteur) : l.vendu);

  const changer = (key: string, champs: Partial<Ligne>) =>
    setLignes((prev) => prev.map((l) => (l.key === key ? { ...l, ...champs } : l)));
  const fixerSaisie = (l: Ligne, v: number) => changer(l.key, { saisie: Math.max(0, Math.min(maxSaisie(l), Math.floor(v) || 0)) });

  const estimation = useMemo(() => {
    const valeurBrute = lignes.reduce((s, l) => s + unites(l) * l.prix, 0);
    const brutAvant = Number(order.montant_brut ?? order.montant_produits) || 0;
    const reductions = (order.reductions || []) as Reduction[];
    const netAvant = Number(order.montant_produits) || 0;
    const { total } = appliquerReductions(reductions, Math.max(brutAvant - valeurBrute, 0));
    const netApres = Math.max(brutAvant - valeurBrute - total, 0);
    const dette = Number(order.dette_ancienne) || 0;
    const paye = Number(order.montant_paye) || 0;
    // TVA de la vente au même taux sur le montant retourné.
    const tauxTva = netAvant ? (Number(order.montant_tva) || 0) / netAvant : 0;
    const valeur = Math.max(netAvant - netApres, 0) * (1 + tauxTva);
    const frais = Math.round((valeur * retenue) / 100);
    const fraisAnterieurs = Number(order.frais_retour) || 0;
    const nouveauTotal = netApres * (1 + tauxTva) + dette + fraisAnterieurs + frais;
    return {
      unites: lignes.reduce((s, l) => s + unites(l), 0),
      valeur,
      frais,
      aRembourser: Math.max(paye - nouveauTotal, 0),
      nouveauTotal,
    };
  }, [lignes, order, retenue]);

  const peutValider = motif.trim().length > 0 && estimation.unites > 0 && !envoi;

  const valider = async () => {
    if (!peutValider) return;
    setEnvoi(true);
    setErreur(null);
    try {
      await onConfirm(
        order.id,
        motif.trim(),
        lignes
          .filter((l) => unites(l) > 0)
          .map((l) => ({
            produit_id: l.produit_id,
            quantite: unites(l),
            is_conditionne: l.is_conditionne,
            ...(l.is_conditionne && l.conditionnement_id ? { conditionnement_id: l.conditionnement_id } : {}),
          })),
        retenue,
      );
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Le retour n'a pas pu être enregistré.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <ConfigProvider theme={{ token: { colorPrimary: PURPLE_950, borderRadius: 10 } }}>
      <Modal
        open
        onCancel={onCancel}
        width={640}
        centered
        footer={null}
        title={
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-950 text-white">
              <RotateCcw size={18} />
            </span>
            <div>
              <div className="text-base font-bold text-purple-950">Retour d'articles</div>
              <div className="text-xs font-normal text-slate-500">
                {order.clientName || order.client?.nom} · Vente #{order.id.slice(0, 8).toUpperCase()}
              </div>
            </div>
          </div>
        }
      >
        <div className="space-y-4 pt-2">
          {/* Lignes de la vente */}
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Articles à retourner</div>
            <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
              {lignes.map((l) => {
                const u = unites(l);
                return (
                  <div
                    key={l.key}
                    className={`rounded-xl border p-3 transition ${u > 0 ? 'border-purple-300 bg-purple-50/50' : 'border-slate-200 bg-white'}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-800">{l.nom}</div>
                        <div className="text-xs text-slate-500">
                          {l.vendu} {l.unite}(s) vendu(s) · {fmt(l.prix)} / {l.unite}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center overflow-hidden rounded-lg border border-slate-200">
                          <button
                            type="button"
                            onClick={() => fixerSaisie(l, l.saisie - 1)}
                            disabled={l.saisie <= 0 || envoi}
                            className="flex h-8 w-8 items-center justify-center bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-40"
                            aria-label="Diminuer"
                          >
                            <Minus size={14} />
                          </button>
                          <InputNumber
                            min={0}
                            max={maxSaisie(l)}
                            value={l.saisie}
                            onChange={(v) => fixerSaisie(l, Number(v) || 0)}
                            controls={false}
                            variant="borderless"
                            className="w-14 text-center"
                            disabled={envoi}
                            aria-label={`Quantité retournée de ${l.nom}`}
                          />
                          <button
                            type="button"
                            onClick={() => fixerSaisie(l, l.saisie + 1)}
                            disabled={l.saisie >= maxSaisie(l) || envoi}
                            className="flex h-8 w-8 items-center justify-center bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40"
                            aria-label="Augmenter"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <span className="w-20 text-right text-xs text-slate-500">
                          max {maxSaisie(l)} {l.parConditionnement ? (l.conditionnement_nom || 'cond.').toLowerCase() : l.unite}
                        </span>
                      </div>
                    </div>
                    {l.is_conditionne && l.facteur > 1 && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <Package size={13} className="text-purple-950" />
                        <span className="text-slate-500">Retourner par :</span>
                        {[true, false].map((parCond) => (
                          <button
                            key={String(parCond)}
                            type="button"
                            onClick={() => changer(l.key, { parConditionnement: parCond, saisie: 0 })}
                            className={`rounded-full px-2.5 py-0.5 font-semibold transition ${
                              l.parConditionnement === parCond
                                ? 'bg-purple-950 text-white'
                                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-purple-50'
                            }`}
                          >
                            {parCond ? `${l.conditionnement_nom || 'Conditionnement'} (× ${l.facteur})` : l.unite}
                          </button>
                        ))}
                        {u > 0 && l.parConditionnement && <span className="text-slate-500">= {u} {l.unite}(s)</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Motif */}
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Motif du retour <span className="text-red-500">*</span>
            </span>
            <TextArea
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder="Ex. : produit défectueux, erreur de commande…"
              disabled={envoi}
            />
          </label>

          {/* Frais de retour */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Frais de retour retenus</div>
              <div className="text-[11px] text-slate-400">
                {politique ? `Politique du magasin : ${politique} %` : 'Par défaut, remboursement intégral'}
                {estimation.frais > 0 && ` · ${fmt(estimation.frais)} gardés`}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {retenue !== 0 && (
                <button
                  type="button"
                  onClick={() => setRetenue(0)}
                  disabled={envoi}
                  className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-purple-50"
                >
                  Ne pas retenir
                </button>
              )}
              <InputNumber
                min={0}
                max={100}
                step={0.5}
                value={retenue}
                onChange={(v) => setRetenue(Math.min(100, Math.max(0, Number(v) || 0)))}
                addonAfter="%"
                className="w-28"
                disabled={envoi}
                aria-label="Frais de retour en pourcentage"
              />
            </div>
          </div>

          {/* Estimation */}
          <div className="rounded-xl bg-purple-950 p-4 text-white">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-purple-200">Unités</div>
                <div className="text-lg font-extrabold">{estimation.unites}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-purple-200">Valeur retournée</div>
                <div className="text-lg font-extrabold">{fmt(estimation.valeur)}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-purple-200">À rembourser</div>
                <div className={`text-lg font-extrabold ${estimation.aRembourser > 0 ? 'text-emerald-300' : ''}`}>
                  {fmt(estimation.aRembourser)}
                </div>
              </div>
            </div>
            <p className="mt-3 border-t border-white/10 pt-2 text-center text-[11px] text-purple-200">
              {estimation.unites === 0
                ? 'Choisissez les quantités retournées. Le stock sera réintégré automatiquement.'
                : estimation.aRembourser > 0
                  ? `Le client a payé plus que le nouveau total : le montant sera à rembourser (bouton « Rembourser »)${estimation.frais > 0 ? `, frais de retour de ${fmt(estimation.frais)} déduits` : ''}.`
                  : `Nouveau total de la vente : ${fmt(estimation.nouveauTotal)}. Rien à rendre, la dette du client baisse.`}
            </p>
          </div>

          {erreur && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={envoi}
              className="rounded-xl border border-purple-200 px-4 py-2.5 text-sm font-semibold text-purple-950 hover:bg-purple-50 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={valider}
              disabled={!peutValider}
              className="flex items-center gap-2 rounded-xl bg-purple-950 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-purple-950/20 hover:bg-purple-900 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              {envoi ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Undo2 size={16} />
              )}
              Enregistrer le retour
            </button>
          </div>
        </div>
      </Modal>
    </ConfigProvider>
  );
};

export default ReturnModal;

import React, { useState } from 'react';
import axios from 'axios';
import { ConfigProvider, Input, Modal } from 'antd';
import { Ban, Check, PackageCheck, RotateCcw, Wallet } from 'lucide-react';
import { Order } from './types';
import { MODES, ModeRemboursement } from './RefundModal';
import TelephoneInternational, {
  decouperNumero,
  numeroInternational,
  numeroValide,
} from './TelephoneInternational';
import { apiVente } from '../venteRole';

const PURPLE_950 = '#3b0764';
const AVEC_REFERENCE: ModeRemboursement[] = ['om', 'momo', 'bancaire'];
const AVEC_TELEPHONE: ModeRemboursement[] = ['om', 'momo'];

const fmt = (n: number) => `${Math.round(n || 0).toLocaleString('fr-FR')} CFA`;

// Message du serveur ({ error } ou { error: { champ: [...] } }) ou texte par défaut.
const messageServeur = (error: unknown, defaut: string): string => {
  const data = axios.isAxiosError(error) ? error.response?.data : undefined;
  const detail = data?.error ?? data?.message;
  if (typeof detail === 'string') return detail;
  if (detail && typeof detail === 'object') return Object.values(detail).flat().join(' ');
  return defaut;
};

/** Argent à rendre si la vente est annulée : même calcul que le serveur. */
export const montantARendre = (order: Order) =>
  Math.max((Number(order.montant_paye) || 0) - (Number(order.montant_deduit_caisse) || 0), 0) +
  (Number(order.retour) || 0);

interface CancelDeliveryModalProps {
  order: Order;
  onCancel: () => void;
  /** Appelé après l'annulation, avec le message du serveur. */
  onCancelled: (orderId: string, message: string) => void;
}

// Annulation d'une vente : articles remis en stock, argent rendu ou crédité au client.
const CancelDeliveryModal: React.FC<CancelDeliveryModalProps> = ({ order, onCancel, onCancelled }) => {
  const aRendre = montantARendre(order);
  const creditRestitue = Number(order.montant_deduit_caisse) || 0;
  const clientDePassage = !order.client?.nom || order.client.nom.toLowerCase() === 'autres';

  const [mode, setMode] = useState<ModeRemboursement>('especes');
  const [reference, setReference] = useState('');
  const [telephone, setTelephone] = useState(() => {
    const n = decouperNumero(order.client?.telephone || '');
    return numeroValide(n.pays, n.chiffres) ? n : { pays: n.pays, chiffres: '' };
  });
  const [motif, setMotif] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const besoinReference = aRendre > 0 && AVEC_REFERENCE.includes(mode);
  const besoinTelephone = aRendre > 0 && AVEC_TELEPHONE.includes(mode);
  const formulaireValide =
    (!besoinReference || reference.trim().length > 0) &&
    (!besoinTelephone || numeroValide(telephone.pays, telephone.chiffres));

  const confirmer = async () => {
    if (!formulaireValide || envoi) return;
    setEnvoi(true);
    setErreur(null);
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.delete(apiVente().annuler(order.id), {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: {
          mode,
          motif: motif.trim(),
          ...(besoinReference ? { reference: reference.trim() } : {}),
          ...(besoinTelephone ? { telephone: numeroInternational(telephone.pays, telephone.chiffres) } : {}),
        },
      });
      onCancelled(order.id, response.data?.message || 'Vente annulée');
    } catch (e) {
      setErreur(messageServeur(e, "La vente n'a pas pu être annulée."));
    } finally {
      setEnvoi(false);
    }
  };

  // Les lignes déjà entièrement retournées (quantité 0) ne reviennent pas en stock.
  const produits = (order.produits || []).filter((p) => (Number(p.quantite) || 0) > 0);

  return (
    <ConfigProvider theme={{ token: { colorPrimary: PURPLE_950, borderRadius: 10 } }}>
      <Modal
        open
        onCancel={envoi ? undefined : onCancel}
        width={580}
        centered
        footer={null}
        title={
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white">
              <Ban size={18} />
            </span>
            <div>
              <div className="text-base font-bold text-purple-950">Annuler la vente</div>
              <div className="text-xs font-normal text-slate-500">
                {order.clientName || order.client?.nom} · Vente #{order.id.slice(0, 8).toUpperCase()} · {fmt(order.montant_total)}
              </div>
            </div>
          </div>
        }
      >
        <div className="space-y-4 pt-2">
          {/* Stock */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-emerald-800">
              <PackageCheck size={16} /> Ces articles reviennent en stock
            </div>
            {produits.length === 0 ? (
              <p className="text-xs text-slate-500">Aucun article restant (déjà tous retournés).</p>
            ) : (
              <ul className="max-h-36 space-y-1 overflow-y-auto pr-1 text-sm">
                {produits.map((p, i) => {
                  const q = Number(p.quantite) || 0;
                  const facteur = Number(p.facteur) || 0;
                  return (
                    <li key={`${p.produit_id}-${i}`} className="flex items-center justify-between gap-3">
                      <span className="truncate text-slate-700">{p.nom || p.name}</span>
                      <span className="shrink-0 font-semibold text-emerald-700">
                        + {q.toLocaleString('fr-FR')} unité{q > 1 ? 's' : ''}
                        {p.is_conditionne && facteur > 1 && (
                          <span className="font-normal text-slate-500">
                            {' '}
                            ({(q / facteur).toLocaleString('fr-FR')} × {p.conditionnement_nom || 'carton'} de {facteur})
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Argent */}
          {creditRestitue > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-purple-50 px-3 py-2 text-sm">
              <span className="flex items-center gap-2 font-semibold text-purple-950">
                <Wallet size={15} /> Crédit du compte client restitué
              </span>
              <span className="font-bold text-purple-950">{fmt(creditRestitue)}</span>
            </div>
          )}

          {aRendre > 0 ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-purple-950 p-4 text-white">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-purple-200">
                  Argent à rendre au client
                </div>
                <div className="text-2xl font-extrabold">{fmt(aRendre)}</div>
                <div className="mt-1 text-xs text-purple-200">
                  Ce que le client a payé{(Number(order.retour) || 0) > 0 ? ', plus le trop-perçu du retour non encore remboursé' : ''}.
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Comment le rendre ?</div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {MODES.map((m) => {
                    const actif = mode === m.value;
                    const desactive = m.value === 'credit_client' && clientDePassage;
                    return (
                      <button
                        key={m.value}
                        type="button"
                        title={desactive ? 'Indisponible pour le client de passage' : m.aide}
                        disabled={desactive || envoi}
                        onClick={() => setMode(m.value)}
                        className={`relative flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                          actif
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300'
                        }`}
                      >
                        {m.icone}
                        <span className="truncate">{m.label}</span>
                        {actif && (
                          <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white">
                            <Check size={10} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-xs text-slate-500">{MODES.find((m) => m.value === mode)?.aide}</p>
              </div>

              {besoinTelephone && (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Numéro qui reçoit <span className="text-red-500">*</span>
                  </span>
                  <TelephoneInternational
                    pays={telephone.pays}
                    chiffres={telephone.chiffres}
                    onChange={(pays, chiffres) => setTelephone({ pays, chiffres })}
                    disabled={envoi}
                  />
                </label>
              )}
              {besoinReference && (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    {mode === 'bancaire' ? 'Référence du virement' : 'ID de transaction'} <span className="text-red-500">*</span>
                  </span>
                  <Input
                    size="large"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    maxLength={100}
                    placeholder={mode === 'bancaire' ? 'Ex. : VIR-2026-0042' : 'Ex. : MP261015.1234.A12345'}
                    disabled={envoi}
                  />
                </label>
              )}
            </div>
          ) : (
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
              Le client n'a rien payé : aucun argent à lui rendre.
            </div>
          )}

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Motif de l'annulation (facultatif)
            </span>
            <Input
              size="large"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              maxLength={200}
              placeholder="Ex. : erreur de saisie, commande annulée par le client"
              disabled={envoi}
            />
          </label>

          <p className="flex items-start gap-2 text-xs text-slate-500">
            <RotateCcw size={14} className="mt-0.5 shrink-0" />
            La vente part dans la corbeille : elle peut être restaurée, ce qui reprend les articles du stock
            {aRendre > 0 && mode === 'credit_client' ? ' et le crédit versé au client' : ''}.
          </p>

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
              Garder la vente
            </button>
            <button
              type="button"
              onClick={confirmer}
              disabled={!formulaireValide || envoi}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-red-600/20 hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              {envoi ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Ban size={16} />
              )}
              Annuler la vente
            </button>
          </div>
        </div>
      </Modal>
    </ConfigProvider>
  );
};

export default CancelDeliveryModal;

import React, { useState } from 'react';
import { ConfigProvider, Input, InputNumber, Modal } from 'antd';
import { Banknote, Check, CheckCircle2, HandCoins, Landmark, Smartphone, Wallet } from 'lucide-react';
import { Order } from './types';
import RefundReceiptButtons from './RefundReceiptButtons';
import type { Remboursement } from './refundReceiptPdf';
import TelephoneInternational, { decouperNumero, numeroInternational, numeroValide } from './TelephoneInternational';

const PURPLE_950 = '#3b0764';

export type ModeRemboursement = 'especes' | 'om' | 'momo' | 'bancaire' | 'credit_client';

interface RefundModalProps {
  order: Order;
  /**
   * Doit lever une erreur si le serveur refuse : la fenêtre reste alors ouverte.
   * Renvoie la vente à jour et le remboursement enregistré (pour le reçu).
   */
  onConfirm: (
    livraisonId: string,
    data: { mode: ModeRemboursement; montant: number; motif: string; reference?: string; telephone?: string },
  ) => Promise<{ order: Order; remboursement: Remboursement } | void>;
  onCancel: () => void;
}

export const MODES: { value: ModeRemboursement; label: string; aide: string; icone: React.ReactNode }[] = [
  { value: 'especes', label: 'Espèces', aide: "L'argent est rendu en main propre", icone: <Banknote size={16} /> },
  { value: 'om', label: 'Orange Money', aide: 'Renvoyé par Orange Money', icone: <Smartphone size={16} /> },
  { value: 'momo', label: 'MTN MoMo', aide: 'Renvoyé par MTN Mobile Money', icone: <Smartphone size={16} /> },
  { value: 'bancaire', label: 'Virement', aide: 'Virement bancaire', icone: <Landmark size={16} /> },
  {
    value: 'credit_client',
    label: 'Compte client',
    aide: 'Crédité sur le compte du client, utilisable sur ses prochains achats',
    icone: <Wallet size={16} />,
  },
];

// Modes où l'argent part par un canal traçable : la référence de la transaction est exigée.
const AVEC_REFERENCE: ModeRemboursement[] = ['om', 'momo', 'bancaire'];
const AVEC_TELEPHONE: ModeRemboursement[] = ['om', 'momo'];

const fmt = (n: number) => `${Math.round(n || 0).toLocaleString('fr-FR')} CFA`;

// Remboursement du trop-perçu né d'un retour (tout ou partie).
const RefundModal: React.FC<RefundModalProps> = ({ order, onConfirm, onCancel }) => {
  const du = Number(order.retour) || 0;
  const [mode, setMode] = useState<ModeRemboursement>('especes');
  const [montant, setMontant] = useState<number>(du);
  const [motif, setMotif] = useState('');
  const [reference, setReference] = useState('');
  // Pré-rempli avec le numéro du client s'il est valide ; pays par défaut : Cameroun.
  const [telephone, setTelephone] = useState(() => {
    const n = decouperNumero(order.client?.telephone || '');
    return numeroValide(n.pays, n.chiffres) ? n : { pays: n.pays, chiffres: '' };
  });
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [termine, setTermine] = useState<{ order: Order; remboursement: Remboursement } | null>(null);

  const clientDePassage = !order.client?.nom || order.client.nom.toLowerCase() === 'autres';
  const montantValide = montant > 0 && montant <= du;
  const restant = Math.max(du - (montant || 0), 0);
  const besoinReference = AVEC_REFERENCE.includes(mode);
  const besoinTelephone = AVEC_TELEPHONE.includes(mode);
  const referenceValide = !besoinReference || reference.trim().length > 0;
  const telephoneValide = !besoinTelephone || numeroValide(telephone.pays, telephone.chiffres);
  const formulaireValide = montantValide && referenceValide && telephoneValide;

  const valider = async () => {
    if (!formulaireValide || envoi) return;
    setEnvoi(true);
    setErreur(null);
    try {
      const resultat = await onConfirm(order.livraison_id || order.id, {
        mode,
        montant,
        motif: motif.trim(),
        ...(besoinReference ? { reference: reference.trim() } : {}),
        ...(besoinTelephone ? { telephone: numeroInternational(telephone.pays, telephone.chiffres) } : {}),
      });
      if (resultat) setTermine(resultat);
      else onCancel();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Le remboursement n'a pas pu être enregistré.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <ConfigProvider theme={{ token: { colorPrimary: PURPLE_950, borderRadius: 10 } }}>
      <Modal
        open
        onCancel={onCancel}
        width={560}
        centered
        footer={null}
        title={
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-950 text-white">
              <HandCoins size={18} />
            </span>
            <div>
              <div className="text-base font-bold text-purple-950">Rembourser le client</div>
              <div className="text-xs font-normal text-slate-500">
                {order.clientName || order.client?.nom} · Vente #{order.id.slice(0, 8).toUpperCase()}
              </div>
            </div>
          </div>
        }
      >
        {termine ? (
          <div className="space-y-4 pt-2">
            <div className="flex flex-col items-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-5 text-center">
              <CheckCircle2 size={40} className="text-emerald-600" />
              <div className="mt-2 text-lg font-extrabold text-emerald-800">
                {fmt(termine.remboursement.montant)} remboursés
              </div>
              <div className="mt-0.5 text-sm text-emerald-700">
                {termine.remboursement.mode_libelle || termine.remboursement.mode}
                {termine.remboursement.reference ? ` · Réf. ${termine.remboursement.reference}` : ''}
              </div>
              <div className="mt-2 text-xs text-slate-600">
                {(Number(termine.order.retour) || 0) > 0
                  ? `Il reste ${fmt(Number(termine.order.retour))} à rembourser au client.`
                  : 'Le client est entièrement remboursé.'}
              </div>
            </div>
            <p className="text-center text-xs text-slate-500">Remettez un reçu au client comme preuve du remboursement.</p>
            <RefundReceiptButtons order={termine.order} remboursement={termine.remboursement} onError={setErreur} />
            {erreur && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</div>
            )}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-xl border border-purple-200 px-4 py-2.5 text-sm font-semibold text-purple-950 hover:bg-purple-50"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
        <div className="space-y-4 pt-2">
          <div className="rounded-xl bg-purple-950 p-4 text-white">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-purple-200">Dû au client après retour</div>
            <div className="text-2xl font-extrabold">{fmt(du)}</div>
            <div className="mt-1 text-xs text-purple-200">Trop-perçu : le client avait payé plus que le total après retour.</div>
          </div>

          {/* Mode */}
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Mode de remboursement</div>
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

          {/* Montant */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Montant remboursé</span>
              {montant !== du && (
                <button type="button" onClick={() => setMontant(du)} className="text-xs font-semibold text-purple-950 hover:underline">
                  Tout rembourser
                </button>
              )}
            </div>
            <InputNumber
              className="w-full"
              size="large"
              min={0}
              max={du}
              value={montant}
              onChange={(v) => setMontant(Number(v) || 0)}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
              parser={(v) => Number((v || '').replace(/\s|CFA/g, '')) as unknown as number}
              addonAfter="CFA"
              disabled={envoi}
              status={montantValide ? undefined : 'error'}
            />
            <p className={`mt-1 text-xs ${montantValide ? 'text-slate-500' : 'text-red-600'}`}>
              {!montantValide
                ? `Le montant doit être compris entre 1 et ${fmt(du)}.`
                : restant > 0
                  ? `Remboursement partiel : il restera ${fmt(restant)} à rembourser.`
                  : 'Remboursement complet.'}
            </p>
          </div>

          {/* Preuve de l'envoi : Orange Money, MoMo, virement */}
          {besoinReference && (
            <div className="grid gap-3">
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
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  {mode === 'bancaire' ? 'Référence du virement' : 'ID de transaction'} <span className="text-red-500">*</span>
                </span>
                <Input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  maxLength={100}
                  placeholder={mode === 'bancaire' ? 'Ex. : VIR-2026-0042' : 'Ex. : MP261015.1234.A12345'}
                  disabled={envoi}
                />
              </label>
              <p className="-mt-1 text-xs text-slate-500">
                Obligatoire : c'est la preuve que l'argent a bien été envoyé au client.
              </p>
            </div>
          )}

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Note (facultatif)</span>
            <Input
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              maxLength={200}
              placeholder="Ex. : remis en caisse par Jean"
              disabled={envoi}
            />
          </label>

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
              disabled={!formulaireValide || envoi}
              className="flex items-center gap-2 rounded-xl bg-purple-950 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-purple-950/20 hover:bg-purple-900 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              {envoi ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <HandCoins size={16} />
              )}
              Rembourser {montantValide ? fmt(montant) : ''}
            </button>
          </div>
        </div>
        )}
      </Modal>
    </ConfigProvider>
  );
};

export default RefundModal;

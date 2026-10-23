import React, { useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { Order } from './types';
import { generateRefundReceiptPdf, Remboursement } from './refundReceiptPdf';
import type { InvoiceMode } from './deliveryInvoicePdf';

interface RefundReceiptButtonsProps {
  order: Order;
  remboursement: Remboursement;
  /** « compact » : boutons icônes (listes) ; sinon boutons pleins avec libellé. */
  compact?: boolean;
  onError?: (message: string) => void;
}

// Boutons Imprimer / Télécharger le reçu d'un remboursement.
const RefundReceiptButtons: React.FC<RefundReceiptButtonsProps> = ({ order, remboursement, compact, onError }) => {
  const [enCours, setEnCours] = useState<InvoiceMode | null>(null);

  const lancer = async (mode: InvoiceMode) => {
    if (enCours) return;
    setEnCours(mode);
    try {
      await generateRefundReceiptPdf(order, remboursement, mode);
    } catch (e) {
      console.error('Reçu de remboursement :', e);
      onError?.("Le reçu n'a pas pu être généré.");
    } finally {
      setEnCours(null);
    }
  };

  const spinner = <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          title="Imprimer le reçu"
          onClick={() => lancer('print')}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-200 text-purple-950 hover:bg-purple-50"
        >
          {enCours === 'print' ? spinner : <Printer size={15} />}
        </button>
        <button
          type="button"
          title="Télécharger le reçu (PDF)"
          onClick={() => lancer('download')}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white hover:opacity-90"
          style={{ backgroundColor: '#3b0764' }}
        >
          {enCours === 'download' ? spinner : <Download size={15} />}
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => lancer('print')}
        className="flex items-center justify-center gap-2 rounded-xl border border-purple-200 px-4 py-2.5 text-sm font-semibold text-purple-950 hover:bg-purple-50"
      >
        {enCours === 'print' ? spinner : <Printer size={16} />}
        Imprimer le reçu
      </button>
      <button
        type="button"
        onClick={() => lancer('download')}
        className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-purple-950/20 hover:opacity-90"
        style={{ backgroundColor: '#3b0764' }}
      >
        {enCours === 'download' ? spinner : <Download size={16} />}
        Télécharger le PDF
      </button>
    </div>
  );
};

export default RefundReceiptButtons;

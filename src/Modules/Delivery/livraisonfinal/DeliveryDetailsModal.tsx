import React from 'react';
import AbandonReste from '../../../Components/Client/AbandonReste';
import { etatVente } from '../../../services/ventes';
import { Drawer, Descriptions, Badge, Tag, Space, Button, Card, Typography } from 'antd';
import { Order } from './types';
import { useTranslation } from 'react-i18next';
import {
  X, Phone, MapPin, Truck, User, Package, Printer,
  Calendar, Receipt, FileText
} from 'lucide-react';

const { Text } = Typography;

interface DeliveryDetailsModalProps {
  order: Order | null;
  onClose: () => void;
  /** Appelé après une action qui modifie la vente (demande d'abandon…). */
  onChanged?: () => void;
}

const DeliveryDetailsModal: React.FC<DeliveryDetailsModalProps> = ({ order, onClose, onChanged }) => {
  const { t } = useTranslation();
  if (!order) return null;

  const handlePrint = () => {
    const storeName = localStorage.getItem('denomination_magasin') || 'LUMISTOCK';
    const storeLogo = localStorage.getItem('logo_magasin');
    const storeEmail = localStorage.getItem('email') || '';

    // Constructing a professional supermarket-style invoice
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Facture #${order.id.slice(0, 8).toUpperCase()}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Inter', sans-serif; padding: 0.5cm; color: #1e293b; line-height: 1.3; font-size: 0.85rem; background: #fff; }
            
            /* Compact Container */
            .invoice-wrap { max-width: 10.5cm; margin: 0 auto; }
            
            /* Professional Side-by-Side Header */
            .header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px dashed #cbd5e1; }
            .logo { height: 50px; width: 50px; object-fit: contain; border-radius: 8px; }
            .store-details { flex: 1; }
            .store-name { font-size: 1.25rem; font-weight: 800; text-transform: uppercase; color: #0f172a; line-height: 1.1; }
            .store-info { font-size: 0.75rem; color: #64748b; margin-top: 0.2rem; }
            
            .invoice-meta { display: flex; justify-content: space-between; margin-bottom: 1.5rem; }
            .meta-item .label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; color: #94a3b8; }
            .meta-item .value { font-size: 0.85rem; font-weight: 700; color: #0f172a; }
            
            .client-section { background: #f8fafc; padding: 0.75rem; border-radius: 8px; margin-bottom: 1.25rem; border: 1px solid #e2e8f0; }
            .section-title { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: #475569; margin-bottom: 0.5rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.2rem; }
            .client-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
            .client-grid div { display: flex; flex-direction: column; }
            .client-grid strong { font-size: 0.65rem; color: #94a3b8; }
            
            .product-table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; }
            .product-table th { text-align: left; background: #f1f5f9; padding: 0.5rem; font-size: 0.65rem; text-transform: uppercase; font-weight: 800; color: #475569; }
            .product-table td { padding: 0.6rem 0.5rem; border-bottom: 1px solid #f1f5f9; }
            .product-table .item-name { font-weight: 700; font-size: 0.8rem; color: #0f172a; }
            .product-table .item-sub { font-size: 0.65rem; color: #94a3b8; margin-top: 0.1rem; }
            .product-table .price { text-align: right; font-family: 'Inter', monospace; font-weight: 600; font-size: 0.8rem; }
            
            .notes { font-size: 0.75rem; color: #64748b; font-style: italic; margin-bottom: 1.5rem; padding: 0.5rem; border-left: 2px solid #e2e8f0; }
            
            .totals-box { background: #0f172a; color: white; padding: 1rem; border-radius: 12px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 0.4rem; font-size: 0.75rem; opacity: 0.85; }
            .total-final { border-top: 1px solid rgba(255, 255, 255, 0.15); padding-top: 0.75rem; margin-top: 0.75rem; font-size: 1.1rem; font-weight: 800; display: flex; justify-content: space-between; align-items: center; }
            .total-final .label { font-size: 0.65rem; opacity: 0.7; }
            
            .stamp { position: absolute; top: 50%; right: 10%; width: 90px; height: 90px; border: 4px solid #fca5a5; color: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; transform: rotate(-20deg); text-transform: uppercase; font-weight: 900; opacity: 0.3; z-index: 10; font-size: 1.2rem; pointer-events: none; }
            .receipt-footer { text-align: center; margin-top: 2rem; font-size: 0.65rem; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 1rem; }

            @media print {
              body { padding: 0.2cm; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-wrap">
            <div class="header">
              ${storeLogo ? `<img src="${storeLogo}" class="logo" />` : ''}
              <div class="store-details">
                <div class="store-name">${storeName}</div>
                <div class="store-info">Email: ${storeEmail} | Plateforme Lumistock</div>
              </div>
            </div>
            
            <div class="invoice-meta">
              <div class="meta-item">
                <div class="label">${t('delivery.detailsModal.printInvoiceNum')}</div>
                <div class="value">FAC-${order.id.slice(0, 8).toUpperCase()}</div>
              </div>
              <div class="meta-item">
                <div class="label">${t('delivery.detailsModal.printDate')}</div>
                <div class="value">${new Date(order.date_commande ?? '').toLocaleDateString('fr-FR')}</div>
              </div>
            </div>
            
            <div class="client-section">
              <div class="section-title">${t('delivery.detailsModal.printClientDesc')}</div>
              <div class="client-grid">
                <div><strong>${t('delivery.detailsModal.printRecipient')}</strong> ${order.client?.nom || t('delivery.detailsModal.notProvided')}</div>
                <div><strong>${t('delivery.detailsModal.printPhone')}</strong> ${order.client?.telephone || t('delivery.detailsModal.notProvided')}</div>
                <div><strong>${t('delivery.detailsModal.printAddress')}</strong> ${order.client?.quartier || t('delivery.detailsModal.notProvided')}</div>
                <div><strong>${t('delivery.detailsModal.printStatus')}</strong> ${etatVente(order.etat).libelle.toUpperCase()}</div>
              </div>
            </div>
            
            <table class="product-table">
              <thead>
                <tr>
                  <th>${t('delivery.detailsModal.printItem')}</th>
                  <th style="text-align: center;">${t('delivery.detailsModal.printQty')}</th>
                  <th style="text-align: right;">${t('delivery.detailsModal.printTotal')}</th>
                </tr>
              </thead>
              <tbody>
                ${order.produits?.map(p => `
                  <tr>
                    <td>
                      <div class="item-name">${p.nom}</div>
                      <div class="item-sub">${p.prix.toLocaleString()} F / ${t('delivery.detailsModal.printUnit')}</div>
                    </td>
                    <td style="text-align: center; font-weight: 700;">${p.quantite}</td>
                    <td class="price">${(p.prix * p.quantite).toLocaleString()} F</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            ${order.notes ? `
              <div class="notes">
                <div style="font-weight: 700; color: #0f172a; margin-bottom: 0.2rem; text-transform: uppercase; font-size: 0.6rem;">${t('delivery.detailsModal.printNote')}</div>
                ${order.notes}
              </div>
            ` : ''}
            
            <div class="totals-box">
              <div class="total-row"><span>${t('delivery.detailsModal.printSubtotal')}</span> <span>${order.montant_total.toLocaleString()} F</span></div>
              <div class="total-row" style="color: #fbbf24; opacity: 1;"><span>${t('delivery.detailsModal.printDiscount')}</span> <span>-${order.ristourne.toLocaleString()} F</span></div>
              <div class="total-row"><span>${t('delivery.detailsModal.printAlreadyPaid')}</span> <span style="color: #34d399;">-${order.montant_paye.toLocaleString()} F</span></div>
              <div class="total-final">
                <div class="label">${t('delivery.detailsModal.printRemaining')}</div>
                <div>${order.montant_restant.toLocaleString()} F</div>
              </div>
            </div>
            
            ${order.statut_paiement === 'payé' ? `<div class="stamp">${t('delivery.detailsModal.printPaid')}</div>` : ''}
            
            <div class="receipt-footer">
              ${t('delivery.detailsModal.printFooter1')}<br/>
              ${t('delivery.detailsModal.printFooter2')}
            </div>
          </div>
          
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Drawer
      title={
        <div className="flex items-center justify-between w-full pr-8">
          <Space size="middle">
            <div className="bg-[#0F172A] p-2 rounded-lg text-white">
              <Truck size={20} />
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">{t('delivery.detailsModal.title')}</div>
              <div className="text-lg font-bold text-[#0F172A]">#{order.id.slice(0, 8).toUpperCase()}</div>
            </div>
          </Space>
          <Space>
            <Tag color={etatVente(order.etat).couleur} className="px-3 py-1 font-bold uppercase text-[10px]">
              {etatVente(order.etat).libelle}
            </Tag>
            <Button
              type="primary"
              icon={<Printer size={16} />}
              onClick={handlePrint}
              className="bg-[#0F172A] hover:bg-[#1E293B] border-none shadow-md font-bold"
            >
              {t('delivery.detailsModal.print')}
            </Button>
          </Space>
        </div>
      }
      placement="right"
      onClose={onClose}
      open={!!order}
      width={700}
      extra={
        <Button
          type="text"
          icon={<X size={20} />}
          onClick={onClose}
          className="text-gray-400 hover:text-red-500 transition-colors"
        />
      }
      headerStyle={{ borderBottom: '1px solid #f1f5f9', padding: '16px 24px' }}
      bodyStyle={{ padding: '24px', backgroundColor: '#f8fafc' }}
      closeIcon={null}
    >
      <div className="space-y-6">
        {/* Section Client */}
        <Card className="shadow-sm border-none overflow-hidden">
          <div className="flex items-center gap-2 mb-4 text-[#0F172A] font-bold">
            <User size={18} />
            <span>{t('delivery.detailsModal.clientInfo')}</span>
          </div>
          <Descriptions column={2} bordered size="small" className="bg-white">
            <Descriptions.Item label={t('delivery.detailsModal.name')} span={2}>
              <Text strong className="text-slate-900">{order.client?.nom}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('delivery.detailsModal.phone')}>
              <Space>
                <Phone size={14} className="text-slate-400" />
                <Text>{order.client?.telephone || t('delivery.detailsModal.notProvided')}</Text>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label={t('delivery.detailsModal.email')}>
              <Text>{order.client?.email || t('delivery.detailsModal.notProvided')}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('delivery.detailsModal.city')} span={1}>
              <Text>{order.client?.ville || t('delivery.detailsModal.notProvided')}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('delivery.detailsModal.neighborhood')} span={1}>
              <Space>
                <MapPin size={14} className="text-slate-400" />
                <Text>{order.client?.quartier || t('delivery.detailsModal.notProvided')}</Text>
              </Space>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Section Commande & Finances */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="shadow-sm border-none bg-white">
            <div className="flex items-center gap-2 mb-4 text-[#0F172A] font-bold">
              <Calendar size={18} />
              <span>{t('delivery.detailsModal.orderDetails')}</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <Text className="text-slate-500">{t('delivery.detailsModal.date')}</Text>
                <Text strong>{new Date(order.date_commande ?? '').toLocaleDateString('fr-FR')}</Text>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <Text className="text-slate-500">{t('delivery.detailsModal.items')}</Text>
                <Badge count={order.quantity} overflowCount={999} style={{ backgroundColor: '#0F172A' }} />
              </div>
              <div className="flex justify-between items-center py-2">
                <Text className="text-slate-500">{t('delivery.detailsModal.payment')}</Text>
                <Tag color={order.statut_paiement === 'payé' ? 'success' : 'warning'} className="m-0 font-bold">
                  {(order.statut_paiement ?? '').toUpperCase()}
                </Tag>
              </div>
              <div className="flex justify-between items-center py-2">
                <Text className="text-black ">{t('delivery.detailsModal.paymentMethod')}</Text>
                <p className="text-red-500 ">
                  {order.methode_paiement}
                </p>
              </div>
            </div>
          </Card>

          <Card className="shadow-sm border-none bg-[#0F172A] text-white">
            <div className="flex items-center gap-2 mb-4 font-bold opacity-80">
              <Receipt size={18} />
              <span>{t('delivery.detailsModal.financialSummary')}</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm opacity-80">
                <span>{t('delivery.detailsModal.totalAmount')}</span>
                <span>{order.montant_total.toLocaleString()} CFA</span>
              </div>
              <div className="flex justify-between items-center text-sm opacity-80">
                <span>{t('delivery.detailsModal.discount')}</span>
                <span className="text-amber-400">-{order.ristourne.toLocaleString()} CFA</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-white/10">
                <span className="font-bold">{t('delivery.detailsModal.remainingToPay')}</span>
                <span className="text-xl font-bold text-red-400">{order.montant_restant.toLocaleString()} CFA</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Le gérant peut demander l'abandon du reste impayé ; un manager décide. */}
        <AbandonReste
          livraisonId={order.id}
          reste={order.montant_restant}
          abandon={order.abandon_reste}
          enAttente={order.abandon_en_attente}
          annulee={order.etat === 'annulee'}
          profil="gerant"
          onDone={() => { onChanged?.(); onClose(); }}
        />

        {/* Détail des Paiements */}
        <Card className="shadow-sm border-none" bodyStyle={{ padding: '0 16px' }}>
          <div className="grid grid-cols-3 divide-x divide-slate-100 py-4">
            <div className="px-4 text-center">
              <div className="text-xs text-slate-500 mb-1 uppercase tracking-tighter">{t('delivery.detailsModal.paid')}</div>
              <div className="text-lg font-bold text-emerald-600">{order.montant_paye.toLocaleString()}</div>
            </div>
            <div className="px-4 text-center">
              <div className="text-xs text-slate-500 mb-1 uppercase tracking-tighter">{t('delivery.detailsModal.discount')}</div>
              <div className="text-lg font-bold text-amber-600">{order.ristourne.toLocaleString()}</div>
            </div>
            <div className="px-4 text-center">
              <div className="text-xs text-slate-500 mb-1 uppercase tracking-tighter">{t('delivery.detailsModal.balance')}</div>
              <div className="text-lg font-bold text-slate-900">{order.relicat?.toLocaleString() || 0}</div>
            </div>
          </div>
        </Card>

        {/* Liste des Produits */}
        <Card className="shadow-sm border-none" title={
          <div className="flex items-center gap-2 text-[#0F172A] font-bold">
            <Package size={18} />
            <span>{t('delivery.detailsModal.orderedItems')}</span>
          </div>
        }>
          <div className="divide-y divide-slate-100">
            {order.produits?.map((p, idx) => (
              <div key={idx} className="py-4 first:pt-0 last:pb-0">
                <div className="flex justify-between items-center mb-1">
                  <Text strong className="text-slate-900">{p.nom}</Text>
                  <Text strong>{(p.quantite * p.prix).toLocaleString()} CFA</Text>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Badge count={p.quantite} size="small" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }} />
                  <span>×</span>
                  <span>{p.prix.toLocaleString()} CFA / {p.unite}</span>
                  {p.is_conditionne && (
                    <Tag color="blue" className="ml-auto m-0 opacity-70">
                      {p.conditionnement_nom} (Facteur: {p.facteur})
                    </Tag>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Retours */}
        {order.retours && order.retours.length > 0 && (
          <Card className="shadow-sm border-none bg-red-50/50" title={
            <div className="flex items-center gap-2 text-red-700 font-bold">
              <Receipt size={18} />
              <span>{t('delivery.detailsModal.returns')} ({order.retours.length})</span>
            </div>
          }>
            <div className="space-y-4">
              {order.retours.map(r => (
                <div key={r.id} className="bg-white p-3 rounded-lg border border-red-100 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <Text strong className="text-xs font-bold text-red-600 tracking-wider">RET-#{r.id.slice(0, 6)}</Text>
                    <Text className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString()}</Text>
                  </div>
                  <div className="text-sm border-l-2 border-red-200 pl-3 mb-2 italic text-slate-600">
                    "{r.motif}"
                  </div>
                  <div className="space-y-1">
                    {r.produits?.map((rp, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span>{rp.nom || t('delivery.detailsModal.printItem')}</span>
                        <span className="font-bold text-red-600">{rp.quantite}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Notes */}
        {order.notes && (
          <Card className="shadow-sm border-none bg-amber-50">
            <div className="flex items-center gap-2 mb-2 text-amber-800 font-bold">
              <FileText size={18} />
              <span>{t('delivery.detailsModal.deliveryNotes')}</span>
            </div>
            <div className="text-sm text-amber-900/80 leading-relaxed italic">
              {order.notes}
            </div>
          </Card>
        )}
      </div>
    </Drawer>
  );
};

export default DeliveryDetailsModal;



import React, { useState } from 'react';
import { Drawer, Descriptions, Badge, Tag, Space, Button, Card, Typography, Dropdown, App } from 'antd';
import { Order } from './types';
import {
  X, Phone, MapPin, Truck, User, Package, Printer,
  Calendar, Receipt, FileText, Download, ChevronDown
} from 'lucide-react';
import { generateDeliveryInvoicePdf, InvoiceMode } from './deliveryInvoicePdf';

const METHODES: Record<string, string> = { cash: 'Espèces', om: 'Orange Money', momo: 'MTN MoMo', bancaire: 'Virement bancaire' };
import { useTranslation } from 'react-i18next';
import RefundReceiptButtons from './RefundReceiptButtons';
import AbandonReste from '../../../Client/AbandonReste';
import { etatVente } from '../../../../services/ventes';
import { estCaissier } from '../venteRole';
import { imprimerTicketVente } from '../../../../Modules/Caisse/ticket';

const { Text } = Typography;


interface DeliveryDetailsModalProps {
  order: Order | null;
  onClose: () => void;
  /** Appelé après une action qui modifie la vente (abandon du reste…). */
  onChanged?: () => void;
}

const DeliveryDetailsModal: React.FC<DeliveryDetailsModalProps> = ({ order, onClose, onChanged }) => {
  const { t, i18n } = useTranslation();
  const [factureEnCours, setFactureEnCours] = useState<InvoiceMode | null>(null);
  const [ticketEnCours, setTicketEnCours] = useState(false);
  // Le `message` statique d'antd ne s'affiche pas sous React 19 : contexte <App>.
  const { message } = App.useApp();
  if (!order) return null;

  // Ticket 80 mm pour imprimante de caisse : le même que celui du caissier.
  const imprimerTicket = async () => {
    setTicketEnCours(true);
    try {
      await imprimerTicketVente(order.id, estCaissier());
    } catch (error) {
      console.error('Erreur de préparation du ticket :', error);
      message.error("Le ticket n'a pas pu être préparé.");
    } finally {
      setTicketEnCours(false);
    }
  };

  // Facture PDF identique en téléchargement et en impression (même charte
  // que le bon d'approvisionnement).
  const genererFacture = async (mode: InvoiceMode) => {
    setFactureEnCours(mode);
    try {
      await generateDeliveryInvoicePdf(order, mode);
      if (mode === 'download') message.success('Facture téléchargée');
    } catch (error) {
      console.error('Erreur de génération de la facture :', error);
      message.error('Erreur lors de la génération de la facture');
    } finally {
      setFactureEnCours(null);
    }
  };

  return (
    <Drawer
      title={
        <div className="flex items-center justify-between w-full pr-8">
          <Space size="middle">
            <div className="bg-[#3b0764] p-2 rounded-lg text-white">
              <Truck size={20} />
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">{t('admin.deliveries.modals.detail.title')}</div>
              <div className="text-lg font-bold text-[#3b0764]">#{order.id.slice(0, 8).toUpperCase()}</div>
            </div>
          </Space>
          <Space>
            <Tag color={etatVente(order.etat).couleur} className="px-3 py-1 font-bold uppercase text-[10px]">
              {etatVente(order.etat).libelle}
            </Tag>
            <Button
              icon={<Download size={16} />}
              onClick={() => genererFacture('download')}
              loading={factureEnCours === 'download'}
              disabled={factureEnCours !== null}
              style={{ borderColor: '#3b0764', color: '#3b0764' }}
              className="font-bold"
            >
              Télécharger
            </Button>
            <Dropdown.Button
              type="primary"
              onClick={imprimerTicket}
              icon={<ChevronDown size={16} />}
              loading={ticketEnCours || factureEnCours === 'print'}
              disabled={factureEnCours === 'download'}
              menu={{
                items: [{ key: 'a4', icon: <FileText size={14} />, label: 'Imprimer la facture A4' }],
                onClick: () => genererFacture('print'),
              }}
              buttonsRender={([gauche, droite]) => [
                React.cloneElement(gauche as React.ReactElement<{ style?: React.CSSProperties; className?: string }>, {
                  style: { backgroundColor: '#3b0764' },
                  className: 'border-none shadow-md font-bold',
                }),
                React.cloneElement(droite as React.ReactElement<{ style?: React.CSSProperties }>, {
                  style: { backgroundColor: '#3b0764' },
                }),
              ]}
            >
              <span className="inline-flex items-center gap-1.5">
                <Printer size={16} /> Imprimer le ticket
              </span>
            </Dropdown.Button>
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
      styles={{
        header: { borderBottom: '1px solid #f1f5f9', padding: '16px 24px' },
        body: { padding: '24px', backgroundColor: '#f8fafc' },
      }}
      closeIcon={null}
    >
      <div className="space-y-6">
        {/* Section Client */}
        <Card className="shadow-sm border-none overflow-hidden">
          <div className="flex items-center gap-2 mb-4 text-[#3b0764] font-bold">
            <User size={18} />
            <span>{t('admin.deliveries.modals.detail.clientSection')}</span>
          </div>
          <Descriptions column={2} bordered size="small" className="bg-white">
            <Descriptions.Item label={t('reports.table.client')} span={2}>
              <Text strong className="text-slate-900">{order.client.nom}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('admin.customers.add.phone')}>
              <Space>
                <Phone size={14} className="text-slate-400" />
                <Text>{order.client.telephone || t('admin.deliveries.modals.detail.noPhone')}</Text>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label={t('admin.customers.add.email')}>
              <Text>{order.client.email || t('admin.deliveries.modals.detail.noEmail')}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('admin.customers.add.city')} span={1}>
              <Text>{order.client.ville || 'N/A'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('admin.customers.add.district')} span={1}>
              <Space>
                <MapPin size={14} className="text-slate-400" />
                <Text>{order.client.quartier || 'N/A'}</Text>
              </Space>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Section Commande & Finances */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="shadow-sm border-none bg-white">
            <div className="flex items-center gap-2 mb-4 text-[#3b0764] font-bold">
              <Calendar size={18} />
              <span>{t('admin.deliveries.modals.detail.orderSection')}</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <Text className="text-slate-500">{t('admin.table.date')}</Text>
                <Text strong>{new Date(order.date_commande ?? '').toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US')}</Text>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <Text className="text-slate-500">{t('admin.deliveries.modals.detail.articles')}</Text>
                <Badge count={order.quantity} overflowCount={999} style={{ backgroundColor: '#3b0764' }} />
              </div>
              <div className="flex justify-between items-center py-2">
                <Text className="text-slate-500">{t('admin.table.payment')}</Text>
                <Tag color={order.statut_paiement === 'payé' ? 'success' : 'warning'} className="m-0 font-bold">
                  {(order.statut_paiement ?? '').toUpperCase()}
                </Tag>
              </div>
              <div className="flex justify-between items-center py-2">
                <Text className="text-black ">{t('admin.deliveries.modals.detail.paymentMethod')}</Text>
                <p className="m-0 font-semibold text-slate-700">
                  {(order.paiements?.filter((p) => Number(p.montant) > 0).map((p) => METHODES[p.methode] || p.methode).join(', '))
                    || METHODES[order.methode_paiement ?? ''] || order.methode_paiement}
                </p>
              </div>
            </div>
          </Card>

          {/* Couleur en style direct : le fond des Card antd écrase la classe bg-*. */}
          <Card className="shadow-sm border-none" style={{ backgroundColor: '#3b0764', color: '#fff' }}>
            <div className="flex items-center gap-2 mb-4 font-bold opacity-80">
              <Receipt size={18} />
              <span>{t('admin.deliveries.modals.detail.financialSection')}</span>
            </div>
            <div className="space-y-3">
              {(order.reductions?.length ?? 0) > 0 && (
                <>
                  <div className="flex justify-between items-center text-sm opacity-80">
                    <span>Montant brut</span>
                    <span>{(order.montant_brut ?? 0).toLocaleString()} {t('delivery.productSelection.currency')}</span>
                  </div>
                  {order.reductions!.map((r) => (
                    <div key={r.type} className="flex justify-between items-start gap-3 text-sm">
                      <span className="opacity-80">
                        {r.libelle}{r.mode === 'pourcentage' ? ` (${r.valeur} %)` : ''}
                        {r.motif && <span className="block text-xs opacity-70">{r.motif}</span>}
                      </span>
                      <span className="shrink-0 text-emerald-400">-{r.montant.toLocaleString()} {t('delivery.productSelection.currency')}</span>
                    </div>
                  ))}
                </>
              )}
              {order.appliquer_tva && (order.montant_tva ?? 0) > 0 && (
                <>
                  <div className="flex justify-between items-center text-sm opacity-80">
                    <span>Total HT</span>
                    <span>{(order.montant_produits ?? 0).toLocaleString('fr-FR')} {t('delivery.productSelection.currency')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm opacity-80">
                    <span>TVA ({(order.taux_tva ?? 0).toLocaleString('fr-FR')} %)</span>
                    <span>+{(order.montant_tva ?? 0).toLocaleString('fr-FR')} {t('delivery.productSelection.currency')}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center text-sm opacity-80">
                <span>{order.appliquer_tva && (order.montant_tva ?? 0) > 0 ? 'Total TTC' : t('admin.deliveries.modals.detail.totalAmount')}</span>
                <span>{order.montant_total.toLocaleString()} {t('delivery.productSelection.currency')}</span>
              </div>
              {/* <div className="flex justify-between items-center text-sm opacity-80">
                <span>{t('admin.deliveries.modals.detail.discount')}</span>
                <span className="text-amber-400">-{order.ristourne.toLocaleString()} {t('delivery.productSelection.currency')}</span>
              </div> */}
              <div className="flex justify-between items-center pt-3 border-t border-white/10">
                <span className="font-bold">{t('admin.deliveries.modals.detail.remaining')}</span>
                <span className="text-xl font-bold text-red-400">{order.montant_restant.toLocaleString()} {t('delivery.productSelection.currency')}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Abandon du reste impayé (admin et manager) */}
        {!estCaissier() && (
          <AbandonReste
            livraisonId={order.id}
            reste={order.montant_restant}
            abandon={order.abandon_reste}
            enAttente={order.abandon_en_attente}
            annulee={order.etat === 'annulee'}
            profil="responsable"
            onDone={() => { onChanged?.(); onClose(); }}
          />
        )}

        {/* Détail des Paiements */}
        <Card className="shadow-sm border-none" styles={{ body: { padding: '0 16px' } }}>
          <div className="grid grid-cols-3 divide-x divide-slate-100 py-4">
            <div className="px-4 text-center">
              <div className="text-xs text-slate-500 mb-1 uppercase tracking-tighter">{t('admin.deliveries.modals.detail.paid')}</div>
              <div className="text-lg font-bold text-emerald-600">{order.montant_paye.toLocaleString()}</div>
            </div>
            {/* <div className="px-4 text-center">
              <div className="text-xs text-slate-500 mb-1 uppercase tracking-tighter">{t('admin.deliveries.modals.detail.discount')}</div>
              <div className="text-lg font-bold text-amber-600">{order.ristourne.toLocaleString()}</div>
            </div> */}
            <div className="px-4 text-center">
              <div className="text-xs text-slate-500 mb-1 uppercase tracking-tighter">{t('admin.deliveries.modals.detail.reliquat')}</div>
              <div className="text-lg font-bold text-slate-900">{order.relicat?.toLocaleString() || 0}</div>
            </div>
          </div>
        </Card>

        {/* Liste des Produits */}
        <Card className="shadow-sm border-none" title={
          <div className="flex items-center gap-2 text-[#3b0764] font-bold">
            <Package size={18} />
            <span>{t('admin.deliveries.modals.detail.itemsSection')}</span>
          </div>
        }>
          <div className="divide-y divide-slate-100">
            {order.produits?.map((p, idx) => (
              <div key={idx} className="py-4 first:pt-0 last:pb-0">
                <div className="flex justify-between items-center mb-1">
                  <Text strong className="text-slate-900">{p.nom}</Text>
                  <Text strong>{(p.quantite * p.prix).toLocaleString()} {t('delivery.productSelection.currency')}</Text>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Badge count={p.quantite} size="small" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }} />
                  <span>×</span>
                  <span>{p.prix.toLocaleString()} {t('delivery.productSelection.currency')} / {p.unite}</span>
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

        {/* Remboursements liés aux retours */}
        {((Number(order.retour) || 0) > 0 || (order.remboursements?.length ?? 0) > 0) && (
          <Card className="shadow-sm border-none" title={
            <div className="flex items-center gap-2 text-[#3b0764] font-bold">
              <Receipt size={18} />
              <span>Remboursements</span>
            </div>
          }>
            {(Number(order.retour) || 0) > 0 && (
              <div className="mb-3 flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-sm">
                <span className="font-semibold text-amber-800">Reste à rembourser au client</span>
                <span className="font-bold text-amber-700">{Number(order.retour).toLocaleString('fr-FR')} CFA</span>
              </div>
            )}
            <div className="divide-y divide-slate-100">
              {(order.remboursements || []).map((r, i) => (
                <div key={i} className="flex items-start justify-between gap-3 py-2 text-sm">
                  <div>
                    <div className="font-semibold text-slate-800">{r.mode_libelle || r.mode}</div>
                    <div className="text-xs text-slate-500">
                      {new Date(r.date.endsWith('Z') ? r.date : `${r.date}Z`).toLocaleString('fr-FR')}
                      {r.par_nom ? ` · par ${r.par_nom}` : ''}
                    </div>
                    {(r.reference || r.telephone) && (
                      <div className="text-xs text-slate-600">
                        {r.reference ? `Réf. ${r.reference}` : ''}
                        {r.reference && r.telephone ? ' · ' : ''}
                        {r.telephone ? `N° ${r.telephone}` : ''}
                      </div>
                    )}
                    {r.motif && <div className="text-xs italic text-slate-500">{r.motif}</div>}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-bold text-emerald-600">− {Number(r.montant).toLocaleString('fr-FR')} CFA</span>
                    <RefundReceiptButtons order={order} remboursement={r} compact />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Retours */}
        {order.retours && order.retours.length > 0 && (
          <Card className="shadow-sm border-none bg-red-50/50" title={
            <div className="flex items-center gap-2 text-red-700 font-bold">
              <Receipt size={18} />
              <span>{t('admin.deliveries.modals.detail.returnsSection')} ({order.retours.length})</span>
            </div>
          }>
            <div className="space-y-4">
              {order.retours.map(r => (
                <div key={r.id} className="bg-white p-3 rounded-lg border border-red-100 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <Text strong className="text-xs font-bold text-red-600 tracking-wider">RET-#{r.id.slice(0, 6)}</Text>
                    <Text className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US')}</Text>
                  </div>
                  <div className="text-sm border-l-2 border-red-200 pl-3 mb-2 italic text-slate-600">
                    "{r.motif}"
                  </div>
                  <div className="space-y-1">
                    {r.produits?.map((rp, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span>{rp.nom || 'Produit'}</span>
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
              <span>{t('admin.deliveries.modals.detail.notesSection')}</span>
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



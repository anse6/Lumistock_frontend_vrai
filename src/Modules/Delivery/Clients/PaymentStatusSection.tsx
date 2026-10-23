import React, { useState, useEffect } from 'react';
import { Select, InputNumber } from 'antd';
import { useDeliveryStore } from './composantclient/deliveryStore';
import { useProductStore } from '../../../Components/componentproduitselection/stores/useProductStore';
import { useTranslation } from 'react-i18next';
import SituationClient from '../../../Components/Client/SituationClient';

export const PaymentStatusSection: React.FC = () => {
  const { t } = useTranslation();
  const defaultStatutPaiement = useDeliveryStore((state) => state.statut_paiement);
  const defaultPaiements = useDeliveryStore((state) => state.paiements);
  const defaultRelicat = useDeliveryStore((state) => state.relicat);
  const defaultDetteAncienne = useDeliveryStore((state) => state.dette_ancienne);
  const defaultIsDetteAncienneActive = useDeliveryStore((state) => state.is_dette_ancienne_active);
  const clientId = useDeliveryStore((state) => state.clientId);
  const { totalAmount } = useProductStore();

  const determineLocalStatus = (statut: string) => {
    if (statut === 'payé' || statut === 'paye') return 'total';
    if (statut === 'partiellement payé') return 'partiellement payé';
    return 'none';
  };

  const [status, setStatus] = useState<'total' | 'none' | 'partiellement payé'>(determineLocalStatus(defaultStatutPaiement));
  const [selectedMethods, setSelectedMethods] = useState<string[]>(defaultPaiements.map(p => p.methode));
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, number>>(
    defaultPaiements.reduce((acc, p) => ({ ...acc, [p.methode]: p.montant }), {})
  );

  const [relicat] = useState<number | ''>(defaultRelicat || '');
  const [showOldDebtSetting, setShowOldDebtSetting] = useState(localStorage.getItem('show_old_debt') !== 'false');

  useEffect(() => {
    const handleSettingChange = () => {
      setShowOldDebtSetting(localStorage.getItem('show_old_debt') !== 'false');
    };
    window.addEventListener('oldDebtSettingChange', handleSettingChange);
    return () => window.removeEventListener('oldDebtSettingChange', handleSettingChange);
  }, []);

  const setPaymentStatus = useDeliveryStore((state) => state.setPaymentStatus);
  const setPaiementsStore = useDeliveryStore((state) => state.setPaiements);
  const setAdvance = useDeliveryStore((state) => state.setAdvanceAmount);
  const setRelicat = useDeliveryStore((state) => state.setRelicat);
  const setACouche = useDeliveryStore((state) => state.setACouche);

  const paymentOptions = [
    { label: t('delivery.deliveryConfig.paymentMethodCash'), value: 'cash' },
    { label: t('delivery.deliveryConfig.paymentMethodOM'), value: 'om' },
    { label: t('delivery.deliveryConfig.paymentMethodMomo'), value: 'momo' },
    { label: t('delivery.deliveryConfig.paymentMethodBank'), value: 'bancaire' },
  ];

  // Logic to handle changes in methods and amounts (SYNC LOCAL -> STORE)
  useEffect(() => {
    const newPaiements = selectedMethods.map((m: string) => ({
      methode: m,
      montant: paymentAmounts[m] || 0
    }));

    // Avoid redundant store updates if data is identical
    const currentPaiementsStr = JSON.stringify(defaultPaiements);
    const newPaiementsStr = JSON.stringify(newPaiements);

    if (currentPaiementsStr !== newPaiementsStr) {
      setPaiementsStore(newPaiements);
    }

    const totalPaid = newPaiements.reduce((sum: number, p: { montant: number }) => sum + p.montant, 0);
    // Only update advance if it changed
    useDeliveryStore.getState().montant_paye !== totalPaid && setAdvance(totalPaid);
  }, [selectedMethods, paymentAmounts, setPaiementsStore, setAdvance, defaultPaiements]);

  useEffect(() => {
    setStatus(determineLocalStatus(defaultStatutPaiement));
  }, [defaultStatutPaiement]);

  useEffect(() => {
    if (defaultPaiements && defaultPaiements.length > 0) {
      const currentMethods = selectedMethods;
      const newMethods = defaultPaiements.map(p => p.methode);

      const currentAmountsStr = JSON.stringify(paymentAmounts);
      const newAmounts = defaultPaiements.reduce((acc, p) => ({ ...acc, [p.methode]: p.montant }), {});
      const newAmountsStr = JSON.stringify(newAmounts);

      // Only update if something actually changed
      if (JSON.stringify(currentMethods) !== JSON.stringify(newMethods)) {
        setSelectedMethods(newMethods);
      }
      if (currentAmountsStr !== newAmountsStr) {
        setPaymentAmounts(newAmounts);
      }
    }
  }, [defaultPaiements]); // Only depend on store changes

  useEffect(() => {
    let statutFinal: 'payé' | 'partiellement payé' | 'non payé' = 'non payé';
    if (status === 'total') statutFinal = 'payé';
    else if (status === 'partiellement payé') statutFinal = 'partiellement payé';

    // Only update store if status actually changed
    if (useDeliveryStore.getState().statut_paiement !== statutFinal) {
      setPaymentStatus(statutFinal);
    }

    if (status === 'none') {
      setSelectedMethods([]);
      setPaymentAmounts({});
      // Only update store if value changed
      if (useDeliveryStore.getState().aCouche !== false) {
        setACouche(false);
      }
    }
  }, [setPaymentStatus, setACouche, status]);

  const handleMethodChange = (methods: string[]) => {
    setSelectedMethods(methods);
    const newAmounts = { ...paymentAmounts };
    // Cleanup removed methods
    Object.keys(newAmounts).forEach(m => {
      if (!methods.includes(m)) delete newAmounts[m];
    });
    setPaymentAmounts(newAmounts);
  };

  const handleAmountChange = (method: string, amount: number | null) => {
    setPaymentAmounts((prev: Record<string, number>) => ({
      ...prev,
      [method]: amount || 0
    }));
  };

  useEffect(() => {
    if (status === 'total' && typeof relicat === 'number') {
      setRelicat(relicat);
    }
  }, [relicat, setRelicat, status]);

  // Sync effects removed as we use store directly

  return (
    <div className="mb-6 px-2 sm:px-0">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-1/2">
            <label htmlFor="payment-status" className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">
              {t('delivery.deliveryConfig.paymentStatus')}
            </label>
            <div className="relative">
              <select
                id="payment-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'none' | 'total' | 'partiellement payé')}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 text-sm sm:text-base appearance-none focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20"
              >
                <option value="none">{t('delivery.deliveryConfig.paymentUnpaid')}</option>
                <option value="total">{t('delivery.deliveryConfig.paymentPaid')}</option>
                <option value="partiellement payé">{t('delivery.deliveryConfig.paymentAdvanced')}</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {(status === 'total' || status === 'partiellement payé') && (
            <div className="w-full sm:w-1/2">
              <label className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">
                {t('delivery.deliveryConfig.paymentMethods')}
              </label>
              <Select
                mode="multiple"
                placeholder={t('delivery.deliveryConfig.paymentChooseMethods')}
                value={selectedMethods}
                onChange={handleMethodChange}
                style={{ width: '100%' }}
                options={paymentOptions}
                size="large"
              />
            </div>
          )}
        </div>

        {(status === 'total' || status === 'partiellement payé') && selectedMethods.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-4">
            <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">{t('delivery.deliveryConfig.paymentDetails')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedMethods.map((method) => (
                <div key={method} className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500 capitalize">
                    {t('delivery.deliveryConfig.paymentAmount')} {method.replace('_', ' ')}
                  </label>
                  <InputNumber
                    className="w-full"
                    placeholder="0"
                    min={0}
                    value={paymentAmounts[method]}
                    onChange={(val) => handleAmountChange(method, val)}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                    parser={value => value!.replace(/\s?|CFA/g, '') as any}
                    addonAfter="CFA"
                  />
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">{t('delivery.deliveryConfig.paymentTotalPaid')}</span>
              <span className={`text-lg font-bold ${
                (status === 'total' || status === 'partiellement payé') && 
                Object.values(paymentAmounts).reduce((a, b) => a + b, 0) > (totalAmount + (defaultIsDetteAncienneActive ? defaultDetteAncienne : 0)) 
                ? 'text-red-600' : 'text-indigo-600'
              }`}>
                {Object.values(paymentAmounts).reduce((a, b) => a + b, 0).toLocaleString()} CFA
              </span>
            </div>
            {((status === 'total' || status === 'partiellement payé') && 
              Object.values(paymentAmounts).reduce((a, b) => a + b, 0) > (totalAmount + (defaultIsDetteAncienneActive ? defaultDetteAncienne : 0))) && (
              <div className="text-red-600 text-sm font-medium mt-2 p-3 bg-red-50 rounded-md border border-red-200">
                Le montant payé ({Object.values(paymentAmounts).reduce((a, b) => a + b, 0).toLocaleString()} CFA) ne peut pas dépasser le total à payer ({(totalAmount + (defaultIsDetteAncienneActive ? defaultDetteAncienne : 0)).toLocaleString()} CFA).
              </div>
            )}
          </div>
        )}

      </div>

      {/* Dette du client : la dette d'avant Lumistock se saisit sur sa fiche et
          se règle à part ; elle n'est plus ajoutée au total de la vente. */}
      {showOldDebtSetting && (
        <div className="mt-4">
          <SituationClient clientId={clientId} compact />
        </div>
      )}
      {defaultIsDetteAncienneActive && defaultDetteAncienne > 0 && (
        <div className="mt-3 p-3 text-sm text-slate-600 bg-slate-50 rounded-lg border border-slate-200">
          Cette ancienne vente inclut une dette ancienne de {defaultDetteAncienne.toLocaleString()} CFA
          (ancienne méthode, conservée telle quelle).
        </div>
      )}
    </div>
  );
};

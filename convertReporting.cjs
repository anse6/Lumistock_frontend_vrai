const fs = require('fs');
let code = fs.readFileSync('src/Modules/Charges/FinancialReporting.tsx', 'utf8');

if (!code.includes('useTranslation')) {
  code = code.replace(`from 'react';`, `from 'react';\nimport { useTranslation } from 'react-i18next';`);
}
code = code.replace(`const { notification } = App.useApp();`, `const { notification } = App.useApp();\n  const { t } = useTranslation();`);

code = code.replace(/Période du Rapport/g, `{t('finance.reporting.reportPeriod')}`);
code = code.replace(/Solde Initial \(Caisse\)/g, `{t('finance.reporting.initialBalance')}`);
code = code.replace(/Générer les Rapports/g, `{t('finance.reporting.generateReports')}`);
code = code.replace(/Compte de Résultat \(PnL\)/g, `{t('finance.reporting.pnlTitle')}`);
code = code.replace(/Performance économique brute/g, `{t('finance.reporting.pnlSubtitle')}`);

code = code.replace(/>Bénéfice Net Période</g, `>{t('finance.reporting.netProfitPeriod')}<`);
code = code.replace(/>Détails Financiers</g, `>{t('finance.reporting.financialDetails')}<`);

code = code.replace(/>Ventes</g, `>{t('finance.reporting.sales')}<`);
code = code.replace(/>Achats Stock</g, `>{t('finance.reporting.stockPurchases')}<`);
code = code.replace(/>Dépenses \(Charges\)</g, `>{t('finance.reporting.expenses')}<`);
code = code.replace(/>Amortissements</g, `>{t('finance.reporting.depreciation')}<`);

code = code.replace(/Flux de Trésorerie \(Cash Flow\)/g, `{t('finance.reporting.cashFlowTitle')}`);
code = code.replace(/Gestion des liquidités réelles/g, `{t('finance.reporting.cashFlowSubtitle')}`);
code = code.replace(/>Solde Ouverture</g, `>{t('finance.reporting.openingBalance')}<`);
code = code.replace(/>Entrées Nettes</g, `>{t('finance.reporting.netEntries')}<`);
code = code.replace(/>Sorties Totales</g, `>{t('finance.reporting.totalExits')}<`);
code = code.replace(/>Solde Prévisionnel Clôture</g, `>{t('finance.reporting.projectedClosing')}<`);
code = code.replace(/>Action</g, `>{t('finance.reporting.action')}<`);

code = code.replace(`name: 'Ventes'`, `name: t('finance.reporting.sales')`);
code = code.replace(`name: 'Achats'`, `name: t('finance.reporting.stockPurchases')`);
code = code.replace(`name: 'Charges'`, `name: t('finance.profitloss.totalCharges')`);
code = code.replace(`name: 'Amort.'`, `name: t('finance.reporting.depreciation')`);
code = code.replace(`name: 'Net'`, `name: t('finance.profitloss.netProfit')`);
code = code.replace(`name: 'Ouverture'`, `name: t('finance.reporting.openingBalance')`);
code = code.replace(`name: 'Flux Net'`, `name: t('finance.reporting.netEntries')`);
code = code.replace(`name: 'Clôture'`, `name: t('finance.reporting.projectedClosing')`);

fs.writeFileSync('src/Modules/Charges/FinancialReporting.tsx', code);
console.log('FinancialReporting localized');

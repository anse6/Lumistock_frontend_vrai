const fs = require('fs');

// ProfitLossAnalysis
let profitCode = fs.readFileSync('src/Modules/Charges/ProfitLossAnalysis.tsx', 'utf8');

if (!profitCode.includes('useTranslation')) {
  profitCode = profitCode.replace(`from 'react';`, `from 'react';\nimport { useTranslation } from 'react-i18next';`);
}
profitCode = profitCode.replace(`const ProfitLossAnalysis: React.FC<ProfitLossAnalysisProps> = ({ stats }) => {`, `const ProfitLossAnalysis: React.FC<ProfitLossAnalysisProps> = ({ stats }) => {\n  const { t } = useTranslation();`);

profitCode = profitCode.replace(`name: 'C.A.'`, `name: t('finance.profitloss.revenue')`);
profitCode = profitCode.replace(`name: 'Coût Achat'`, `name: t('finance.profitloss.totalPurchaseCost')`);
profitCode = profitCode.replace(/name: 'Charges'/g, `name: t('finance.profitloss.totalCharges')`);
profitCode = profitCode.replace(/name: 'Bénéfice Net'/g, `name: t('finance.profitloss.netProfit')`);
profitCode = profitCode.replace(`name: 'Achats'`, `name: t('finance.profitloss.totalPurchaseCost')`);

profitCode = profitCode.replace(/>Chiffre d'Affaires<\/p>/g, `>{t('finance.profitloss.revenue')}</p>`);
profitCode = profitCode.replace(/>Ventes totales<\/p>/g, `>{t('finance.profitloss.totalSales')}</p>`);
profitCode = profitCode.replace(/>Charges Totales<\/p>/g, `>{t('finance.profitloss.totalCharges')}</p>`);
profitCode = profitCode.replace(/>Dépenses cumulées<\/p>/g, `>{t('finance.profitloss.cumulativeExpenses')}</p>`);
profitCode = profitCode.replace(/>Bénéfice Net<\/p>/g, `>{t('finance.profitloss.netProfit')}</p>`);
profitCode = profitCode.replace(/>Rentabilité nette<\/p>/g, `>{t('finance.profitloss.netProfitability')}</p>`);
profitCode = profitCode.replace(/% marge<\/span>/g, `% {t('finance.profitloss.margin')}</span>`);

profitCode = profitCode.replace(/>Répartition Financière<\/Text>/g, `>{t('finance.profitloss.financialDistribution')}</Text>`);
profitCode = profitCode.replace(/>Analyse de la Marge<\/Text>/g, `>{t('finance.profitloss.marginAnalysis')}</Text>`);
profitCode = profitCode.replace(/>Composition du C\.A\.<\/Text>/g, `>{t('finance.profitloss.revenueComposition')}</Text>`);
profitCode = profitCode.replace(/>Coût Achat \(Total\)<\/Text>/g, `>{t('finance.profitloss.totalPurchaseCost')}</Text>`);
profitCode = profitCode.replace(/>Bénéfice Brut<\/Text>/g, `>{t('finance.profitloss.grossProfit')}</Text>`);
profitCode = profitCode.replace(/>Marge Brute %<\/Text>/g, `>{t('finance.profitloss.grossMarginPercent')}</Text>`);

fs.writeFileSync('src/Modules/Charges/ProfitLossAnalysis.tsx', profitCode);
console.log('ProfitLossAnalysis localized');

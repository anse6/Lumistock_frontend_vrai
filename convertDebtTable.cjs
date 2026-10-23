const fs = require('fs');

let debtTable = fs.readFileSync('src/Components/admin/clients/DebtTable.tsx', 'utf8');

if (!debtTable.includes('useTranslation')) {
  debtTable = debtTable.replace(`import { EyeOutlined, WalletOutlined } from '@ant-design/icons';`, `import { EyeOutlined, WalletOutlined } from '@ant-design/icons';\nimport { useTranslation } from 'react-i18next';`);
}
debtTable = debtTable.replace(/const \[isModalVisible, setIsModalVisible\] = useState\(false\);/, `const [isModalVisible, setIsModalVisible] = useState(false);\n  const { t } = useTranslation();`);

// Columns translation in DebtTable
debtTable = debtTable.replace(/title: 'Client'/, `title: t('admin.customers.debt.table.columns.client')`);
debtTable = debtTable.replace(/title: 'Téléphone'/, `title: t('admin.customers.debt.table.columns.phone')`);
debtTable = debtTable.replace(/title: 'Localisation'/, `title: t('admin.customers.debt.table.columns.location')`);
debtTable = debtTable.replace(/title: 'Livreur'/, `title: t('admin.customers.debt.table.columns.deliveryPerson')`);
debtTable = debtTable.replace(/title: 'Nb Livr.'/g, `title: t('admin.customers.debt.table.columns.nbDeliveries')`);
debtTable = debtTable.replace(/title: 'Montant Total'/g, `title: t('admin.customers.debt.table.columns.totalAmount')`);
debtTable = debtTable.replace(/title: 'Montant Payé'/g, `title: t('admin.customers.debt.table.columns.paidAmount')`);
debtTable = debtTable.replace(/title: 'Dette'/g, `title: t('admin.customers.debt.table.columns.debt')`);
debtTable = debtTable.replace(/title: 'Action'/g, `title: t('admin.customers.debt.table.columns.action')`);
debtTable = debtTable.replace(/>\s*Détails\s*<\/Button>/g, `>{t('admin.customers.debt.table.columns.details')}</Button>`);

// Modal translation in DebtTable
debtTable = debtTable.replace(/title=\{([^}]+)\}/, `title={\`\${t('admin.customers.debt.modal.title')} \${debtDetails?.client_nom || ''}\`}`);
debtTable = debtTable.replace(/>\s*Date\s*:\s*/g, `>{t('admin.customers.debt.modal.date')} `);
debtTable = debtTable.replace(/Reste\s*:/g, `{t('admin.customers.debt.modal.remainder')}`);
debtTable = debtTable.replace(/>\s*Produits livrés\s*:/g, `>{t('admin.customers.debt.modal.productsDelivered')}`);
debtTable = debtTable.replace(/>\s*\+\s*Dette ancienne\s*:/g, `>+ {t('admin.customers.debt.modal.oldDebtIncluded')}`);
debtTable = debtTable.replace(/>\s*Total dû\s*:/g, `>{t('admin.customers.debt.modal.totalDue')}`);
debtTable = debtTable.replace(/>\s*Payé\s*:/g, `>{t('admin.customers.debt.modal.paid')}`);
debtTable = debtTable.replace(/>\s*Reste à payer\s*:/g, `>{t('admin.customers.debt.modal.remainingToPay')}`);
debtTable = debtTable.replace(/>\s*Détails des produits\s*</g, `>{t('admin.customers.debt.modal.productDetails')}<`);
debtTable = debtTable.replace(/Qté:/g, `{t('admin.customers.debt.modal.qty')}`);
debtTable = debtTable.replace(/placeholder="Montant à payer"/, `placeholder={t('admin.customers.debt.modal.amountToPay')}`);
debtTable = debtTable.replace(/>\s*Payer\s*<\/Button>/, `>{t('admin.customers.debt.modal.payButton')}</Button>`);

// Messages in DebtTable
debtTable = debtTable.replace(/'Erreur lors du chargement des détails de la dette\.'/g, `t('admin.customers.debt.messages.errorDebtDetails')`);
debtTable = debtTable.replace(/'Veuillez entrer un montant valide'/g, `t('admin.customers.debt.messages.validAmountWarning')`);
debtTable = debtTable.replace(/'Paiement partiel enregistré avec succès'/g, `t('admin.customers.debt.messages.paymentSuccess')`);
debtTable = debtTable.replace(/'Erreur lors du paiement partiel'/g, `t('admin.customers.debt.messages.paymentError')`);
debtTable = debtTable.replace(/'Ce champ est requis'/g, `t('admin.customers.debt.messages.fieldRequired')`);
debtTable = debtTable.replace(/message: \`Le montant doit être inferieur ou égale à \$\{liv\.relicat_dette\}\`/g, `message: t('admin.customers.debt.messages.amountMustBeLessOrEqual', { amount: liv.relicat_dette })`);

fs.writeFileSync('src/Components/admin/clients/DebtTable.tsx', debtTable);
console.log('DebtTable converted');

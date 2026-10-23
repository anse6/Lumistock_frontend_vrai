const fs = require('fs');

const enPath = 'src/locales/en/translation.json';
let en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

if (!en.reports) en.reports = {};

en.reports = {
  ...en.reports,
  "pageTitle": "Reports & Activities",
  "tabs": {
    "deliveryReport": "Delivery Report",
    "paymentTracking": "Payment Tracking"
  },
  "header": {
    "title": "Delivery Report",
    "subtitle": "View and print your sales reports"
  },
  "filters": {
    "perDay": "Per Day",
    "perWeek": "Per Week",
    "perMonth": "Per Month",
    "perYear": "Per Year"
  },
  "actions": {
    "print": "Print"
  },
  "stats": {
    "revenue": "Revenue",
    "productsDelivered": "Products Delivered",
    "deliveryCount": "Number of Deliveries"
  },
  "print": {
    "title": "SALES REPORT",
    "period": "Period:",
    "generatedOn": "Generated on",
    "weekOf": "Week of",
    "totalRevenue": "Total Revenue",
    "totalQuantity": "Total Quantity",
    "deliveries": "Deliveries",
    "units": "units",
    "records": "records",
    "signatureManager": "Manager Signature",
    "companyStamp": "Company Stamp"
  },
  "table": {
    "date": "Date",
    "client": "Client",
    "deliveryPerson": "Delivery Person",
    "product": "Product",
    "qty": "Qty",
    "unitPrice": "Unit Price",
    "total": "Total",
    "status": "Status",
    "totalRows": "Total {{total}} rows"
  },
  "messages": {
    "fetchError": "Error retrieving the report"
  }
};

fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
console.log('en.reports patched correctly.');

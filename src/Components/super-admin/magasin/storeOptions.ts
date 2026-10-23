const fallbackCurrencyCodes = [
  'XAF', 'XOF', 'EUR', 'USD', 'GBP', 'AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA',
  'ARS', 'AUD', 'AWG', 'AZN', 'BAM', 'BBD', 'BDT', 'BGN', 'BHD', 'BIF', 'BMD',
  'BND', 'BOB', 'BSD', 'BTN', 'BWP', 'BYN', 'BZD', 'CAD', 'CDF', 'CHF', 'CLP',
  'CNY', 'COP', 'CRC', 'CUC', 'CUP', 'CVE', 'CZK', 'DJF', 'DKK', 'DOP', 'DZD',
  'EGP', 'ERN', 'ETB', 'FJD', 'FKP', 'GEL', 'GHS', 'GIP', 'GMD', 'GNF', 'GTQ',
  'GYD', 'HKD', 'HNL', 'HTG', 'HUF', 'IDR', 'ILS', 'INR', 'IQD', 'IRR', 'ISK',
  'JMD', 'JOD', 'JPY', 'KES', 'KGS', 'KHR', 'KMF', 'KPW', 'KRW', 'KWD', 'KYD',
  'KZT', 'LAK', 'LBP', 'LKR', 'LRD', 'LSL', 'LYD', 'MAD', 'MDL', 'MGA', 'MKD',
  'MMK', 'MNT', 'MOP', 'MRU', 'MUR', 'MVR', 'MWK', 'MXN', 'MYR', 'MZN', 'NAD',
  'NGN', 'NIO', 'NOK', 'NPR', 'NZD', 'OMR', 'PAB', 'PEN', 'PGK', 'PHP', 'PKR',
  'PLN', 'PYG', 'QAR', 'RON', 'RSD', 'RUB', 'RWF', 'SAR', 'SBD', 'SCR', 'SDG',
  'SEK', 'SGD', 'SHP', 'SLE', 'SLL', 'SOS', 'SRD', 'SSP', 'STN', 'SVC', 'SYP',
  'SZL', 'THB', 'TJS', 'TMT', 'TND', 'TOP', 'TRY', 'TTD', 'TWD', 'TZS', 'UAH',
  'UGX', 'UYU', 'UZS', 'VES', 'VND', 'VUV', 'WST', 'XCD', 'XCG', 'XDR', 'XPF',
  'XSU', 'YER', 'ZAR', 'ZMW', 'ZWG', 'ZWL',
];

const supportedValuesOf = (Intl as typeof Intl & {
  supportedValuesOf?: (key: string) => string[];
}).supportedValuesOf;

const currencyCodes = typeof supportedValuesOf === 'function'
  ? supportedValuesOf('currency')
  : fallbackCurrencyCodes;

const currencyNames = new Intl.DisplayNames(['fr'], { type: 'currency' });
const preferredCurrencies = ['XAF', 'XOF', 'EUR', 'USD', 'GBP'];

export const currencyOptions = [...new Set([...preferredCurrencies, ...currencyCodes])]
  .map((value) => ({
    value,
    label: `${currencyNames.of(value) ?? value} (${value})`,
  }))
  .sort((left, right) => {
    const leftPriority = preferredCurrencies.indexOf(left.value);
    const rightPriority = preferredCurrencies.indexOf(right.value);
    if (leftPriority !== -1 || rightPriority !== -1) {
      return (leftPriority === -1 ? Number.MAX_SAFE_INTEGER : leftPriority)
        - (rightPriority === -1 ? Number.MAX_SAFE_INTEGER : rightPriority);
    }
    return left.label.localeCompare(right.label, 'fr');
  });

// Utilities for formatting currency, numbers, and dates
// Supports South Asian comma format (lakh / crore) and Bangla numerals

const BANGLA_DIGITS: { [key: string]: string } = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
  '.': '.',
};

/**
 * Converts Western digits to Bengali numerals
 */
export function toBengaliDigits(input: string | number): string {
  const str = input.toString();
  return str.replace(/[0-9]/g, (match) => BANGLA_DIGITS[match] || match);
}

/**
 * Formats a number using South Asian numbering (e.g. 1,23,456.00 for BDT)
 */
export function formatSouthAsianNumber(amount: number): string {
  const [integerPart, decimalPart] = amount.toFixed(2).split('.');
  
  if (integerPart.length <= 3) {
    return `${integerPart}.${decimalPart}`;
  }

  const lastThree = integerPart.substring(integerPart.length - 3);
  const rest = integerPart.substring(0, integerPart.length - 3);
  
  // Format remaining with pairs of 2 digits
  const formattedRest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${formattedRest},${lastThree}.${decimalPart}`;
}

/**
 * Formats money with the symbol according to currency convention
 */
export function formatMoney(amount: number, currency: string = 'BDT', useBengaliDigits: boolean = false): string {
  const num = Number(amount) || 0;
  let formatted = '';

  if (currency === 'BDT' || currency === 'INR') {
    formatted = formatSouthAsianNumber(num);
  } else {
    formatted = num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  const symbol = getCurrencySymbol(currency);

  if (useBengaliDigits) {
    const bnDigits = toBengaliDigits(formatted);
    return `${symbol} ${bnDigits}`;
  }

  return `${symbol} ${formatted}`;
}

export function getCurrencySymbol(currency: string): string {
  switch (currency) {
    case 'BDT':
      return '৳';
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    case 'INR':
      return '₹';
    case 'GBP':
      return '£';
    default:
      return '৳';
  }
}

/**
 * Formats dates nicely (e.g. 27 Nov 2026)
 */
export function formatDate(dateStr: string, locale: 'en' | 'bn' = 'en'): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  if (locale === 'bn') {
    const monthsBn = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    const day = toBengaliDigits(date.getDate());
    const month = monthsBn[date.getMonth()];
    const year = toBengaliDigits(date.getFullYear());
    return `${day} ${month}, ${year}`;
  }

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// Formatting helpers matching SlipDo prototype specifications
// Supports South Asian comma notation (3-2-2) & Bengali numerals

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

export function toBengaliDigits(str: string | number): string {
  if (str === null || str === undefined) return '';
  return str.toString().replace(/[0-9]/g, (w) => BANGLA_DIGITS[w] || w);
}

export function formatSouthAsian(num: number, useBengali = false): string {
  const parts = Number(num || 0).toFixed(2).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  let result = '';
  if (integerPart.length > 3) {
    const lastThree = integerPart.substring(integerPart.length - 3);
    const rest = integerPart.substring(0, integerPart.length - 3);
    const withCommas = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    result = withCommas + ',' + lastThree;
  } else {
    result = integerPart;
  }

  result = result + '.' + decimalPart;
  return useBengali ? toBengaliDigits(result) : result;
}

export function formatCurrency(num: number, forceBn: boolean | null = null): string {
  const isBn = forceBn ?? false;
  return `${isBn ? '৳' : '৳'} ${formatSouthAsian(num, isBn)}`;
}

export function calcTotals(
  items: { qty: number; price: number }[],
  taxRate = 0,
  enableTax = true,
  discount = 0,
  enableDiscount = true
) {
  const subtotal = items.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.price) || 0), 0);
  const taxAmount = enableTax && taxRate > 0 ? (subtotal * taxRate) / 100 : 0;
  const discountAmount = enableDiscount && discount > 0 ? Math.min(discount, subtotal + taxAmount) : 0;
  const total = Math.max(0, subtotal + taxAmount - discountAmount);

  return {
    subtotal,
    taxAmount,
    discountAmount,
    total,
  };
}

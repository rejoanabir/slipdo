// Formatting helpers matching SlipDo prototype specifications
// Supports South Asian comma notation (3-2-2), Bengali numerals, and Number-to-Words

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

// --- Number to Words: English (South Asian System) ---
const ONES_EN = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS_EN = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertUnderThousandEn(n: number): string {
  let str = '';
  if (n >= 100) {
    str += ONES_EN[Math.floor(n / 100)] + ' Hundred ';
    n %= 100;
  }
  if (n >= 20) {
    str += TENS_EN[Math.floor(n / 10)] + ' ';
    n %= 10;
  }
  if (n > 0) {
    str += ONES_EN[n] + ' ';
  }
  return str.trim();
}

export function numberToWordsEn(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded === 0) return 'Zero Taka Only';

  let n = rounded;
  let words = '';

  // Crores
  if (n >= 10000000) {
    const crore = Math.floor(n / 10000000);
    words += convertUnderThousandEn(crore) + ' Crore ';
    n %= 10000000;
  }
  // Lakhs
  if (n >= 100000) {
    const lakh = Math.floor(n / 100000);
    words += convertUnderThousandEn(lakh) + ' Lakh ';
    n %= 100000;
  }
  // Thousands
  if (n >= 1000) {
    const thousand = Math.floor(n / 1000);
    words += convertUnderThousandEn(thousand) + ' Thousand ';
    n %= 1000;
  }
  // Hundreds & Remaining
  if (n > 0) {
    words += convertUnderThousandEn(n) + ' ';
  }

  return `${words.trim()} Taka Only`;
}

// --- Number to Words: Bengali ---
const ONES_BN = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়', 'দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ', 'বিশ', 'একুশ', 'বাইশ', 'তেইশ', 'চব্বিশ', 'পঁচিশ', 'ছাব্বিশ', 'সাতাশ', 'আটাশ', 'ঊনত্রিশ', 'ত্রিশ', 'একত্রিশ', 'বত্রিশ', 'তেত্রিশ', 'চৌত্রিশ', 'পঁয়ত্রিশ', 'ছত্রিশ', 'সাঁয়ত্রিশ', 'আটত্রিশ', 'ঊনচল্লিশ', 'চল্লিশ', 'একচল্লিশ', 'বিয়াল্লিশ', 'তেতাল্লিশ', 'চুয়াল্লিশ', 'পঁয়তাল্লিশ', 'ছেচল্লিশ', 'সাতচল্লিশ', 'আটচল্লিশ', 'ঊনপঞ্চাশ', 'পঞ্চাশ', 'একান্ন', 'বায়ান্ন', 'তিপ্পান্ন', 'চুয়ান্ন', 'পঞ্চান্ন', 'ছাপ্পান্ন', 'সাতান্ন', 'আটান্ন', 'ঊনষাট', 'ষাট', 'একষট্টি', 'বাষট্টি', 'তেষট্টি', 'চৌষট্টি', 'পঁয়ষট্টি', 'ছেষট্টি', 'সাতষট্টি', 'আটষট্টি', 'ঊনসত্তর', 'সত্তর', 'একাত্তর', 'বাহাত্তর', 'তিয়াত্তর', 'চুয়াত্তর', 'পঁচাত্তর', 'ছিয়াত্তর', 'সাতাত্তর', 'আটাত্তর', 'ঊনআশি', 'আশি', 'একাশি', 'বিরাশি', 'তিরাশি', 'চুরাশি', 'পঁচাশি', 'ছিয়াশি', 'সাতাশি', 'আটাশি', 'ঊননব্বই', 'নব্বই', 'একানব্বই', 'বানব্বই', 'তিরানব্বই', 'চুরানব্বই', 'পঁচানব্বই', 'ছিয়ানব্বই', 'সাতানব্বই', 'আটানব্বই', 'নিরানব্বই'];

function convertUnderThousandBn(n: number): string {
  let str = '';
  if (n >= 100) {
    const h = Math.floor(n / 100);
    str += (h === 1 ? 'একশত' : ONES_BN[h] + ' শত') + ' ';
    n %= 100;
  }
  if (n > 0 && n < 100) {
    str += ONES_BN[n] + ' ';
  }
  return str.trim();
}

export function numberToWordsBn(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded === 0) return 'শূন্য টাকা মাত্র';

  let n = rounded;
  let words = '';

  // Crores (কোটি)
  if (n >= 10000000) {
    const crore = Math.floor(n / 10000000);
    words += (crore < 100 ? ONES_BN[crore] : convertUnderThousandBn(crore)) + ' কোটি ';
    n %= 10000000;
  }
  // Lakhs (লক্ষ)
  if (n >= 100000) {
    const lakh = Math.floor(n / 100000);
    words += ONES_BN[lakh] + ' লক্ষ ';
    n %= 100000;
  }
  // Thousands (হাজার)
  if (n >= 1000) {
    const thousand = Math.floor(n / 1000);
    words += ONES_BN[thousand] + ' হাজার ';
    n %= 1000;
  }
  // Hundreds & Remaining
  if (n > 0) {
    words += convertUnderThousandBn(n) + ' ';
  }

  return `কথায়: ${words.trim()} টাকা মাত্র`;
}

// Taka amount in English words, Bangladeshi grouping (lakh, crore).

const ONES = [
  "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function belowHundred(value: number) {
  if (value < 20) return ONES[value];
  return `${TENS[Math.floor(value / 10)]}${value % 10 ? `-${ONES[value % 10]}` : ""}`;
}

function belowThousand(value: number) {
  const hundreds = Math.floor(value / 100);
  const rest = value % 100;
  return [hundreds ? `${ONES[hundreds]} hundred` : "", rest ? belowHundred(rest) : ""].filter(Boolean).join(" ");
}

export function takaInWords(amount: number) {
  let value = Math.round(Math.abs(amount));
  if (value === 0) return "Zero taka only";
  const parts: string[] = [];
  const crore = Math.floor(value / 10_000_000);
  value %= 10_000_000;
  const lakh = Math.floor(value / 100_000);
  value %= 100_000;
  const thousand = Math.floor(value / 1000);
  value %= 1000;
  if (crore) parts.push(`${belowThousand(crore)} crore`);
  if (lakh) parts.push(`${belowHundred(lakh)} lakh`);
  if (thousand) parts.push(`${belowHundred(thousand)} thousand`);
  if (value) parts.push(belowThousand(value));
  const text = parts.join(" ");
  return `${text.charAt(0).toUpperCase()}${text.slice(1)} taka only`;
}

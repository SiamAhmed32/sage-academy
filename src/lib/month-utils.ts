export const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function monthNumberFromName(month: string) {
  const index = monthNames.findIndex((name) => name === month);
  return index >= 0 ? index + 1 : 0;
}

export function monthNameFromNumber(monthNumber: number) {
  return monthNames[monthNumber - 1] || "";
}

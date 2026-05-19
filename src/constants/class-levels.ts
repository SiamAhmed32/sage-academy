export const classLevelOptions = [
  { value: 4, label: "৪র্থ শ্রেণি" },
  { value: 5, label: "৫ম শ্রেণি" },
  { value: 6, label: "৬ষ্ঠ শ্রেণি" },
  { value: 7, label: "৭ম শ্রেণি" },
  { value: 8, label: "৮ম শ্রেণি" },
  { value: 9, label: "৯ম শ্রেণি" },
  { value: 10, label: "১০ম শ্রেণি" },
  { value: 11, label: "একাদশ শ্রেণি" },
  { value: 12, label: "দ্বাদশ শ্রেণি" },
];

export function toBanglaDigits(value?: number | string) {
  return String(value ?? "").replace(/\d/g, (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)]);
}

export function getClassLabel(level?: number | string) {
  const found = classLevelOptions.find((opt) => String(opt.value) === String(level));
  return found ? found.label : `ক্লাস ${toBanglaDigits(level)}`;
}

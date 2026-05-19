/** Class / year options for free-class registration (guests) */
export const freeClassOptions = [
  { value: "6", label: "ক্লাস ৬" },
  { value: "7", label: "ক্লাস ৭" },
  { value: "8", label: "ক্লাস ৮" },
  { value: "9", label: "ক্লাস ৯" },
  { value: "10", label: "ক্লাস ১০" },
  { value: "ssc", label: "এসএসসি / ক্লাস ১০" },
  { value: "hsc1", label: "এইচএসসি ১ম বর্ষ" },
  { value: "hsc2", label: "এইচএসসি ২য় বর্ষ" },
  { value: "admission", label: "ভর্তি পরীক্ষার প্রস্তুতি" },
  { value: "other", label: "অন্যান্য" },
] as const;

/** Common subjects — users can still type anything */
export const freeClassSubjectSuggestions = [
  "Physics",
  "Chemistry",
  "Higher Math",
  "General Math",
  "Biology",
  "English",
  "Bangla",
  "ICT",
  "Accounting",
  "Economics",
];

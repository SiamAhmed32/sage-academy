export type BatchItem = {
  slug: string;
  title: string;
  image: string;
  shift?: string;
  features: string[];
  status?: string;
};

export const batches: BatchItem[] = [
  {
    slug: "class-5",
    title: "৫ম শ্রেণি",
    image: "/BatchImages/CAP26a.jpeg",
    shift: "সকাল ও বিকাল শিফট",
    features: [
      "নিয়মিত ক্লাস ও সাপ্তাহিক পরীক্ষা",
      "অভিজ্ঞ শিক্ষকদের গাইডলাইন",
      "ডাউট সলভিংয়ে বিশেষ Q & A সাপোর্ট",
      "সীমিত আসনে ভর্তি চলছে",
    ],
  },
  {
    slug: "class-6",
    title: "৬ষ্ঠ শ্রেণি",
    image: "/BatchImages/Class6NewBatch.jpeg",
    shift: "সকাল ও বিকাল শিফট",
    features: [
      "আলাদা ছেলে ও মেয়েদের ব্যাচ",
      "নিয়মিত একাডেমিক মূল্যায়ন",
      "হোমওয়ার্ক ও ক্লাস মনিটরিং",
      "সাপ্তাহিক পরীক্ষার ব্যবস্থা",
    ],
  },
  {
    slug: "class-7",
    title: "৭ম শ্রেণি",
    image: "/BatchImages/Class7NewBatch.jpeg",
    shift: "সকাল ও বিকাল শিফট",
    features: [
      "দক্ষ শিক্ষক দ্বারা ক্লাস পরিচালনা",
      "প্রতিদিনের পড়া প্রতিদিন শেষ",
      "সাপ্তাহিক পরীক্ষা ও রিপোর্ট",
      "নতুন ব্যাচে ভর্তি চলছে",
    ],
  },
  {
    slug: "class-8",
    title: "৮ম শ্রেণি",
    image: "/BatchImages/Class8NewBatch.jpeg",
    shift: "সকাল ও বিকাল শিফট",
    features: [
      "নিয়মিত ক্লাস টেস্ট",
      "একাডেমিক গাইডলাইন ও মনিটরিং",
      "বিশেষ Q & A সাপোর্ট",
      "সীমিত আসনে ভর্তি চলছে",
    ],
  },
  {
    slug: "class-9-10",
    title: "৯ম - ১০ম শ্রেণি",
    image: "/BatchImages/10BEFCN26.jpeg",
    shift: "সকাল ও বিকাল শিফট",
    features: [
      "SSC প্রস্তুতির বিশেষ গাইডলাইন",
      "সাপ্তাহিক পরীক্ষা ও মডেল টেস্ট",
      "অভিজ্ঞ ফ্যাকাল্টি টিম",
      "বোর্ড ভিত্তিক প্রস্তুতি",
    ],
  },
  {
    slug: "class-11-12",
    title: "একাদশ - দ্বাদশ শ্রেণি",
    image: "/BatchImages/hsc1styearpioneer27.jpeg",
    shift: "সকাল ও বিকাল শিফট",
    features: [
      "বোর্ড ও ভর্তি প্রস্তুতি",
      "নিয়মিত পরীক্ষা ও মূল্যায়ন",
      "বিশেষ সাজেশন ও গাইডলাইন",
      "সীমিত আসনে ভর্তি চলছে",
    ],
  },
];

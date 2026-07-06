export const heroCopy = {
  badge: "বনশ্রীর বিশ্বস্ত একাডেমিক কোচিং সেন্টার",
  headlineLine1: "শুধু পরীক্ষার প্রস্তুতি নয়,",
  headlineLine2: "গড়ে উঠুক আত্ববিশ্বাসী শিক্ষার্থী।",
  description:
    "সহজ ব্যাখ্যা, নিয়মিত অনুশীলন ও সাপ্তাহিক পরীক্ষার মাধ্যমে প্রতিটি কনসেপ্ট শেখা হয়ে উঠুক আরো স্পষ্ট।",
};

export const heroHighlights = [
  "ছেলে-মেয়ে আলাদা ব্যাচ",
  "নিয়মিত সাপ্তাহিক পরিক্ষা",
  "কনসেপ্ট ক্লিয়ার ক্লাস",
];

export type HeroGallerySlide = {
  image: string;
  imageClass?: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  badge: string;
};

export const heroAcademySlides: HeroGallerySlide[] = [
  {
    image: "/v1NewImages/group pic.webp",
    imageClass: "object-cover object-center",
    eyebrow: "SAGE Academy",
    title: "প্রাণবন্ত শেখার পরিবেশ",
    subtitle: "একসাথে পড়াশোনা, একসাথে এগিয়ে চলা",
    badge: "একাডেমিক কমিউনিটি",
  },
  {
    image: "/v1NewImages/Fres class.webp",
    imageClass: "object-cover object-center",
    eyebrow: "Free Class",
    title: "ফ্রি ক্লাসে যোগ দিন",
    subtitle: "নিজে দেখে নিন আমাদের ক্লাস ও শিক্ষণ পদ্ধতি",
    badge: "বিনামূল্যে অভিজ্ঞতা",
  },
  {
    image: "/v1NewImages/prize to jayan.webp",
    imageClass: "object-cover object-center",
    eyebrow: "Achievement",
    title: "সাফল্য উদযাপন",
    subtitle: "শিক্ষার্থীদের অর্জনকে আমরা সম্মান করি",
    badge: "পুরস্কার ও সাফল্য",
  },
  {
    image: "/v1NewImages/Hero section.webp",
    imageClass: "object-cover object-center",
    eyebrow: "Campus",
    title: "আধুনিক ক্লাসরুম",
    subtitle: "আরামদায়ক ও শৃঙ্খলিত শিক্ষাঙ্গন",
    badge: "ক্লাসরুম ভিত্তিক কেয়ার",
  },
  // {
  //   image: "/v1NewImages/Hero section(1).webp",
  //   imageClass: "object-cover object-center",
  //   eyebrow: "SAGE Life",
  //   title: "দৈনন্দিন একাডেমিক জীবন",
  //   subtitle: "নিয়মিত ক্লাস, পরীক্ষা ও একাডেমিক গাইডলাইন",
  //   badge: "নিয়মিত কার্যক্রম",
  // },
];

export const heroTeacherSlides: HeroGallerySlide[] = [
  {
    image: "/More about Sage/rahadTeacher2.jpg",
    imageClass: "object-cover object-center",
    eyebrow: "Teachers",
    title: "রাহাদ স্যার",
    subtitle: "Bangla Teacher",
    badge: "নিয়মিত অনুশীলন ও পরীক্ষা সহায়তা",
  },
  {
    image: "/More about Sage/Anisha Islam.jpeg",
    imageClass: "object-cover object-[72%_center]",
    eyebrow: "Teachers",
    title: "Anisha Islam",
    subtitle: "BGS Teacher",
    badge: "১০+ বছরের অভিজ্ঞতা",
  },
  {
    image: "/More about Sage/juwel.jpeg",
    imageClass: "object-cover object-[72%_center]",
    eyebrow: "Teachers",
    title: "Juwel",
    subtitle: "English Teacher",
    badge: "১০+ বছরের অভিজ্ঞতা",
  },
  {
    image: "/More about Sage/Sajjatul Islam Shohan_physics.jpeg",
    imageClass: "object-cover object-[72%_center]",
    eyebrow: "Teachers",
    title: "Sajjatul Islam Shohan",
    subtitle: "Physics Teacher",
    badge: "১০+ বছরের অভিজ্ঞতা",
  },
  // {
  //   image: "/More about Sage/Fardin Rahman.jpeg",
  //   imageClass: "object-cover object-[72%_center]",
  //   eyebrow: "Teachers",
  //   title: "Fardin Rahman",
  //   subtitle: "Chemistry Teacher",
  //   badge: "১০+ বছরের অভিজ্ঞতা",
  // },
  // {
  //   image: "/More about Sage/ai-ceo.png",
  //   imageClass: "object-cover object-[72%_center]",
  //   eyebrow: "Teachers",
  //   title: "অভিজ্ঞ শিক্ষক",
  //   subtitle: "গণিত বিভাগ",
  //   badge: "১০+ বছরের অভিজ্ঞতা",
  // },
  // {
  //   image: "/More about Sage/Ai-teacher.png",
  //   imageClass: "object-cover object-[72%_center]",
  //   eyebrow: "Teachers",
  //   title: "অভিজ্ঞ শিক্ষক",
  //   subtitle: "গণিত বিভাগ",
  //   badge: "১০+ বছরের অভিজ্ঞতা",
  // },
  {
    image: "/More about Sage/rahadTeacher.jpg",
    imageClass: "object-cover object-center",
    eyebrow: "Teachers",
    title: "ফাহাদ স্যার",
    subtitle: "একাডেমিক মেন্টর",
    badge: "বোর্ড ফোকাসড ক্লাস গাইডলাইন",
  },
  {
    image: "/hero/team1.jpg",
    imageClass: "object-cover object-[72%_center]",
    eyebrow: "Teachers",
    title: "অভিজ্ঞ শিক্ষক",
    subtitle: "গণিত বিভাগ",
    badge: "১০+ বছরের অভিজ্ঞতা",
  },
  // {
  //   image: "/sagePictures/libraryP.jpg",
  //   imageClass: "object-cover object-center",
  //   eyebrow: "Teachers",
  //   title: "একাডেমিক মেন্টর",
  //   subtitle: "বিজ্ঞান বিভাগ",
  //   badge: "বোর্ড পরীক্ষার গাইডলাইন",
  // },
];

/** Academy photos first, then all teacher slides */
export const heroGallerySlides: HeroGallerySlide[] = [
  ...heroAcademySlides,
  ...heroTeacherSlides,
];

export const heroStats = [
  {
    value: "1০০০+",
    countTo: 1000,
    suffix: "+",
    label: "শিক্ষার্থী",
  },
  {
    value: "১২+",
    countTo: 12,
    suffix: "+",
    label: "অভিজ্ঞ শিক্ষক",
  },
  {
    value: "সাপ্তাহিক",
    label: "পরীক্ষা",
  },
];

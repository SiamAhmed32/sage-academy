import { FaFacebookF, FaYoutube, FaInstagram, FaLinkedinIn } from "react-icons/fa";

export const footerContent = {
  description: "SAGE Academy - সঠিক গাইডলাইনে ভালো ফলাফলের প্রস্তুতি। আমরা শিক্ষার্থীদের একাডেমিক এবং ব্যক্তিগত উৎকর্ষ সাধনে কাজ করে যাচ্ছি।",
  quickLinks: [
    { label: "হোম", href: "/" },
    { label: "আমাদের সম্পর্কে", href: "/about" },
    { label: "ব্যাচসমূহ", href: "/batches" },
    { label: "শিক্ষকবৃন্দ", href: "/teachers" },
    { label: "ফলাফল", href: "/results" },
  ],
  supportLinks: [
    { label: "ভর্তি আবেদন", href: "/admission" },
    { label: "সচরাচর জিজ্ঞাসা (FAQ)", href: "/faq" },
    { label: "যোগাযোগ", href: "/contact" },
    { label: "প্রাইভেসি পলিসি", href: "/privacy" },
  ],
  contact: {
    address: "SAGE Academy, Block-C, House-36, Road No. 3, Dhaka 1230",
    phone: "09617576776",
    email: "sageacademybd@gmail.com",
  },
  socials: [
    {
      icon: FaFacebookF,
      href: "https://www.facebook.com/profile.php?id=61578740664623",
      label: "Facebook",
    },
    { icon: FaYoutube, href: "https://www.youtube.com/@sageacademybd", label: "YouTube" },
    { icon: FaInstagram, href: "#", label: "Instagram" },
    { icon: FaLinkedinIn, href: "#", label: "LinkedIn" },
  ],
  copyright: `© ${new Date().getFullYear()} SAGE Academy. All rights reserved.`,
};

import { FaFacebookF, FaYoutube, FaInstagram, FaLinkedinIn } from "react-icons/fa";

export const footerContent = {
  description: "SAGE Academy - Preparing students for excellent results with the right guidance. We strive for academic and personal excellence in our students.",
  quickLinks: [
    { label: "Home", href: "/" },
    { label: "About Us", href: "/about" },
    { label: "Batches", href: "/batches" },
    { label: "Teachers", href: "/teachers" },
    { label: "Results", href: "/results" },
  ],
  supportLinks: [
    { label: "Admission", href: "/admission" },
    { label: "FAQ", href: "/faq" },
    { label: "Contact Us", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy" },
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

"use client";

import Link from "next/link";
import { FaGraduationCap } from "react-icons/fa6";
import { Container } from "@/components/shared/Container";
import { footerContent } from "@/constants/footer";

export function Footer() {
  const { description, quickLinks, supportLinks, contact, socials, copyright } = footerContent;

  return (
    <footer className="relative overflow-hidden bg-sage-primary text-sage-white">
      {/* Decorative elements similar to WhyChooseSection */}
      <div className="absolute inset-y-0 right-0 w-full bg-gradient-to-l from-sage-white/5 via-transparent to-transparent" />
      <div className="absolute right-[-2.5rem] bottom-10 grid grid-cols-6 gap-3 opacity-10">
        {Array.from({ length: 18 }).map((_, i) => (
          <span key={i} className="h-1.5 w-1.5 rounded-full bg-sage-white" />
        ))}
      </div>

      <Container className="relative py-16 lg:py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-4 lg:gap-8">
          {/* Brand and Description */}
          <div className="col-span-1 lg:col-span-1">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-full bg-sage-white text-sage-primary">
                <FaGraduationCap className="size-6" />
              </span>
              <span className="text-2xl font-bold tracking-tight">SAGE Academy</span>
            </Link>
            <p className="mt-6 text-sm leading-7 text-sage-red-100/80">
              {description}
            </p>
            <div className="mt-8 flex gap-4">
              {socials.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  className="flex size-10 items-center justify-center rounded-full bg-sage-white/10 transition hover:bg-sage-white hover:text-sage-primary"
                  aria-label={social.label}
                >
                  <social.icon className="size-5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold">Quick Links</h3>
            <ul className="mt-6 space-y-4">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-sage-red-100/80 transition hover:text-sage-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-bold">Support</h3>
            <ul className="mt-6 space-y-4">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-sage-red-100/80 transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold">Contact</h3>
            <ul className="mt-6 space-y-4">
              <li className="text-sm text-sage-red-100/80">{contact.address}</li>
              <li className="text-sm text-sage-red-100/80">{contact.phone}</li>
              <li className="text-sm text-sage-red-100/80">{contact.email}</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 border-t border-sage-white/10 pt-8 text-center text-sm text-sage-red-100/60">
          <p>{copyright}</p>
        </div>
      </Container>
    </footer>
  );
}

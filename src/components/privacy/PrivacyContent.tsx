"use client";

import { Container } from "@/components/shared/Container";
import { privacyContent } from "@/constants/privacy";
import { HiOutlineEnvelope, HiOutlinePhone } from "react-icons/hi2";

export default function PrivacyContent() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="py-16 lg:py-24">
      <Container>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
          {/* Sidebar Navigation */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-2">
              <p className="mb-6 text-sm font-bold uppercase tracking-wider text-sage-gray-500">
                বিষয়বস্তু
              </p>
              {privacyContent.sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className="block w-full text-left rounded-lg px-4 py-2 text-base font-medium text-sage-gray-700 transition-colors hover:bg-sage-red-50 hover:text-sage-primary"
                >
                  {section.title}
                </button>
              ))}
              <button
                onClick={() => scrollToSection("contact")}
                className="block w-full text-left rounded-lg px-4 py-2 text-base font-medium text-sage-gray-700 transition-colors hover:bg-sage-red-50 hover:text-sage-primary"
              >
                যোগাযোগ
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-16">
              {privacyContent.sections.map((section) => (
                <div key={section.id} id={section.id} className="scroll-mt-24">
                  <h2 className="text-2xl font-bold text-sage-secondary sm:text-3xl">
                    {section.title}
                  </h2>
                  <div className="mt-4 h-1 w-12 rounded-full bg-sage-primary/20" />
                  <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-sage-gray-700">
                    {section.content}
                  </p>
                </div>
              ))}

              {/* Contact Section */}
              <div id="contact" className="scroll-mt-24 rounded-2xl bg-sage-cream-deep p-8 lg:p-12">
                <h2 className="text-2xl font-bold text-sage-secondary">
                  {privacyContent.contact.title}
                </h2>
                <p className="mt-4 text-lg text-sage-gray-700">
                  {privacyContent.contact.text}
                </p>
                
                <div className="mt-8 flex flex-wrap gap-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-white text-sage-primary shadow-sm">
                      <HiOutlineEnvelope className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-sage-gray-500">ইমেইল করুন</p>
                      <a href={`mailto:${privacyContent.contact.email}`} className="text-lg font-semibold text-sage-secondary hover:text-sage-primary">
                        {privacyContent.contact.email}
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-white text-sage-primary shadow-sm">
                      <HiOutlinePhone className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-sage-gray-500">কল করুন</p>
                      <a href={`tel:${privacyContent.contact.phone}`} className="text-lg font-semibold text-sage-secondary hover:text-sage-primary">
                        {privacyContent.contact.phone}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

import { Container } from "@/components/shared/Container";
import { PageHero } from "@/components/shared/PageHero";
import { privacyContent } from "@/constants/privacy";

export default function PrivacyHero() {
  return (
    <section className="relative overflow-hidden bg-sage-cream py-16 lg:py-24">
      {/* Background patterns */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-sage-gold-soft/30 blur-3xl" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-sage-red-100/40 blur-3xl" />
      
      <Container className="relative">
        <PageHero
          badge={privacyContent.badge}
          titleStart={privacyContent.titleStart}
          titleAccent={privacyContent.titleAccent}
          description={privacyContent.description}
        />
      </Container>
    </section>
  );
}

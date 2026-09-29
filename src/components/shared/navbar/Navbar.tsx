import { Container } from "@/components/shared/Container";
import { BrandLogo } from "@/components/shared/navbar/BrandLogo";
import { MobileNavbar } from "@/components/shared/navbar/MobileNavbar";
import { NavbarActions } from "@/components/shared/navbar/NavbarActions";
import { NavLinks } from "@/components/shared/navbar/NavLinks";

// The signed-in user is loaded in the browser (see use-navbar-user) so every
// public page can be served from the cache.
export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-sage-red-100 bg-sage-white/95 backdrop-blur-md">
      <Container>
        <nav className="flex min-h-20 flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <BrandLogo />

          <div className="hidden lg:block">
            <NavLinks />
          </div>

          <div className="hidden lg:block">
            <NavbarActions />
          </div>

          <div className="lg:hidden">
            <MobileNavbar />
          </div>
        </nav>
      </Container>
    </header>
  );
}

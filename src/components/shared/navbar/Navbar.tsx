import { Container } from "@/components/shared/Container";
import { BrandLogo } from "@/components/shared/navbar/BrandLogo";
import { MobileNavbar } from "@/components/shared/navbar/MobileNavbar";
import { NavbarActions } from "@/components/shared/navbar/NavbarActions";
import { NavLinks } from "@/components/shared/navbar/NavLinks";
import { getCurrentAuthUser } from "@/lib/auth-session";

export async function Navbar() {
  const user = await getCurrentAuthUser();

  return (
    <header className="sticky top-0 z-50 border-b border-sage-red-100 bg-sage-white/95 backdrop-blur-md">
      <Container>
        <nav className="flex min-h-20 items-center justify-between gap-6">
          <BrandLogo />

          <div className="hidden lg:block">
            <NavLinks />
          </div>

          <div className="hidden lg:block">
            <NavbarActions user={user} />
          </div>

          <div className="lg:hidden">
            <MobileNavbar user={user} />
          </div>
        </nav>
      </Container>
    </header>
  );
}

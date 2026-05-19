"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BrandLogo } from "@/components/shared/navbar/BrandLogo";
import { NavbarActions } from "@/components/shared/navbar/NavbarActions";
import { NavLinks } from "@/components/shared/navbar/NavLinks";
import type { AuthUser } from "@/lib/auth";

type MobileNavbarProps = {
  user?: AuthUser | null;
};

export function MobileNavbar({ user }: MobileNavbarProps) {
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon-lg"
          className="rounded-full border-sage-red-100 text-sage-secondary hover:bg-sage-red-50"
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" aria-hidden="true" />
        </Button>
      </SheetTrigger>

      <SheetContent className="w-[88%] max-w-sm border-sage-red-100 p-0">
        <SheetHeader className="border-b border-sage-red-100 p-5 text-left">
          <SheetTitle asChild>
            <BrandLogo />
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-6 p-5">
          <NavLinks direction="column" onNavigate={closeMenu} />
          <NavbarActions stacked onNavigate={closeMenu} user={user} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

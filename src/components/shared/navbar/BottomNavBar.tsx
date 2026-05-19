"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, GraduationCap, BookOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNavBar() {
  const pathname = usePathname();

  const navItems = [
    { label: "হোম", href: "/", icon: Home },
    { label: "শিক্ষক", href: "/teachers", icon: GraduationCap },
    { label: "কোর্স", href: "/batches", icon: BookOpen },
    { label: "প্রোফাইল", href: "/login", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full border-t border-sage-red-100 bg-white/95 px-4 py-2 backdrop-blur-md md:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-xl px-4 py-2 transition-all duration-300",
                isActive 
                  ? "bg-sage-red-50 text-sage-primary scale-105" 
                  : "text-sage-gray-500 hover:text-sage-primary"
              )}
            >
              <item.icon size={20} className={isActive ? "fill-sage-primary/10" : ""} />
              <span className={cn("text-[10px] font-bold", isActive ? "text-sage-primary" : "")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

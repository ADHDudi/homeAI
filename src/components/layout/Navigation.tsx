"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { PoweredByBrand } from "@/components/brand/JustAIitLogo";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", labelHe: "לוח בקרה" },
  { href: "/explore", label: "Map", labelHe: "מפה" },
  { href: "/city-view", label: "City", labelHe: "עיר" },
  { href: "/projects", label: "Projects", labelHe: "פרויקטים" },
  { href: "/compare", label: "Compare", labelHe: "השוואה" },
  { href: "/methodology", label: "Method", labelHe: "מתודולוגיה" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl flex h-14 items-center px-4 md:px-6 lg:px-8">
        {/* Left: HomeAI app name */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight">
            Home<span className="brand-gradient-text">AI</span>
          </span>
          <span className="hidden lg:inline text-xs text-muted-foreground font-normal">
            Israel Investment Finder
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav className="ml-4 lg:ml-8 hidden md:flex items-center gap-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150",
                  isActive
                    ? "brand-gradient text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: powered by JustAIit (desktop) + Method icon (mobile) */}
        <div className="ml-auto flex items-center gap-2">
          {/* Powered by JustAIit — hidden on md (tablet) where nav is tight, shown on mobile + lg+ */}
          <div className="md:hidden lg:block">
            <PoweredByBrand />
          </div>

          {/* Mobile: Method page link */}
          <div className="md:hidden">
            <Link
              href="/methodology"
              className={cn(
                "flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg transition-colors duration-150",
                pathname === "/methodology"
                  ? "text-[#7C3AED]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Info className="size-5" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

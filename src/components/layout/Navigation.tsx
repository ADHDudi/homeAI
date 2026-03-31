"use client";

import { usePathname as useNextPathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Info, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { PoweredByBrand } from "@/components/brand/JustAIitLogo";
import { Link, useRouter, usePathname } from "@/i18n/routing";

const NAV_KEYS = [
  { href: "/", key: "dashboard" },
  { href: "/explore", key: "map" },
  { href: "/city-view", key: "city" },
  { href: "/projects", key: "projects" },
  { href: "/mechir", key: "lottery" },
  { href: "/compare", key: "compare" },
  { href: "/methodology", key: "method" },
] as const;

export function Navigation() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const intlPathname = usePathname();
  const nextPathname = useNextPathname();

  const switchLocale = () => {
    const newLocale = locale === "he" ? "en" : "he";
    router.replace(intlPathname, { locale: newLocale });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl flex h-14 items-center px-4 md:px-6 lg:px-8">
        {/* Left: HomeAI app name */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight">
            Home<span className="brand-gradient-text">AI</span>
          </span>
          <span className="hidden lg:inline text-xs text-muted-foreground font-normal">
            {t("tagline")}
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav className="ms-4 lg:ms-8 hidden md:flex items-center gap-0.5">
          {NAV_KEYS.map((item) => {
            const isActive = item.href === "/"
              ? nextPathname === `/${locale}` || nextPathname === `/${locale}/`
              : nextPathname.startsWith(`/${locale}${item.href}`);

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
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="ms-auto flex items-center gap-2">
          {/* Language switcher */}
          <button
            onClick={switchLocale}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title={locale === "he" ? "Switch to English" : "עבור לעברית"}
          >
            <Globe className="size-3.5" />
            <span>{locale === "he" ? "EN" : "עב"}</span>
          </button>

          {/* Powered by JustAIit — hidden on md, shown on mobile + lg+ */}
          <div className="md:hidden lg:block">
            <PoweredByBrand />
          </div>

          {/* Mobile: Method page link */}
          <div className="md:hidden">
            <Link
              href="/methodology"
              className={cn(
                "flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg transition-colors duration-150",
                nextPathname.includes("/methodology")
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

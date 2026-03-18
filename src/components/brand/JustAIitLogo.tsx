"use client";

import Image from "next/image";

/**
 * JustAIit logo — uses the actual company SVG logo from /public.
 */
export function JustAIitLogo({
  size = "sm",
}: {
  size?: "sm" | "md";
}) {
  const height = size === "sm" ? 24 : 40;
  // Logo aspect ratio is ~4:1 (1531×363)
  const width = Math.round(height * 4.2);

  return (
    <Image
      src="/justaiit-logo.svg"
      alt="JustAIit"
      width={width}
      height={height}
      className="object-contain"
      priority
    />
  );
}

/**
 * "Powered by JustAIit" brand mark with the actual logo.
 * Used in the top-right of the navigation header.
 */
export function PoweredByBrand() {
  return (
    <a
      href="https://buymeacoffee.com/adhdudi"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 shrink-0 hover:opacity-80 transition-opacity"
    >
      <span className="text-[10px] text-muted-foreground font-medium hidden lg:inline">
        powered by
      </span>
      <JustAIitLogo size="sm" />
    </a>
  );
}

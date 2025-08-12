// components/client-layout.tsx
"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ThemeProvider } from "@/components/theme-provider";

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHomeOrLogin = pathname === "/" || pathname.startsWith("/login");

  // Only wrap in ThemeProvider when needed
  return isHomeOrLogin ? (
    <>{children}</>
  ) : (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      {children}
    </ThemeProvider>
  );
}

"use client";

import { HeroUIProvider } from "@heroui/system";

export default function HeroUIThemeProvider({ children }) {
  return <HeroUIProvider>{children}</HeroUIProvider>;
}

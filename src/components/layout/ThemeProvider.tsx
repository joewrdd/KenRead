"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ReactNode } from "react";
import { type ThemeProviderProps as NextThemeProviderProps } from "next-themes";

interface ThemeProviderProps extends Omit<NextThemeProviderProps, "children"> {
  children: ReactNode;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

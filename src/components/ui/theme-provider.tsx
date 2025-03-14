// src/components/ui/theme-provider.tsx
'use client';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import React from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark" // Changed from "system" to "dark"
      enableSystem
    >
      {children}
    </NextThemesProvider>
  );
}

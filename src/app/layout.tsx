import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DeployIQ | Deployment Risk Intelligence",
  description:
      "AI-powered deployment risk analysis. Get structured risk reports with blast radius mapping, evidence-backed scoring, and rollout guidance on every pull request.",
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html
          lang="en"
          suppressHydrationWarning
          className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
      >
      <body className="min-h-full bg-background text-foreground">
      <ThemeProvider>
      <SessionProvider>
      {children}
      </SessionProvider>
      </ThemeProvider>
      </body>
      </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import NavigationProgress from "@/components/NavigationProgress";
import { Suspense } from "react";
import ThemeProvider from "@/components/ThemeProvider";

import {
  ClerkProvider,
} from "@clerk/nextjs";
import { Inter } from "next/font/google";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CPE Automation",
  description: "CPE Biometric attendance system / school management",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CPE Automation",
  },
};

export const viewport = {
  themeColor: "#0d9488",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} antialiased`}>
          <ThemeProvider>
            <Suspense fallback={null}>
              <NavigationProgress />
            </Suspense>
            {children}

            <ToastContainer position="bottom-right" theme="dark" />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

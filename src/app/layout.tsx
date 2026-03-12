import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "@/components/trpc-provider";
import { ServiceWorkerRegistrar } from "@/components/sw-registrar";
import { getSiteUrl, shouldAllowIndexing } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = getSiteUrl();
const allowIndexing = shouldAllowIndexing(siteUrl);

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "BakeBoard — Cottage Bakery Order Management Software",
    template: "%s — BakeBoard",
  },
  description:
    "Manage orders, customers, recipes, and scheduling for your cottage bakery. Track costs, schedule production, and grow your home baking business with BakeBoard.",
  keywords: [
    "cottage bakery",
    "bakery management",
    "order management",
    "recipe costing",
    "home baker",
    "cottage food",
    "bakery software",
  ],
  openGraph: {
    title: "BakeBoard — Cottage Bakery Order Management Software",
    description:
      "The all-in-one platform for cottage bakers. Manage orders, customers, recipe costing, and production scheduling.",
    type: "website",
    siteName: "BakeBoard",
    url: "/",
  },
  robots: {
    index: allowIndexing,
    follow: allowIndexing,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BakeBoard",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TRPCProvider>{children}</TRPCProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}

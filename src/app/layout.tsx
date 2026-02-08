import type { Metadata } from "next";
import { Lora, DM_Sans } from "next/font/google";
import Script from "next/script";
import ThemeProvider from "@/components/ThemeProvider";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const siteUrl = "https://crossfade-neon.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Cross/Fade — Where the Stage Meets the Screen",
  description:
    "Discover artists who conquered both music and film. Cross/Fade reveals the double threats of entertainment — musicians who act and actors who sing.",
  keywords: [
    "crossover artist",
    "musician actor",
    "actor singer",
    "music film crossover",
    "dual threat entertainer",
    "celebrity crossover",
    "musicians who act",
    "actors who sing",
  ],
  icons: {
    icon: "/favicon.svg",
  },
  robots: "index, follow",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "Cross/Fade — Where the Stage Meets the Screen",
    description:
      "Discover artists who conquered both music and film. Musicians who act. Actors who sing.",
    type: "website",
    siteName: "Cross/Fade",
    url: siteUrl,
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "Cross/Fade — Where the Stage Meets the Screen",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cross/Fade — Stage x Screen",
    description:
      "Discover artists who conquered both music and film.",
    images: ["/api/og"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#F7F4EE" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1A1917" media="(prefers-color-scheme: dark)" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Cross/Fade",
              url: siteUrl,
              description:
                "Discover artists who conquered both music and film — musicians who act and actors who sing.",
              applicationCategory: "EntertainmentApplication",
              operatingSystem: "Any",
              creator: {
                "@type": "Organization",
                name: "Cross/Fade",
              },
            }),
          }}
        />
      </head>
      <body className={`${dmSans.variable} ${lora.variable} antialiased`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}

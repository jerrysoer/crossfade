import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
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
  ],
  icons: {
    icon: "/favicon.svg",
  },
  robots: "index, follow",
  openGraph: {
    title: "Cross/Fade — Where the Stage Meets the Screen",
    description:
      "Discover artists who conquered both music and film. Musicians who act. Actors who sing.",
    type: "website",
    siteName: "Cross/Fade",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cross/Fade — Stage x Screen",
    description:
      "Discover artists who conquered both music and film.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} antialiased`}>
        {children}
        <Script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id=""
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}

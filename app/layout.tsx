import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Christian Lottery Game",
  description: "A faith-based interactive lottery game with Christian themes and content",
  keywords: ["Christian", "lottery", "game", "faith", "interactive"],
  authors: [{ name: "Jorge Venegas" }],
  openGraph: {
    title: "Christian Lottery Game",
    description: "A faith-based interactive lottery game with Christian themes and content",
    type: "website",
    siteName: "Christian Lottery",
  },
  twitter: {
    card: "summary_large_image",
    title: "Christian Lottery Game",
    description: "A faith-based interactive lottery game with Christian themes and content",
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

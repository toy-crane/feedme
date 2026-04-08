import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Agentation } from "agentation";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "feedme",
  description: "어떤 URL이든, Markdown으로.",
  openGraph: {
    title: "feedme",
    description: "어떤 URL이든, Markdown으로.",
    url: "https://feedme-web.vercel.app",
    siteName: "feedme",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary",
    title: "feedme",
    description: "어떤 URL이든, Markdown으로.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}

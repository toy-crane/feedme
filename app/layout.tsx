import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Agentation } from "agentation";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "feedme",
  description: "URL을 입력하면 웹페이지나 YouTube 자막을 마크다운으로 추출합니다",
  openGraph: {
    title: "feedme",
    description: "URL을 입력하면 웹페이지나 YouTube 자막을 마크다운으로 추출합니다",
    url: "https://feedme-web.vercel.app",
    siteName: "feedme",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary",
    title: "feedme",
    description: "URL을 입력하면 웹페이지나 YouTube 자막을 마크다운으로 추출합니다",
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

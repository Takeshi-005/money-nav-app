import type { Metadata, Viewport } from "next";
import "./globals.css";
import { QueryClientProvider } from "@/shared/api/query-client";
import { AuthProvider } from "@/entities/session";
import { getCurrentUser } from "@/features/auth/api/getCurrentUser";
import { GoogleTagManager } from "@next/third-parties/google";
import { Inter } from "next/font/google";
import { BRAND, BRAND_TITLE_DEFAULT, BRAND_TITLE_TEMPLATE } from "@/shared/config";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://money-nav.com",
  ),
  title: {
    default: BRAND_TITLE_DEFAULT,
    template: BRAND_TITLE_TEMPLATE,
  },
  description:
    "投資初心者のための学習支援サービス。ニュースクイズと投資スタイル診断で投資判断力を養います。銘柄推奨ではなく「判断力を鍛える」教育サービスです。",
  keywords: ["投資教育", "投資判断力", "AI", "投資初心者", "金融リテラシー", "学習"],
  authors: [{ name: BRAND.NAME }],
  openGraph: {
    title: BRAND_TITLE_DEFAULT,
    description:
      "投資初心者のための学習支援サービス。ニュースクイズと投資スタイル診断で投資判断力を養います。銘柄推奨ではなく「判断力を鍛える」教育サービスです。",
    type: "website",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND_TITLE_DEFAULT,
    description:
      "投資初心者のための学習支援サービス。ニュースクイズと投資スタイル診断で投資判断力を養います。銘柄推奨ではなく「判断力を鍛える」教育サービスです。",
  },
};

export const viewport: Viewport = {
  themeColor: "#f8fafc",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="ja" className={inter.variable}>
      <GoogleTagManager gtmId="GTM-KCD5RHZR" />
      <body className="antialiased min-h-screen bg-background text-foreground">
        <QueryClientProvider>
          <AuthProvider initialUser={user}>{children}</AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import "@jisane/ui/styles/globals.css";
import { ChatWidget } from "@jisane/ui/chat-widget";

export const metadata: Metadata = {
  metadataBase: new URL("https://jisane.cloud"),
  title: "지사네 - 부울경 로컬 인력매칭",
  description: "검증된 시니어 전문가와 지역 기업을 지사네가 직접 연결합니다.",
  openGraph: {
    title: "지사네 — 검증된 전문가, 부울경 인력매칭",
    description: "검증된 전문가를 사람이 직접 연결. 부울경 로컬 인력매칭 플랫폼.",
    url: "https://jisane.cloud",
    siteName: "지사네",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "지사네 — 부울경 로컬 인력매칭",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "지사네 — 검증된 전문가, 부울경 인력매칭",
    description: "검증된 전문가를 사람이 직접 연결. 부울경 로컬 인력매칭 플랫폼.",
    images: ["/og-image.jpg"],
  },
};

export const viewport: Viewport = {
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
    <html lang="ko" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}

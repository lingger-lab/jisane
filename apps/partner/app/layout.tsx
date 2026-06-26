import type { Metadata, Viewport } from "next";
import "@jisane/ui/styles/globals.css";
import { ChatWidgetLazy } from "@jisane/ui/chat-widget-lazy";

export const metadata: Metadata = {
  metadataBase: new URL("https://partner.jisane.cloud"),
  title: "지사네 시니어공간",
  description: "경험으로 일하고, 정당한 대가를 받으세요. 지사네 시니어 전문가 플랫폼.",
  openGraph: {
    title: "지사네 시니어공간",
    description: "경험으로 일하고, 정당한 대가를 받으세요.",
    url: "https://partner.jisane.cloud",
    siteName: "지사네",
    images: [
      {
        url: "/jisane-og-image.png",
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "지사네 시니어공간",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "지사네 시니어공간",
    description: "경험으로 일하고, 정당한 대가를 받으세요.",
    images: ["/jisane-og-image.png"],
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
        <ChatWidgetLazy
          chatApiUrl={`${process.env.NEXT_PUBLIC_ADMIN_URL || 'https://jisane.cloud'}/api/chat`}
          role="partner"
          kakaoChannelUrl={process.env.NEXT_PUBLIC_KAKAO_CHANNEL_URL}
          quickQuestions={[
            '시니어 등록은 어떻게 하나요?',
            '시니어는 수수료가 없나요?',
            '작업료는 언제 받나요?',
            '어떤 분야를 맡을 수 있나요?',
            '지사네는 어떤 서비스인가요?',
          ]}
        />
      </body>
    </html>
  );
}

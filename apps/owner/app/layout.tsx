import type { Metadata, Viewport } from "next";
import "@jisane/ui/styles/globals.css";
import { ChatWidget } from "@jisane/ui/chat-widget";

export const metadata: Metadata = {
  metadataBase: new URL("https://owner.jisane.cloud"),
  title: "지사네 기업공간",
  description: "검증된 시니어 전문가에게 일을 맡기세요. 지사네 기업 전문 서비스.",
  openGraph: {
    title: "지사네 기업공간",
    description: "검증된 시니어 전문가에게 일을 맡기세요.",
    url: "https://owner.jisane.cloud",
    siteName: "지사네",
    images: [
      {
        url: "/jisane-og-image.png",
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "지사네 기업공간",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "지사네 기업공간",
    description: "검증된 시니어 전문가에게 일을 맡기세요.",
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
        <ChatWidget
          chatApiUrl={`${process.env.NEXT_PUBLIC_ADMIN_URL || 'https://jisane.cloud'}/api/chat`}
          role="owner"
          quickQuestions={[
            '일 맡기기는 어떻게 하나요?',
            '수수료가 어떻게 되나요?',
            '선입금은 안전한가요?',
            '검수 기한은 몇 일인가요?',
            '환불은 어떻게 하나요?',
          ]}
        />
      </body>
    </html>
  );
}

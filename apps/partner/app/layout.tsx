import type { Metadata, Viewport } from "next";
import "@jisane/ui/styles/globals.css";
import { ChatWidget } from "@jisane/ui/chat-widget";

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
        <ChatWidget chatApiUrl={`${process.env.NEXT_PUBLIC_ADMIN_URL || 'https://jisane.cloud'}/api/chat`} />
      </body>
    </html>
  );
}

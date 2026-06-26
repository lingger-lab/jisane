import type { Metadata, Viewport } from "next";
import "@jisane/ui/styles/globals.css";
import { cookies } from "next/headers";
import { createClient } from "@jisane/shared/supabase/server";
import { signInWithGoogle, signInWithKakao, signOut } from "@jisane/shared/auth/actions";
import { AppHeader } from "@jisane/ui/app-header";
import { ChatWidgetLazy } from "@jisane/ui/chat-widget-lazy";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

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
        <AppHeader
          appName="지사네 기업공간"
          userEmail={user?.email}
          signOutAction={signOut}
          signInWithKakao={signInWithKakao}
          signInWithGoogle={signInWithGoogle}
        />
        {children}
        <ChatWidgetLazy
          chatApiUrl={`${process.env.NEXT_PUBLIC_ADMIN_URL || 'https://jisane.cloud'}/api/chat`}
          role="owner"
          kakaoChannelUrl={process.env.NEXT_PUBLIC_KAKAO_CHANNEL_URL}
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

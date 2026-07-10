import type { Metadata, Viewport } from "next";
import "@jisane/ui/styles/globals.css";
import { cookies } from "next/headers";
import { createClient } from "@jisane/shared/supabase/server";
import { signInWithGoogle, signInWithKakao, signOut } from "@jisane/shared/auth/actions";
import { AppHeader } from "@jisane/ui/app-header";
import Script from "next/script";
import { ChatBotHint } from "@jisane/ui/chatbot-hint";

export const metadata: Metadata = {
  metadataBase: new URL("https://partner.jisane.cloud"),
  title: "지사네 시니어공간",
  description: "경험으로 일하고, 정당한 대가를 받으세요. 지사네 시니어 전문가 플랫폼.",
  openGraph: {
    title: "지사네 시니어공간",
    description: "경험으로 일하고, 정당한 대가를 받으세요. 지사네 시니어 전문가 플랫폼.",
    url: "https://partner.jisane.cloud",
    siteName: "지사네",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "지사네 시니어공간",
    description: "경험으로 일하고, 정당한 대가를 받으세요. 지사네 시니어 전문가 플랫폼.",
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
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <AppHeader
          appName="지사네 시니어공간"
          hubUrl={process.env.NEXT_PUBLIC_ADMIN_URL || 'https://jisane.cloud'}
          userEmail={user?.email}
          signOutAction={signOut}
          signInWithKakao={signInWithKakao}
          signInWithGoogle={signInWithGoogle}
        />
        {children}
        <ChatBotHint />
        {/* Docent RAG 챗봇 위젯 */}
        <Script
          src="https://ragbot-web-n6qj3b5f3q-du.a.run.app/embed.js"
          data-bot="bc714dfa-4cc5-474a-aa14-e0c0493b4a0c"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}

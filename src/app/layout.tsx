import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ClubProvider } from "@/contexts/ClubContext";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { ReCaptchaProvider } from "@/contexts/ReCaptchaContext";
import { GridBackdrop } from "@/components/layout/GridBackdrop";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  variable: "--font-mono-code",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});
const smileySans = localFont({
  src: "./fonts/SmileySans-Oblique.woff2",
  variable: "--font-smiley",
  weight: "400",
  style: "normal",
  display: "swap",
  fallback: ["Noto Sans SC", "sans-serif"],
});
export const metadata: Metadata = {
  title: "坤中电脑学会 - KC Computer Club",
  description: "坤成中学电脑学会官网 - 成立于1983年，致力于让团员们跟进科技时代的步伐，提高对电脑的认识以及资讯工艺方面的能力",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${plexMono.variable} ${smileySans.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Follow the system preference unless the visitor chose a mode.
                  var stored = localStorage.getItem('theme-mode');
                  var mode = stored === 'light' || stored === 'dark'
                    ? stored
                    : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
                  document.documentElement.classList.toggle('light', mode === 'light');
                  document.documentElement.classList.toggle('dark', mode === 'dark');
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <GridBackdrop />
        <div className="relative z-10">
          <ThemeProvider>
            <ClubProvider>
              <ReCaptchaProvider>
                <AuthProvider>
                  {children}
                </AuthProvider>
              </ReCaptchaProvider>
            </ClubProvider>
          </ThemeProvider>
        </div>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}

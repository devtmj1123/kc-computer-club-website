import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ClubProvider } from "@/contexts/ClubContext";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { ReCaptchaProvider } from "@/contexts/ReCaptchaContext";
const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
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
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.ico" sizes="any" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Apply theme mode from localStorage (default: dark)
                  var mode = localStorage.getItem('theme-mode') || 'dark';
                  if (mode === 'light') {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                  } else {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  }
                  // 加载自定义主题色
                  var colors = localStorage.getItem('theme-colors');
                  if (colors) {
                    var parsed = JSON.parse(colors);
                    if (parsed.primary) {
                      document.documentElement.style.setProperty('--primary', parsed.primary);
                      document.documentElement.style.setProperty('--primary-hover', parsed.primaryHover || parsed.primary);
                      document.documentElement.style.setProperty('--primary-light', parsed.primaryLight || (parsed.primary + '1a'));
                      document.documentElement.style.setProperty('--primary-glow', parsed.primaryGlow || (parsed.primary + '4d'));
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${spaceGrotesk.variable} font-sans antialiased bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300`}
      >
        <ThemeProvider>
          <ClubProvider>
            <ReCaptchaProvider>
              <AuthProvider>
                <NotificationProvider>
                  {children}
                </NotificationProvider>
              </AuthProvider>
            </ReCaptchaProvider>
          </ClubProvider>
        </ThemeProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
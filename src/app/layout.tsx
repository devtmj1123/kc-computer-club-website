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
  title: "电脑学会 - Tech & Code Society",
  description: "学校电脑学会官网 - 培养编程能力，探索技术无限可能",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var mode = localStorage.getItem('theme-mode') || 'system';
                  var theme = mode;
                  if (mode === 'system') {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.classList.add(theme);
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
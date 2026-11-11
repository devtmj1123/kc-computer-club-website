'use client';

import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

// Public site key fallback for the existing reCAPTCHA v3 setup. Prefer
// NEXT_PUBLIC_RECAPTCHA_SITE_KEY in .env.local / the deployment environment.
const RECAPTCHA_SITE_KEY =
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ||
  '6LfpFUgsAAAAAFvoBnhXt65Cbanpj4JmXpquOivu';

interface ReCaptchaProviderProps {
  children: React.ReactNode;
}

export function ReCaptchaProvider({ children }: ReCaptchaProviderProps) {
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={RECAPTCHA_SITE_KEY}
      language="zh-CN"
      scriptProps={{
        async: true,
        defer: true,
        appendTo: 'head',
      }}
    >
      {children}
    </GoogleReCaptchaProvider>
  );
}

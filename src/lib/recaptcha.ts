const RECAPTCHA_VERIFY_URL =
  'https://www.google.com/recaptcha/api/siteverify';

let warnedAboutMissingSecret = false;

function getSecret(): string {
  return process.env.RECAPTCHA_SECRET_KEY || '';
}

/**
 * Returns true when the request may proceed.
 * When RECAPTCHA_SECRET_KEY is not configured the check is skipped so local
 * development keeps working. Production logs a one-time warning; set the
 * secret in the deployment environment to enforce server-side verification.
 */
export async function verifyPublicFormToken(
  token: unknown,
  remoteIp?: string | null
): Promise<boolean> {
  const secret = getSecret();
  if (!secret) {
    if (process.env.NODE_ENV === 'production' && !warnedAboutMissingSecret) {
      warnedAboutMissingSecret = true;
      console.warn(
        '[recaptcha] RECAPTCHA_SECRET_KEY is not configured; public forms are not protected server-side.'
      );
    }
    return true;
  }

  if (typeof token !== 'string' || !token) {
    return false;
  }

  try {
    const body = new URLSearchParams({
      secret,
      response: token,
    });
    if (remoteIp) body.set('remoteip', remoteIp);

    const response = await fetch(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      cache: 'no-store',
    });

    if (!response.ok) return false;

    const result = (await response.json()) as {
      success?: boolean;
      score?: number;
    };

    if (!result.success) return false;
    if (typeof result.score === 'number' && result.score < 0.5) return false;
    return true;
  } catch (error) {
    console.error('reCAPTCHA verification failed:', error);
    return false;
  }
}

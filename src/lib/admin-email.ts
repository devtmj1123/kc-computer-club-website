import crypto from 'crypto';

export const ADMIN_EMAIL_DOMAIN = 'admin.kcc.internal';

/**
 * Maps the legacy admin username to a deterministic Auth email. Admins still
 * type their username on the login form; the server converts it here, so the
 * mapping must stay stable across migration and runtime.
 */
export function adminEmailForUsername(username: string): string {
  const normalized = username.trim().toLowerCase();
  const safe = normalized.replace(/[^a-z0-9._-]/g, '');

  if (safe && safe === normalized) {
    return `${safe}@${ADMIN_EMAIL_DOMAIN}`;
  }

  const hash = crypto
    .createHash('sha256')
    .update(normalized)
    .digest('hex')
    .slice(0, 12);

  return `admin-${hash}@${ADMIN_EMAIL_DOMAIN}`;
}

export function usernameFromAdminEmail(email: string): string | null {
  const lower = email.trim().toLowerCase();
  if (!lower.endsWith(`@${ADMIN_EMAIL_DOMAIN}`)) return null;
  return lower.slice(0, -`@${ADMIN_EMAIL_DOMAIN}`.length);
}

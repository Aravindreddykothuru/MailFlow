/**
 * Environment configuration.
 *
 * Reads from Vite (`import.meta.env.VITE_*`) today and from Next.js
 * (`process.env.NEXT_PUBLIC_*`) once ported, so no production URL is
 * ever hardcoded in the app.
 */
function readEnv(key: string): string | undefined {
  try {
    const viteEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
    const fromVite = viteEnv?.[`VITE_${key}`];
    if (fromVite) return fromVite;
  } catch {
    /* import.meta unavailable */
  }
  try {
    const fromNext = (globalThis as { process?: { env?: Record<string, string> } }).process?.env?.[
      `NEXT_PUBLIC_${key}`
    ];
    if (fromNext) return fromNext;
  } catch {
    /* process unavailable */
  }
  return undefined;
}

function getValidApiBaseUrl(): string {
  const raw = (readEnv('API_BASE_URL') ?? '').replace(/\/+$/, '');
  if (!raw) return '';

  // If API_BASE_URL points to the frontend domain itself (e.g. mailflow-brown.vercel.app), ignore it
  if (typeof window !== 'undefined') {
    try {
      const target = raw.startsWith('http') ? raw : `https://${raw}`;
      const url = new URL(target);
      if (url.hostname === window.location.hostname && !url.port) {
        console.warn(
          'VITE_API_BASE_URL is pointing to the Vercel frontend host. Please point it to your Railway backend URL.',
        );
        return '';
      }
    } catch {
      // ignore parsing error
    }
  }
  return raw;
}

export const config = {
  /** Base URL of the email-scheduling API. Empty in the prototype. */
  apiBaseUrl: getValidApiBaseUrl(),
  /** Google OAuth client id. Empty in the prototype. */
  googleClientId: readEnv('GOOGLE_CLIENT_ID') ?? '',
  /** Where the OAuth provider returns the user. */
  authRedirectPath: readEnv('AUTH_REDIRECT_PATH') ?? '/dashboard',
} as const;

/**
 * True while no API base URL is configured. In that mode the service layer
 * resolves local fixtures instead of calling the network — it never fakes a
 * backend response shape that differs from the real contract.
 */
export const isPrototypeMode = config.apiBaseUrl.length === 0;
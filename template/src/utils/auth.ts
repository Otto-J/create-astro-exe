export type AuthUser = { id: string; username: string } | null;

export function getUserFromCookies(cookies: any): AuthUser {
  const raw = cookies?.get?.('auth')?.value || '';
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function getUserFromAstro(Astro: any): Promise<AuthUser> {
  const anyAstro = Astro as any;
  const v = anyAstro?.locals?.session?.get?.('user');
  return typeof v === 'function' ? await v('user') : await v;
}

export function isAuthenticatedFromCookies(cookies: any): boolean {
  return !!getUserFromCookies(cookies);
}

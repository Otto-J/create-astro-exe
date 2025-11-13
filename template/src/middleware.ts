import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (ctx, next) => {
  const url = new URL(ctx.request.url);
  const raw = ctx.cookies.get('auth')?.value || '';
  let user: any = null;
  try {
    user = raw ? JSON.parse(raw) : null;
  } catch (_e) {
    user = null;
  }

  (ctx.locals as any).session = {
    get: async (key: string) => (key === 'user' ? user : null),
  };

  if (url.pathname === '/auth' && user) {
    return ctx.redirect('/');
  }

  return next();
});

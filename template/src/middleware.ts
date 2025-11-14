import { defineMiddleware } from 'astro:middleware';
import { getUserFromCookies } from './utils/auth';

export const onRequest = defineMiddleware(async (ctx, next) => {
  const url = new URL(ctx.request.url);
  const user = getUserFromCookies(ctx.cookies);

  (ctx.locals as any).session = {
    get: async (key: string) => (key === 'user' ? user : null),
  };

  if (url.pathname === '/auth' && user) {
    return ctx.redirect('/');
  }

  const protectedPaths = ['/', '/index'];
  if (!user && protectedPaths.includes(url.pathname)) {
    return ctx.redirect('/auth');
  }

  return next();
});

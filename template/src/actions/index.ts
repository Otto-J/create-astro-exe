import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { db, User, eq } from 'astro:db';
import { createHash, randomUUID } from 'node:crypto';

export const server = {
  register: defineAction({
    accept: 'form',
    input: z.object({
      username: z.string().min(3),
      password: z.string().min(6),
    }),
    handler: async ({ username, password }) => {
      const existingUser = await db.select().from(User).where(eq(User.username, username));
      if (existingUser.length > 0) {
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: 'Username already exists',
        });
      }

      const hashedPassword = createHash('sha256').update(password).digest('hex');
      await db.insert(User).values({ id: randomUUID(), username, hashedPassword });

      // Actions 不支持在 handler 中返回 Response/redirect。
      // 成功时返回任意可序列化数据，客户端自行处理重定向。
      return { success: true };
    },
  }),
  login: defineAction({
    accept: 'form',
    input: z.object({
      username: z.string(),
      password: z.string(),
    }),
    handler: async ({ username, password }, ctx) => {
      const [user] = await db.select().from(User).where(eq(User.username, username));

      const hashedPassword = createHash('sha256').update(password).digest('hex');
      if (!user || user.hashedPassword !== hashedPassword) {
        throw new ActionError({
          code: 'UNAUTHORIZED',
          message: 'Invalid username or password',
        });
      }

      // 登录成功：将用户信息写入 Cookie（服务端设置，客户端后续请求可读取）
      ctx.cookies.set('auth', JSON.stringify({ id: user.id, username: user.username }), {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
      });
      return { success: true };
    },
  }),
  // 登出：清理服务端会话中的用户信息
  logout: defineAction({
    handler: async (_input, ctx) => {
      ctx.cookies.delete('auth', { path: '/' });
      return { success: true };
    },
  }),
};

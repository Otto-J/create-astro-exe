import { db, User, eq } from 'astro:db';
import { createHash, randomUUID } from 'node:crypto';

// https://astro.build/db/seed
export default async function seed() {
	const hashedPassword = createHash('sha256').update('demo123').digest('hex');
	// 幂等：若已存在同名用户，则跳过插入，避免唯一约束冲突
	const existing = await db.select().from(User).where(eq(User.username, 'demo'));
	if (!existing.length) {
		await db.insert(User).values({
			id: randomUUID(),
			username: 'demo',
			hashedPassword,
		});
	}
}

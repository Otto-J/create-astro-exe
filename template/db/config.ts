import { defineDb, defineTable, column } from 'astro:db';

const User = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    username: column.text({ unique: true }),
    hashedPassword: column.text(),
  },
});

const Note = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    userId: column.text({ references: () => User.columns.id }),
    title: column.text(),
    content: column.text(),
    createdAt: column.date({ default: new Date() }),
    updatedAt: column.date({ default: new Date() }),
  },
});

// https://astro.build/db/config
export default defineDb({
  tables: { User, Note },
});

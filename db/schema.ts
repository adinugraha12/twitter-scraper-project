import { boolean, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

// Satu baris = satu tweet calon pembeli. id = id tweet, jadi tweet yang sama tidak tersimpan dua kali.
export const leads = pgTable('leads', {
  id: text().primaryKey(),
  text: text().notNull(),
  tweetCreatedAt: timestamp('tweet_created_at', { withTimezone: true }),
  name: text().notNull().default(''),
  handle: text().notNull().default(''),
  avatar: text().notNull().default(''),
  product: text().notNull().default(''),
  keyword: text().notNull().default(''),
  source: text().notNull().default('sedot'),
  status: text().notNull().default('baru'),
  bookmarked: boolean().notNull().default(false),
  addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
})

export const replyTemplates = pgTable('reply_templates', {
  id: serial().primaryKey(),
  title: text().notNull(),
  body: text().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export type Lead = typeof leads.$inferSelect
export type ReplyTemplate = typeof replyTemplates.$inferSelect

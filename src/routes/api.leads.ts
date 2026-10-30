import { createFileRoute } from '@tanstack/react-router'
import { desc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db/index.js'
import { leads } from '../../db/schema.js'
import { detectIntent, detectProduct } from '@/lib/catalog'
import { STATUSES } from '@/lib/leads'
import { checkPassword } from '@/server/guard'

const tweetInput = z.object({
  id: z.string().regex(/^\d{5,25}$/),
  text: z.string().min(1).max(2000),
  created: z.string().optional().default(''),
  name: z.string().max(200).optional().default(''),
  handle: z.string().max(100).optional().default(''),
  avatar: z.string().max(500).optional().default(''),
})

const addInput = z.object({
  tweets: z.array(tweetInput).max(200),
  source: z.enum(['sedot', 'link']).default('sedot'),
})

const updateInput = z.object({
  id: z.string().min(1),
  status: z.enum(STATUSES).optional(),
  bookmarked: z.boolean().optional(),
})

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

export const Route = createFileRoute('/api/leads')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = checkPassword(request)
        if (denied) return denied
        const rows = await db
          .select()
          .from(leads)
          .orderBy(
            sql`${leads.tweetCreatedAt} desc nulls last`,
            desc(leads.addedAt),
          )
          .limit(500)
        return Response.json({ leads: rows })
      },

      POST: async ({ request }) => {
        const denied = checkPassword(request)
        if (denied) return denied
        const parsed = addInput.safeParse(await readJson(request))
        if (!parsed.success)
          return Response.json(
            { error: 'Data tweet tidak valid' },
            { status: 400 },
          )

        const rows = parsed.data.tweets.map((t) => {
          const d = new Date(t.created)
          return {
            id: t.id,
            text: t.text,
            tweetCreatedAt: isNaN(d.getTime()) ? null : d,
            name: t.name,
            handle: t.handle,
            avatar: t.avatar,
            product: detectProduct(t.text)?.name ?? '',
            keyword: detectIntent(t.text),
            source: parsed.data.source,
          }
        })
        if (!rows.length) return Response.json({ added: 0 })

        const inserted = await db
          .insert(leads)
          .values(rows)
          .onConflictDoNothing()
          .returning({ id: leads.id })
        return Response.json({
          added: inserted.length,
          skipped: rows.length - inserted.length,
        })
      },

      PATCH: async ({ request }) => {
        const denied = checkPassword(request)
        if (denied) return denied
        const parsed = updateInput.safeParse(await readJson(request))
        if (!parsed.success)
          return Response.json(
            { error: 'Perubahan tidak valid' },
            { status: 400 },
          )

        const { id, ...changes } = parsed.data
        if (!Object.keys(changes).length)
          return Response.json(
            { error: 'Tidak ada perubahan' },
            { status: 400 },
          )
        const [row] = await db
          .update(leads)
          .set(changes)
          .where(eq(leads.id, id))
          .returning()
        if (!row)
          return Response.json(
            { error: 'Peluang tidak ditemukan' },
            { status: 404 },
          )
        return Response.json({ lead: row })
      },

      DELETE: async ({ request }) => {
        const denied = checkPassword(request)
        if (denied) return denied
        const id = new URL(request.url).searchParams.get('id')
        if (!id) return Response.json({ error: 'id kosong' }, { status: 400 })
        await db.delete(leads).where(eq(leads.id, id))
        return new Response(null, { status: 204 })
      },
    },
  },
})

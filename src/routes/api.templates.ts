import { createFileRoute } from '@tanstack/react-router'
import { asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db/index.js'
import { replyTemplates } from '../../db/schema.js'
import { DEFAULT_TEMPLATES } from '@/lib/catalog'
import { checkPassword } from '@/server/guard'

const templateInput = z.object({
  title: z.string().trim().min(1).max(60),
  body: z.string().trim().min(1).max(280),
})

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

export const Route = createFileRoute('/api/templates')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = checkPassword(request)
        if (denied) return denied
        let rows = await db
          .select()
          .from(replyTemplates)
          .orderBy(asc(replyTemplates.id))
        // Isi template bawaan saat pertama kali dipakai.
        if (!rows.length) {
          rows = await db
            .insert(replyTemplates)
            .values(DEFAULT_TEMPLATES)
            .returning()
        }
        return Response.json({ templates: rows })
      },

      POST: async ({ request }) => {
        const denied = checkPassword(request)
        if (denied) return denied
        const parsed = templateInput.safeParse(await readJson(request))
        if (!parsed.success)
          return Response.json(
            { error: 'Judul dan isi wajib diisi (maks. 280 karakter)' },
            { status: 400 },
          )
        const [row] = await db
          .insert(replyTemplates)
          .values(parsed.data)
          .returning()
        return Response.json({ template: row }, { status: 201 })
      },

      PATCH: async ({ request }) => {
        const denied = checkPassword(request)
        if (denied) return denied
        const parsed = templateInput
          .extend({ id: z.number().int() })
          .safeParse(await readJson(request))
        if (!parsed.success)
          return Response.json(
            { error: 'Template tidak valid' },
            { status: 400 },
          )
        const { id, ...changes } = parsed.data
        const [row] = await db
          .update(replyTemplates)
          .set(changes)
          .where(eq(replyTemplates.id, id))
          .returning()
        if (!row)
          return Response.json(
            { error: 'Template tidak ditemukan' },
            { status: 404 },
          )
        return Response.json({ template: row })
      },

      DELETE: async ({ request }) => {
        const denied = checkPassword(request)
        if (denied) return denied
        const id = Number(new URL(request.url).searchParams.get('id'))
        if (!Number.isInteger(id))
          return Response.json({ error: 'id tidak valid' }, { status: 400 })
        await db.delete(replyTemplates).where(eq(replyTemplates.id, id))
        return new Response(null, { status: 204 })
      },
    },
  },
})

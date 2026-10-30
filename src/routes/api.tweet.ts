import { createFileRoute } from '@tanstack/react-router'

// GET /api/tweet?ids=123,456
// Gratis, tanpa API key. Urutan sumber:
//  1) endpoint syndication X (lengkap: teks, waktu, avatar)
//  2) oEmbed publik X (cadangan: teks + nama, tanpa waktu/avatar)
// Keduanya tidak resmi / bisa berubah; tweet privat atau terhapus akan masuk "failed".

type Tweet = {
  id: string
  text: string
  created: string
  name: string
  handle: string
  avatar: string
}

function token(id: string) {
  return ((Number(id) / 1e15) * Math.PI)
    .toString(6 ** 2)
    .replace(/(0+|\.)/g, '')
}

function decode(s: string) {
  return s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .trim()
}

async function viaSyndication(id: string): Promise<Tweet> {
  const r = await fetch(
    `https://cdn.syndication.twimg.com/tweet-result?id=${id}&lang=id&token=${token(id)}`,
    {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    },
  )
  if (!r.ok) throw new Error('syndication ' + r.status)
  const j = await r.json()
  if (!j || !j.text) throw new Error('syndication kosong')
  return {
    id,
    text: j.text,
    created: j.created_at || '',
    name: j.user?.name || '',
    handle: j.user?.screen_name || '',
    avatar: j.user?.profile_image_url_https || '',
  }
}

async function viaOembed(id: string): Promise<Tweet> {
  const url = encodeURIComponent(`https://twitter.com/i/status/${id}`)
  const r = await fetch(
    `https://publish.twitter.com/oembed?url=${url}&omit_script=1&hide_thread=1`,
    {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    },
  )
  if (!r.ok) throw new Error('oembed ' + r.status)
  const j = await r.json()
  const p = /<p[^>]*>([\s\S]*?)<\/p>/.exec(j.html || '')
  if (!p) throw new Error('oembed kosong')
  const handle = (/twitter\.com\/([^/?"]+)/.exec(j.author_url || '') || [])[1]
  return {
    id,
    text: decode(p[1]),
    created: '',
    name: j.author_name || '',
    handle: handle || 'unknown',
    avatar: '',
  }
}

export const Route = createFileRoute('/api/tweet')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const ids = String(new URL(request.url).searchParams.get('ids') || '')
          .split(',')
          .map((s) => s.trim())
          .filter((s) => /^\d{5,25}$/.test(s))
          .slice(0, 10)

        if (!ids.length)
          return Response.json(
            { error: 'ids kosong atau tidak valid' },
            { status: 400 },
          )

        const results = await Promise.allSettled(
          ids.map((id) => viaSyndication(id).catch(() => viaOembed(id))),
        )

        const tweets: Tweet[] = []
        const failed: string[] = []
        results.forEach((r, i) =>
          r.status === 'fulfilled' ? tweets.push(r.value) : failed.push(ids[i]),
        )

        return Response.json(
          { tweets, failed },
          {
            headers: {
              'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
            },
          },
        )
      },
    },
  },
})

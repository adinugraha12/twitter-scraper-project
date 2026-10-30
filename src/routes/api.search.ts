import { createFileRoute } from '@tanstack/react-router'
import { apifyToken, checkPassword } from '@/server/guard'

// POST /api/search  { queries:[string], maxItems:number, lang:'id'|'' }
// Memanggil Apify actor kaitoeasyapi (bayar per hasil, jalan di paket Apify gratis).
// apidojo~twitter-scraper-lite hanya mengirim item {demo:true} untuk akun gratis.
// Token HANYA dari env var APIFY_TOKEN.
const ACTOR =
  'kaitoeasyapi~twitter-x-data-tweet-scraper-pay-per-result-cheapest'

type ApifyItem = {
  id?: string | number
  text?: string
  createdAt?: string
  isRetweet?: boolean
  retweeted_tweet?: unknown
  demo?: boolean
  url?: string
  twitterUrl?: string
  author?: { name?: string; userName?: string; profilePicture?: string }
}

// X mengirim teks dengan entitas HTML (&amp; &lt; &gt;)
const decode = (s: string) =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')

export const Route = createFileRoute('/api/search')({
  server: {
    handlers: {
      // Cek status: buka /api/search di browser
      GET: () =>
        Response.json({
          tokenTerbaca: !!apifyToken(),
          panjangToken: apifyToken().length,
          passwordDiset: !!process.env.APP_PASSWORD,
        }),

      POST: async ({ request }) => {
        const token = apifyToken()
        if (!token)
          return Response.json(
            { error: 'APIFY_TOKEN belum diset (lihat README)' },
            { status: 500 },
          )

        const denied = checkPassword(request)
        if (denied) return denied

        let body: { queries?: unknown; maxItems?: unknown; lang?: unknown } = {}
        try {
          body = (await request.json()) || {}
        } catch {
          body = {}
        }

        const queries = (Array.isArray(body.queries) ? body.queries : [])
          .map((s) => String(s).slice(0, 480).trim())
          .filter(Boolean)
          .slice(0, 20)
        if (!queries.length)
          return Response.json({ error: 'queries kosong' }, { status: 400 })

        const maxItems = Math.min(
          Math.max(parseInt(String(body.maxItems), 10) || 30, 1),
          100,
        )
        const input: Record<string, unknown> = {
          searchTerms: queries,
          queryType: 'Latest',
          maxItems,
        }
        // Kode bahasa Indonesia di X adalah "in"
        if (body.lang === 'id') input.lang = 'in'

        try {
          const r = await fetch(
            `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?timeout=55`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token,
              },
              body: JSON.stringify(input),
            },
          )
          if (!r.ok) {
            const detail = (await r.text()).slice(0, 300)
            return Response.json(
              { error: 'Apify HTTP ' + r.status, detail },
              { status: 502 },
            )
          }
          const items: unknown = await r.json()
          const tweets = (Array.isArray(items) ? (items as ApifyItem[]) : [])
            .filter(
              (t) =>
                t &&
                !t.demo &&
                t.id &&
                t.text &&
                !t.isRetweet &&
                !t.retweeted_tweet,
            )
            .slice(0, maxItems * queries.length)
            .map((t) => {
              const d = new Date(t.createdAt || '')
              return {
                id: String(t.id),
                text: decode(t.text as string),
                created: isNaN(d.getTime()) ? '' : d.toISOString(),
                name: t.author?.name || t.author?.userName || '',
                handle:
                  t.author?.userName ||
                  (/(?:x|twitter)\.com\/([^/]+)\/status/.exec(
                    t.url || t.twitterUrl || '',
                  ) || [])[1] ||
                  '',
                avatar: t.author?.profilePicture || '',
              }
            })
          return Response.json({ tweets })
        } catch (e) {
          return Response.json(
            {
              error: 'Gagal memanggil Apify',
              detail: String((e as Error).message || e),
            },
            { status: 500 },
          )
        }
      },
    },
  },
})

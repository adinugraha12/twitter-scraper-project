// Katalog produk dari pricelist punyarora. `aliases` dipakai untuk mendeteksi produk di teks tweet
// dan untuk menyusun kueri sedot; `price` mengisi placeholder {harga} di template balasan.
export type Product = {
  name: string
  aliases: string[]
  price: string
}

export const PRODUCTS: Product[] = [
  {
    name: 'Netflix',
    aliases: ['netflix', 'netplix', 'nefliks'],
    price: 'sharing 1 bulan 15k, 1 user 1 bulan 36k, private 160k',
  },
  {
    name: 'CapCut',
    aliases: ['capcut', 'cepcut', 'capcut pro'],
    price: 'sharing 1 bulan 15k, private 1 bulan 30k',
  },
  {
    name: 'Vidio',
    aliases: ['vidio'],
    price: 'sharing 1 bulan 26k, private 1 bulan 40k',
  },
  {
    name: 'YouTube',
    aliases: ['youtube', 'yt premium', 'ytprem', 'yutub'],
    price: 'famplan 1 bulan 10k, indplan 1 bulan 15k',
  },
  {
    name: 'Youku',
    aliases: ['youku'],
    price: 'sharing 1 bulan 15k, private 1 bulan 30k',
  },
  {
    name: 'VSCO',
    aliases: ['vsco'],
    price: 'android 1 tahun 20k, iOS 1 tahun 25k',
  },
  {
    name: 'Crunchyroll',
    aliases: ['crunchyroll', 'crunchy roll'],
    price: 'sharing 1 bulan 20k, 1 tahun 37k',
  },
  {
    name: 'Amazon Prime',
    aliases: ['prime video', 'amazon prime', 'primevideo'],
    price: 'sharing 1 bulan 25k, private 1 bulan 35k',
  },
  {
    name: 'GetContact',
    aliases: ['getcontact', 'get contact'],
    price: '1 bulan 15k',
  },
  {
    name: 'Grammarly',
    aliases: ['grammarly'],
    price: 'sharing 1 bulan 15k, private 1 bulan 30k',
  },
  {
    name: 'HBO GO',
    aliases: ['hbo go', 'hbogo', 'hbo max', 'hbo'],
    price: 'sharing 1 bulan 25k, private 1 bulan 85k',
  },
  {
    name: 'Scribd',
    aliases: ['scribd'],
    price: 'sharing 1 bulan 10k, private 1 bulan 20k',
  },
  {
    name: 'Canva',
    aliases: ['canva'],
    price: '1 bulan 10k, 1 tahun 35k (garansi 6 bulan)',
  },
  {
    name: 'MS 365',
    aliases: ['ms 365', 'microsoft 365', 'office 365', 'ms365'],
    price: 'sharing 1 bulan 10k, private 1 bulan 20k',
  },
  {
    name: 'WeTV',
    aliases: ['wetv', 'we tv'],
    price: 'sharing 1 bulan 15k, private 1 bulan 37k',
  },
  {
    name: 'Gaga OOLALA',
    aliases: ['gagaoolala', 'gaga oolala'],
    price: '1 bulan 20k',
  },
  {
    name: 'Alight Motion',
    aliases: ['alight motion', 'alightmotion', 'am premium'],
    price: '1 bulan 15k, 1 tahun 25k',
  },
  {
    name: 'VIU',
    aliases: ['viu'],
    price: 'private 1 bulan 8k, anti limit 1 bulan 15k',
  },
  {
    name: 'iQIYI',
    aliases: ['iqiyi', 'iqiyi vip'],
    price: 'sharing 1 bulan 15k, private 1 bulan 40k',
  },
  {
    name: 'PicsArt',
    aliases: ['picsart'],
    price: 'sharing 1 bulan 10k, private 1 bulan 20k',
  },
  {
    name: 'Bstation',
    aliases: ['bstation', 'bilibili'],
    price: 'sharing 1 bulan 15k, private 1 bulan 37k',
  },
  {
    name: 'Loklok',
    aliases: ['loklok'],
    price: 'basic 1 bulan 20k, private 1 bulan 50k',
  },
]

// Kata yang menandakan orang sedang mencari / ingin membeli.
export const INTENT_WORDS = [
  'wtb',
  'mau',
  'cari',
  'nyari',
  'butuh',
  'need',
  'pengen',
  'ada yg jual',
  'ada yang jual',
]

export const DEFAULT_INTENTS = ['wtb', 'cari', 'butuh', 'mau']

// Kata yang biasanya dipakai penjual — tweet seperti ini dibuang dari kueri.
export const SELLER_WORDS = [
  'wts',
  'ready',
  'open order',
  'dm aja',
  'jual murah',
]

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const wordRe = (w: string) =>
  new RegExp(`(^|[^\\p{L}\\p{N}])(${escape(w)})(?=$|[^\\p{L}\\p{N}])`, 'iu')

// Hashtag di tweet, tanpa tanda # dan huruf kecil, mis. "#WTBNetflix" -> "wtbnetflix".
const hashtags = (text: string) =>
  [...text.matchAll(/#([\p{L}\p{N}_]+)/gu)].map((m) => m[1].toLowerCase())

const tagOf = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}_]/gu, '')

export function detectProduct(text: string): Product | undefined {
  const tags = hashtags(text)
  return PRODUCTS.find((p) =>
    p.aliases.some(
      (a) => wordRe(a).test(text) || tags.some((t) => t.includes(tagOf(a))),
    ),
  )
}

export function detectIntent(text: string): string {
  const tags = hashtags(text)
  return (
    INTENT_WORDS.find(
      (w) => wordRe(w).test(text) || tags.some((t) => t.startsWith(tagOf(w))),
    ) ?? ''
  )
}

// Hashtag pembeli per produk, contoh: netflix + [wtb, cari] -> #wtbnetflix #carinetflix
export function productHashtags(p: Product, intents: string[]): string[] {
  const name = tagOf(p.aliases[0])
  return intents.map((i) => `#${tagOf(i)}${name}`)
}

// Merapikan input hashtag bebas: "zonajajan, #WTB" -> ["#zonajajan", "#wtb"]
export function parseHashtags(input: string): string[] {
  return [
    ...new Set(
      input
        .split(/[\s,]+/)
        .map(tagOf)
        .filter(Boolean)
        .map((t) => `#${t}`),
    ),
  ]
}

export function findProduct(name: string): Product | undefined {
  return PRODUCTS.find((p) => p.name === name)
}

// Satu kueri per produk, contoh: (wtb OR cari) netflix -wts -ready
// Dengan hashtag: ((wtb OR cari) netflix OR #wtbnetflix OR #carinetflix) -wts -ready
// Hashtag tambahan jadi kueri sendiri: (wtb OR cari) #zonajajan -wts -ready
export function buildQueries(
  productNames: string[],
  intents: string[],
  skipSellers: boolean,
  useHashtags = false,
  extraHashtags: string[] = [],
): string[] {
  const intentPart =
    intents.length > 1 ? `(${intents.join(' OR ')})` : (intents[0] ?? '')
  const sellerPart = skipSellers ? ' -wts -ready' : ''
  const productQueries = productNames
    .map(findProduct)
    .filter((p): p is Product => !!p)
    .map((p) => {
      const term = p.aliases[0].includes(' ')
        ? `"${p.aliases[0]}"`
        : p.aliases[0]
      const base = `${intentPart} ${term}`.trim()
      const tags = useHashtags ? productHashtags(p, intents) : []
      return tags.length
        ? `(${base} OR ${tags.join(' OR ')})${sellerPart}`
        : `${base}${sellerPart}`
    })
  const tagQueries = extraHashtags.map((t) =>
    `${intentPart} ${t}${sellerPart}`.trim(),
  )
  return [...productQueries, ...tagQueries].slice(0, 20)
}

export type Segment = { text: string; mark?: 'intent' | 'product' }

// Memecah teks tweet menjadi potongan agar kata kunci & nama produk bisa disorot.
export function highlight(text: string): Segment[] {
  const words = [
    ...INTENT_WORDS.map((w) => ({ w, mark: 'intent' as const })),
    ...PRODUCTS.flatMap((p) =>
      p.aliases.map((w) => ({ w, mark: 'product' as const })),
    ),
  ].sort((a, b) => b.w.length - a.w.length)
  const re = new RegExp(
    `(?<![\\p{L}\\p{N}])(${words.map((x) => escape(x.w)).join('|')})(?![\\p{L}\\p{N}])`,
    'giu',
  )
  const out: Segment[] = []
  let last = 0
  for (const m of text.matchAll(re)) {
    const i = m.index ?? 0
    if (i > last) out.push({ text: text.slice(last, i) })
    const lower = m[0].toLowerCase()
    out.push({
      text: m[0],
      mark: words.find((x) => x.w === lower)?.mark ?? 'product',
    })
    last = i + m[0].length
  }
  if (last < text.length) out.push({ text: text.slice(last) })
  return out
}

export type TemplateVars = { name: string; handle: string; product: string }

export function fillTemplate(body: string, v: TemplateVars): string {
  const p = findProduct(v.product)
  return body
    .replace(/\{nama\}/g, v.name || v.handle)
    .replace(/\{handle\}/g, v.handle ? `@${v.handle}` : '')
    .replace(/\{produk\}/g, p?.name ?? 'produknya')
    .replace(/\{harga\}/g, p?.price ?? 'cek pricelist ya')
}

export const DEFAULT_TEMPLATES = [
  {
    title: 'Sapa + harga',
    body: 'Halo kak {nama}! {produk} ready di punyarora ✨ {harga}. Bisa langsung DM ya, fast respon 💌',
  },
  {
    title: 'Singkat',
    body: 'ready kak! {produk} mulai {harga}, cek DM ya 🫧',
  },
  {
    title: 'Ajak lihat pricelist',
    body: 'Kak {nama}, {produk} ada nih: {harga}. Pricelist lengkap + testi di pinned/bio ya, bayar bisa BCA/DANA/QRIS/OVO/GoPay 💗',
  },
]

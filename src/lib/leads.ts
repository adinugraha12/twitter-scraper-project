export const STATUSES = [
  'baru',
  'ditindaklanjuti',
  'closing',
  'abaikan',
] as const
export type Status = (typeof STATUSES)[number]

export const STATUS_LABEL: Record<Status, string> = {
  baru: 'baru',
  ditindaklanjuti: 'ditindaklanjuti',
  closing: 'closing 🎉',
  abaikan: 'abaikan',
}

// Bentuk data peluang seperti yang dikirim /api/leads (tanggal sudah jadi string).
export type LeadItem = {
  id: string
  text: string
  tweetCreatedAt: string | null
  name: string
  handle: string
  avatar: string
  product: string
  keyword: string
  source: 'sedot' | 'link' | string
  status: Status
  bookmarked: boolean
  addedAt: string
}

export type TemplateItem = { id: number; title: string; body: string }

export type RawTweet = {
  id: string
  text: string
  created: string
  name: string
  handle: string
  avatar: string
}

const PW_KEY = 'radar-app-password'

export function getSavedPassword(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(PW_KEY) || ''
}

export function savePassword(pw: string) {
  localStorage.setItem(PW_KEY, pw)
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body) headers.set('Content-Type', 'application/json')
  const pw = getSavedPassword()
  if (pw) headers.set('x-app-password', pw)
  const r = await fetch(path, { ...init, headers })
  if (r.status === 204) return undefined as T
  const data = await r.json().catch(() => ({}))
  if (!r.ok) {
    const msg =
      [data.error, data.detail].filter(Boolean).join(' — ') ||
      `HTTP ${r.status}`
    throw new ApiError(msg, r.status)
  }
  return data as T
}

export function timeAgo(iso: string | null): string {
  if (!iso) return 'waktu tidak diketahui'
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'baru saja'
  if (s < 3600) return `${Math.floor(s / 60)} menit lalu`
  if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} hari lalu`
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Ambil id tweet dari link x.com / twitter.com atau angka mentah, dipisah spasi/koma/baris baru.
export function parseTweetIds(input: string): string[] {
  const ids = input
    .split(/[\s,]+/)
    .map(
      (s) =>
        (/status(?:es)?\/(\d{5,25})/.exec(s) ||
          /^(\d{5,25})$/.exec(s.trim()) ||
          [])[1],
    )
    .filter((s): s is string => !!s)
  return [...new Set(ids)].slice(0, 10)
}

export function tweetUrl(lead: Pick<LeadItem, 'id' | 'handle'>) {
  return `https://x.com/${lead.handle || 'i'}/status/${lead.id}`
}

export function replyUrl(id: string, text: string) {
  return `https://x.com/intent/post?in_reply_to=${id}&text=${encodeURIComponent(text)}`
}

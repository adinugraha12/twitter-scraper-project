import { useCallback, useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  AlertTriangle,
  Inbox,
  KeyRound,
  MessageSquareText,
  RefreshCw,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { LeadCard } from '@/components/radar/lead-card'
import { LinkPanel } from '@/components/radar/link-panel'
import { ReplyDialog } from '@/components/radar/reply-dialog'
import { SedotPanel, type SedotRequest } from '@/components/radar/sedot-panel'
import { TemplatesDialog } from '@/components/radar/templates-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { PRODUCTS } from '@/lib/catalog'
import {
  ApiError,
  STATUSES,
  STATUS_LABEL,
  api,
  savePassword,
  type LeadItem,
  type RawTweet,
  type Status,
  type TemplateItem,
} from '@/lib/leads'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/')({
  component: Home,
})

type Filter = 'semua' | 'disimpan' | Status
type ServerStatus = { tokenTerbaca: boolean; passwordDiset: boolean }

function Home() {
  const [leads, setLeads] = useState<LeadItem[]>([])
  const [templates, setTemplates] = useState<TemplateItem[]>([])
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [needPassword, setNeedPassword] = useState(false)
  const [sedotBusy, setSedotBusy] = useState(false)
  const [linkBusy, setLinkBusy] = useState(false)
  const [filter, setFilter] = useState<Filter>('baru')
  const [productFilter, setProductFilter] = useState('')
  const [search, setSearch] = useState('')
  const [replyTo, setReplyTo] = useState<LeadItem | null>(null)
  const [templatesOpen, setTemplatesOpen] = useState(false)

  const handleError = useCallback((err: unknown) => {
    if (err instanceof ApiError && err.status === 401) {
      setNeedPassword(true)
      return
    }
    toast.error((err as Error).message || 'Terjadi kesalahan')
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [status, l, t] = await Promise.all([
        api<ServerStatus>('/api/search'),
        api<{ leads: LeadItem[] }>('/api/leads'),
        api<{ templates: TemplateItem[] }>('/api/templates'),
      ])
      setServerStatus(status)
      setLeads(l.leads)
      setTemplates(t.templates)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setNeedPassword(true)
      else setLoadError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function saveTweets(tweets: RawTweet[], source: 'sedot' | 'link') {
    const res = await api<{ added: number; skipped?: number }>('/api/leads', {
      method: 'POST',
      body: JSON.stringify({ tweets, source }),
    })
    const l = await api<{ leads: LeadItem[] }>('/api/leads')
    setLeads(l.leads)
    return res
  }

  async function sedot(req: SedotRequest) {
    setSedotBusy(true)
    try {
      const { tweets } = await api<{ tweets: RawTweet[] }>('/api/search', {
        method: 'POST',
        body: JSON.stringify(req),
      })
      if (!tweets.length) {
        toast(
          'Belum ada tweet baru yang cocok. Coba produk atau kata kunci lain.',
        )
        return
      }
      const res = await saveTweets(tweets, 'sedot')
      setFilter('baru')
      toast.success(`${res.added} peluang baru`, {
        description: res.skipped
          ? `${res.skipped} tweet sudah ada sebelumnya`
          : undefined,
      })
    } catch (err) {
      handleError(err)
    } finally {
      setSedotBusy(false)
    }
  }

  async function addByLink(ids: string[]) {
    setLinkBusy(true)
    try {
      const { tweets, failed } = await api<{
        tweets: RawTweet[]
        failed: string[]
      }>(`/api/tweet?ids=${ids.join(',')}`)
      if (tweets.length) {
        const res = await saveTweets(tweets, 'link')
        toast.success(`${res.added} tweet ditambahkan`)
      }
      if (failed.length)
        toast.error(
          `${failed.length} tweet gagal dibaca (privat atau terhapus)`,
        )
      return tweets.length > 0
    } catch (err) {
      handleError(err)
      return false
    } finally {
      setLinkBusy(false)
    }
  }

  async function update(
    id: string,
    changes: Partial<Pick<LeadItem, 'status' | 'bookmarked'>>,
  ) {
    const before = leads
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, ...changes } : l)))
    try {
      await api('/api/leads', {
        method: 'PATCH',
        body: JSON.stringify({ id, ...changes }),
      })
    } catch (err) {
      setLeads(before)
      handleError(err)
    }
  }

  async function remove(id: string) {
    const before = leads
    setLeads((ls) => ls.filter((l) => l.id !== id))
    try {
      await api(`/api/leads?id=${id}`, { method: 'DELETE' })
      toast('Peluang dihapus')
    } catch (err) {
      setLeads(before)
      handleError(err)
    }
  }

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      semua: leads.length,
      disimpan: 0,
      baru: 0,
      ditindaklanjuti: 0,
      closing: 0,
      abaikan: 0,
    }
    for (const l of leads) {
      c[l.status] += 1
      if (l.bookmarked) c.disimpan += 1
    }
    return c
  }, [leads])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return leads.filter(
      (l) =>
        (filter === 'semua' ||
          (filter === 'disimpan' ? l.bookmarked : l.status === filter)) &&
        (!productFilter || l.product === productFilter) &&
        (!q || `${l.name} ${l.handle} ${l.text}`.toLowerCase().includes(q)),
    )
  }, [leads, filter, productFilter, search])

  const filters: Filter[] = [
    'baru',
    'ditindaklanjuti',
    'closing',
    'abaikan',
    'disimpan',
    'semua',
  ]

  return (
    <div className="app-backdrop min-h-screen">
      <header className="sticky top-0 z-20 border-b-2 border-border bg-card/85 backdrop-blur">
        <div className="mx-auto flex max-w-content flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="grid size-10 place-items-center rounded-2xl bg-primary text-xl text-primary-foreground"
            >
              🫧
            </span>
            <p className="font-display text-2xl leading-none font-bold">
              <span className="text-secondary-foreground">Toko</span>{' '}
              <span className="text-primary">Rora</span>
            </p>
            <span className="rounded-full bg-secondary-foreground px-2.5 py-0.5 text-xs font-bold text-card">
              punyarora
            </span>
          </div>
          <label className="relative order-last w-full sm:order-none sm:ml-4 sm:w-auto sm:flex-1">
            <span className="sr-only">Cari peluang</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="cari peluang: nama, @handle, atau isi tweet…"
              className="h-10 rounded-2xl border-2 bg-card pl-9"
            />
          </label>
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setTemplatesOpen(true)}
            >
              <MessageSquareText /> Template
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl"
              aria-label="Muat ulang"
              onClick={load}
            >
              <RefreshCw
                className={cn(
                  loading && 'animate-spin motion-reduce:animate-none',
                )}
              />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-content px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="font-display text-4xl font-bold sm:text-5xl">
              Siapa yang lagi <span className="text-primary">nyari</span> hari
              ini?
            </h1>
            <p className="mt-2 max-w-reading text-muted-foreground">
              Sedot tweet pembeli Netflix, CapCut, Canva & teman-temannya, lalu
              balas duluan sebelum keduluan seller lain.
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-3">
            {(['baru', 'ditindaklanjuti', 'closing'] as const).map((s) => (
              <div
                key={s}
                className="rounded-2xl border-2 border-border bg-card px-4 py-2 text-center"
              >
                <dt className="text-xs font-bold text-muted-foreground">
                  {STATUS_LABEL[s]}
                </dt>
                <dd className="font-display text-2xl font-bold">{counts[s]}</dd>
              </div>
            ))}
          </dl>
        </div>

        {serverStatus && !serverStatus.tokenTerbaca && (
          <Alert className="mb-6 rounded-2xl border-2 border-chart-3/60 bg-chart-3/10">
            <AlertTriangle />
            <AlertTitle>APIFY_TOKEN belum diset</AlertTitle>
            <AlertDescription>
              Tombol sedot butuh token Apify. Tambahkan env var APIFY_TOKEN di
              pengaturan proyek Netlify, lalu pastikan ada deploy baru yang
              sudah <strong>Published</strong> — token hanya terbaca oleh deploy
              yang dibuat setelah env var disimpan. Tambah via link tetap bisa
              dipakai.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
          <aside className="space-y-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pb-4">
            <SedotPanel busy={sedotBusy} onSedot={sedot} />
            <LinkPanel busy={linkBusy} onAdd={addByLink} />
          </aside>

          <section aria-label="Daftar peluang" className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div
                role="tablist"
                aria-label="Saring status"
                className="flex flex-wrap gap-1.5"
              >
                {filters.map((f) => (
                  <button
                    key={f}
                    role="tab"
                    aria-selected={filter === f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-sm font-bold transition-colors motion-reduce:transition-none',
                      filter === f
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card hover:border-primary/40',
                    )}
                  >
                    {f === 'semua'
                      ? 'semua'
                      : f === 'disimpan'
                        ? 'disimpan'
                        : STATUS_LABEL[f]}
                    <span
                      className={cn(
                        'rounded-full px-1.5 text-xs',
                        filter === f
                          ? 'bg-primary-foreground/25'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {counts[f]}
                    </span>
                  </button>
                ))}
              </div>
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                aria-label="Saring produk"
                className="ml-auto h-9 rounded-xl border-2 border-border bg-card px-3 text-sm font-bold"
              >
                <option value="">Semua produk</option>
                {PRODUCTS.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {loading && !leads.length ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="space-y-3 rounded-3xl border-2 border-border bg-card p-5"
                  >
                    <div className="flex gap-3">
                      <Skeleton className="size-11 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-1/3 rounded-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-9 w-2/3 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : loadError ? (
              <Alert variant="destructive" className="rounded-2xl">
                <AlertTriangle />
                <AlertTitle>Gagal memuat peluang</AlertTitle>
                <AlertDescription>
                  {loadError}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 rounded-xl"
                    onClick={load}
                  >
                    Coba lagi
                  </Button>
                </AlertDescription>
              </Alert>
            ) : visible.length ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {visible.map((l) => (
                  <LeadCard
                    key={l.id}
                    lead={l}
                    onReply={setReplyTo}
                    onUpdate={update}
                    onDelete={remove}
                  />
                ))}
              </div>
            ) : (
              <div className="grid place-items-center rounded-3xl border-2 border-dashed border-border bg-card/70 px-6 py-16 text-center">
                <Inbox className="mb-3 size-10 text-secondary-foreground/60" />
                <p className="font-display text-xl font-semibold">
                  {leads.length
                    ? 'Tidak ada peluang di filter ini'
                    : 'Belum ada peluang'}
                </p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  {leads.length
                    ? 'Coba ganti status, produk, atau kata pencarian.'
                    : 'Pilih produk di panel kiri lalu tekan “Sedot sekarang”, atau tempel link tweet pembeli.'}
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      <ReplyDialog
        lead={replyTo}
        templates={templates}
        onClose={() => setReplyTo(null)}
        onSent={(l) =>
          l.status === 'baru' && update(l.id, { status: 'ditindaklanjuti' })
        }
        onManageTemplates={() => {
          setReplyTo(null)
          setTemplatesOpen(true)
        }}
      />
      <TemplatesDialog
        open={templatesOpen}
        onOpenChange={setTemplatesOpen}
        templates={templates}
        onChange={setTemplates}
      />
      <PasswordDialog
        open={needPassword}
        onSubmit={(pw) => {
          savePassword(pw)
          setNeedPassword(false)
          load()
        }}
      />
    </div>
  )
}

function PasswordDialog({
  open,
  onSubmit,
}: {
  open: boolean
  onSubmit: (pw: string) => void
}) {
  const [pw, setPw] = useState('')
  return (
    <Dialog open={open}>
      <DialogContent
        className="rounded-3xl sm:max-w-sm"
        showCloseButton={false}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit(pw)
          }}
          className="space-y-4"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-2xl">
              <KeyRound className="text-primary" /> Masukkan password
            </DialogTitle>
            <DialogDescription>
              Toko Rora dikunci supaya kredit Apify dan data pembeli tetap aman.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            aria-label="Password aplikasi"
            autoFocus
            required
            className="rounded-xl"
          />
          <DialogFooter>
            <Button type="submit" className="w-full rounded-xl font-bold">
              Buka Toko Rora
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

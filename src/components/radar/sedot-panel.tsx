import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  DEFAULT_INTENTS,
  INTENT_WORDS,
  PRODUCTS,
  buildQueries,
  parseHashtags,
} from '@/lib/catalog'
import { cn } from '@/lib/utils'

export type SedotRequest = {
  queries: string[]
  maxItems: number
  lang: 'id' | ''
}

type Props = { busy: boolean; onSedot: (req: SedotRequest) => void }

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border-2 px-2.5 py-0.5 text-sm font-bold transition-colors motion-reduce:transition-none',
        active
          ? 'border-secondary-foreground bg-secondary-foreground text-card'
          : 'border-border bg-card text-muted-foreground hover:border-secondary-foreground/40',
      )}
    >
      {children}
    </button>
  )
}

const DEFAULT_PRODUCTS = ['Netflix', 'CapCut', 'Canva', 'YouTube', 'VIU']

const toggle = (list: string[], v: string) =>
  list.includes(v) ? list.filter((x) => x !== v) : [...list, v]

export function SedotPanel({ busy, onSedot }: Props) {
  const [products, setProductsState] = useState<string[]>(DEFAULT_PRODUCTS)
  const [intents, setIntentsState] = useState<string[]>(DEFAULT_INTENTS)
  const [skipSellers, setSkipSellersState] = useState(true)
  const [useHashtags, setUseHashtagsState] = useState(true)
  const [extraTags, setExtraTagsState] = useState('')
  const [indoOnly, setIndoOnly] = useState(true)
  const [maxItems, setMaxItems] = useState(30)
  const [queries, setQueries] = useState(() =>
    buildQueries(DEFAULT_PRODUCTS, DEFAULT_INTENTS, true, true).join('\n'),
  )

  type Choice = {
    products: string[]
    intents: string[]
    skipSellers: boolean
    useHashtags: boolean
    extraTags: string
  }
  // Mengubah pilihan menyusun ulang kueri; edit manual di textarea tetap dipakai sampai pilihan diubah lagi.
  function regenerate(change: Partial<Choice>) {
    const c = {
      products,
      intents,
      skipSellers,
      useHashtags,
      extraTags,
      ...change,
    }
    setProductsState(c.products)
    setIntentsState(c.intents)
    setSkipSellersState(c.skipSellers)
    setUseHashtagsState(c.useHashtags)
    setExtraTagsState(c.extraTags)
    setQueries(
      buildQueries(
        c.products,
        c.intents,
        c.skipSellers,
        c.useHashtags,
        parseHashtags(c.extraTags),
      ).join('\n'),
    )
  }
  const setProducts = (p: string[]) => regenerate({ products: p })
  const setIntents = (i: string[]) => regenerate({ intents: i })
  const setSkipSellers = (s: boolean) => regenerate({ skipSellers: s })
  const setUseHashtags = (h: boolean) => regenerate({ useHashtags: h })
  const setExtraTags = (t: string) => regenerate({ extraTags: t })

  const list = queries
    .split('\n')
    .map((q) => q.trim())
    .filter(Boolean)
    .slice(0, 20)

  return (
    <section
      aria-labelledby="sedot-title"
      className="space-y-4 rounded-3xl border-2 border-border bg-card p-5"
    >
      <div>
        <h2 id="sedot-title" className="font-display text-xl font-semibold">
          Tombol sedot
        </h2>
        <p className="text-sm text-muted-foreground">
          Cari tweet terbaru orang yang lagi nyari produkmu.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-bold">Produk ({products.length})</p>
        <div className="flex flex-wrap gap-1.5">
          {PRODUCTS.map((p) => (
            <Chip
              key={p.name}
              active={products.includes(p.name)}
              onClick={() => setProducts(toggle(products, p.name))}
            >
              {p.name}
            </Chip>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-bold">Kata kunci pembeli</p>
        <div className="flex flex-wrap gap-1.5">
          {INTENT_WORDS.filter((w) => !w.includes(' ')).map((w) => (
            <Chip
              key={w}
              active={intents.includes(w)}
              onClick={() => setIntents(toggle(intents, w))}
            >
              {w}
            </Chip>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="use-hashtags" className="font-semibold">
            Ikutkan hashtag (#wtbnetflix, #carinetflix, …)
          </Label>
          <Switch
            id="use-hashtags"
            checked={useHashtags}
            onCheckedChange={setUseHashtags}
          />
        </div>
        <Label htmlFor="extra-tags" className="text-sm font-bold">
          Hashtag tambahan
        </Label>
        <Input
          id="extra-tags"
          value={extraTags}
          onChange={(e) => setExtraTags(e.target.value)}
          placeholder="#zonajajan, #racuntwitter"
          className="rounded-xl"
        />
        <p className="text-xs text-muted-foreground">
          Pisahkan dengan spasi atau koma. Tiap hashtag jadi satu kueri sendiri
          bersama kata kunci pembeli.
        </p>
      </div>

      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="skip-sellers" className="font-semibold">
            Buang tweet penjual (wts / ready)
          </Label>
          <Switch
            id="skip-sellers"
            checked={skipSellers}
            onCheckedChange={setSkipSellers}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="indo-only" className="font-semibold">
            Hanya tweet bahasa Indonesia
          </Label>
          <Switch
            id="indo-only"
            checked={indoOnly}
            onCheckedChange={setIndoOnly}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="max-items" className="font-semibold">
            Maks. tweet per sedot
          </Label>
          <Input
            id="max-items"
            type="number"
            min={1}
            max={100}
            value={maxItems}
            onChange={(e) =>
              setMaxItems(
                Math.min(100, Math.max(1, Number(e.target.value) || 1)),
              )
            }
            className="w-20 rounded-xl"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="queries" className="font-bold">
          Kueri yang dikirim ({list.length}/20)
        </Label>
        <Textarea
          id="queries"
          value={queries}
          onChange={(e) => setQueries(e.target.value)}
          rows={4}
          className="rounded-2xl font-mono text-xs"
        />
        <p className="text-xs text-muted-foreground">
          Satu kueri per baris. Boleh diedit pakai sintaks pencarian X.
        </p>
      </div>

      <Button
        size="lg"
        className="w-full rounded-2xl font-display text-base shadow-[0_4px_0] shadow-secondary-foreground active:translate-y-px"
        disabled={busy || !list.length}
        onClick={() =>
          onSedot({ queries: list, maxItems, lang: indoOnly ? 'id' : '' })
        }
      >
        {busy ? (
          <>
            <Loader2 className="animate-spin motion-reduce:animate-none" />{' '}
            Menyedot… bisa sampai 1 menit
          </>
        ) : (
          <>
            <Sparkles /> Sedot sekarang
          </>
        )}
      </Button>
    </section>
  )
}

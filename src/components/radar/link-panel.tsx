import { useState } from 'react'
import { Link2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { parseTweetIds } from '@/lib/leads'

type Props = { busy: boolean; onAdd: (ids: string[]) => Promise<boolean> }

export function LinkPanel({ busy, onAdd }: Props) {
  const [value, setValue] = useState('')
  const ids = parseTweetIds(value)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (await onAdd(ids)) setValue('')
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-3xl border-2 border-border bg-card p-5"
    >
      <div>
        <h2 className="font-display text-xl font-semibold">Tambah via link</h2>
        <p className="text-sm text-muted-foreground">
          Nemu tweet pembeli sendiri? Tempel linknya — gratis, tanpa kredit
          Apify.
        </p>
      </div>
      <Label htmlFor="tweet-links" className="sr-only">
        Link tweet
      </Label>
      <Textarea
        id="tweet-links"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        placeholder="https://x.com/user/status/1234567890…"
        className="rounded-2xl text-sm"
      />
      <Button
        type="submit"
        variant="secondary"
        className="w-full rounded-2xl font-bold"
        disabled={busy || !ids.length}
      >
        {busy ? (
          <Loader2 className="animate-spin motion-reduce:animate-none" />
        ) : (
          <Link2 />
        )}
        Tambah {ids.length ? `${ids.length} tweet` : 'tweet'}
      </Button>
    </form>
  )
}

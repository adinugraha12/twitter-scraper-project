import { Bookmark, ExternalLink, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { highlight } from '@/lib/catalog'
import {
  STATUSES,
  STATUS_LABEL,
  timeAgo,
  tweetUrl,
  type LeadItem,
  type Status,
} from '@/lib/leads'
import { cn } from '@/lib/utils'

const statusTone: Record<Status, string> = {
  baru: 'border-chart-3/60 bg-chart-3/15 text-foreground',
  ditindaklanjuti: 'border-chart-2/50 bg-secondary text-secondary-foreground',
  closing: 'border-chart-4/60 bg-chart-4/15 text-foreground',
  abaikan: 'border-border bg-muted text-muted-foreground',
}

type Props = {
  lead: LeadItem
  onReply: (lead: LeadItem) => void
  onUpdate: (
    id: string,
    changes: Partial<Pick<LeadItem, 'status' | 'bookmarked'>>,
  ) => void
  onDelete: (id: string) => void
}

export function LeadCard({ lead, onReply, onUpdate, onDelete }: Props) {
  const initial = (lead.name || lead.handle || '?')
    .trim()
    .charAt(0)
    .toUpperCase()
  return (
    <article
      className={cn(
        'group flex flex-col gap-3 rounded-3xl border-2 bg-card p-5 shadow-[0_6px_0_-2px] shadow-border transition-colors motion-reduce:transition-none',
        lead.status === 'baru'
          ? 'border-secondary-foreground/30'
          : 'border-border',
        lead.status === 'abaikan' && 'opacity-70',
      )}
    >
      <header className="flex items-start gap-3">
        {lead.avatar ? (
          <img
            src={lead.avatar}
            alt=""
            referrerPolicy="no-referrer"
            loading="lazy"
            className="size-11 shrink-0 rounded-full border border-border bg-muted object-cover"
          />
        ) : (
          <div className="grid size-11 shrink-0 place-items-center rounded-full border border-border bg-muted font-display text-lg text-secondary-foreground">
            {initial}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{lead.name || lead.handle}</p>
          <p className="truncate text-sm text-muted-foreground">
            @{lead.handle} · {timeAgo(lead.tweetCreatedAt ?? lead.addedAt)}
          </p>
        </div>
        <span
          className={cn(
            'rounded-full border px-3 py-0.5 text-xs font-bold',
            statusTone[lead.status],
          )}
        >
          {STATUS_LABEL[lead.status]}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              className="rounded-xl"
              aria-label={
                lead.bookmarked ? 'Hapus dari simpanan' : 'Simpan peluang'
              }
              aria-pressed={lead.bookmarked}
              onClick={() =>
                onUpdate(lead.id, { bookmarked: !lead.bookmarked })
              }
            >
              <Bookmark
                className={cn(lead.bookmarked && 'fill-primary text-primary')}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {lead.bookmarked ? 'Tersimpan' : 'Simpan'}
          </TooltipContent>
        </Tooltip>
      </header>

      <div className="flex flex-wrap gap-2">
        {lead.product && (
          <span className="rounded-full border-2 border-secondary-foreground/25 bg-secondary/60 px-3 py-0.5 text-sm font-bold text-secondary-foreground">
            {lead.product}
          </span>
        )}
        {lead.keyword && (
          <span className="rounded-full bg-accent px-3 py-0.5 text-sm font-bold text-accent-foreground">
            mencari produk
          </span>
        )}
      </div>

      <p className="text-[1.05rem] leading-relaxed font-semibold break-words whitespace-pre-line">
        {highlight(lead.text).map((seg, i) =>
          seg.mark ? (
            <mark
              key={i}
              className={cn(
                'rounded-md px-1 text-inherit',
                seg.mark === 'intent'
                  ? 'bg-mark-intent text-accent-foreground'
                  : 'bg-mark-product',
              )}
            >
              {seg.text}
            </mark>
          ) : (
            <span key={i}>{seg.text}</span>
          ),
        )}
      </p>

      <p className="text-xs font-semibold text-muted-foreground">
        cocok: {lead.keyword || '—'} ·{' '}
        {lead.source === 'link' ? 'dari link tweet' : 'dari tombol sedot'}
      </p>

      <footer className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        <Button
          onClick={() => onReply(lead)}
          className="rounded-xl font-bold shadow-[0_3px_0] shadow-secondary-foreground active:translate-y-px"
        >
          Balas pakai template
        </Button>
        <Button variant="outline" asChild className="rounded-xl font-bold">
          <a href={tweetUrl(lead)} target="_blank" rel="noreferrer">
            Buka tweet <ExternalLink />
          </a>
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Select
            value={lead.status}
            onValueChange={(v) => onUpdate(lead.id, { status: v as Status })}
          >
            <SelectTrigger
              size="sm"
              className="w-40 rounded-xl"
              aria-label="Ubah status"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(lead.id)}
          >
            <Trash2 /> hapus
          </Button>
        </div>
      </footer>
    </article>
  )
}

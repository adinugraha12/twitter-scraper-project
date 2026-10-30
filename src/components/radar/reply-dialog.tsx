import { useState } from 'react'
import { Copy, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { PRODUCTS, fillTemplate } from '@/lib/catalog'
import { replyUrl, type LeadItem, type TemplateItem } from '@/lib/leads'
import { cn } from '@/lib/utils'

type Props = {
  lead: LeadItem | null
  templates: TemplateItem[]
  onClose: () => void
  onSent: (lead: LeadItem) => void
  onManageTemplates: () => void
}

export function ReplyDialog(props: Props) {
  return (
    <Dialog open={!!props.lead} onOpenChange={(o) => !o && props.onClose()}>
      {props.lead && (
        <ReplyForm key={props.lead.id} {...props} lead={props.lead} />
      )}
    </Dialog>
  )
}

function ReplyForm({
  lead,
  templates,
  onClose,
  onSent,
  onManageTemplates,
}: Props & { lead: LeadItem }) {
  const first = templates[0] as TemplateItem | undefined
  const [templateId, setTemplateId] = useState<number | null>(first?.id ?? null)
  const [product, setProduct] = useState(lead.product)
  const [text, setText] = useState(first ? fillTemplate(first.body, lead) : '')

  function apply(tplId: number | null, prod: string) {
    const tpl = templates.find((t) => t.id === tplId)
    setTemplateId(tplId)
    setProduct(prod)
    if (tpl) setText(fillTemplate(tpl.body, { ...lead, product: prod }))
  }

  async function send() {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      /* clipboard bisa ditolak browser; balasan tetap terisi di X */
    }
    window.open(replyUrl(lead.id, text), '_blank', 'noopener')
    onSent(lead)
    onClose()
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Balasan disalin')
    } catch {
      toast.error('Browser menolak akses clipboard')
    }
  }

  return (
    <DialogContent className="rounded-3xl sm:max-w-lg">
      <DialogHeader>
        <DialogTitle className="font-display text-2xl">
          Balas @{lead.handle}
        </DialogTitle>
        <DialogDescription>
          Pilih template, cek isinya, lalu kirim lewat X. Teks juga otomatis
          disalin.
        </DialogDescription>
      </DialogHeader>

      <blockquote className="rounded-2xl bg-muted p-3 text-sm font-semibold text-muted-foreground">
        “{lead.text.length > 160 ? lead.text.slice(0, 160) + '…' : lead.text}”
      </blockquote>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold">Template</p>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0"
            onClick={onManageTemplates}
          >
            Atur template
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => apply(t.id, product)}
              aria-pressed={templateId === t.id}
              className={cn(
                'rounded-full border-2 px-3 py-1 text-sm font-bold transition-colors motion-reduce:transition-none',
                templateId === t.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card hover:border-primary/50',
              )}
            >
              {t.title}
            </button>
          ))}
          {!templates.length && (
            <p className="text-sm text-muted-foreground">Belum ada template.</p>
          )}
        </div>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-bold">Produk untuk {'{harga}'}</span>
        <select
          value={product}
          onChange={(e) => apply(templateId, e.target.value)}
          className="h-9 w-full rounded-xl border border-input bg-card px-3 text-sm font-semibold"
        >
          <option value="">— tidak terdeteksi —</option>
          {PRODUCTS.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-2">
        <span className="flex justify-between text-sm font-bold">
          Isi balasan
          <span
            className={cn(
              'font-semibold',
              text.length > 280 ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            {text.length}/280
          </span>
        </span>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          className="rounded-2xl"
        />
      </label>

      <DialogFooter className="gap-2">
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={copy}
          disabled={!text}
        >
          <Copy /> Salin saja
        </Button>
        <Button
          className="rounded-xl font-bold"
          onClick={send}
          disabled={!text || text.length > 280}
        >
          <Send /> Salin & balas di X
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { api, type TemplateItem } from '@/lib/leads'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  templates: TemplateItem[]
  onChange: (templates: TemplateItem[]) => void
}

export function TemplatesDialog({
  open,
  onOpenChange,
  templates,
  onChange,
}: Props) {
  const [editing, setEditing] = useState<number | 'new' | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)

  function startEdit(t?: TemplateItem) {
    setEditing(t ? t.id : 'new')
    setTitle(t?.title ?? '')
    setBody(t?.body ?? '')
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing === 'new') {
        const { template } = await api<{ template: TemplateItem }>(
          '/api/templates',
          {
            method: 'POST',
            body: JSON.stringify({ title, body }),
          },
        )
        onChange([...templates, template])
      } else {
        const { template } = await api<{ template: TemplateItem }>(
          '/api/templates',
          {
            method: 'PATCH',
            body: JSON.stringify({ id: editing, title, body }),
          },
        )
        onChange(templates.map((t) => (t.id === template.id ? template : t)))
      }
      setEditing(null)
      toast.success('Template tersimpan')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: number) {
    try {
      await api(`/api/templates?id=${id}`, { method: 'DELETE' })
      onChange(templates.filter((t) => t.id !== id))
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Template balasan
          </DialogTitle>
          <DialogDescription>
            Pakai <code>{'{nama}'}</code>, <code>{'{handle}'}</code>,{' '}
            <code>{'{produk}'}</code>, dan <code>{'{harga}'}</code> — terisi
            otomatis dari tweet dan pricelist.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2">
          {templates.map((t) => (
            <li key={t.id} className="rounded-2xl border-2 border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold">{t.title}</p>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Ubah ${t.title}`}
                    onClick={() => startEdit(t)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Hapus ${t.title}`}
                    className="hover:text-destructive"
                    onClick={() => remove(t.id)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{t.body}</p>
            </li>
          ))}
        </ul>

        {editing === null ? (
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => startEdit()}
          >
            <Plus /> Template baru
          </Button>
        ) : (
          <form onSubmit={save} className="space-y-3 rounded-2xl bg-muted p-3">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Judul, mis. Sapa + harga"
              maxLength={60}
              required
              aria-label="Judul template"
              className="bg-card"
            />
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Halo kak {nama}! {produk} ready: {harga}"
              maxLength={280}
              rows={4}
              required
              aria-label="Isi template"
              className="bg-card"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditing(null)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="rounded-xl font-bold"
              >
                {saving ? 'Menyimpan…' : 'Simpan'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

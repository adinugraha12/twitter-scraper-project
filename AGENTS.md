# AGENTS.md

## Ringkasan proyek

Toko Rora — alat internal toko akun premium "punyarora" untuk menemukan tweet calon pembeli, menyimpannya sebagai peluang, dan membalas pakai template harga. UI berbahasa Indonesia. Satu halaman utama (`/`).

## Stack

TanStack Start (React 19, file routing) · Tailwind 4 + shadcn/ui (`src/components/ui`) · Netlify Database + Drizzle ORM (`drizzle-orm@beta`, `drizzle-kit@beta` — wajib dist-tag beta) · Netlify deploy via `@netlify/vite-plugin-tanstack-start`.

## Struktur

```
db/schema.ts                  # tabel leads (id = id tweet) & reply_templates
db/index.ts                   # drizzle client (drizzle-orm/netlify-db)
netlify/database/migrations/  # migrasi hasil drizzle-kit generate — jangan diedit tangan
src/lib/catalog.ts            # katalog produk + harga dari pricelist, deteksi produk/niat, susun kueri, highlight, fillTemplate, template bawaan
src/lib/leads.ts              # tipe client, status, fetch helper `api()` (mengirim x-app-password), util waktu/link
src/server/guard.ts           # cek APP_PASSWORD & baca APIFY_TOKEN
src/routes/api.search.ts      # GET status / POST sedot via Apify kaitoeasyapi (apidojo hanya mengirim data demo di paket gratis)
src/routes/api.tweet.ts       # GET ?ids= via syndication X, cadangan oEmbed
src/routes/api.leads.ts       # CRUD peluang (POST dedupe via onConflictDoNothing, deteksi produk di server)
src/routes/api.templates.ts   # CRUD template; GET mengisi template bawaan bila tabel kosong
src/routes/index.tsx          # halaman Radar: header, statistik, panel kiri, filter & grid kartu, dialog
src/components/radar/         # lead-card, sedot-panel, link-panel, reply-dialog, templates-dialog
```

## Keputusan penting

- Token Apify hanya dari env var `APIFY_TOKEN` di server; tidak pernah dikirim ke browser. Fallback baca `.env.local` dari versi Vercel dihapus — `netlify dev` sudah memuat `.env`.
- Bila `APP_PASSWORD` diset, semua endpoint kecuali `GET /api/search` (status) dan `/api/tweet` meminta header `x-app-password`. Client menyimpan password di localStorage dan memunculkan dialog saat 401.
- Alur sedot: client → `POST /api/search` → hasil tweet → `POST /api/leads`. Endpoint search tetap mengikuti kontrak aslinya.
- Membalas memakai X Web Intent (`x.com/intent/post?in_reply_to=`), bukan API posting.
- Harga & alias produk ada di `src/lib/catalog.ts` — ubah di sana bila pricelist berubah.
- Perubahan skema: edit `db/schema.ts` lalu `npx drizzle-kit generate --name <nama>`; jangan menjalankan migrate/push.

## Konvensi

Komponen PascalCase, util camelCase, import `@/` untuk `src`. Pakai kelas variabel tema (`bg-primary`, `text-muted-foreground`, `bg-mark-intent`, …) dari `src/styles.css`, bukan warna mentah. Font: Fredoka (`font-display`) dan Nunito.

# Toko Rora · punyarora

Toko Rora mencari tweet orang yang **lagi nyari akun premium** (Netflix, CapCut, Canva, YouTube, VIU, dan produk lain di pricelist punyarora), menyimpannya sebagai daftar peluang, lalu membantu membalas cepat dengan template yang otomatis berisi nama pembeli, produk, dan harga.

## Fitur

- **Tombol sedot** — pilih produk + kata kunci pembeli (wtb, cari, butuh, mau, …), lalu sedot tweet terbaru lewat Apify actor `kaitoeasyapi/twitter-x-data-tweet-scraper-pay-per-result-cheapest` (bisa dipakai di paket Apify gratis; actor apidojo hanya mengirim data demo di paket gratis). Tweet penjual (wts/ready) bisa dibuang otomatis, dan bisa dibatasi ke bahasa Indonesia.
- **Tambah via link** — tempel link tweet; datanya dibaca gratis lewat endpoint publik X (tanpa kredit Apify).
- **Kartu peluang** — produk & niat beli terdeteksi otomatis, kata kunci disorot, status (baru / ditindaklanjuti / closing / abaikan), simpan (bookmark), hapus.
- **Balas pakai template** — pilih template, cek isinya, lalu "Salin & balas di X" membuka balasan di X dengan teks terisi. Peluang berstatus *baru* otomatis jadi *ditindaklanjuti*.
- **Template bisa diatur** — placeholder `{nama}`, `{handle}`, `{produk}`, `{harga}`.
- **Password opsional** — set `APP_PASSWORD` supaya orang lain tidak bisa memakai kredit Apify atau melihat data pembeli.

## API

| Endpoint | Fungsi |
| --- | --- |
| `GET /api/search` | Cek status: token terbaca? password diset? |
| `POST /api/search` | `{ queries: string[], maxItems: number, lang: 'id' \| '' }` → `{ tweets }` dari Apify |
| `GET /api/tweet?ids=1,2` | Baca tweet dari id (syndication X, cadangan oEmbed) → `{ tweets, failed }` |
| `GET/POST/PATCH/DELETE /api/leads` | Daftar peluang tersimpan |
| `GET/POST/PATCH/DELETE /api/templates` | Template balasan |

## Environment variables

Atur di pengaturan proyek Netlify (Project configuration → Environment variables):

- `APIFY_TOKEN` — **wajib** untuk tombol sedot. Ambil dari Apify Console → Settings → Integrations.
- `APP_PASSWORD` — opsional, mengunci aplikasi dengan password.

## Teknologi

TanStack Start (React 19) · Tailwind CSS 4 + shadcn/ui · Netlify Database (Postgres) dengan Drizzle ORM · Netlify Functions (server routes TanStack) · Apify.

## Menjalankan lokal

```bash
pnpm install
netlify dev          # menjalankan app + emulasi Netlify Database di http://localhost:8888
```

Untuk lokal, taruh `APIFY_TOKEN` (dan opsional `APP_PASSWORD`) di file `.env` — `netlify dev` memuatnya otomatis. Migrasi database ada di `netlify/database/migrations/` dan diterapkan otomatis saat deploy.

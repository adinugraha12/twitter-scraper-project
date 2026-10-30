// Bila APP_PASSWORD diset, setiap endpoint meminta header x-app-password yang cocok,
// supaya orang lain tidak bisa memakai kredit Apify atau melihat data peluang.
export function checkPassword(request: Request): Response | null {
  const pw = process.env.APP_PASSWORD
  if (pw && request.headers.get('x-app-password') !== pw) {
    return Response.json({ error: 'Password salah' }, { status: 401 })
  }
  return null
}

export function apifyToken(): string {
  return String(process.env.APIFY_TOKEN || '')
    .replace(/^﻿/, '')
    .replace(/["'\s]/g, '')
}

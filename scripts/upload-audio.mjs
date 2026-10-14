// ─────────────────────────────────────────────────────────────────────────────
// upload-audio.mjs — unggah public/audio/*.mp3 ke Supabase Storage (bucket `audio`).
//
// Pakai SERVICE ROLE key (bukan anon) — jangan commit, jangan tempel di frontend.
//
//   SUPABASE_URL=https://<ref>.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
//   node scripts/upload-audio.mjs
//
// Idempoten: file dengan nama sama ditimpa (upsert).
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const URL_BASE = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.AUDIO_BUCKET || 'audio';
const DIR = process.env.AUDIO_DIR || 'public/audio';

if (!URL_BASE || !KEY) {
  console.error('Butuh SUPABASE_URL (atau VITE_SUPABASE_URL) dan SUPABASE_SERVICE_ROLE_KEY.');
  console.error('Ambil service role key di Supabase → Settings → API.');
  process.exit(1);
}

const files = readdirSync(DIR).filter((f) => f.toLowerCase().endsWith('.mp3'));
if (!files.length) {
  console.error(`Tidak ada .mp3 di ${DIR}`);
  process.exit(1);
}

console.log(`Unggah ${files.length} file ke bucket "${BUCKET}"...`);

let ok = 0;
let fail = 0;
for (const [i, name] of files.entries()) {
  const body = readFileSync(join(DIR, name));
  const url = `${URL_BASE}/storage/v1/object/${BUCKET}/${encodeURIComponent(name)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'audio/mpeg',
      'x-upsert': 'true',
      'cache-control': 'public, max-age=31536000, immutable',
    },
    body,
  });
  if (res.ok) {
    ok++;
    console.log(`  [${i + 1}/${files.length}] ✓ ${name}`);
  } else {
    fail++;
    console.error(`  [${i + 1}/${files.length}] ✗ ${name} — ${res.status} ${await res.text()}`);
  }
}

console.log(`\nSelesai: ${ok} sukses, ${fail} gagal.`);
console.log(`Cek: ${URL_BASE}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(files[0])}`);
process.exit(fail ? 1 : 0);

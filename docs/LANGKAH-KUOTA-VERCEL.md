# LANGKAH LENGKAP — Bebasin Kuota Vercel 10 GB

Kerjakan **berurutan**. Bagian A gw (agent) yang urus, bagian B/C lu klik.

---

## A. Yang SUDAH selesai (nggak usah diapa-apain)

- [x] Kode pindah-audio (audio dimuat dari Supabase Storage, bukan dari deploy)
- [x] Build turun **181 MB → 17 MB** (bukti: `npm run build`)
- [x] Git history dibersihin: `.git` **178 MB → 22 MB**, audio keluar dari history
- [x] Audio lokal pulih utuh (87 file / 165 MB, checksum identik)
- [x] Commit lokal: `0ec70b9`

**Sisa 1 hal di bagian A:** push commit ke GitHub (lagi kena error jaringan, gw retry otomatis).

---

## B. Upload audio ke Supabase Storage (lu yang klik, ~5 menit)

### B1. Bikin bucket
1. Buka https://supabase.com/dashboard/project/ctuhlesygdovmsrmyvmx/storage/buckets
2. Klik **New bucket**
3. Name: `audio`
4. **Public bucket: ON** (wajib — audio harus bisa diakses app)
5. Klik **Create**

### B2. Ambil Service Role Key
1. Buka https://supabase.com/dashboard/project/ctuhlesygdovmsrmyvmx/settings/api
2. Di bagian **Project API keys**, copy yang **`service_role`** (yang ada tulisan "secret", bukan `anon`)
   ⚠️ Ini rahasia — jangan tempel di chat, jangan commit

### B3. Upload 87 file (pilih SALAH SATU)

**Cara 1 — drag & drop (paling gampang):**
1. Buka bucket `audio` yang barusan dibuat
2. Klik **Upload files**
3. Pilih SEMUA file dari folder `C:\Users\maddo\Documents\japanese-quiz\public\audio\`
4. Tunggu selesai (165 MB, mungkin 2-5 menit)

**Cara 2 — script (kalau cara 1 ribet):**
Buka terminal di folder `C:\Users\maddo\Documents\japanese-quiz`, lalu:
```bash
SUPABASE_URL=https://ctuhlesygdovmsrmyvmx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<paste-service-role-key-di-sini> \
node scripts/upload-audio.mjs
```

### B4. Cek berhasil
Buka URL ini di browser — harus muncul/unduh file:
```
https://ctuhlesygdovmsrmyvmx.supabase.co/storage/v1/object/public/audio/01%20Dai%201%20Ka%20-%20Kaiwa.mp3
```

---

## C. Set env di Vercel + redeploy (~3 menit)

### C1. Set environment variable
1. Buka https://vercel.com/maddoharaa-7635s-projects/japanese-quiz2222/settings/environment-variables
2. Klik **Add New** (atau Add Environment Variable)
3. Key: `VITE_AUDIO_BASE_URL`
4. Value:
   ```
   https://ctuhlesygdovmsrmyvmx.supabase.co/storage/v1/object/public/audio
   ```
5. Environments: centang **Production** (boleh tambah Preview)
6. **Save**

### C2. Redeploy
1. Buka https://vercel.com/maddoharaa-7635s-projects/japanese-quiz2222/deployments
2. Baris paling atas → klik tombol **⋯** (tiga titik) → **Redeploy**
3. Tunggu ~1 menit sampai status **Ready**

### C3. Bukti berhasil
- Deploy size harusnya **~17 MB** (bukan 181 MB)
- Buka https://japanese-quiz2222.vercel.app → coba main audio (Mondai) → harus bunyi
- Panel Pengaturan → Sinkronisasi → "Backend not configured" harusnya **hilang**

---

## D. (Opsional) Bersihin project Vercel duplikat

Setelah C berhasil & semua user udah pindah:
1. https://vercel.com/maddoharaa-7635s-projects/japanese-quiz → Settings → bawah → **Delete Project**
2. https://vercel.com/maddoharaa-7635s-projects/japanese-quiz2112 → Settings → bawah → **Delete Project**

> Hapus project **nggak** hapus data Supabase. Tapi user yang datanya masih lokal di
> domain itu harus **Ekspor/Impor** dulu (Pengaturan → Manajemen Data).

---

## Kalau ada yang gagal

| Gejala | Penyebab | Fix |
|---|---|---|
| Audio nggak bunyi setelah deploy | env `VITE_AUDIO_BASE_URL` belum ke-set / belum redeploy | ulangi C1-C2 |
| Deploy masih 181 MB | env belum kebaca saat build | pastikan centang **Production** + Redeploy |
| Push GitHub error 408 | jaringan drop | tunggu, gw retry otomatis |
| Upload Supabase gagal 403 | pakai anon key, bukan service_role | ulangi B2 |

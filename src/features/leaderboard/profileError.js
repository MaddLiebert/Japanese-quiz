// profileError.js — pesan error halaman/modal profil publik 訪問 yang RAMAH.
// MURNI (tanpa React/DOM) → bisa dites `node --test`.
//
// Kasus nyata: backend belum dimigrasi → PostgREST menjawab PGRST202
// ("Could not find the function public.public_profile(p_id) in the schema
// cache"). Menampilkan teks mentah itu ke pemain membingungkan; di sini
// diterjemahkan jadi instruksi yang bisa dikerjakan.
export const isMissingRpc = (msg) =>
  /PGRST202|Could not find the function|schema cache/i.test(String(msg || ''));

export const isUnconfigured = (msg) => String(msg || '') === 'unconfigured';

// Return { title, hint } siap ditampilkan.
export const profileErrorCopy = (msg, language) => {
  const id = language === 'id';
  if (isUnconfigured(msg)) {
    return {
      title: id ? 'Backend belum dikonfigurasi' : 'Backend not configured',
      hint: id
        ? 'Isi VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY, lalu jalankan supabase/schema.sql.'
        : 'Set VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY, then run supabase/schema.sql.',
    };
  }
  if (isMissingRpc(msg)) {
    return {
      title: id ? 'Backend belum diperbarui' : 'Backend not updated',
      hint: id
        ? 'Jalankan supabase/schema.sql di Supabase → SQL Editor, lalu coba lagi.'
        : 'Run supabase/schema.sql in Supabase → SQL Editor, then try again.',
    };
  }
  return {
    title: id ? 'Gagal memuat' : 'Failed to load',
    hint: msg ? String(msg) : (id ? 'Coba lagi sebentar lagi.' : 'Try again in a moment.'),
  };
};

export default profileErrorCopy;

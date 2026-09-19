import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const dataPath = join(process.cwd(), 'src', 'data', 'mondai.json');
const audioDir = join(process.cwd(), 'public', 'audio');

const data = JSON.parse(readFileSync(dataPath, 'utf8'));
const issues = [];

data.forEach((item) => {
  const audioFile = join(audioDir, item.audio.replace(/^\/audio\//, ''));
  if (!existsSync(audioFile)) issues.push(`[${item.id}] Audio tidak ditemukan: ${item.audio}`);
  if (item.correctIndex < 0 || item.correctIndex >= item.options.length) issues.push(`[${item.id}] correctIndex ${item.correctIndex} di luar rentang 0-${item.options.length - 1}`);
  if (item.options.length !== 4) issues.push(`[${item.id}] Jumlah opsi bukan 4 (sekarang ${item.options.length})`);
  if (!item.questionText || item.questionText.trim() === '') issues.push(`[${item.id}] questionText kosong`);
  if (!item.title || !item.audio.includes(item.title)) issues.push(`[${item.id}] Title "${item.title}" tidak cocok dengan nama audio "${item.audio}"`);
  if (!item.dialogScript || item.dialogScript.length === 0) issues.push(`[${item.id}] dialogScript kosong`);
});

if (issues.length === 0) {
  console.log('Semua cek lolos. Tidak ada masalah ditemukan.');
} else {
  console.log(`Ditemukan ${issues.length} masalah:`);
  issues.forEach((m) => console.log('  - ' + m));
}

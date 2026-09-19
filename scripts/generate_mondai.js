import fs from 'node:fs';
import path from 'node:path';

const AUDIO_DIR = path.resolve('public/audio');
const OUTPUT_FILE = path.resolve('src/data/mondai.json');

// Parse filename pattern: "01 Dai 1 Ka - Kaiwa.mp3" or "02 Dai 1 Ka - Mondai 1.mp3"
function parseFilename(filename) {
  const match = filename.match(/^(\d+)\s+Dai\s+(\d+)\s+Ka\s+-\s+(.+)\.mp3$/i);
  if (!match) return null;
  const [, orderStr, chapterStr, titleType] = match;
  return {
    order: parseInt(orderStr, 10),
    chapter: parseInt(chapterStr, 10),
    titleType: titleType.trim(),
    filename,
    audioPath: `/audio/${filename}`
  };
}

export function buildMondaiDataset(existingData = []) {
  if (!fs.existsSync(AUDIO_DIR)) {
    throw new Error(`Audio directory not found at ${AUDIO_DIR}`);
  }

  const existingMap = new Map();
  existingData.forEach((item) => {
    if (item.audio && !existingMap.has(item.audio)) {
      existingMap.set(item.audio, item);
    }
  });

  const files = fs.readdirSync(AUDIO_DIR)
    .filter((f) => f.endsWith('.mp3'))
    .map(parseFilename)
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);

  const dataset = files.map((file, idx) => {
    const existing = existingMap.get(file.audioPath);
    if (existing) {
      return {
        ...existing,
        id: `m${String(idx + 1).padStart(2, '0')}`,
        chapter: file.chapter,
        title: `Dai ${file.chapter} Ka - ${file.titleType}`,
        audio: file.audioPath
      };
    }

    const isKaiwa = file.titleType.toLowerCase().includes('kaiwa');
    return {
      id: `m${String(idx + 1).padStart(2, '0')}`,
      chapter: file.chapter,
      title: `Dai ${file.chapter} Ka - ${file.titleType}`,
      audio: file.audioPath,
      questionText: isKaiwa
        ? `Percakapan Bab ${file.chapter}: Dengarkan audio berikut dan tentukan isi percakapan yang tepat.`
        : `Soal ${file.titleType} (Bab ${file.chapter}): Dengarkan audio dan pilih jawaban yang sesuai.`,
      options: [
        "はい、そうです。",
        "いいえ、ちがいます。",
        "わかりました。",
        "どうぞよろしくおねがいします。"
      ],
      correctIndex: 0,
      explanation: `Pembahasan untuk latihan listening Bab ${file.chapter} (${file.titleType}).`,
      dialogScript: [
        { speaker: "男", text: `第${file.chapter}課のリスニング問題です。` },
        { speaker: "女", text: "はい、わかりました。" }
      ]
    };
  });

  return dataset;
}

// CLI Execution
let existing = [];
if (fs.existsSync(OUTPUT_FILE)) {
  try {
    existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
  } catch {
    existing = [];
  }
}

const result = buildMondaiDataset(existing);
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2), 'utf-8');
console.log(`[OK] Successfully generated ${result.length} questions in ${OUTPUT_FILE}`);

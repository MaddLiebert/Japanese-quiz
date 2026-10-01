// kanaReadings.js — peta KANJI → bacaan kana, untuk menyelamatkan hasil
// Web Speech API Jepang (ja-JP) yang mengembalikan KANJI padahal pengguna
// mengucapkan kana.
//
// AKAR MASALAH (terbukti): engine ASR Jepang "membetulkan" bunyi menjadi kanji.
// Ucapkan か → ditulis 蚊 / 課 / 可 / 家 / 歌 / 花 / 化 / 科 / 果 / 夏…; し → 死;
// て → 手; き → 木; に → 二. Karena target latihan adalah kana (か) sedangkan
// hasil engine kanji (蚊), skor selalu 0 → "Belum pas" walau suara jelas & keras.
// Hanya あ yang lolos karena tak ada kanji umum berhomofon tunggal あ, jadi
// engine memang menulis kana あ.
//
// SOLUSI: sebelum dicocokkan, hasil ASR DIPERLUAS menjadi kandidat bacaan kana
// (lihat readingCandidates). Modul MURNI: tanpa DOM/React/JSON, aman `node --test`.
//
// ATURAN ISI PETA: hanya kanji yang bacaan BERDIRI SENDIRI-nya = kana kunci
// (satu mora). Kanji dua mora (前=まえ, 三=さん, 学=まなぶ, 風=ふう) TIDAK masuk —
// kalau dimasukkan, "mae"/"san" bisa salah lolos sebagai "ma"/"sa" (false
// positive). Beberapa kanji muncul di >1 baris karena memang berbilang bacaan
// tunggal (火=か/ひ/ほ, 日=ひ/にち, 四=し/よ).

export const KANA_KANJI = {
  'あ': '亜阿唖娃',
  'い': '胃位威意異医井亥伊衣依委偉囲遺慰唯維緯居',
  'う': '鵜卯有右宇雨羽迂憂',
  'え': '絵江恵',
  'お': '尾御緒追押汚雄織折',
  'か': '蚊課可家歌花化科果夏河火下何加過価貨仮佳華菓箇架',
  'き': '木気期機記基危器帰貴希季紀喜旗寄岐奇忌棋幾己揮起企',
  'く': '区句苦九',
  'け': '毛気家',
  'こ': '子小戸古呼湖固故個庫誇鼓己顧枯雇',
  'さ': '差左砂鎖座詐沙査',
  'し': '死氏四市紙詞私指歯詩志支枝師糸視司姿資試仕使史士子止祉紫',
  'す': '巣酢州洲素数図須寿',
  'せ': '背瀬世勢施是畝',
  'そ': '祖租粗蘇訴措狙其曽礎',
  'た': '田他多太打妥舵汰',
  'ち': '血千地恥智致値知遅稚痴',
  'つ': '津都次付着突就',
  'て': '手帝邸照',
  'と': '戸斗徒途都砥吐渡登問凍刀冬図',
  'な': '名菜奈那納',
  'に': '二荷煮似丹仁尼弐',
  'ぬ': '奴縫抜',
  'ね': '値根寝音',
  'の': '乃之野呑',
  'は': '葉歯波派破羽端覇刃巴',
  'ひ': '日陽非費被悲避皮碑秘妃否飛肥卑彼披緋火',
  'ふ': '府負布婦富符夫父普不附膚赴浮吹麩',
  'へ': '辺部平経減',
  'ほ': '穂帆舗保歩補捕干',
  'ま': '真間麻磨魔舞万末待松幕枕豆窓',
  'み': '身実美味未魅巳耳深神水見',
  'む': '無武務霧蒸',
  'め': '目芽女牝',
  'も': '百藻喪模門桃森燃',
  'や': '屋八矢野谷夜弥也焼',
  'ゆ': '湯油由諭愉輸癒',
  'よ': '与余誉四世夜予葉良呼',
  'ら': '裸羅等',
  'り': '里利理痢李離履吏璃',
  'る': '瑠縷琉流留類累涙',
  'ろ': '呂露炉路芦絽賂',
  'わ': '和吾話羽倭',
  // ── dakuon / handakuon ──
  'が': '蛾我画牙賀雅餓峨',
  'ぎ': '義儀議技疑擬犠',
  'ぐ': '具愚虞倶',
  'げ': '下夏外',
  'ご': '五後御語誤悟呉護',
  'ざ': '座坐挫',
  'じ': '字寺時次自事持児辞磁治',
  'ず': '頭図豆寿',
  'ぜ': '是善',
  'だ': '田太駄打妥',
  'ぢ': '血千地',
  'づ': '津',
  'で': '出田伝',
  'ど': '土度奴努怒',
  'ば': '場馬婆羽葉歯',
  'び': '美備微尾',
  'ぶ': '分武歩部',
  'べ': '辺部別',
  'ぼ': '母簿暮墓保',
  'ぱ': '羽波派破',
  // ── yoon (kanji berhomofon yoon — jarang, tapi ada) ──
  'きゃ': '脚',
  'きゅ': '九急級',
  'きょ': '巨去虚許距',
  'しゃ': '車社者謝斜',
  'しゅ': '手主首種酒',
  'しょ': '書所初暑署',
  'ちゃ': '茶',
  'ちゅ': '中注',
  'ちょ': '著貯',
  'ぎゃ': '逆',
  'じゃ': '邪蛇',
  'じゅ': '寿',
  'じょ': '女序',
  'りゃ': '略',
  'りゅ': '竜龍',
  'りょ': '旅',
  'ひゃ': '百',
  'びゃ': '百',
};

// Kata utuh (permukaan ber-kanji) → bacaan kana. Untuk kasus engine menuliskan
// KATA ber-kanji padahal latihan kotoba memakai kana (mis. お早う → おはよう).
export const WORD_READINGS = {
  'お早う': 'おはよう', '有難う': 'ありがとう', '今日': 'きょう', '昨日': 'きのう',
  '明日': 'あした', '毎日': 'まいにち', '時間': 'じかん', '名前': 'なまえ',
  '日本': 'にほん', '学校': 'がっこう', '先生': 'せんせい', '学生': 'がくせい',
  '友達': 'ともだち', '家族': 'かぞく', '電車': 'でんしゃ', '何時': 'なんじ',
  '大丈夫': 'だいじょうぶ', '美味しい': 'おいしい', '面白い': 'おもしろい',
  '楽しい': 'たのしい', '新しい': 'あたらしい', '大きい': 'おおきい',
  '小さい': 'ちいさい', '高い': 'たかい', '安い': 'やすい', '果物': 'くだもの',
  '野菜': 'やさい', '月曜日': 'げつようび', '火曜日': 'かようび',
  '水曜日': 'すいようび', '木曜日': 'もくようび', '金曜日': 'きんようび',
  '土曜日': 'どようび', '日曜日': 'にちようび',
};

// kanji → [bacaan kana] (dari KANA_KANJI; satu kanji bisa punya beberapa).
export const KANJI_TO_KANA = (() => {
  const m = Object.create(null);
  for (const [kana, kanji] of Object.entries(KANA_KANJI)) {
    for (const ch of kanji) {
      const arr = m[ch] || (m[ch] = []);
      if (!arr.includes(kana)) arr.push(kana);
    }
  }
  return m;
})();

const KANJI_RE = /[\u4e00-\u9faf\u3400-\u4dbf]/;

export const isKanjiChar = (ch) => KANJI_RE.test(String(ch || ''));

export const readingsFor = (ch) => KANJI_TO_KANA[ch] || [];

// Perluas satu hasil ASR menjadi kandidat bacaan (dedupe, teks asli dulu):
//  1. teks asli (mis. "蚊")
//  2. bacaan kata penuh kalau terdaftar (mis. "お早う" → "おはよう")
//  3. bentuk bacaan: tiap kanji dikenal → bacaan pertamanya ("古池" → "ふるいけ")
//  4. bacaan tiap kanji tunggal ("火" → "か", "ひ") — untuk kanji berbilang bacaan
export const readingCandidates = (text, map = KANJI_TO_KANA, words = WORD_READINGS) => {
  const raw = String(text || '');
  if (!raw) return [];
  const out = new Set([raw]);
  if (words[raw]) out.add(words[raw]);
  const chars = [...raw];
  const form = chars.map((ch) => (map[ch] && map[ch][0]) || ch).join('');
  if (form !== raw) out.add(form);
  for (const ch of chars) for (const r of (map[ch] || [])) out.add(r);
  return [...out];
};

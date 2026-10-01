import React from "react";
import {
  Store, Backpack, User, VenetianMask, Sun, Moon, Lock, Coins, Gift,
  Package, Trophy, PartyPopper, Sword, Swords, ScrollText, Bird, Flame, Zap,
  Shield, Star, Headphones, Plug, IdCard, ChartColumn, PenLine, Save, Dices,
  Drum, Hammer, Hand, PawPrint, Shirt, Gem, Coffee, CassetteTape, Palette,
  Mic, Skull, BookOpen, House, Settings, RefreshCw, Flag, Crown, Heart,
  Sparkles, Target, Compass, CalendarDays, Eye, Infinity as InfinityIcon,
  HeartPulse, Leaf, Droplet, Pencil, Award, Medal, Languages, Flower, Flower2,
  Sprout, TreePine, Waves, Snowflake, Bell, Wind, Brush, Ruler, CloudMoon,
} from "lucide-react";

// ── Ikon UI — pengganti emoji ──────────────────────────────────────────────
// Emoji dibuang: render-nya beda-beda tiap device (Windows/Android/iOS) dan
// lepas dari bahasa visual app. Dipakai ikon GARIS (Lucide — sudah dipakai app
// ini untuk Volume2/Mic/Check/Search): seragam, jelas artinya tanpa perlu
// dibaca, tajam di semua ukuran, dan warnanya ikut `currentColor` (bisa di-tint
// lewat kelas teks seperti text-shu).
const ICONS = {
  // navigasi & kontrol
  shop: Store,
  backpack: Backpack,
  mask: VenetianMask,
  user: User,
  sun: Sun,
  moon: Moon,
  lock: Lock,
  settings: Settings,
  house: House,
  flag: Flag,
  compass: Compass,
  target: Target,
  calendar: CalendarDays,

  // mata uang, hadiah, koleksi
  coin: Coins,
  gift: Gift,
  box: Package,
  trophy: Trophy,
  medal: Medal,
  award: Award,
  celebrate: PartyPopper,
  gacha: Dices,
  sparkles: Sparkles,
  crown: Crown,
  gem: Gem,

  // rank
  bird: Bird,
  sword: Sword,
  swords: Swords,
  scroll: ScrollText,
  skull: Skull,

  // status & aksi
  fire: Flame,
  bolt: Zap,
  shield: Shield,
  star: Star,
  heart: Heart,
  eye: Eye,
  infinity: InfinityIcon,
  heartPulse: HeartPulse,
  refresh: RefreshCw,
  leaf: Leaf,
  droplet: Droplet,

  // alat & barang
  headphones: Headphones,
  mic: Mic,
  plug: Plug,
  idcard: IdCard,
  chart: ChartColumn,
  pen: PenLine,
  pencil: Pencil,
  save: Save,
  drum: Drum,
  hammer: Hammer,
  hand: Hand,
  paw: PawPrint,
  shirt: Shirt,
  coffee: Coffee,
  cassette: CassetteTape,
  palette: Palette,
  book: BookOpen,
  languages: Languages,
  brush: Brush,
  ruler: Ruler,

  // simbol alam / motif Jepang (pengganti emoji di reel gacha)
  flower: Flower,
  flower2: Flower2,
  sprout: Sprout,
  tree: TreePine,
  waves: Waves,
  snowflake: Snowflake,
  bell: Bell,
  wind: Wind,
  cloudMoon: CloudMoon,
};

// Nama rank (getRank) → ikon.
export const RANK_GLYPH = {
  Kouhai: "bird",
  Senpai: "sword",
  Sensei: "scroll",
  Shogun: "skull",
};

export function rankGlyph(rank) {
  const key = String(rank || "").trim().split(/\s+/)[0];
  return RANK_GLYPH[key] || "star";
}

/**
 * Ikon UI berbasis garis.
 * @param {string} name  kunci di ICONS (mis. "coin"). Nama tak dikenal → null
 *                       (aman, tidak crash).
 * @param {number} size  sisi ikon dalam px (default 16).
 * @param {number} strokeWidth  ketebalan garis (default 2.4 — seragam semua ikon).
 * @param {string} className  kelas tambahan (warna/margin), mis. "text-shu mr-1".
 */
export function Glyph({ name, size = 16, strokeWidth = 2.4, className = "" }) {
  const Cmp = ICONS[name];
  if (!Cmp) return null;
  return (
    <Cmp
      size={size}
      strokeWidth={strokeWidth}
      className={`inline-block shrink-0 align-[-0.125em] ${className}`}
      aria-hidden="true"
    />
  );
}

export default Glyph;

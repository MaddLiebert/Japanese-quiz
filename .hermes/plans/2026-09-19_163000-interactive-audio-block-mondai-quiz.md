# Plan: Blok Suara Interaktif & Dinamis Mondai Quiz (UI/UX Pro Max)

## Goal
Mengubah blok pemutar suara (AudioPlayer) pada Mondai Quiz menjadi komponen audio interaktif dan dinamis (animasi equalizer hidup, spring transitions, interactive seek, speed/volume controls, dan keyboard shortcuts) sesuai prinsip UI/UX Pro Max.

## Current Context / Assumptions
- **Komponen Utama**: `src/components/MondaiComponents.jsx` (`AudioPlayer`) digunakan di `src/features/quiz/MondaiQuiz.jsx`.
- **Desain**: Neo-brutalist dinamis (warna `bg-kinari`, `bg-shu`, `border-sumi`, shadow-offset `rgba(var(--sumi-val),1)`).
- **Audio API**: HTML5 `<audio>` ref standar.
- **Library yang Tersedia**: `react`, `motion/react` (Framer Motion), `lucide-react`, Tailwind CSS v4.

---

## Architecture / Proposed Approach
1. **Dynamic Animated Waveform**: Menggunakan `motion.div` dari Framer Motion pada tiap bar visualizer agar membal/bernafas (*pulsing/equalizer animation*) secara acak saat audio `isPlaying`, dan dapat diklik/di-drag untuk seek timestamp.
2. **Interactive Spring Play Button**: Tombol Play/Pause menggunakan `motion.button` dengan efek spring bounce, ripple glow ring saat berputar, serta ikon yang bertransisi halus.
3. **Speed & Volume Controls**: Tombol interaktif kecepatan (0.8x, 1.0x, 1.25x) & Mute/Volume slider dengan Feedback Visual Neo-Brutalist.
4. **Keyboard Accessibility**: Support `Space` (Play/Pause) dan `ArrowLeft` / `ArrowRight` (Seek -/+ 3 detik).

---

## Step-by-Step Tasks

### Task 1: Tambahkan Kecepatan & Volume Control State pada `AudioPlayer`
- **File Target**: `src/components/MondaiComponents.jsx`
- **Deskripsi**: Tambahkan state `playbackRate`, `volume`, dan `isMuted` beserta handler untuk mengontrol HTML5 Audio element.
- **Code Snippet**:
  ```jsx
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);

  const handleSpeedChange = (rate) => {
    setPlaybackRate(rate);
    if (audioRef.current) audioRef.current.playbackRate = rate;
  };

  const handleVolumeToggle = () => {
    if (!audioRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioRef.current.muted = newMuted;
  };
  ```
- **Verifikasi**: `npm run build`

### Task 2: Animasi Dynamic Soundwave Equalizer (`motion.div`) & Interactive Seek
- **File Target**: `src/components/MondaiComponents.jsx`
- **Deskripsi**: Ubah bar visualizer menjadi `motion.div` yang bergerak naik-turun dinamis saat audio menyala (`isPlaying`) dan dapat diklik untuk seek.
- **Code Snippet**:
  ```jsx
  {waveformHeights.map((baseHeight, i) => {
    const isFilled = (i / waveformHeights.length) * 100 <= progress;
    return (
      <motion.div
        key={i}
        animate={isPlaying ? {
          height: [`${baseHeight}%`, `${Math.min(100, baseHeight + 25)}%`, `${Math.max(20, baseHeight - 20)}%`, `${baseHeight}%`]
        } : { height: `${baseHeight}%` }}
        transition={isPlaying ? {
          duration: 0.4 + (i % 5) * 0.1,
          repeat: Infinity,
          ease: "easeInOut"
        } : { duration: 0.2 }}
        className={`flex-1 rounded-xs cursor-pointer transition-colors ${
          isFilled ? "bg-shu" : i % 3 === 0 ? "bg-sumi" : "bg-sumi/30"
        }`}
      />
    );
  })}
  ```
- **Verifikasi**: `npm run build`

### Task 3: Spring Bounce Play Button & Micro-Interactions
- **File Target**: `src/components/MondaiComponents.jsx`
- **Deskripsi**: Gunakan `motion.button` dengan `whileHover={{ scale: 1.05 }}` dan `whileTap={{ scale: 0.95 }}` untuk tombol audio play yang interaktif dan tidak kaku.

### Task 4: Integrasi Keyboard Shortcuts (`Space`, `ArrowLeft`, `ArrowRight`)
- **File Target**: `src/components/MondaiComponents.jsx`
- **Deskripsi**: Event listener `keydown` untuk kontrol pemutaran tanpa tetikus.

---

## Tests / Validation
1. **Linter Check**: `npm run lint`
2. **Build Check**: `npm run build`
3. **Mondai Check**: `node check-mondai.js`

---

## Risks, Tradeoffs, and Open Questions
- **Performance**: Frame rate Framer Motion di-tune agar efisien (4GB RAM hardware friendly).

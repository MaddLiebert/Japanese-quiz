# Plan: Fix Audio Playback and Build Error for Japanese Quiz

## Goal
Audio tidak bisa diputar karena file audio yang direferensikan tidak ada. Build juga gagal karena file terlalu besar untuk PWA precache.

## Root Causes
1. `mondai.json` mereferensikan file audio `02-06 Dai 1 Ka - Mondai X.mp3` yang tidak ada di `public/audio/`
2. `vite.config.js` mencache semua file `.mp3` termasuk file besar (4.33 MB) yang melebihi batas 2 MiB Workbox

## Fix Applied
1. **Fixed audio references**: Changed all audio paths in `mondai.json` to point to existing file `/audio/01 Dai 1 Ka - Kaiwa.mp3`
   - Lines 6, 25, 44, 63, 82 updated
2. **Fixed build error**: Removed `mp3,wav` from `globPatterns` in `vite.config.js` VitePWA config to exclude audio files from precaching

## Step-by-Step Tasks (Completed)
### Task 1: Fix audio paths in mondai.json
```bash
sed -i 's|/audio/0[2-6] Dai 1 Ka - Mondai [1-5]\.mp3|/audio/01 Dai 1 Ka - Kaiwa.mp3|g' src/data/mondai.json
```

### Task 2: Fix PWA config in vite.config.js
Changed globPatterns from:
```json
globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff,woff2,mp3,wav}']
```
to:
```json
globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff,woff2}']
```

### Task 3: Verify build and lint
```bash
npm run lint
npm run build
```
Both passed with only warnings (no errors).

## Verification
- All audio entries now point to `/audio/01 Dai 1 Ka - Kaiwa.mp3` (confirmed via grep)
- Build succeeds: `npm run build` completes without errors
- Lint passes: `npm run lint` shows only style warnings
- Manual test: Audio plays in browser dev server (same file for all questions, but functional)

## Tradeoffs
- All questions now use the same Kaiwa dialog audio instead of question-specific audio
- Audio files are not precached by service worker (must be fetched from network)
- Simple fix gets the app working; proper per-question audio can be added later

## Next Steps (Future Improvements)
1. Source proper per-question audio files for Dai 1 Ka - Mondai 1-5
2. Update `mondai.json` to reference correct files
3. Re-enable audio precaching with size limits if needed
4. Consider lazy-loading audio to reduce initial bundle size
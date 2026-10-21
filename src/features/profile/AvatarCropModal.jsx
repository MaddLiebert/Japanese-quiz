// AvatarCropModal.jsx — potong foto profil sebelum disimpan.
// Viewport persegi 280px; gambar digambar "cover" (menutupi penuh) lalu bisa
// digeser (drag) dan di-zoom (slider 1×–3×). Matematika crop ada di avatar.js
// (murni, dites); komponen ini cuma yang menggambar + menangani pointer.
import { useEffect, useRef, useState } from 'react';
import {
  loadImageFromFile, coverScale, centerCropOffset, clampCropOffset,
  cropRectFromView, drawCroppedToDataURL,
} from './avatar';

const VIEW = 280;
const MAX_ZOOM = 3;

export default function AvatarCropModal({ file, language = 'id', onCancel, onSave }) {
  const [img, setImg] = useState(null);
  const [src, setSrc] = useState('');
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ offsetX: 0, offsetY: 0 });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const drag = useRef(null);

  const base = img ? coverScale(img.width, img.height, VIEW) : 1;
  const scale = base * zoom;

  // Muat file → gambar awal: cover, tengah. Object URL dibuang saat unmount.
  useEffect(() => {
    let alive = true;
    let objectUrl = '';
    loadImageFromFile(file)
      .then(({ img: im, url }) => {
        objectUrl = url;
        if (!alive) { URL.revokeObjectURL(url); return; }
        setImg(im);
        setSrc(url);
        setZoom(1);
        setOffset(centerCropOffset({
          scale: coverScale(im.width, im.height, VIEW),
          imgW: im.width, imgH: im.height, view: VIEW,
        }));
      })
      .catch(() => { if (alive) setErr(language === 'id' ? 'Gagal memuat gambar' : 'Could not load image'); });
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  // Esc = batal.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  // Zoom di sekitar titik tengah viewport (bukan pojok kiri-atas).
  const applyZoom = (next) => {
    const z = Math.min(MAX_ZOOM, Math.max(1, next));
    if (!img || z === zoom) return;
    const k = z / zoom;
    setOffset((o) => clampCropOffset({
      offsetX: VIEW / 2 - (VIEW / 2 - o.offsetX) * k,
      offsetY: VIEW / 2 - (VIEW / 2 - o.offsetY) * k,
      scale: base * z, imgW: img.width, imgH: img.height, view: VIEW,
    }));
    setZoom(z);
  };

  const onPointerDown = (e) => {
    if (!img) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, offsetX: offset.offsetX, offsetY: offset.offsetY };
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d || !img) return;
    setOffset(clampCropOffset({
      offsetX: d.offsetX + (e.clientX - d.x),
      offsetY: d.offsetY + (e.clientY - d.y),
      scale, imgW: img.width, imgH: img.height, view: VIEW,
    }));
  };
  const onPointerUp = () => { drag.current = null; };

  const handleSave = () => {
    if (!img || busy) return;
    setBusy(true);
    try {
      const crop = cropRectFromView({
        offsetX: offset.offsetX, offsetY: offset.offsetY,
        scale, imgW: img.width, imgH: img.height, view: VIEW,
      });
      onSave(drawCroppedToDataURL(img, crop));
    } catch {
      setErr(language === 'id' ? 'Gagal memproses gambar' : 'Could not process image');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-sumi/70 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-kinari-light border-[4px] border-sumi shadow-[8px_8px_0_0_#1a1a1a] w-full max-w-[340px] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-serif font-black uppercase tracking-[0.2em] text-sumi">
            {language === 'id' ? 'Atur Foto' : 'Crop Photo'}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="w-7 h-7 border-[2px] border-sumi bg-kinari hover:bg-shu hover:text-kinari-light font-black cursor-pointer"
            aria-label={language === 'id' ? 'Batal' : 'Cancel'}
          >
            ✕
          </button>
        </div>

        <div
          className="relative mx-auto bg-sumi border-[3px] border-sumi overflow-hidden select-none touch-none cursor-grab active:cursor-grabbing"
          style={{ width: VIEW, height: VIEW }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {img ? (
            <img
              src={src}
              alt=""
              draggable={false}
              style={{
                position: 'absolute',
                left: offset.offsetX,
                top: offset.offsetY,
                width: img.width * scale,
                height: img.height * scale,
                maxWidth: 'none',
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-kinari-light text-[10px] font-black uppercase tracking-widest">
              {err || '…'}
            </div>
          )}
        </div>

        <label className="mt-4 flex items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-sumi/60">
            {language === 'id' ? 'Zoom' : 'Zoom'}
          </span>
          <input
            type="range" min="1" max={MAX_ZOOM} step="0.01" value={zoom}
            onChange={(e) => applyZoom(Number(e.target.value))}
            className="flex-1 accent-[#1a1a1a] cursor-pointer"
            aria-label={language === 'id' ? 'Perbesar foto' : 'Zoom photo'}
          />
        </label>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 bg-kinari border-[3px] border-sumi shadow-[3px_3px_0_0_#1a1a1a] text-[10px] font-black uppercase tracking-widest text-sumi cursor-pointer"
          >
            {language === 'id' ? 'Batal' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!img || busy}
            className="flex-1 py-2.5 bg-ai border-[3px] border-sumi shadow-[3px_3px_0_0_#1a1a1a] text-[10px] font-black uppercase tracking-widest text-kinari-light cursor-pointer disabled:opacity-50"
          >
            {language === 'id' ? 'Simpan' : 'Save'}
          </button>
        </div>

        {err && img && <div className="mt-2 text-[10px] font-bold text-shu">{err}</div>}
      </div>
    </div>
  );
}

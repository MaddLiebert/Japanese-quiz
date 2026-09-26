// Furigana.jsx — render <ruby> dari segmen puisi: { t: '古池', r: 'ふるいけ' }.
// Segmen tanpa r → teks polos. HANYA ekspor komponen (aturan react-refresh).
export function Furigana({ segments, show = true, className = '', rtClassName = 'font-bold text-shu/80 tracking-wider' }) {
  if (!Array.isArray(segments) || segments.length === 0) return null;
  return (
    <span className={className}>
      {segments.map((s, i) => {
        if (!s?.t) return null;
        if (!show || !s.r) return <span key={i}>{s.t}</span>;
        return (
          <ruby key={i}>
            {s.t}
            <rt className={rtClassName} style={{ fontSize: '0.5em' }}>{s.r}</rt>
          </ruby>
        );
      })}
    </span>
  );
}

export default Furigana;

export function Card({ children, className = "" }) {
  return (
    <div className={`bg-kinari-light rounded-xl border-[1.5px] border-sumi/15 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] relative overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

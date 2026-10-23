import { Component } from 'react';

// Satu komponen efek (GIF JJK) throw → dulu seluruh app jadi layar putih.
// Boundary ini menahan kerusakan di dalam <main>, shell + navigasi tetap hidup.
export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full border-[4px] border-sumi bg-kinari-light p-8 text-center shadow-[8px_8px_0_0_#1a1a1a]">
          <div className="text-5xl font-serif font-black text-shu mb-4">障</div>
          <h2 className="text-xl font-serif font-black text-sumi mb-3">Ada yang rusak di halaman ini</h2>
          <p className="text-xs font-bold text-sumi/60 leading-relaxed mb-6">
            Progresmu aman — tersimpan di perangkat. Muat ulang untuk lanjut.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 border-[4px] border-sumi bg-shu text-kinari-light font-black uppercase tracking-[0.2em] text-xs shadow-[4px_4px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#1a1a1a] transition-all cursor-pointer"
          >
            Muat ulang
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;

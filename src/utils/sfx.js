let audioCtx;

const initAudioContext = () => {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  return audioCtx;
};

export const playCorrectSound = () => {
  const ctx = initAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const t = ctx.currentTime;
  
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.type = 'sine';
  
  // Ascending chime (C5 to E5)
  osc.frequency.setValueAtTime(523.25, t);
  osc.frequency.exponentialRampToValueAtTime(659.25, t + 0.1);

  // Soft fade out
  gainNode.gain.setValueAtTime(0, t);
  gainNode.gain.linearRampToValueAtTime(0.3, t + 0.05);
  gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

  osc.start(t);
  osc.stop(t + 0.6);
};

export const playWrongSound = () => {
  const ctx = initAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const t = ctx.currentTime;
  
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.type = 'triangle';
  
  // Low thud
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(80, t + 0.15);

  gainNode.gain.setValueAtTime(0, t);
  gainNode.gain.linearRampToValueAtTime(0.4, t + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

  osc.start(t);
  osc.stop(t + 0.25);
};

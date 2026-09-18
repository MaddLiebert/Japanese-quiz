// Pre-load and cache voices
let cachedVoices = [];

const loadVoices = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    cachedVoices = window.speechSynthesis.getVoices();
  }
};

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

export const playDramaticAudio = (text) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.');
    return;
  }

  if (!text) return;

  // Unfreeze Chrome synthesis if paused or stuck
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.pitch = 0.95;
  utterance.rate = 0.88; // slightly slower for clear learning pronunciation

  // Retrieve voices (fresh if cache is still empty)
  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  
  // Find highest quality Japanese voice
  const jaVoice = voices.find(voice => 
    voice.lang === 'ja-JP' || 
    voice.lang === 'ja_JP' || 
    voice.lang.toLowerCase().startsWith('ja') ||
    voice.name.toLowerCase().includes('japanese') ||
    voice.name.toLowerCase().includes('japan')
  );

  if (jaVoice) {
    utterance.voice = jaVoice;
  }

  window.speechSynthesis.speak(utterance);
};

// Play audio file from static path (e.g. /audio/filename.mp3)
export const playAudioFile = (audioPath) => {
  if (typeof window === 'undefined') return null;

  // Stop Web Speech Synthesis if playing
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  const audio = new Audio(audioPath);
  audio.play().catch((err) => {
    console.warn('Audio play error:', err);
  });
  return audio;
};
// useSpeechDiagnostics.js — hook BROWSER: kumpulkan bukti untuk menjawab
// "salah website / Google / HP?". Membaca log event ASR dari store bersama
// (speechLog.js — diisi SpeakSession/PoemSession), menambah fakta lingkungan,
// dan menyediakan uji mikrofon mandiri (getUserMedia sendiri).
import { useCallback, useEffect, useState } from 'react';
import { summarizeSpeechLog } from './speechDiagnostics.js';
import { diagnoseEnv } from './speechEnv.js';
import { getRecognitionCtor } from './useSpeechRecognition.js';
import { readSpeechEvents, subscribeSpeechLog, clearSpeechEvents } from './speechLog.js';

const readPermission = async () => {
  try {
    if (typeof navigator === 'undefined' || !navigator.permissions?.query) return 'unknown';
    const p = await navigator.permissions.query({ name: 'microphone' });
    return p?.state || 'unknown';
  } catch { return 'unknown'; }   // Firefox/Safari: tidak didukung → 'unknown'
};

export function useSpeechDiagnostics() {
  const [events, setEvents] = useState(() => readSpeechEvents());
  const [env, setEnv] = useState(null);
  const [micTest, setMicTest] = useState(null);   // null | 'testing' | 'granted' | 'denied' | <error name>
  const [buildId, setBuildId] = useState('');

  useEffect(() => {
    setEvents(readSpeechEvents());
    return subscribeSpeechLog(setEvents);
  }, []);

  const snapshotEnv = useCallback(async () => {
    const permissionState = await readPermission();
    const next = diagnoseEnv({
      hasCtor: Boolean(getRecognitionCtor()),
      isSecureContext: typeof window === 'undefined' ? true : window.isSecureContext !== false,
      permissionState,
      online: typeof navigator === 'undefined' ? true : navigator.onLine !== false,
    });
    setEnv({ ...next, permissionState });
    return next;
  }, []);

  const testMic = useCallback(async () => {
    setMicTest('testing');
    try {
      const media = typeof navigator === 'undefined' ? null : navigator.mediaDevices;
      if (!media?.getUserMedia) { setMicTest('unsupported'); return 'unsupported'; }
      const stream = await media.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicTest('granted');
      return 'granted';
    } catch (err) {
      const name = err?.name || 'error';
      setMicTest(name);
      return name;
    }
  }, []);

  const clear = useCallback(() => {
    clearSpeechEvents();
    setMicTest(null);
  }, []);

  const report = useCallback(() => {
    const summary = summarizeSpeechLog(events);
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'n/a';
    const sw = typeof navigator !== 'undefined' && navigator.serviceWorker?.controller ? 'controlled' : 'none';
    const lines = [
      '# Diagnosa Speaking 日本語学園',
      `build: ${buildId || '(unknown)'}`,
      `env: ${env ? `${env.code} permission=${env.permissionState}` : 'n/a'}`,
      `micTest: ${micTest || 'n/a'}`,
      `ua: ${ua}`,
      `sw: ${sw}`,
      `verdict: ${summary.code}`,
      `counts: ${JSON.stringify(summary.counts)}`,
      `firstError: ${summary.firstError || 'none'}`,
      `heard: ${summary.transcripts.length ? summary.transcripts.join(' | ') : '(none)'}`,
      '--- events ---',
      ...events.map((e) => `${e.t} ${e.type}${e.error ? ':' + e.error : ''}${e.transcript ? ' "' + e.transcript + '"' : ''}`),
    ];
    return lines.join('\n');
  }, [events, env, micTest, buildId]);

  useEffect(() => {
    snapshotEnv();
    setBuildId(typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : '');
  }, [snapshotEnv]);

  return { events, env, micTest, testMic, clear, report, summary: summarizeSpeechLog(events) };
}

export default useSpeechDiagnostics;

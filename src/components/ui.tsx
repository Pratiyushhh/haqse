import { useState, type ReactNode } from 'react';
import { plainText } from '../lib/text';

export { plainText };

export function Card({ title, sub, children }: { title?: string; sub?: string; children: ReactNode }) {
  return (
    <section className="card">
      {title && <h2>{title}</h2>}
      {sub && <p className="sub">{sub}</p>}
      {children}
    </section>
  );
}

/**
 * Errors are shown, never swallowed and never replaced with plausible-looking
 * content. If a model call fails the worker sees that it failed.
 */
export function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div className="banner danger" role="alert">
      <strong>Could not finish that</strong>
      {error}
    </div>
  );
}

export function Busy({ label }: { label: string }) {
  return (
    <p className="muted" role="status" aria-live="polite">
      <span className="spin" aria-hidden="true">
        ◌
      </span>{' '}
      {label}
    </p>
  );
}

export function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="stat">
      <div className="k">{k}</div>
      <div className="v">{v}</div>
    </div>
  );
}

/**
 * Voice input. Progressive enhancement only: if the browser has no speech
 * recognition, or the user denies the microphone, the text field beside this
 * button still works. Nothing is voice-only.
 */
type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { results: { 0: { 0: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

const BCP47: Record<string, string> = {
  Hindi: 'hi-IN',
  English: 'en-IN',
  Bengali: 'bn-IN',
  Tamil: 'ta-IN',
  Telugu: 'te-IN',
  Marathi: 'mr-IN',
  Kannada: 'kn-IN',
  Gujarati: 'gu-IN',
  Punjabi: 'pa-IN',
  Odia: 'or-IN',
};

export function MicButton({
  language,
  onText,
  listening,
  setListening,
}: {
  language: string;
  onText: (text: string) => void;
  listening: boolean;
  setListening: (v: boolean) => void;
}) {
  const w = window as SpeechWindow;
  const Impl = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Impl) return null;

  const start = () => {
    const rec = new Impl();
    rec.lang = BCP47[language] ?? 'hi-IN';
    rec.interimResults = false;
    rec.onresult = (e) => onText(e.results[0][0].transcript);
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  };

  return (
    <button type="button" onClick={start} aria-label="Speak your question" disabled={listening}>
      {listening ? '● Listening' : '🎤 Speak'}
    </button>
  );
}

/**
 * Picks the gentlest voice the device actually has.
 *
 * Browsers ship wildly different voice sets, so this scores what is available
 * rather than naming one: prefer a voice for the right language, prefer the
 * higher-quality natural/neural voices where the platform offers them, and
 * avoid the harsh "compact" fallbacks. Returns null if nothing matches, in
 * which case the browser default is used.
 */
function pickVoice(langTag: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const base = langTag.split('-')[0];
  const score = (v: SpeechSynthesisVoice): number => {
    let n = 0;
    if (v.lang === langTag) n += 100;
    else if (v.lang.startsWith(base + '-')) n += 60;
    else if (base !== 'en' && v.lang.startsWith('en')) n += 5;
    else return -1;

    const name = v.name.toLowerCase();
    if (/natural|neural|premium|enhanced|online/.test(name)) n += 30;
    if (/google/.test(name)) n += 15;
    if (/compact|espeak/.test(name)) n -= 25;
    return n;
  };

  const ranked = voices.map((v) => ({ v, n: score(v) })).filter((x) => x.n >= 0);
  ranked.sort((a, b) => b.n - a.n);
  return ranked[0]?.v ?? null;
}

/**
 * Reads a reply out loud. Only ever called from an explicit tap - nothing in
 * HaqSe speaks on its own, because a phone that starts talking unprompted is
 * a problem in a shared room, on a road, or in a customer's doorway.
 */
export function speak(text: string, language: string): void {
  if (!('speechSynthesis' in window)) return;
  const langTag = BCP47[language] ?? 'hi-IN';
  const u = new SpeechSynthesisUtterance(plainText(text));
  u.lang = langTag;
  const voice = pickVoice(langTag);
  if (voice) u.voice = voice;
  // Slightly slow and slightly soft: easier to follow in traffic noise, and
  // kinder than the default clipped delivery.
  u.rate = 0.92;
  u.pitch = 1.05;
  u.volume = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

export const stopSpeaking = (): void => {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
};

/**
 * Opt-in "read this to me" control. Appears next to any generated text.
 * Tapping again stops playback, so a worker is never stuck waiting it out.
 */
export function SpeakButton({ text, language }: { text: string; language: string }) {
  const [speaking, setSpeaking] = useState(false);
  if (!('speechSynthesis' in window)) return null;

  const toggle = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    speak(text, language);
    setSpeaking(true);
    const poll = window.setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        window.clearInterval(poll);
        setSpeaking(false);
      }
    }, 400);
  };

  return (
    <button type="button" className="ghost" onClick={toggle} aria-pressed={speaking}>
      {speaking ? '■ Stop' : '🔊 Read aloud'}
    </button>
  );
}

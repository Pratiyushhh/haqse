import type { ReactNode } from 'react';

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

/** Reads a reply out loud, for workers who would rather listen than read. */
export function speak(text: string, language: string): void {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = BCP47[language] ?? 'hi-IN';
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

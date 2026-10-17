import { useState } from 'react';

/**
 * First-run tour.
 *
 * Shown once and then remembered, so it never interrupts someone who is
 * working. Skippable from the first step - a worker who wants to get on with
 * it should never have to tap through six screens to be left alone.
 *
 * The flag lives in localStorage rather than a cookie: nothing here needs to
 * reach a server, and it survives the app being reopened from the home
 * screen, which a session cookie would not.
 */
const SEEN_KEY = 'haqse.tourSeen.v1';

export const hasSeenTour = (): boolean => {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    // Private window or blocked storage: show the tour, never crash.
    return false;
  }
};

export const markTourSeen = (): void => {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* non-fatal */
  }
};

type Step = { icon: string; title: string; body: string };

const STEPS: Step[] = [
  {
    icon: '👋',
    title: 'HaqSe is your work diary and your rights desk',
    body: 'It works out what you really earn, finds the government schemes you qualify for, and writes your complaints for you. Everything stays on this phone.',
  },
  {
    icon: '₹',
    title: 'Hisaab — photograph, never type',
    body: 'Take a photo of any payout screen or bill. HaqSe reads it, and shows what you actually kept after the platform cut and your petrol. It also tells you if that is below minimum wage.',
  },
  {
    icon: '💬',
    title: 'Saathi — ask in your own language',
    body: 'Speak or type in Hindi, Tamil, Bengali and seven more. Saathi answers using only your own saved payouts, so the numbers are yours, not invented.',
  },
  {
    icon: '🛡',
    title: 'Haq — the schemes you are owed',
    body: 'Answer six questions once. HaqSe checks you against real government schemes and shows the exact documents and steps for each, with the official link.',
  },
  {
    icon: '✍',
    title: 'Likho — your complaint, written properly',
    body: 'Say what went wrong. You get four letters: to the platform, the Labour Commissioner, the consumer forum, and one in your language explaining what you just sent.',
  },
  {
    icon: '🌡',
    title: 'Kaagaz and Safety',
    body: 'Kaagaz warns you before a licence or PUC expires. Safety shows live heat and rain for your city, and works out whether an order is worth taking before you accept it.',
  },
];

export default function Tour({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0);
  const step = STEPS[i]!;
  const last = i === STEPS.length - 1;

  const finish = () => {
    markTourSeen();
    onClose();
  };

  return (
    <div
      className="tour-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
    >
      <div className="tour-card">
        <div className="tour-top">
          <span className="tour-icon" aria-hidden="true">
            {step.icon}
          </span>
          <button className="ghost" onClick={finish}>
            Skip
          </button>
        </div>

        <h2 id="tour-title">{step.title}</h2>
        <p>{step.body}</p>

        <div className="tour-dots" aria-hidden="true">
          {STEPS.map((_, n) => (
            <span key={n} className={n === i ? 'dot on' : 'dot'} />
          ))}
        </div>
        <p className="sr-only" aria-live="polite">
          Step {i + 1} of {STEPS.length}
        </p>

        <div className="row">
          {i > 0 && <button onClick={() => setI(i - 1)}>Back</button>}
          <button className="primary" onClick={() => (last ? finish() : setI(i + 1))}>
            {last ? 'Start using HaqSe' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

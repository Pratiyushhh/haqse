import { useState } from 'react';
import { Busy, Card, ErrorNote, plainText } from '../components/ui';
import { callAI } from '../lib/api';
import { computeTotals, detectAnomalies } from '../lib/money';
import type { AppState } from '../lib/store';

type Turn = { role: 'you' | 'saathi'; text: string };

const SUGGESTIONS = [
  'Aaj tak kitna bacha?',
  'Yeh deduction kya hai?',
  'Garmi mein kaise safe rahun?',
  'Mujhe kaun si sarkari yojana milegi?',
];

/**
 * Saathi answers from the worker's REAL ledger.
 *
 * The context we send is computed by pure functions, never generated. The
 * model is explicitly told that every number it states must come from that
 * context, which is what stops it inventing earnings.
 */
export default function Saathi({ state }: { state: AppState }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { profile } = state;

  function buildContext(): string {
    const t = computeTotals(state.earnings, state.expenses);
    const anomalies = detectAnomalies(state.earnings);
    return JSON.stringify({
      name: profile.name || 'worker',
      city: profile.city,
      state: profile.state,
      payoutsRecorded: state.earnings.length,
      grossEarned: t.gross + t.incentive,
      platformDeductions: t.platformDeductions,
      ownCosts: t.expenses,
      netKept: t.net,
      hoursWorked: t.hours,
      trueHourlyRate: t.trueHourly,
      perTrip: t.perTrip,
      recentDeductions: state.earnings
        .slice(0, 3)
        .flatMap((e) => e.deductions.map((d) => `${d.label}: ${d.amount}`)),
      flaggedDeductions: anomalies.map((a) => `${a.label} ${a.amount}: ${a.reason}`),
      documentsSaved: state.documents.map((d) => `${d.docType} expires ${d.expiryDate || 'unknown'}`),
    });
  }

  async function ask(question: string) {
    if (!question.trim()) return;
    setError(null);
    setInput('');
    setTurns((t) => [...t, { role: 'you', text: question }]);
    setBusy(true);
    try {
      const { answer } = await callAI<{ answer: string }>('chat', {
        question,
        language: profile.language,
        context: buildContext(),
      });
      // Markdown is stripped before display: the model sometimes bolds
      // amounts, and raw asterisks are noise on a small screen.
      setTurns((t) => [...t, { role: 'saathi', text: plainText(answer) }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reach Saathi.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card
      title="Saathi"
      sub={`Ask anything about your work and get a reply in ${profile.language}.`}
    >
      {turns.length === 0 && (
        <div>
          <p className="muted">Try one of these:</p>
          {SUGGESTIONS.map((s) => (
            <button key={s} className="ghost" style={{ marginRight: 6, marginBottom: 6 }} onClick={() => void ask(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div aria-live="polite">
        {turns.map((t, i) => (
          <div
            key={i}
            className={t.role === 'you' ? 'banner' : 'banner ok'}
            style={t.role === 'you' ? { background: 'var(--surface-2)' } : undefined}
          >
            <strong>{t.role === 'you' ? 'You' : 'Saathi'}</strong>
            {t.text}
          </div>
        ))}
      </div>

      {busy && <Busy label="Saathi is thinking…" />}
      <ErrorNote error={error} />

      <label htmlFor="saathi-input">Your question</label>
      <textarea
        id="saathi-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Aaj kitna bacha?"
      />
      <button
        className="primary"
        style={{ marginTop: 10 }}
        onClick={() => void ask(input)}
        disabled={busy || !input.trim()}
      >
        Ask
      </button>

      <p className="muted" style={{ marginTop: 12 }}>
        Saathi reads only the payouts and bills you have saved on this phone. It is not a lawyer and
        does not give legal advice.
      </p>
    </Card>
  );
}

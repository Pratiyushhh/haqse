import { useState } from 'react';
import { Busy, Card, ErrorNote } from '../components/ui';
import { callAI } from '../lib/api';
import { detectAnomalies, rupees } from '../lib/money';
import { newId, type AppState, type Grievance as GrievanceRecord } from '../lib/store';

type Draft = Omit<GrievanceRecord, 'id' | 'createdAt'>;

const TABS = [
  ['platformLetter', 'To the platform'],
  ['labourLetter', 'To the Labour Commissioner'],
  ['consumerLetter', 'To the consumer forum'],
  ['workerSummary', 'In your language'],
] as const;

/**
 * The drafter attaches real evidence.
 *
 * It does not just rewrite what the worker says - it pulls the matching rows
 * out of their ledger and the anomalies the Detective flagged, so the letter
 * cites figures that came from their own payout photos.
 */
export default function Grievance({
  state,
  addGrievance,
}: {
  state: AppState;
  addGrievance: (g: GrievanceRecord) => void;
}) {
  const [narrative, setNarrative] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number][0]>('platformLetter');

  const anomalies = detectAnomalies(state.earnings);
  const recent = state.earnings.slice(0, 3);

  async function run() {
    if (!narrative.trim()) return;
    setError(null);
    setBusy(true);
    setDraft(null);
    try {
      const result = await callAI<Draft>('draft_grievance', {
        language: state.profile.language,
        narrative,
        worker: {
          name: state.profile.name || '[FILL: your name]',
          city: state.profile.city,
          state: state.profile.state,
        },
        evidence: {
          flaggedDeductions: anomalies.map((a) => ({
            label: a.label,
            amount: a.amount,
            why: a.reason,
          })),
          recentPayouts: recent.map((e) => ({
            platform: e.platform,
            date: e.date,
            gross: e.gross,
            incentive: e.incentive,
            trips: e.trips,
            deductions: e.deductions,
          })),
        },
      });
      setDraft(result);
      addGrievance({ ...result, id: newId(), createdAt: new Date().toISOString() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not write the letters.');
    } finally {
      setBusy(false);
    }
  }

  const copy = (text: string) => void navigator.clipboard?.writeText(text);

  return (
    <Card
      title="Likho — write my complaint"
      sub="Write what happened in your own words. You get four letters: to the platform, to the Labour Commissioner, to the consumer forum, and one in your own language explaining what you just sent."
    >
      {anomalies.length > 0 && (
        <div className="banner warn">
          <strong>Evidence ready to attach</strong>
          {anomalies.map((a) => (
            <div key={a.label}>
              {a.label} — {rupees(a.amount)}. {a.reason}
            </div>
          ))}
        </div>
      )}

      <label htmlFor="narrative">What happened?</label>
      <textarea
        id="narrative"
        value={narrative}
        onChange={(e) => setNarrative(e.target.value)}
        placeholder="Swiggy ne 15 tareekh ko ₹400 kaat liya, bola late delivery. Us din baarish thi aur traffic jam tha."
      />
      <button
        className="primary"
        style={{ marginTop: 10 }}
        onClick={() => void run()}
        disabled={busy || !narrative.trim()}
      >
        Write my letters
      </button>

      {busy && <Busy label="Drafting four documents from your facts…" />}
      <ErrorNote error={error} />

      {draft && (
        <div style={{ marginTop: 16 }}>
          <div className="banner ok">
            <strong>Ready to send</strong>
            {draft.summary}
          </div>

          {draft.missingFacts?.length > 0 && (
            <div className="banner warn">
              <strong>Add these before you send</strong>
              <ul className="list">
                {draft.missingFacts.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          )}

          <div role="tablist" aria-label="Letter versions" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {TABS.map(([key, label]) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                className="ghost"
                style={tab === key ? { background: 'var(--surface-2)', color: 'var(--brand)' } : undefined}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            ))}
          </div>

          <pre className="letter" tabIndex={0}>{draft[tab]}</pre>

          <div className="row">
            <button onClick={() => copy(draft[tab])}>Copy</button>
            <button
              onClick={() =>
                window.open(
                  `https://wa.me/?text=${encodeURIComponent(draft[tab].slice(0, 1500))}`,
                  '_blank',
                  'noopener',
                )
              }
            >
              Send on WhatsApp
            </button>
          </div>
          <button
            style={{ marginTop: 10 }}
            onClick={() =>
              window.open(
                `mailto:?subject=${encodeURIComponent('Grievance: ' + draft.summary)}&body=${encodeURIComponent(draft[tab])}`,
              )
            }
          >
            ✉ Open in email
          </button>
        </div>
      )}

      {state.grievances.length > 0 && (
        <>
          <h3>Your past complaints</h3>
          <ul className="list">
            {state.grievances.map((g) => (
              <li key={g.id}>
                {g.summary}
                <div className="muted">{new Date(g.createdAt).toLocaleDateString('en-IN')}</div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}

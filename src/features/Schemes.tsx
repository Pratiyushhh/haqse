import { useState } from 'react';
import { Busy, Card, ErrorNote } from '../components/ui';
import { callAI } from '../lib/api';
import { filterEligible, SCHEMES, type Scheme } from '../data/schemes';
import type { AppState } from '../lib/store';

type Match = { id: string; whyYou: string; firstStep: string };

/**
 * Two-stage, deliberately.
 *
 * Stage 1 is a deterministic rules engine over the scheme corpus - no model
 * decides whether someone is eligible. Stage 2 asks the model only to rank
 * and explain the schemes the rules already approved, and the UI renders
 * benefit amounts, steps and links from the corpus rather than from the
 * model's reply. That makes a hallucinated benefit structurally impossible.
 */
export default function Schemes({ state }: { state: AppState }) {
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const { profile } = state;
  const eligible = filterEligible({
    age: profile.age,
    monthlyIncome: profile.monthlyIncome,
    state: profile.state,
    hasVehicle: profile.hasVehicle,
    dependents: profile.dependents,
  });

  const worth = eligible.reduce((a, s) => a + s.annualWorthINR, 0);

  // Explain the six most valuable. A worker cannot act on ten schemes at
  // once, and a shorter list is also a cheaper and faster call. The rest are
  // still listed below, straight from the corpus, with no model involved.
  const EXPLAIN_LIMIT = 6;
  const ranked = [...eligible].sort((a, b) => b.annualWorthINR - a.annualWorthINR);
  const toExplain = ranked.slice(0, EXPLAIN_LIMIT);
  const alsoEligible = ranked.slice(EXPLAIN_LIMIT);

  async function run() {
    setError(null);
    setBusy(true);
    try {
      if (eligible.length === 0) {
        setMatches([]);
        return;
      }
      const { matches: m } = await callAI<{ matches: Match[] }>('match_schemes', {
        language: profile.language,
        profile: {
          age: profile.age,
          state: profile.state,
          city: profile.city,
          monthlyIncome: profile.monthlyIncome,
          dependents: profile.dependents,
          hasVehicle: profile.hasVehicle,
        },
        eligibleIds: toExplain.map((s) => s.id),
        // Trimmed corpus: the model needs enough to rank and describe, not
        // the steps and document lists the UI already renders locally. Fewer
        // input tokens, and nothing for it to paraphrase incorrectly.
        corpus: SCHEMES.map((s) => ({
          id: s.id,
          name: s.name,
          what: s.what,
          benefitValue: s.benefitValue,
          cost: s.cost,
        })),
      });
      // Never trust the model to stay inside the eligible set - enforce it.
      setMatches(m.filter((x) => toExplain.some((s) => s.id === x.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not check your schemes.');
    } finally {
      setBusy(false);
    }
  }

  const byId = (id: string): Scheme | undefined => SCHEMES.find((s) => s.id === id);

  return (
    <Card
      title="Haq Checker"
      sub="Which government schemes you appear to qualify for, and exactly what to do about each one."
    >
      <div className="banner ok">
        <strong>
          {eligible.length} schemes match your details
        </strong>
        Based on age {profile.age}, {profile.state}, about {profile.monthlyIncome.toLocaleString('en-IN')} a
        month, {profile.dependents} dependents.
        {worth > 0 && ` Together these are worth up to ₹${worth.toLocaleString('en-IN')} of cover and benefit.`}
      </div>

      <button className="primary" onClick={() => void run()} disabled={busy}>
        {matches ? 'Check again' : 'Explain these for me'}
      </button>
      {busy && <Busy label="Working out which ones matter most for you…" />}
      <ErrorNote error={error} />

      {matches?.length === 0 && (
        <p className="muted" style={{ marginTop: 12 }}>
          Nothing matched your details. Change your age, state or income in Settings and check again.
          We would rather show you nothing than show you a scheme you cannot get.
        </p>
      )}

      {matches && alsoEligible.length > 0 && (
        <div className="banner" style={{ background: 'var(--surface-2)' }}>
          <strong>Also open to you</strong>
          {alsoEligible.map((s) => s.name).join(' · ')}
        </div>
      )}

      {matches?.map((m, i) => {
        const s = byId(m.id);
        if (!s) return null;
        const isOpen = open === s.id;
        return (
          <div key={s.id} className="card" style={{ margin: '12px 0 0' }}>
            <span className="pill">#{i + 1} for you</span>
            {s.annualWorthINR > 0 && (
              <span className="pill live">worth ₹{s.annualWorthINR.toLocaleString('en-IN')}</span>
            )}
            <h2>{s.name}</h2>
            <p className="sub">{s.authority}</p>
            <p>{m.whyYou}</p>
            <div className="banner ok">
              <strong>Do this today</strong>
              {m.firstStep}
            </div>

            <button className="ghost" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : s.id)}>
              {isOpen ? 'Hide details' : 'Full details, documents and steps'}
            </button>

            {isOpen && (
              <div>
                <h3>What it is</h3>
                <p>{s.what}</p>
                <h3>What you get</h3>
                <p>{s.benefitValue}</p>
                <h3>What it costs</h3>
                <p>{s.cost}</p>
                <h3>Documents you need</h3>
                <ul className="list">
                  {s.documents.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
                <h3>Steps</h3>
                <ol>
                  {s.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <p className="cite">
                  Source:{' '}
                  <a href={s.officialUrl} target="_blank" rel="noopener noreferrer">
                    {s.officialUrl}
                  </a>{' '}
                  · last checked {s.lastVerified}
                </p>
              </div>
            )}
          </div>
        );
      })}

      <p className="muted" style={{ marginTop: 16 }}>
        These are schemes you <em>appear</em> to qualify for. Confirm at a Common Service Centre
        before you rely on any of them.
      </p>
    </Card>
  );
}

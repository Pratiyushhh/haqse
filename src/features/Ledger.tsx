import { useState } from 'react';
import { PhotoPicker } from '../components/PhotoPicker';
import { Busy, Card, ErrorNote, Stat } from '../components/ui';
import { callAI, compressImage } from '../lib/api';
import {
  buildIncomeSummary,
  compareToMinimumWage,
  computeTotals,
  detectAnomalies,
  rupees,
  type Earning,
  type Expense,
} from '../lib/money';
import { newId, today, type AppState } from '../lib/store';

type Extraction = {
  kind: 'earning' | 'expense' | 'unreadable';
  platform: string;
  date: string;
  gross: number;
  incentive: number;
  trips: number;
  hours: number;
  distanceKm: number;
  deductions: { label: string; amount: number }[];
  category: Expense['category'] | '';
  amount: number;
  confidence: 'high' | 'medium' | 'low';
  note: string;
};

const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? '' : 's'}`;

export default function Ledger({
  state,
  addEarning,
  addExpense,
}: {
  state: AppState;
  addEarning: (e: Earning) => void;
  addExpense: (e: Expense) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Extraction | null>(null);

  const totals = computeTotals(state.earnings, state.expenses);
  const wage = compareToMinimumWage(totals.trueHourly, state.profile.state);
  const anomalies = detectAnomalies(state.earnings);
  const income = buildIncomeSummary(state.earnings, state.expenses);

  async function onFile(file: File) {
    setError(null);
    setPending(null);
    setBusy(true);
    try {
      const { base64, mimeType } = await compressImage(file);
      const result = await callAI<Extraction>('extract_receipt', {
        imageBase64: base64,
        mimeType,
      });
      setPending(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  function confirm() {
    if (!pending) return;
    if (pending.kind === 'earning') {
      addEarning({
        id: newId(),
        platform: pending.platform || 'Unknown',
        date: pending.date || today(),
        gross: pending.gross,
        incentive: pending.incentive,
        trips: pending.trips,
        hours: pending.hours,
        distanceKm: pending.distanceKm,
        deductions: pending.deductions ?? [],
      });
    } else if (pending.kind === 'expense') {
      addExpense({
        id: newId(),
        category: (pending.category || 'other') as Expense['category'],
        amount: pending.amount || pending.gross,
        date: pending.date || today(),
      });
    }
    setPending(null);
  }

  return (
    <>
      <Card
        title="Add a payout or a bill"
        sub="Take a photo. No typing. The app reads it and works out what you actually kept."
      >
        <PhotoPicker
          disabled={busy}
          onFile={(f) => void onFile(f)}
          cameraLabel="📷 Take a photo"
          galleryLabel="🖼 Choose from gallery"
        />
        {busy && <Busy label="Reading your photo…" />}
        <ErrorNote error={error} />

        {pending && (
          <div className="banner ok" role="region" aria-label="Check what was read">
            <strong>Check this before saving</strong>
            {pending.kind === 'unreadable' ? (
              <p>Could not read that one. {pending.note}</p>
            ) : (
              <>
                <p className="muted">
                  Read with {pending.confidence} confidence
                  {pending.note ? ` — ${pending.note}` : ''}
                </p>
                <table>
                  <tbody>
                    {pending.kind === 'earning' ? (
                      <>
                        <tr><th>Platform</th><td>{pending.platform || '—'}</td></tr>
                        <tr><th>Date</th><td>{pending.date || today()}</td></tr>
                        <tr><th>Gross</th><td>{rupees(pending.gross)}</td></tr>
                        <tr><th>Incentive</th><td>{rupees(pending.incentive)}</td></tr>
                        <tr><th>Trips</th><td>{pending.trips || '—'}</td></tr>
                        <tr><th>Hours</th><td>{pending.hours || '—'}</td></tr>
                        {pending.deductions?.map((d) => (
                          <tr key={d.label}>
                            <th>Deduction: {d.label}</th>
                            <td>−{rupees(d.amount)}</td>
                          </tr>
                        ))}
                      </>
                    ) : (
                      <>
                        <tr><th>Category</th><td>{pending.category || 'other'}</td></tr>
                        <tr><th>Amount</th><td>{rupees(pending.amount || pending.gross)}</td></tr>
                        <tr><th>Date</th><td>{pending.date || today()}</td></tr>
                      </>
                    )}
                  </tbody>
                </table>
                <div className="row" style={{ marginTop: 12 }}>
                  <button className="primary" onClick={confirm}>Save it</button>
                  <button onClick={() => setPending(null)}>Discard</button>
                </div>
              </>
            )}
          </div>
        )}
      </Card>

      <Card title="What you actually keep" sub={`${plural(state.earnings.length, 'payout')}, ${plural(state.expenses.length, 'bill')} recorded`}>
        {state.earnings.length === 0 ? (
          <p className="muted">
            Nothing recorded yet. Photograph one payout screen above and this page fills itself.
          </p>
        ) : (
          <>
            <div className="big">{rupees(totals.net)}</div>
            <p className="sub">kept, after platform cuts and your own costs</p>

            <div className="statgrid">
              <Stat k="Earned" v={rupees(totals.gross + totals.incentive)} />
              <Stat k="Platform cuts" v={'−' + rupees(totals.platformDeductions)} />
              <Stat k="Your costs" v={'−' + rupees(totals.expenses)} />
              <Stat k="Real rate" v={totals.trueHourly ? `${rupees(totals.trueHourly)}/hr` : '—'} />
            </div>

            {wage.belowMinimum && (
              <div className="banner warn" role="note">
                <strong>You are earning below minimum wage</strong>
                Your real rate is {rupees(wage.trueHourly)} an hour. Unskilled minimum wage in{' '}
                {state.profile.state} works out to about {rupees(wage.minHourly)} an hour — you are
                short {rupees(wage.shortfallPerHour)} for every hour you ride.
              </div>
            )}

            {anomalies.length > 0 && (
              <>
                <h3>Deduction Detective</h3>
                <p className="muted">
                  Found by comparing this payout against your own history — statistics, not a guess.
                </p>
                {anomalies.map((a) => (
                  <div key={a.label} className="banner danger">
                    <strong>
                      {a.label} — {rupees(a.amount)}
                    </strong>
                    {a.reason} You can contest this in the Likho tab.
                  </div>
                ))}
              </>
            )}

            <h3>Income certificate</h3>
            <p className="muted">
              The payslip gig work never gives you. Built only from payouts you recorded.
            </p>
            <div className="statgrid">
              <Stat k="Monthly average" v={rupees(income.averageMonthlyNet)} />
              <Stat k="Consistency" v={`${income.consistencyScore}%`} />
              <Stat k="Active days" v={String(income.activeDays)} />
              <Stat k="Platforms" v={income.platforms.length ? income.platforms.join(', ') : '—'} />
            </div>
            <button style={{ marginTop: 12 }} onClick={() => window.print()}>
              🖨 Save as PDF for a bank or landlord
            </button>
          </>
        )}
      </Card>
    </>
  );
}

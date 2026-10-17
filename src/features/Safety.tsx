import { useEffect, useState } from 'react';
import { Busy, Card, ErrorNote, Stat } from '../components/ui';
import { callAI, CITIES, fetchWeather, type Weather } from '../lib/api';
import { computeTotals, decideOrder, estimateMinutes, rupees, type OrderVerdictMath } from '../lib/money';
import type { AppState } from '../lib/store';

/** Thresholds are fixed and explainable, not model output. */
function heatLevel(apparent: number): { level: 'ok' | 'warn' | 'danger'; text: string } {
  if (apparent >= 41) return { level: 'danger', text: 'Dangerous heat. Heat stroke risk.' };
  if (apparent >= 35) return { level: 'warn', text: 'High heat. Take water breaks.' };
  return { level: 'ok', text: 'Heat is manageable right now.' };
}

export default function Safety({ state }: { state: AppState }) {
  const { profile } = state;
  const totals = computeTotals(state.earnings, state.expenses);

  const [weather, setWeather] = useState<Weather | null>(null);
  const [brief, setBrief] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Order Decider
  const [payout, setPayout] = useState(85);
  const [distance, setDistance] = useState(7);
  const [math, setMath] = useState<OrderVerdictMath | null>(null);
  const [verdict, setVerdict] = useState<string | null>(null);
  const [deciding, setDeciding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const city = CITIES[profile.city] ?? CITIES.Delhi!;
    setBusy(true);
    setError(null);
    fetchWeather(city.lat, city.lon, profile.city)
      .then((w) => {
        if (cancelled) return;
        setWeather(w);
        return callAI<{ brief: string }>('safety_brief', {
          language: profile.language,
          trueHourly: totals.trueHourly,
          weather: w,
        }).then(({ brief: b }) => {
          if (!cancelled) setBrief(b);
        });
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load conditions.');
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.city, profile.language]);

  async function decide() {
    setDeciding(true);
    setVerdict(null);
    const m = decideOrder({
      payout,
      distanceKm: distance,
      fuelPricePerLitre: profile.fuelPrice,
      vehicleKmpl: profile.vehicleKmpl,
      trueHourly: totals.trueHourly || 60,
      estimatedMinutes: estimateMinutes(distance * 2),
      raining: (weather?.rain ?? 0) > 0,
    });
    setMath(m);
    try {
      const { verdict: v } = await callAI<{ verdict: string }>('order_verdict', {
        language: profile.language,
        math: m,
      });
      setVerdict(v);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not get the verdict.');
    } finally {
      setDeciding(false);
    }
  }

  const sos = () => {
    const text = `I need help. I am a delivery worker near ${profile.city}. Please call me.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };

  const heat = weather ? heatLevel(weather.apparentTemperature) : null;

  return (
    <>
      <Card title="Surakshit — today's conditions" sub={`Live measured weather for ${profile.city}.`}>
        {busy && <Busy label="Checking live conditions…" />}
        <ErrorNote error={error} />

        {weather && (
          <>
            <div className="statgrid">
              <Stat k="Feels like" v={`${Math.round(weather.apparentTemperature)}°C`} />
              <Stat k="Actual" v={`${Math.round(weather.temperature)}°C`} />
              <Stat k="Humidity" v={`${Math.round(weather.humidity)}%`} />
              <Stat k="Rain" v={`${weather.rain} mm`} />
            </div>
            {heat && (
              <div className={`banner ${heat.level}`}>
                <strong>{heat.text}</strong>
                {weather.rain > 0
                  ? 'It is raining. Braking distance doubles on wet Indian roads.'
                  : 'Keep water with you and rest in shade every hour.'}
              </div>
            )}
          </>
        )}

        {brief && (
          <div className="banner ok" style={{ whiteSpace: 'pre-wrap' }}>
            <strong>Saathi's advice for today</strong>
            {brief}
          </div>
        )}

        <button className="primary" onClick={sos} style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}>
          🆘 Send SOS to someone
        </button>
        <p className="muted">
          Opens WhatsApp with a ready message. Pick the person you want to alert — nothing is sent
          until you press send.
        </p>
      </Card>

      <Card
        title="Should I take this order?"
        sub="Petrol, your time and the rain, worked out before you tap accept."
      >
        <div className="row">
          <div>
            <label htmlFor="payout">Order pays (₹)</label>
            <input
              id="payout"
              type="number"
              inputMode="numeric"
              value={payout}
              onChange={(e) => setPayout(Number(e.target.value))}
            />
          </div>
          <div>
            <label htmlFor="distance">Distance (km)</label>
            <input
              id="distance"
              type="number"
              inputMode="decimal"
              value={distance}
              onChange={(e) => setDistance(Number(e.target.value))}
            />
          </div>
        </div>
        <button className="primary" style={{ marginTop: 12 }} onClick={() => void decide()} disabled={deciding}>
          Work it out
        </button>

        {math && (
          <>
            <div className={`banner ${math.worthIt ? 'ok' : 'warn'}`}>
              <strong>{math.worthIt ? 'Worth taking' : 'Below your usual rate'}</strong>
              You keep {rupees(math.netKept)} — that works out to {rupees(math.netPerHour)} an hour
              against your average of {rupees(math.benchmarkHourly)}.
            </div>
            <table>
              <tbody>
                <tr><th>Order pays</th><td>{rupees(math.payout)}</td></tr>
                <tr><th>Round trip</th><td>{math.roundTripKm} km</td></tr>
                <tr><th>Petrol</th><td>−{rupees(math.fuelCost)}</td></tr>
                {math.weatherPenalty > 0 && (
                  <tr><th>Rain cost</th><td>−{rupees(math.weatherPenalty)}</td></tr>
                )}
                <tr><th>You keep</th><td><strong>{rupees(math.netKept)}</strong></td></tr>
              </tbody>
            </table>
          </>
        )}
        {deciding && <Busy label="Asking Saathi to say it simply…" />}
        {verdict && (
          <div className="banner ok">
            <strong>Saathi says</strong>
            {verdict}
          </div>
        )}
      </Card>
    </>
  );
}

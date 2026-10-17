import { useEffect, useState } from 'react';
import { Card } from './components/ui';
import Documents from './features/Documents';
import Grievance from './features/Grievance';
import Ledger from './features/Ledger';
import Saathi from './features/Saathi';
import Safety from './features/Safety';
import Schemes from './features/Schemes';
import { aiLog, CITIES, onAiLog } from './lib/api';
import { LANGUAGES, useAppState } from './lib/store';

type Tab = 'home' | 'saathi' | 'haq' | 'likho' | 'kaagaz' | 'surakshit';

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'home', icon: '₹', label: 'Hisaab' },
  { id: 'saathi', icon: '💬', label: 'Saathi' },
  { id: 'haq', icon: '🛡', label: 'Haq' },
  { id: 'likho', icon: '✍', label: 'Likho' },
  { id: 'kaagaz', icon: '📄', label: 'Kaagaz' },
  { id: 'surakshit', icon: '🌡', label: 'Safety' },
];

export default function App() {
  const { state, updateProfile, addEarning, addExpense, addDocument, addGrievance, reset } =
    useAppState();
  const [tab, setTab] = useState<Tab>('home');
  const [panel, setPanel] = useState<'none' | 'settings' | 'ailog'>('none');

  if (!state.profile.onboarded) {
    return <Onboarding onDone={(p) => updateProfile({ ...p, onboarded: true })} />;
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="logo">
          Haq<span>Se</span>
        </div>
        <div className="spacer" />
        <button
          className="ghost"
          onClick={() => setPanel(panel === 'ailog' ? 'none' : 'ailog')}
          aria-pressed={panel === 'ailog'}
        >
          AI log
        </button>
        <button
          className="ghost"
          onClick={() => setPanel(panel === 'settings' ? 'none' : 'settings')}
          aria-pressed={panel === 'settings'}
        >
          ⚙ <span className="sr-only">Settings</span>
        </button>
      </header>

      <main>
        {panel === 'settings' && (
          <Settings state={state} updateProfile={updateProfile} reset={reset} />
        )}
        {panel === 'ailog' && <AiLogPanel />}

        {panel === 'none' && (
          <>
            {tab === 'home' && (
              <Ledger state={state} addEarning={addEarning} addExpense={addExpense} />
            )}
            {tab === 'saathi' && <Saathi state={state} />}
            {tab === 'haq' && <Schemes state={state} />}
            {tab === 'likho' && <Grievance state={state} addGrievance={addGrievance} />}
            {tab === 'kaagaz' && <Documents state={state} addDocument={addDocument} />}
            {tab === 'surakshit' && <Safety state={state} />}
          </>
        )}
      </main>

      <nav className="nav" aria-label="Main">
        {TABS.map((t) => (
          <button
            key={t.id}
            aria-current={panel === 'none' && tab === t.id ? 'page' : undefined}
            onClick={() => {
              setTab(t.id);
              setPanel('none');
            }}
          >
            <span className="ico" aria-hidden="true">
              {t.icon}
            </span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

// ------------------------------------------------------------- onboarding

function Onboarding({ onDone }: { onDone: (p: Record<string, unknown>) => void }) {
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('Hindi');
  const [city, setCity] = useState('Delhi');
  const [age, setAge] = useState(28);
  const [monthlyIncome, setMonthlyIncome] = useState(14000);
  const [dependents, setDependents] = useState(2);

  return (
    <div className="app">
      <header className="topbar">
        <div className="logo">
          Haq<span>Se</span>
        </div>
      </header>
      <Card
        title="Six questions, once."
        sub="This is all HaqSe needs to check your schemes, your minimum wage and your safety. Everything stays on this phone."
      >
        <label htmlFor="o-name">Your name</label>
        <input id="o-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ravi Kumar" />

        <label htmlFor="o-lang">Language you want to be spoken to in</label>
        <select id="o-lang" value={language} onChange={(e) => setLanguage(e.target.value)}>
          {LANGUAGES.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>

        <label htmlFor="o-city">City you work in</label>
        <select id="o-city" value={city} onChange={(e) => setCity(e.target.value)}>
          {Object.keys(CITIES).map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <div className="row">
          <div>
            <label htmlFor="o-age">Your age</label>
            <input
              id="o-age"
              type="number"
              inputMode="numeric"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
            />
          </div>
          <div>
            <label htmlFor="o-dep">People who depend on you</label>
            <input
              id="o-dep"
              type="number"
              inputMode="numeric"
              value={dependents}
              onChange={(e) => setDependents(Number(e.target.value))}
            />
          </div>
        </div>

        <label htmlFor="o-income">Roughly what you earn a month (₹)</label>
        <input
          id="o-income"
          type="number"
          inputMode="numeric"
          value={monthlyIncome}
          onChange={(e) => setMonthlyIncome(Number(e.target.value))}
        />

        <button
          className="primary"
          style={{ marginTop: 16 }}
          onClick={() =>
            onDone({
              name,
              language,
              city,
              state: CITIES[city]?.state ?? 'Delhi',
              age,
              monthlyIncome,
              dependents,
            })
          }
        >
          Start
        </button>
      </Card>
    </div>
  );
}

// --------------------------------------------------------------- settings

function Settings({
  state,
  updateProfile,
  reset,
}: {
  state: ReturnType<typeof useAppState>['state'];
  updateProfile: ReturnType<typeof useAppState>['updateProfile'];
  reset: () => void;
}) {
  const p = state.profile;
  return (
    <Card title="Settings" sub="Change these and every other screen updates.">
      <label htmlFor="s-lang">Language</label>
      <select id="s-lang" value={p.language} onChange={(e) => updateProfile({ language: e.target.value })}>
        {LANGUAGES.map((l) => (
          <option key={l}>{l}</option>
        ))}
      </select>

      <label htmlFor="s-city">City</label>
      <select
        id="s-city"
        value={p.city}
        onChange={(e) =>
          updateProfile({ city: e.target.value, state: CITIES[e.target.value]?.state ?? 'Delhi' })
        }
      >
        {Object.keys(CITIES).map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>

      <div className="row">
        <div>
          <label htmlFor="s-age">Age</label>
          <input id="s-age" type="number" value={p.age} onChange={(e) => updateProfile({ age: Number(e.target.value) })} />
        </div>
        <div>
          <label htmlFor="s-dep">Dependents</label>
          <input
            id="s-dep"
            type="number"
            value={p.dependents}
            onChange={(e) => updateProfile({ dependents: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="row">
        <div>
          <label htmlFor="s-kmpl">Vehicle km per litre</label>
          <input
            id="s-kmpl"
            type="number"
            value={p.vehicleKmpl}
            onChange={(e) => updateProfile({ vehicleKmpl: Number(e.target.value) })}
          />
        </div>
        <div>
          <label htmlFor="s-fuel">Petrol price (₹/litre)</label>
          <input
            id="s-fuel"
            type="number"
            value={p.fuelPrice}
            onChange={(e) => updateProfile({ fuelPrice: Number(e.target.value) })}
          />
        </div>
      </div>

      <label htmlFor="s-income">Monthly income (₹)</label>
      <input
        id="s-income"
        type="number"
        value={p.monthlyIncome}
        onChange={(e) => updateProfile({ monthlyIncome: Number(e.target.value) })}
      />

      <button style={{ marginTop: 16 }} onClick={() => confirm('Erase everything on this phone?') && reset()}>
        Erase all my data
      </button>
    </Card>
  );
}

// ----------------------------------------------------------------- ai log

/**
 * Receipts for the evaluator.
 *
 * Every model call this session, with the real model name, token counts and
 * latency straight from the API response. Nothing in this app can show a
 * number here without having actually called the API.
 */
function AiLogPanel() {
  const [, force] = useState(0);
  useEffect(() => onAiLog(() => force((n) => n + 1)), []);

  const live = aiLog.filter((u) => !u.cached).length;
  const cachedCount = aiLog.filter((u) => u.cached).length;
  const inTokens = aiLog.reduce((a, u) => a + (u.inputTokens ?? 0), 0);
  const outTokens = aiLog.reduce((a, u) => a + (u.outputTokens ?? 0), 0);

  return (
    <Card
      title="AI call log"
      sub="Every model call made in this session, as reported by the Anthropic API. Open it after trying a few screens."
    >
      {aiLog.length === 0 ? (
        <p className="muted">No calls yet. Use any screen and come back.</p>
      ) : (
        <>
          <p className="muted">
            {live} live calls · {cachedCount} served from cache · {inTokens} input tokens ·{' '}
            {outTokens} output tokens
          </p>
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Model</th>
                <th>In</th>
                <th>Out</th>
                <th>ms</th>
              </tr>
            </thead>
            <tbody>
              {aiLog.slice(0, 25).map((u, i) => (
                <tr key={i}>
                  <td>{u.action}</td>
                  <td>{u.cached ? 'cache hit' : u.model}</td>
                  <td>{u.inputTokens}</td>
                  <td>{u.outputTokens}</td>
                  <td>{u.latencyMs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </Card>
  );
}

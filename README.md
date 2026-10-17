# HaqSe — Gig Worker Companion

**Tera kaam, tera hisaab, tera haq.** *(Your work, your accounts, your rights.)*

A multilingual assistant for Indian gig and informal workers — delivery riders,
cab drivers and daily-wage workers. It turns the payout screenshots and bills already sitting
in a worker's phone into a ledger, a rights map, a filed grievance and the first income proof
they have ever been able to hand to a bank.

---

## 1. Chosen vertical

**Gig Worker Companion.** The brief asks for multilingual guidance on earnings tracking, safety
practices, rights and welfare scheme awareness, document help, and grievance drafting. HaqSe
ships a working flow for each of the six, and they all read and write the same worker profile.

| Brief requirement | Flow in HaqSe | Where |
|---|---|---|
| Earnings tracking | **Hisaab** — photo → ledger → true hourly rate → Deduction Detective → income certificate | `src/features/Ledger.tsx` |
| Multilingual guidance | **Saathi** — assistant in 10 languages, answering from real ledger data | `src/features/Saathi.tsx` |
| Rights & welfare schemes | **Haq Checker** — 12-scheme corpus, deterministic eligibility, cited sources | `src/features/Schemes.tsx`, `src/data/schemes.ts` |
| Grievance / dispute drafting | **Likho** — four register-shifted letters built on real evidence | `src/features/Grievance.tsx` |
| Document help | **Kaagaz** — document reading, masked numbers, expiry warnings with real penalties | `src/features/Documents.tsx` |
| Safety practices | **Surakshit** — live weather, heat thresholds, SOS, plus the Order Decider | `src/features/Safety.tsx` |

---

## 2. The idea in one paragraph

Gig workers do not have a dashboard problem. They have a **proof problem**. They cannot prove
what they earned (no payslip), what they spent (no books), or what the platform did to them (no
record) — so every high-value thing in their life, a loan, a scheme application, a dispute, dies
the moment someone asks "do you have proof?". HaqSe is a proof engine in plain language.

---

## 3. Approach and logic

### 3.1 The rule that shapes the whole codebase

> **AI explains. Code decides.**

Every number a worker sees is produced by a pure, unit-tested function. The model is only ever
asked to put those numbers into their language. This is not a stylistic choice — it is what makes
a hallucinated earnings figure structurally impossible.

Concretely:

- **Earnings** — `computeTotals()` in `src/lib/money.ts`. The model's only job was reading the
  photo; the arithmetic is ours.
- **Deduction Detective** — `detectAnomalies()` flags a deduction when it is a label the worker
  has never seen, or more than 2σ above that label's own history. Statistics first; the model is
  asked only to explain a flag we already raised.
- **Scheme eligibility** — `filterEligible()` is a deterministic rules engine. The model receives
  the list of IDs that already passed and may only rank and explain them. The UI then renders
  benefit amounts, steps and links **from the corpus, not from the model's reply**, and the
  client re-filters the model's output against the eligible set before rendering.
- **Order Decider** — `decideOrder()` does the break-even maths. The model writes one sentence.
- **Minimum wage** — compared against a versioned table of state notifications.

### 3.2 Logical decision making from user context

Six onboarding questions (age, state, income, dependents, vehicle, language) drive everything
downstream:

- scheme eligibility and ranking,
- which state's minimum wage the true hourly rate is judged against,
- which city's live weather and which heat thresholds apply,
- the fuel and mileage figures behind every order verdict,
- the language of every generated sentence,
- the worker's details inside the grievance letters.

Change the city in Settings and the weather, the minimum wage benchmark and the state welfare
board all change with it.

### 3.3 Worked example

Ravi, 31, Delhi, three platforms:

1. Photographs a payout screen → Sonnet reads it → ledger row.
2. `computeTotals` → *"₹18,400 earned, ₹11,200 kept, ₹62/hour."*
3. `compareToMinimumWage` → *"Delhi unskilled minimum is about ₹71/hour. You are short ₹9 every hour."*
4. `detectAnomalies` → *"'quality penalty' ₹400 has never appeared on your payouts before."*
5. He opens **Likho**, writes one sentence in Hindi. The drafter pulls that flagged deduction and
   the surrounding payout rows as evidence and writes four letters.
6. **Haq Checker** → 10 eligible schemes, each with its official URL and last-checked date.
7. **Hisaab** → income certificate PDF for the loan he has been refused twice.

---

## 4. Architecture

```
Browser (React 18 + TS strict, PWA)
  │  never holds an API key
  │  localStorage only — earnings and documents never leave the phone
  ▼
/api/ai  (one serverless function — the ONLY path to Anthropic)
  │  action router · input clamping · prompt construction
  │  response cache · prompt caching · untrusted-data fencing
  ▼
Anthropic Messages API        Open-Meteo (keyless, live weather)
```

```
src/
├ lib/money.ts        pure calculators — the numbers spine, 100% of the test suite
├ lib/store.ts        local-first persistence + app state hook
├ lib/api.ts          AI client, image downscaling, weather
├ data/schemes.ts     scheme corpus + deterministic eligibility rules
├ components/ui.tsx   shared UI primitives
├ features/           one folder-free module per flow
api/ai.ts             the AI gateway
tests/money.test.ts   24 unit tests
```

In development the exact same `api/ai.ts` handler is mounted as Vite middleware
(see `vite.config.ts`), so there is one implementation and no dev/prod drift.

---

## 5. How to run it

```bash
npm install
cp .env.example .env        # add your ANTHROPIC_API_KEY
npm run dev
```

```bash
npm test          # 24 unit tests
npm run typecheck # tsc --noEmit, strict
npm run build     # ~60 KB gzipped
```

Deploy: push to GitHub, import into Vercel, set `ANTHROPIC_API_KEY` as an environment variable.
`vercel.json` is already configured.

**No login.** There are no credentials to share because there is no account — an evaluator opens
the URL, answers six questions and has the whole app. Nothing is gated.

**Sample images for testing.** The camera features need Indian payout screens and documents that
a reviewer is unlikely to have to hand, so six synthetic ones are in [`samples/`](samples/) with
an upload order and what each should produce. They are drawn from scratch by a committed script,
and the identity documents are visibly marked SAMPLE.

---

## 6. Evaluation notes

### Code Quality
TypeScript strict with `noUnusedLocals`, zero `any`. Business logic is pure and lives apart from
React. One AI client, one error taxonomy, one state hook. Typecheck and tests both clean.

### Security
- `ANTHROPIC_API_KEY` is read only inside the serverless function. It is never prefixed `VITE_`,
  so it cannot reach the bundle.
- **Prompt-injection handling**: OCR text, user narratives and anything else from an image is
  fenced in `<untrusted_data>` tags, and every system prompt states that content inside those
  tags is data and never an instruction.
- **Document numbers are masked at extraction** — the model is instructed to return all but the
  last four characters as `X`, and the photo itself is never stored.
- All input is length-clamped and type-coerced at the gateway before any prompt is built.
- Worker data is local-only. There is no server database and no account to breach.
- The model's scheme output is re-filtered against the eligible set client-side — the server is
  not trusted to have constrained it.

### Efficiency
- **Model tiering** — Haiku 5.5 for five of seven actions; Sonnet 5.5 only for messy receipt
  extraction and four-document drafting; **Opus is not used at all**, because nothing here needs
  it. See `GENAI.md` for the per-action rationale.
- **Send less, not more** — the scheme call explains only the six most valuable matches and gets a
  trimmed corpus, because the steps and URLs are rendered locally. Measured: 193 input tokens.
- **Response cache** at the gateway — identical payloads inside 10 minutes never reach the API.
  Measured: 1191 ms to 0 ms on a repeat call.
- **Images downscaled to 896px** client-side before encoding, which is the single biggest token
  saving in the app.
- Extended thinking left off; `max_tokens` sized per action from measured output. 60 KB gzipped.
- Prompt caching is declared on the scheme corpus but does **not** currently engage — after
  trimming, that block sits below the minimum cacheable size. `GENAI.md` explains why it is left
  in place rather than quietly claimed as a win.

### Testing
24 unit tests over the calculators and the eligibility rules, covering the edge cases that
actually break this kind of app: empty ledgers, zero hours, unknown states, unknown vehicles,
first-time deduction labels, and age/income/state boundaries on every scheme rule.
One of them caught a real bug during the build — the anomaly detector was including the payout
under judgement in its own baseline, which let a large new deduction hide itself.

All seven AI actions were additionally verified against the live API, including both vision
actions against generated test documents. Document masking was asserted explicitly: the full
licence number does not appear in the stored record.

### Accessibility
Built for a cheap Android held one-handed in sunlight, by someone who may read slowly.

Photo inputs offer **both** camera and gallery. A paper bill wants the camera; a payout screen is
usually already a screenshot, and a camera-only input makes that unreachable.

A six-step tour runs once on first open, skippable from step one, replayable from Settings, and
remembered in localStorage so it never interrupts twice.

Model replies have their markdown stripped before display, so a bolded amount never reaches the
screen as raw asterisks. 52-56px touch targets, 16px base type, semantic landmarks, `aria-live`
on every async region, visible focus rings, full keyboard operation, light and dark themes,
`prefers-reduced-motion` respected, and a layout that holds at 320px.

### Problem Statement Alignment
All six required capabilities are built, each one reachable in two taps, each one sharing the
same profile so the flows compound rather than sit side by side.

---

## 7. Assumptions made

1. **Scheme data is a curated snapshot.** Twelve real schemes, each with `lastVerified` and an
   official URL shown in the UI. The app says "schemes you *appear* to qualify for — confirm at a
   CSC" rather than asserting entitlement.
2. **Minimum wage figures** are recent state notifications for unskilled work, divided to an
   hourly rate. All 28 states and 8 union territories are covered, each with its major working
   cities. They are revised twice a year, so they are approximations — the UI shows the
   `WAGES_VERIFIED` date rather than quoting them as legal fact. One record per state in
   `src/data/places.ts`.
3. **Fuel price and mileage** default to ₹95/litre and 45 km/l and are editable in Settings,
   because they vary by city and vehicle.
4. **Ride time** is estimated at 18 km/h door-to-door for city two-wheeler delivery.
5. **Rain cost** is modelled as 25% of fuel cost plus ₹10 — a deliberate approximation standing in
   for slower riding, wear and risk, and it is shown as its own line so the worker can see it.
6. **Local-only storage** is a privacy choice, not a shortcut. It means no sync across devices;
   that trade is worth it for a product holding someone's income and ID documents.
7. **Platform grievance addresses** are left as `[FILL: ...]` placeholders rather than guessed,
   since they change and a wrong address means an unsent complaint.
8. **The app is not a lawyer.** It drafts documents and surfaces public information. That
   disclaimer is in the UI, not just here.

---

## 8. Honest limitations

- Receipt extraction is only as good as the photo. Low-confidence reads are labelled as such and
  every field is shown for confirmation before anything is saved — the app would rather ask than
  guess.
- If a model call fails, the app shows the failure. There are **no canned fallback responses**
  anywhere, by design.
- **Voice input and spoken output are not in this build.** They were implemented, behaved
  inconsistently across devices, and were removed rather than shipped half-working. Saathi and
  Likho are text-only for now. The markdown-stripping helper they needed (`src/lib/text.ts`)
  stays, because it also cleans model replies for display.

---

## 9. GenAI services used

Anthropic Claude (Messages API). Full per-action table with models, call sites and token budgets
is in **[GENAI.md](GENAI.md)**.

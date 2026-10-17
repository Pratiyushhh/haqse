import { describe, expect, it } from 'vitest';
import {
  buildIncomeSummary,
  compareToMinimumWage,
  computeTotals,
  decideOrder,
  detectAnomalies,
  estimateMinutes,
  minWageHourly,
  type Earning,
  type Expense,
} from '../src/lib/money';
import { filterEligible } from '../src/data/schemes';

const earning = (over: Partial<Earning> = {}): Earning => ({
  id: 'e1',
  platform: 'Zomato',
  date: '2026-10-01',
  gross: 1000,
  incentive: 200,
  trips: 20,
  hours: 10,
  distanceKm: 80,
  deductions: [],
  ...over,
});

describe('computeTotals', () => {
  it('subtracts platform deductions and the worker\'s own costs', () => {
    const earnings = [earning({ deductions: [{ label: 'late', amount: 100 }] })];
    const expenses: Expense[] = [{ id: 'x', category: 'fuel', amount: 200, date: '2026-10-01' }];
    const t = computeTotals(earnings, expenses);

    expect(t.gross).toBe(1000);
    expect(t.platformDeductions).toBe(100);
    expect(t.expenses).toBe(200);
    expect(t.net).toBe(900); // 1000 + 200 - 100 - 200
    expect(t.trueHourly).toBe(90);
    expect(t.perTrip).toBe(45);
  });

  it('never divides by zero when no hours are recorded', () => {
    const t = computeTotals([earning({ hours: 0, trips: 0, distanceKm: 0 })], []);
    expect(t.trueHourly).toBe(0);
    expect(t.perTrip).toBe(0);
    expect(t.perKm).toBe(0);
  });

  it('returns zeroes for an empty ledger', () => {
    const t = computeTotals([], []);
    expect(t.net).toBe(0);
    expect(t.trueHourly).toBe(0);
  });
});

describe('minimum wage comparison', () => {
  it('flags a rate below the state minimum', () => {
    const v = compareToMinimumWage(62, 'Delhi');
    expect(v.belowMinimum).toBe(true);
    expect(v.shortfallPerHour).toBeGreaterThan(0);
  });

  it('does not flag a rate above the minimum', () => {
    expect(compareToMinimumWage(200, 'Delhi').belowMinimum).toBe(false);
  });

  it('treats an unknown state with the national fallback rather than crashing', () => {
    expect(minWageHourly('Nowhere')).toBeGreaterThan(0);
  });

  it('does not flag a worker with no recorded hours', () => {
    expect(compareToMinimumWage(0, 'Delhi').belowMinimum).toBe(false);
  });
});

describe('detectAnomalies', () => {
  it('flags a deduction label that has never appeared before', () => {
    const found = detectAnomalies([
      earning({ id: 'a', date: '2026-10-02', deductions: [{ label: 'quality penalty', amount: 400 }] }),
      earning({ id: 'b', date: '2026-10-01', deductions: [{ label: 'late', amount: 20 }] }),
    ]);
    expect(found).toHaveLength(1);
    expect(found[0]!.label).toBe('quality penalty');
    expect(found[0]!.severity).toBe('high');
  });

  it('flags a deduction far above its own history', () => {
    const history = ['2026-09-01', '2026-09-02', '2026-09-03'].map((date, i) =>
      earning({ id: 'h' + i, date, deductions: [{ label: 'late', amount: 20 }] }),
    );
    const found = detectAnomalies([
      earning({ id: 'now', date: '2026-10-05', deductions: [{ label: 'late', amount: 500 }] }),
      ...history,
    ]);
    expect(found.some((a) => a.label === 'late')).toBe(true);
  });

  it('stays quiet when a deduction matches its history', () => {
    const rows = ['2026-09-01', '2026-09-02', '2026-10-01'].map((date, i) =>
      earning({ id: 'r' + i, date, deductions: [{ label: 'late', amount: 20 }] }),
    );
    expect(detectAnomalies(rows)).toHaveLength(0);
  });

  it('returns nothing for an empty ledger', () => {
    expect(detectAnomalies([])).toEqual([]);
  });
});

describe('decideOrder', () => {
  const base = {
    payout: 85,
    distanceKm: 7,
    fuelPricePerLitre: 95,
    vehicleKmpl: 45,
    trueHourly: 62,
    estimatedMinutes: 47,
    raining: false,
  };

  it('charges petrol for the round trip, not one way', () => {
    const m = decideOrder(base);
    expect(m.roundTripKm).toBe(14);
    expect(m.fuelCost).toBeCloseTo((14 / 45) * 95, 1);
  });

  it('adds a cost when it is raining', () => {
    expect(decideOrder({ ...base, raining: true }).netKept).toBeLessThan(decideOrder(base).netKept);
  });

  it('calls a long cheap order not worth it', () => {
    expect(decideOrder({ ...base, payout: 40, distanceKm: 12 }).worthIt).toBe(false);
  });

  it('calls a short well-paid order worth it', () => {
    expect(decideOrder({ ...base, payout: 150, distanceKm: 2, estimatedMinutes: 15 }).worthIt).toBe(true);
  });

  it('falls back to a sane mileage when the vehicle is unknown', () => {
    expect(decideOrder({ ...base, vehicleKmpl: 0 }).fuelCost).toBeGreaterThan(0);
  });

  it('estimates a sensible ride time', () => {
    expect(estimateMinutes(18)).toBe(60);
    expect(estimateMinutes(0.5)).toBe(10); // never below the 10 minute floor
  });
});

describe('buildIncomeSummary', () => {
  it('summarises a multi-month ledger', () => {
    const s = buildIncomeSummary(
      [
        earning({ id: '1', date: '2026-08-01' }),
        earning({ id: '2', date: '2026-09-01' }),
        earning({ id: '3', date: '2026-10-01' }),
      ],
      [],
    );
    expect(s.totalNet).toBe(3600);
    expect(s.activeDays).toBe(3);
    expect(s.platforms).toEqual(['Zomato']);
    expect(s.averageMonthlyNet).toBeGreaterThan(0);
  });

  it('handles an empty ledger without dividing by zero', () => {
    const s = buildIncomeSummary([], []);
    expect(s.averageMonthlyNet).toBe(0);
    expect(s.consistencyScore).toBe(0);
  });
});

describe('scheme eligibility rules', () => {
  const ravi = { age: 31, monthlyIncome: 14000, state: 'Delhi', hasVehicle: true, dependents: 2 };

  it('matches schemes for a typical delivery rider', () => {
    const ids = filterEligible(ravi).map((s) => s.id);
    expect(ids).toContain('eshram');
    expect(ids).toContain('pm-sym');
    expect(ids).toContain('pmsby');
  });

  it('excludes PM-SYM once the worker is over 40', () => {
    expect(filterEligible({ ...ravi, age: 45 }).map((s) => s.id)).not.toContain('pm-sym');
  });

  it('excludes state schemes outside that state', () => {
    expect(filterEligible(ravi).map((s) => s.id)).not.toContain('rajasthan-gig-board');
    expect(filterEligible({ ...ravi, state: 'Rajasthan' }).map((s) => s.id)).toContain(
      'rajasthan-gig-board',
    );
  });

  it('excludes income-capped schemes for a higher earner', () => {
    expect(filterEligible({ ...ravi, monthlyIncome: 60000 }).map((s) => s.id)).not.toContain('pm-sym');
  });

  it('excludes dependent-only schemes for a worker with none', () => {
    expect(filterEligible({ ...ravi, dependents: 0 }).map((s) => s.id)).not.toContain('pmjjby');
  });
});

/**
 * The numbers spine of HaqSe.
 *
 * Every function here is pure and deterministic. No model, no network, no
 * React. This is deliberate: a worker's earnings must never be generated
 * text. The model is only ever asked to *explain* what these functions
 * compute.
 */

export type Earning = {
  id: string;
  platform: string;
  date: string;
  gross: number;
  incentive: number;
  trips: number;
  hours: number;
  distanceKm: number;
  deductions: { label: string; amount: number }[];
};

export type Expense = {
  id: string;
  category: 'fuel' | 'emi' | 'repair' | 'data' | 'fine' | 'food' | 'other';
  amount: number;
  date: string;
};

export type Totals = {
  gross: number;
  incentive: number;
  platformDeductions: number;
  expenses: number;
  net: number;
  hours: number;
  trips: number;
  distanceKm: number;
  trueHourly: number;
  perTrip: number;
  perKm: number;
};

export const sum = (xs: number[]): number => xs.reduce((a, b) => a + b, 0);

export function computeTotals(earnings: Earning[], expenses: Expense[]): Totals {
  const gross = sum(earnings.map((e) => e.gross));
  const incentive = sum(earnings.map((e) => e.incentive));
  const platformDeductions = sum(earnings.flatMap((e) => e.deductions.map((d) => d.amount)));
  const expenseTotal = sum(expenses.map((e) => e.amount));
  const hours = sum(earnings.map((e) => e.hours));
  const trips = sum(earnings.map((e) => e.trips));
  const distanceKm = sum(earnings.map((e) => e.distanceKm));
  const net = gross + incentive - platformDeductions - expenseTotal;

  return {
    gross,
    incentive,
    platformDeductions,
    expenses: expenseTotal,
    net,
    hours,
    trips,
    distanceKm,
    trueHourly: hours > 0 ? round2(net / hours) : 0,
    perTrip: trips > 0 ? round2(net / trips) : 0,
    perKm: distanceKm > 0 ? round2(net / distanceKm) : 0,
  };
}

export const round2 = (n: number): number => Math.round(n * 100) / 100;

/** Minimum wage for unskilled work, rupees per 8-hour day. Source: state labour notifications. */
export const MIN_WAGE_PER_DAY: Record<string, number> = {
  Delhi: 18456 / 26,
  Karnataka: 15423 / 26,
  Maharashtra: 14000 / 26,
  Rajasthan: 7488 / 26,
  Telangana: 11000 / 26,
  'Tamil Nadu': 12000 / 26,
  'West Bengal': 10374 / 26,
  Gujarat: 12324 / 26,
  Other: 12000 / 26,
};

export function minWageHourly(state: string): number {
  const perDay = MIN_WAGE_PER_DAY[state] ?? MIN_WAGE_PER_DAY.Other!;
  return round2(perDay / 8);
}

export type WageVerdict = {
  trueHourly: number;
  minHourly: number;
  shortfallPerHour: number;
  belowMinimum: boolean;
};

export function compareToMinimumWage(trueHourly: number, state: string): WageVerdict {
  const minHourly = minWageHourly(state);
  return {
    trueHourly: round2(trueHourly),
    minHourly,
    shortfallPerHour: round2(Math.max(0, minHourly - trueHourly)),
    belowMinimum: trueHourly > 0 && trueHourly < minHourly,
  };
}

// --------------------------------------------------- Deduction Detective

export type Anomaly = {
  label: string;
  amount: number;
  reason: string;
  severity: 'high' | 'medium';
};

/**
 * Statistics first, language second.
 *
 * A deduction is flagged when it is a label this worker has never seen
 * before, or when it is more than two standard deviations above that label's
 * own history. The model is never asked whether something is an anomaly - it
 * is only asked to explain one we already found.
 */
/**
 * Deductions that are lawful and expected, so flagging them would send a
 * worker to argue with their platform about statutory tax. The Detective
 * exists to find money taken wrongly, not money taken correctly.
 */
const STATUTORY = ['tds', 'tax', 'gst', 'pf', 'epf', 'esi', 'esic', 'insurance premium'];

export const isStatutory = (label: string): boolean => {
  const l = label.trim().toLowerCase();
  return STATUTORY.some((s) => l.includes(s));
};

export function detectAnomalies(earnings: Earning[]): Anomaly[] {
  const byDateDesc = [...earnings].sort((a, b) => b.date.localeCompare(a.date));
  const latest = byDateDesc[0];
  if (!latest) return [];

  // History must exclude the payout being judged, otherwise a large new
  // deduction inflates its own baseline and hides itself.
  const history = new Map<string, number[]>();
  for (const e of byDateDesc.slice(1)) {
    for (const d of e.deductions) {
      const key = d.label.trim().toLowerCase();
      history.set(key, [...(history.get(key) ?? []), d.amount]);
    }
  }

  const found: Anomaly[] = [];
  for (const d of latest.deductions) {
    if (isStatutory(d.label)) continue;
    const key = d.label.trim().toLowerCase();
    const prior = history.get(key) ?? [];

    if (prior.length === 0) {
      found.push({
        label: d.label,
        amount: d.amount,
        reason: 'This is the first time this deduction has appeared on your payouts.',
        severity: 'high',
      });
      continue;
    }

    const mean = sum(prior) / prior.length;
    const variance = sum(prior.map((x) => (x - mean) ** 2)) / prior.length;
    const sd = Math.sqrt(variance);
    if (sd > 0 && d.amount > mean + 2 * sd) {
      found.push({
        label: d.label,
        amount: d.amount,
        reason: `Usually about ₹${Math.round(mean)}. This time it is ₹${Math.round(d.amount)}.`,
        severity: 'high',
      });
    } else if (sd === 0 && d.amount > mean) {
      found.push({
        label: d.label,
        amount: d.amount,
        reason: `This has always been ₹${Math.round(mean)} before.`,
        severity: 'medium',
      });
    }
  }
  return found;
}

// --------------------------------------------------------- Order Decider

export type OrderInput = {
  payout: number;
  distanceKm: number;
  fuelPricePerLitre: number;
  vehicleKmpl: number;
  trueHourly: number;
  estimatedMinutes: number;
  raining: boolean;
};

export type OrderVerdictMath = {
  payout: number;
  roundTripKm: number;
  fuelCost: number;
  timeCost: number;
  weatherPenalty: number;
  netKept: number;
  netPerHour: number;
  benchmarkHourly: number;
  worthIt: boolean;
};

export function decideOrder(input: OrderInput): OrderVerdictMath {
  const roundTripKm = round2(input.distanceKm * 2);
  const kmpl = input.vehicleKmpl > 0 ? input.vehicleKmpl : 40;
  const fuelCost = round2((roundTripKm / kmpl) * input.fuelPricePerLitre);
  const minutes = input.estimatedMinutes > 0 ? input.estimatedMinutes : estimateMinutes(roundTripKm);
  const timeCost = round2((minutes / 60) * input.trueHourly);
  // Rain costs real money: slower riding, more wear, higher risk.
  const weatherPenalty = input.raining ? round2(fuelCost * 0.25 + 10) : 0;
  const netKept = round2(input.payout - fuelCost - weatherPenalty);
  const netPerHour = round2(minutes > 0 ? (netKept / minutes) * 60 : 0);

  return {
    payout: input.payout,
    roundTripKm,
    fuelCost,
    timeCost,
    weatherPenalty,
    netKept,
    netPerHour,
    benchmarkHourly: round2(input.trueHourly),
    worthIt: netPerHour >= input.trueHourly,
  };
}

/** City two-wheeler delivery averages roughly 18 km/h door to door. */
export const estimateMinutes = (km: number): number => Math.max(10, Math.round((km / 18) * 60));

// ------------------------------------------------------ Income certificate

export type IncomeSummary = {
  months: number;
  totalNet: number;
  averageMonthlyNet: number;
  activeDays: number;
  consistencyScore: number;
  platforms: string[];
};

/**
 * Consistency score: what share of the period the worker actually earned on.
 * A lender cares less about the peak month than about whether income stops.
 */
export function buildIncomeSummary(earnings: Earning[], expenses: Expense[]): IncomeSummary {
  if (earnings.length === 0) {
    return { months: 0, totalNet: 0, averageMonthlyNet: 0, activeDays: 0, consistencyScore: 0, platforms: [] };
  }
  const totals = computeTotals(earnings, expenses);
  const dates = earnings.map((e) => e.date).filter(Boolean).sort();
  const activeDays = new Set(dates).size;
  const first = new Date(dates[0] ?? Date.now());
  const last = new Date(dates[dates.length - 1] ?? Date.now());
  const spanDays = Math.max(1, Math.round((last.getTime() - first.getTime()) / 86_400_000) + 1);
  const months = Math.max(1, round2(spanDays / 30));

  return {
    months,
    totalNet: round2(totals.net),
    averageMonthlyNet: round2(totals.net / months),
    activeDays,
    consistencyScore: Math.min(100, Math.round((activeDays / spanDays) * 100)),
    platforms: [...new Set(earnings.map((e) => e.platform).filter(Boolean))],
  };
}

export const rupees = (n: number): string =>
  '₹' + Math.round(n).toLocaleString('en-IN');

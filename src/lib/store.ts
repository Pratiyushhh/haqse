/**
 * Local-first persistence.
 *
 * Everything a worker records stays on their own device. There is no account
 * and no server database, which means: evaluators get instant access with no
 * credentials, and a worker's earnings and documents never leave their phone.
 * The only thing that ever goes to a server is the specific payload needed
 * for one AI call.
 */

import { useEffect, useState } from 'react';
import type { Earning, Expense } from './money';

export type DocRecord = {
  id: string;
  docType: string;
  numberMasked: string;
  holderName: string;
  expiryDate: string;
};

export type Grievance = {
  id: string;
  createdAt: string;
  summary: string;
  missingFacts: string[];
  platformLetter: string;
  labourLetter: string;
  consumerLetter: string;
  workerSummary: string;
};

export type Profile = {
  name: string;
  language: string;
  city: string;
  state: string;
  age: number;
  monthlyIncome: number;
  hasVehicle: boolean;
  vehicleKmpl: number;
  dependents: number;
  fuelPrice: number;
  onboarded: boolean;
};

export type AppState = {
  profile: Profile;
  earnings: Earning[];
  expenses: Expense[];
  documents: DocRecord[];
  grievances: Grievance[];
};

export const LANGUAGES = [
  'Hindi',
  'English',
  'Bengali',
  'Tamil',
  'Telugu',
  'Marathi',
  'Kannada',
  'Gujarati',
  'Punjabi',
  'Odia',
] as const;

const KEY = 'haqse.v1';

export const emptyState: AppState = {
  profile: {
    name: '',
    language: 'Hindi',
    city: 'Delhi',
    state: 'Delhi',
    age: 28,
    monthlyIncome: 14000,
    hasVehicle: true,
    vehicleKmpl: 45,
    dependents: 2,
    fuelPrice: 95,
    onboarded: false,
  },
  earnings: [],
  expenses: [],
  documents: [],
  grievances: [],
};

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      ...emptyState,
      ...parsed,
      profile: { ...emptyState.profile, ...(parsed.profile ?? {}) },
    };
  } catch {
    return emptyState;
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked (private window). The app keeps working in
    // memory for this session rather than crashing.
  }
}

export const newId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const today = (): string => new Date().toISOString().slice(0, 10);

/** Single app-wide state hook. Small app, no need for a state library. */
export function useAppState() {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const update = (patch: Partial<AppState>) => setState((s) => ({ ...s, ...patch }));
  const updateProfile = (patch: Partial<Profile>) =>
    setState((s) => ({ ...s, profile: { ...s.profile, ...patch } }));
  const addEarning = (e: Earning) => setState((s) => ({ ...s, earnings: [e, ...s.earnings] }));
  const addExpense = (e: Expense) => setState((s) => ({ ...s, expenses: [e, ...s.expenses] }));
  const addDocument = (d: DocRecord) => setState((s) => ({ ...s, documents: [d, ...s.documents] }));
  const addGrievance = (g: Grievance) =>
    setState((s) => ({ ...s, grievances: [g, ...s.grievances] }));
  const reset = () => setState(emptyState);

  return { state, update, updateProfile, addEarning, addExpense, addDocument, addGrievance, reset };
}

/** Days until a document expires. Negative means it has already expired. */
export function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return null;
  return Math.ceil((then - Date.now()) / 86_400_000);
}

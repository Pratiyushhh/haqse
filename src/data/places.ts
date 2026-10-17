/**
 * States, union territories and their major working cities.
 *
 * Two things depend on this, which is why they live together:
 *   - the STATE drives scheme eligibility and the minimum-wage benchmark,
 *   - the CITY drives live weather and the safety brief.
 *
 * `minWagePerDay` is the notified minimum wage for UNSKILLED work in the
 * scheduled employments, in rupees per 8-hour day. These are revised by each
 * state, usually twice a year, so they are approximations shown as such in
 * the UI rather than quoted as legal fact. `wagesVerified` records when the
 * table was last reviewed.
 */

export type City = { lat: number; lon: number };
export type StateInfo = {
  minWagePerDay: number;
  cities: Record<string, City>;
};

export const WAGES_VERIFIED = '2026-10-17';

export const STATES: Record<string, StateInfo> = {
  'Andhra Pradesh': {
    minWagePerDay: 420,
    cities: {
      Visakhapatnam: { lat: 17.69, lon: 83.22 },
      Vijayawada: { lat: 16.51, lon: 80.65 },
      Guntur: { lat: 16.31, lon: 80.44 },
      Tirupati: { lat: 13.63, lon: 79.42 },
    },
  },
  'Arunachal Pradesh': {
    minWagePerDay: 310,
    cities: { Itanagar: { lat: 27.08, lon: 93.6 }, Naharlagun: { lat: 27.1, lon: 93.69 } },
  },
  Assam: {
    minWagePerDay: 340,
    cities: {
      Guwahati: { lat: 26.14, lon: 91.74 },
      Silchar: { lat: 24.83, lon: 92.78 },
      Dibrugarh: { lat: 27.47, lon: 94.91 },
    },
  },
  Bihar: {
    minWagePerDay: 420,
    cities: {
      Patna: { lat: 25.59, lon: 85.14 },
      Gaya: { lat: 24.8, lon: 85.0 },
      Muzaffarpur: { lat: 26.12, lon: 85.39 },
      Bhagalpur: { lat: 25.24, lon: 86.99 },
    },
  },
  Chhattisgarh: {
    minWagePerDay: 400,
    cities: {
      Raipur: { lat: 21.25, lon: 81.63 },
      Bhilai: { lat: 21.21, lon: 81.38 },
      Bilaspur: { lat: 22.08, lon: 82.15 },
    },
  },
  Goa: {
    minWagePerDay: 420,
    cities: { Panaji: { lat: 15.49, lon: 73.83 }, Margao: { lat: 15.28, lon: 73.96 } },
  },
  Gujarat: {
    minWagePerDay: 474,
    cities: {
      Ahmedabad: { lat: 23.02, lon: 72.57 },
      Surat: { lat: 21.17, lon: 72.83 },
      Vadodara: { lat: 22.31, lon: 73.18 },
      Rajkot: { lat: 22.3, lon: 70.8 },
      Gandhinagar: { lat: 23.22, lon: 72.65 },
    },
  },
  Haryana: {
    minWagePerDay: 445,
    cities: {
      Gurugram: { lat: 28.46, lon: 77.03 },
      Faridabad: { lat: 28.41, lon: 77.31 },
      Panipat: { lat: 29.39, lon: 76.97 },
      Ambala: { lat: 30.38, lon: 76.78 },
    },
  },
  'Himachal Pradesh': {
    minWagePerDay: 400,
    cities: { Shimla: { lat: 31.1, lon: 77.17 }, Solan: { lat: 30.91, lon: 77.1 }, Dharamshala: { lat: 32.22, lon: 76.32 } },
  },
  Jharkhand: {
    minWagePerDay: 400,
    cities: {
      Ranchi: { lat: 23.34, lon: 85.31 },
      Jamshedpur: { lat: 22.8, lon: 86.2 },
      Dhanbad: { lat: 23.8, lon: 86.43 },
    },
  },
  Karnataka: {
    minWagePerDay: 593,
    cities: {
      Bengaluru: { lat: 12.97, lon: 77.59 },
      Mysuru: { lat: 12.3, lon: 76.64 },
      Hubballi: { lat: 15.36, lon: 75.12 },
      Mangaluru: { lat: 12.91, lon: 74.86 },
      Belagavi: { lat: 15.85, lon: 74.5 },
    },
  },
  Kerala: {
    minWagePerDay: 500,
    cities: {
      Thiruvananthapuram: { lat: 8.52, lon: 76.94 },
      Kochi: { lat: 9.93, lon: 76.27 },
      Kozhikode: { lat: 11.25, lon: 75.78 },
      Thrissur: { lat: 10.53, lon: 76.21 },
    },
  },
  'Madhya Pradesh': {
    minWagePerDay: 415,
    cities: {
      Bhopal: { lat: 23.26, lon: 77.41 },
      Indore: { lat: 22.72, lon: 75.86 },
      Jabalpur: { lat: 23.18, lon: 79.99 },
      Gwalior: { lat: 26.22, lon: 78.18 },
    },
  },
  Maharashtra: {
    minWagePerDay: 538,
    cities: {
      Mumbai: { lat: 19.08, lon: 72.88 },
      Pune: { lat: 18.52, lon: 73.86 },
      Nagpur: { lat: 21.15, lon: 79.09 },
      Nashik: { lat: 20.01, lon: 73.79 },
      'Navi Mumbai': { lat: 19.03, lon: 73.02 },
      Thane: { lat: 19.22, lon: 72.98 },
    },
  },
  Manipur: { minWagePerDay: 330, cities: { Imphal: { lat: 24.82, lon: 93.94 } } },
  Meghalaya: { minWagePerDay: 420, cities: { Shillong: { lat: 25.58, lon: 91.89 } } },
  Mizoram: { minWagePerDay: 400, cities: { Aizawl: { lat: 23.73, lon: 92.72 } } },
  Nagaland: { minWagePerDay: 350, cities: { Kohima: { lat: 25.67, lon: 94.11 }, Dimapur: { lat: 25.91, lon: 93.73 } } },
  Odisha: {
    minWagePerDay: 450,
    cities: {
      Bhubaneswar: { lat: 20.3, lon: 85.82 },
      Cuttack: { lat: 20.46, lon: 85.88 },
      Rourkela: { lat: 22.26, lon: 84.85 },
    },
  },
  Punjab: {
    minWagePerDay: 420,
    cities: {
      Ludhiana: { lat: 30.9, lon: 75.86 },
      Amritsar: { lat: 31.63, lon: 74.87 },
      Jalandhar: { lat: 31.33, lon: 75.58 },
      Mohali: { lat: 30.7, lon: 76.72 },
    },
  },
  Rajasthan: {
    minWagePerDay: 288,
    cities: {
      Jaipur: { lat: 26.91, lon: 75.79 },
      Jodhpur: { lat: 26.24, lon: 73.02 },
      Udaipur: { lat: 24.58, lon: 73.71 },
      Kota: { lat: 25.21, lon: 75.86 },
      Ajmer: { lat: 26.45, lon: 74.64 },
    },
  },
  Sikkim: { minWagePerDay: 400, cities: { Gangtok: { lat: 27.33, lon: 88.61 } } },
  'Tamil Nadu': {
    minWagePerDay: 462,
    cities: {
      Chennai: { lat: 13.08, lon: 80.27 },
      Coimbatore: { lat: 11.02, lon: 76.96 },
      Madurai: { lat: 9.93, lon: 78.12 },
      Tiruchirappalli: { lat: 10.79, lon: 78.7 },
      Salem: { lat: 11.66, lon: 78.15 },
    },
  },
  Telangana: {
    minWagePerDay: 423,
    cities: {
      Hyderabad: { lat: 17.39, lon: 78.49 },
      Warangal: { lat: 17.97, lon: 79.59 },
      Nizamabad: { lat: 18.67, lon: 78.09 },
    },
  },
  Tripura: { minWagePerDay: 340, cities: { Agartala: { lat: 23.83, lon: 91.28 } } },
  'Uttar Pradesh': {
    minWagePerDay: 432,
    cities: {
      Lucknow: { lat: 26.85, lon: 80.95 },
      Kanpur: { lat: 26.45, lon: 80.33 },
      Noida: { lat: 28.54, lon: 77.39 },
      Ghaziabad: { lat: 28.67, lon: 77.43 },
      Varanasi: { lat: 25.32, lon: 82.97 },
      Agra: { lat: 27.18, lon: 78.01 },
      Prayagraj: { lat: 25.44, lon: 81.85 },
    },
  },
  Uttarakhand: {
    minWagePerDay: 420,
    cities: {
      Dehradun: { lat: 30.32, lon: 78.03 },
      Haridwar: { lat: 29.95, lon: 78.16 },
      Haldwani: { lat: 29.22, lon: 79.52 },
    },
  },
  'West Bengal': {
    minWagePerDay: 399,
    cities: {
      Kolkata: { lat: 22.57, lon: 88.36 },
      Howrah: { lat: 22.59, lon: 88.31 },
      Siliguri: { lat: 26.73, lon: 88.4 },
      Durgapur: { lat: 23.52, lon: 87.31 },
    },
  },

  // Union territories
  'Andaman and Nicobar Islands': { minWagePerDay: 460, cities: { 'Port Blair': { lat: 11.62, lon: 92.73 } } },
  Chandigarh: { minWagePerDay: 475, cities: { Chandigarh: { lat: 30.73, lon: 76.78 } } },
  'Dadra and Nagar Haveli and Daman and Diu': {
    minWagePerDay: 420,
    cities: { Silvassa: { lat: 20.27, lon: 73.01 }, Daman: { lat: 20.4, lon: 72.84 } },
  },
  Delhi: {
    minWagePerDay: 710,
    cities: {
      Delhi: { lat: 28.61, lon: 77.21 },
      'New Delhi': { lat: 28.61, lon: 77.21 },
      Dwarka: { lat: 28.59, lon: 77.05 },
      Rohini: { lat: 28.74, lon: 77.12 },
    },
  },
  'Jammu and Kashmir': {
    minWagePerDay: 350,
    cities: { Srinagar: { lat: 34.08, lon: 74.8 }, Jammu: { lat: 32.73, lon: 74.86 } },
  },
  Ladakh: { minWagePerDay: 350, cities: { Leh: { lat: 34.16, lon: 77.58 } } },
  Lakshadweep: { minWagePerDay: 400, cities: { Kavaratti: { lat: 10.57, lon: 72.64 } } },
  Puducherry: { minWagePerDay: 440, cities: { Puducherry: { lat: 11.94, lon: 79.83 } } },
};

export const STATE_NAMES: string[] = Object.keys(STATES).sort();

export const citiesOf = (state: string): string[] =>
  Object.keys(STATES[state]?.cities ?? {}).sort();

/**
 * Falls back to the state's first city, then to Delhi, so lookups never throw.
 *
 * "First" means first in `citiesOf`, which is what the dropdown shows, so a
 * fallback always resolves to the city the worker would see selected rather
 * than to whichever one happens to be first in this file.
 */
export function locate(state: string, city: string): City {
  const s = STATES[state];
  if (!s) return { lat: 28.61, lon: 77.21 };
  const fromCity = s.cities[city];
  if (fromCity) return fromCity;
  const firstName = citiesOf(state)[0];
  return (firstName ? s.cities[firstName] : undefined) ?? { lat: 28.61, lon: 77.21 };
}

/** National floor used when a state is somehow unknown. */
export const FALLBACK_WAGE_PER_DAY = 400;

export const minWagePerDay = (state: string): number =>
  STATES[state]?.minWagePerDay ?? FALLBACK_WAGE_PER_DAY;

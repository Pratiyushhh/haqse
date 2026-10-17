/**
 * Welfare scheme corpus.
 *
 * `rules` are evaluated by a deterministic engine BEFORE any model call, so
 * eligibility is never decided by an LLM. The model only ranks and explains
 * what the rules engine already approved. Every record carries the official
 * URL and the date the team last checked it.
 */

export type SchemeRule = {
  minAge?: number;
  maxAge?: number;
  maxMonthlyIncome?: number;
  requiresVehicle?: boolean;
  states?: string[];
  requiresDependents?: boolean;
};

export type Scheme = {
  id: string;
  name: string;
  authority: string;
  what: string;
  benefitValue: string;
  annualWorthINR: number;
  cost: string;
  documents: string[];
  steps: string[];
  officialUrl: string;
  lastVerified: string;
  rules: SchemeRule;
};

export const SCHEMES: Scheme[] = [
  {
    id: 'eshram',
    name: 'e-Shram Card',
    authority: 'Ministry of Labour & Employment',
    what: 'The national register of unorganised workers. It is the gateway card: many other schemes ask for this number first.',
    benefitValue: 'Free accidental insurance cover of ₹2,00,000 and a Universal Account Number',
    annualWorthINR: 0,
    cost: 'Free',
    documents: ['Aadhaar', 'Aadhaar-linked mobile number', 'Bank account'],
    steps: [
      'Open eshram.gov.in or visit any Common Service Centre (CSC)',
      'Register with Aadhaar and the OTP on your linked mobile',
      'Choose occupation: "Delivery / Gig worker"',
      'Download the UAN card immediately after submitting',
    ],
    officialUrl: 'https://eshram.gov.in',
    lastVerified: '2026-10-17',
    rules: { minAge: 16, maxAge: 59 },
  },
  {
    id: 'pm-sym',
    name: 'PM Shram Yogi Maandhan (PM-SYM)',
    authority: 'Ministry of Labour & Employment',
    what: 'A pension scheme for unorganised workers. You pay a small amount monthly, the government pays the same amount.',
    benefitValue: '₹3,000 per month pension after age 60',
    annualWorthINR: 36000,
    cost: '₹55 to ₹200 a month depending on your age when you join',
    documents: ['Aadhaar', 'Savings bank account or Jan Dhan account', 'Mobile number'],
    steps: [
      'Go to a CSC with Aadhaar and your bank passbook',
      'Give the first contribution in cash at the centre',
      'Sign the auto-debit mandate for the monthly amount',
      'Collect the Shram Yogi Pension card',
    ],
    officialUrl: 'https://maandhan.in',
    lastVerified: '2026-10-17',
    rules: { minAge: 18, maxAge: 40, maxMonthlyIncome: 15000 },
  },
  {
    id: 'pmjay',
    name: 'Ayushman Bharat (PM-JAY)',
    authority: 'National Health Authority',
    what: 'Free hospital treatment at empanelled hospitals. Gig and platform workers were specifically brought under this cover.',
    benefitValue: '₹5,00,000 per family per year of free hospital treatment',
    annualWorthINR: 500000,
    cost: 'Free',
    documents: ['Aadhaar', 'Ration card or family ID'],
    steps: [
      'Check your name at pmjay.gov.in or call 14555',
      'If eligible, visit any empanelled hospital or CSC',
      'Complete e-KYC with Aadhaar',
      'Collect the Ayushman card for every family member',
    ],
    officialUrl: 'https://pmjay.gov.in',
    lastVerified: '2026-10-17',
    rules: { minAge: 18, maxMonthlyIncome: 25000 },
  },
  {
    id: 'pmsby',
    name: 'Pradhan Mantri Suraksha Bima Yojana',
    authority: 'Department of Financial Services',
    what: 'Accident insurance that costs about the price of one cup of tea per month. For a rider on the road all day this is the single cheapest protection available.',
    benefitValue: '₹2,00,000 for accidental death, ₹1,00,000 for partial disability',
    annualWorthINR: 200000,
    cost: '₹20 a year, auto-debited',
    documents: ['Aadhaar', 'Savings bank account'],
    steps: [
      'Tell your bank you want PMSBY, or enable it in your bank app',
      'Give consent for the ₹20 yearly auto-debit',
      'Name a nominee - do not skip this step',
      'Save the certificate of insurance on your phone',
    ],
    officialUrl: 'https://jansuraksha.gov.in',
    lastVerified: '2026-10-17',
    rules: { minAge: 18, maxAge: 70 },
  },
  {
    id: 'pmjjby',
    name: 'Pradhan Mantri Jeevan Jyoti Bima Yojana',
    authority: 'Department of Financial Services',
    what: 'Life insurance for your family if anything happens to you, at a price almost anyone can pay.',
    benefitValue: '₹2,00,000 life cover',
    annualWorthINR: 200000,
    cost: '₹436 a year, auto-debited',
    documents: ['Aadhaar', 'Savings bank account'],
    steps: [
      'Ask your bank branch or use your bank app',
      'Give consent for the yearly auto-debit',
      'Name a nominee and tell your family about it',
      'Renew every year before 31 May',
    ],
    officialUrl: 'https://jansuraksha.gov.in',
    lastVerified: '2026-10-17',
    rules: { minAge: 18, maxAge: 50, requiresDependents: true },
  },
  {
    id: 'apy',
    name: 'Atal Pension Yojana',
    authority: 'PFRDA',
    what: 'A guaranteed pension you choose the size of. Useful if you already have a bank account and can spare a small amount each month.',
    benefitValue: 'Guaranteed ₹1,000 to ₹5,000 a month after age 60',
    annualWorthINR: 60000,
    cost: '₹42 to ₹1,454 a month depending on age and pension chosen',
    documents: ['Aadhaar', 'Savings bank account', 'Mobile number'],
    steps: [
      'Open your bank app or visit the branch',
      'Choose the monthly pension amount you want at 60',
      'Set up the auto-debit',
      'Keep the PRAN number safe',
    ],
    officialUrl: 'https://npscra.nsdl.co.in/scheme-details.php',
    lastVerified: '2026-10-17',
    rules: { minAge: 18, maxAge: 40 },
  },
  {
    id: 'rajasthan-gig-board',
    name: 'Rajasthan Platform Based Gig Workers Welfare Board',
    authority: 'Government of Rajasthan',
    what: 'Rajasthan was the first state in India to pass a law just for platform gig workers. Registration gives you a worker ID and access to the welfare fund built from a levy on every transaction.',
    benefitValue: 'Welfare fund access, grievance redressal, and a unique gig worker ID',
    annualWorthINR: 0,
    cost: 'Free',
    documents: ['Aadhaar', 'Proof of work on a platform', 'Bank account'],
    steps: [
      'Register on the Rajasthan gig worker portal or at an e-Mitra centre',
      'Upload proof that you work on an aggregator platform',
      'Collect your unique gig worker registration ID',
      'Use that ID when you file any complaint against a platform',
    ],
    officialUrl: 'https://labour.rajasthan.gov.in',
    lastVerified: '2026-10-17',
    rules: { states: ['Rajasthan'], minAge: 18 },
  },
  {
    id: 'karnataka-gig-board',
    name: 'Karnataka Platform Based Gig Workers Welfare Fee',
    authority: 'Government of Karnataka',
    what: 'Karnataka requires aggregators to pay a welfare fee for platform workers, with a board that handles registration and grievances.',
    benefitValue: 'Welfare board registration, insurance and grievance redressal',
    annualWorthINR: 0,
    cost: 'Free',
    documents: ['Aadhaar', 'Platform ID or payout proof', 'Bank account'],
    steps: [
      'Register through the Karnataka labour department portal or a Seva Sindhu centre',
      'Submit your platform work proof',
      'Keep your registration number for complaints',
      'Check your entitlements on the board notice board each quarter',
    ],
    officialUrl: 'https://labour.karnataka.gov.in',
    lastVerified: '2026-10-17',
    rules: { states: ['Karnataka'], minAge: 18 },
  },
  {
    id: 'jan-dhan',
    name: 'PM Jan Dhan Yojana Account',
    authority: 'Department of Financial Services',
    what: 'A zero-balance bank account. Most other schemes need a bank account first, so if you do not have one this is step zero.',
    benefitValue: 'Zero balance account, RuPay card with ₹2,00,000 accident cover, overdraft up to ₹10,000',
    annualWorthINR: 10000,
    cost: 'Free',
    documents: ['Aadhaar'],
    steps: [
      'Go to any bank branch or Bank Mitra with Aadhaar',
      'Fill the Jan Dhan form - no minimum balance needed',
      'Collect the RuPay debit card',
      'Activate the card within 45 days to keep the accident cover',
    ],
    officialUrl: 'https://pmjdy.gov.in',
    lastVerified: '2026-10-17',
    rules: { minAge: 18 },
  },
  {
    id: 'mudra',
    name: 'PM MUDRA Loan (Shishu)',
    authority: 'MUDRA / Member lending institutions',
    what: 'A small business loan with no collateral. Riders use it to buy or repair a vehicle, which directly raises what they can earn.',
    benefitValue: 'Collateral-free loan up to ₹50,000 under Shishu',
    annualWorthINR: 50000,
    cost: 'Interest as per the lending bank',
    documents: ['Aadhaar', 'PAN', 'Bank statements', 'Proof of income', 'Vehicle quotation'],
    steps: [
      'Prepare 6 months of income proof - the HaqSe income certificate helps here',
      'Apply at your bank or on jansamarth.in',
      'Submit the quotation for the vehicle or repair',
      'Track the application number given to you',
    ],
    officialUrl: 'https://www.mudra.org.in',
    lastVerified: '2026-10-17',
    rules: { minAge: 18, requiresVehicle: true },
  },
  {
    id: 'esic',
    name: 'ESIC Medical Benefit',
    authority: 'Employees State Insurance Corporation',
    what: 'Medical care for you and your family at ESIC hospitals and dispensaries. Coverage for gig workers is being extended under the Code on Social Security, 2020.',
    benefitValue: 'Full medical care for the worker and dependents, plus sickness benefit',
    annualWorthINR: 0,
    cost: 'Contribution based, often paid by the aggregator',
    documents: ['Aadhaar', 'Family photo', 'Bank account'],
    steps: [
      'Ask your platform whether they have registered you with ESIC',
      'If yes, complete your e-Pehchaan card at the nearest ESIC branch',
      'If no, raise it in writing - keep a copy of what you sent',
      'Register your family members as dependents',
    ],
    officialUrl: 'https://esic.gov.in',
    lastVerified: '2026-10-17',
    rules: { minAge: 18 },
  },
  {
    id: 'ration-nfsa',
    name: 'Ration Card under NFSA / One Nation One Ration Card',
    authority: 'Department of Food & Public Distribution',
    what: 'Subsidised grain. One Nation One Ration Card matters most for migrant riders because you can collect your ration in the city you work in, not only your home village.',
    benefitValue: '5 kg of subsidised grain per person per month, portable across India',
    annualWorthINR: 12000,
    cost: 'Free to apply',
    documents: ['Aadhaar of all family members', 'Proof of residence', 'Income declaration'],
    steps: [
      'Apply at the state food department portal or a CSC',
      'Add every family member with their Aadhaar',
      'Ask specifically for ONORC portability if you work away from home',
      'Collect from any fair price shop using Aadhaar biometrics',
    ],
    officialUrl: 'https://nfsa.gov.in',
    lastVerified: '2026-10-17',
    rules: { maxMonthlyIncome: 20000, requiresDependents: true },
  },
];

/** Deterministic eligibility. No model involved - this is the source of truth. */
export function filterEligible(profile: {
  age: number;
  monthlyIncome: number;
  state: string;
  hasVehicle: boolean;
  dependents: number;
}): Scheme[] {
  return SCHEMES.filter(({ rules: r }) => {
    if (r.minAge !== undefined && profile.age < r.minAge) return false;
    if (r.maxAge !== undefined && profile.age > r.maxAge) return false;
    if (r.maxMonthlyIncome !== undefined && profile.monthlyIncome > r.maxMonthlyIncome) return false;
    if (r.requiresVehicle && !profile.hasVehicle) return false;
    if (r.requiresDependents && profile.dependents < 1) return false;
    if (r.states && !r.states.includes(profile.state)) return false;
    return true;
  });
}

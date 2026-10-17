import { describe, expect, it } from 'vitest';
import { plainText } from '../src/lib/text';
import { citiesOf, locate, minWagePerDay, STATE_NAMES, STATES } from '../src/data/places';
import { minWageHourly } from '../src/lib/money';

describe('plainText', () => {
  it('removes the bold markers that would be read aloud', () => {
    expect(plainText('Aapne **₹11,200** bachaaye')).toBe('Aapne ₹11,200 bachaaye');
  });

  it('removes bullet markers at the start of lines', () => {
    expect(plainText('- khatra\n- kya karein')).toBe('khatra\nkya karein');
  });

  it('strips headings, italics, code and links', () => {
    expect(plainText('## Aaj')).toBe('Aaj');
    expect(plainText('*zaroori*')).toBe('zaroori');
    expect(plainText('`₹400`')).toBe('₹400');
    expect(plainText('[eShram](https://eshram.gov.in)')).toBe('eShram');
  });

  it('leaves ordinary text, including rupee amounts, untouched', () => {
    const s = 'Aapka asli ghanta-daam ₹62 hai.';
    expect(plainText(s)).toBe(s);
  });

  it('handles an empty string', () => {
    expect(plainText('')).toBe('');
  });
});

describe('places', () => {
  it('covers every state and union territory', () => {
    expect(STATE_NAMES.length).toBeGreaterThanOrEqual(36);
    expect(STATE_NAMES).toContain('Delhi');
    expect(STATE_NAMES).toContain('Nagaland');
    expect(STATE_NAMES).toContain('Ladakh');
  });

  it('gives every state at least one city', () => {
    for (const st of STATE_NAMES) {
      expect(citiesOf(st).length, st).toBeGreaterThan(0);
    }
  });

  it('gives every state a plausible minimum wage', () => {
    for (const st of STATE_NAMES) {
      const w = STATES[st]!.minWagePerDay;
      expect(w, st).toBeGreaterThan(200);
      expect(w, st).toBeLessThan(1200);
    }
  });

  it('locates a known city', () => {
    const c = locate('Karnataka', 'Bengaluru');
    expect(c.lat).toBeCloseTo(12.97, 1);
    expect(c.lon).toBeCloseTo(77.59, 1);
  });

  it('falls back to the first city of the state when the city is unknown', () => {
    expect(locate('Kerala', 'Nowhere')).toEqual(locate('Kerala', citiesOf('Kerala')[0]!));
  });

  it('falls back to Delhi rather than throwing on an unknown state', () => {
    const c = locate('Atlantis', 'Nowhere');
    expect(c.lat).toBeCloseTo(28.61, 1);
  });

  it('uses the national floor for an unknown state', () => {
    expect(minWagePerDay('Atlantis')).toBe(400);
    expect(minWageHourly('Atlantis')).toBe(50);
  });

  it('derives the hourly rate from the state daily rate', () => {
    expect(minWageHourly('Delhi')).toBeCloseTo(STATES.Delhi!.minWagePerDay / 8, 2);
  });
});

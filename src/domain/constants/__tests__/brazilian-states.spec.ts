import {
  BRAZILIAN_STATE_CODES,
  assertValidUF,
  isValidUF,
} from '../brazilian-states';

describe('BRAZILIAN_STATE_CODES', () => {
  it('contains 27 units (26 states + DF)', () => {
    expect(BRAZILIAN_STATE_CODES).toHaveLength(27);
  });

  it('contains only uppercase two-letter codes', () => {
    const twoLetterUpper = /^[A-Z]{2}$/;
    BRAZILIAN_STATE_CODES.forEach((code) => {
      expect(code).toMatch(twoLetterUpper);
    });
  });

  it('includes SP and DF', () => {
    expect(BRAZILIAN_STATE_CODES).toContain('SP');
    expect(BRAZILIAN_STATE_CODES).toContain('DF');
  });
});

describe('isValidUF', () => {
  it('returns true for valid uppercase UF', () => {
    expect(isValidUF('SP')).toBe(true);
    expect(isValidUF('RJ')).toBe(true);
    expect(isValidUF('DF')).toBe(true);
  });

  it('returns true for valid lowercase UF (case insensitive)', () => {
    expect(isValidUF('sp')).toBe(true);
    expect(isValidUF('rj')).toBe(true);
  });

  it('returns false for invalid code', () => {
    expect(isValidUF('XX')).toBe(false);
    expect(isValidUF('')).toBe(false);
    expect(isValidUF('S')).toBe(false);
    expect(isValidUF('SPP')).toBe(false);
  });

  it('returns false for non-UF strings', () => {
    expect(isValidUF('São Paulo')).toBe(false);
    expect(isValidUF('12')).toBe(false);
  });
});

describe('assertValidUF', () => {
  it('does not throw for valid UF', () => {
    expect(() => assertValidUF('SP')).not.toThrow();
    expect(() => assertValidUF('sp')).not.toThrow();
  });

  it('throws for invalid UF with descriptive message', () => {
    expect(() => assertValidUF('XX')).toThrow('Invalid UF: "XX"');
    expect(() => assertValidUF('XX')).toThrow('Must be one of:');
  });

  it('throws Error instance', () => {
    expect(() => assertValidUF('INVALID')).toThrow(Error);
  });
});

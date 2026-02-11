import { BrazilianStateCode, assertValidUF, isValidUF } from '../brazilian-states';

describe('BRAZILIAN_STATE_CODES', () => {
  it('contains 27 units (26 states + DF)', () => {
    expect(Object.values(BrazilianStateCode)).toHaveLength(27);
  });

  it('contains only uppercase two-letter codes', () => {
    const twoLetterUpper = /^[A-Z]{2}$/;
    Object.values(BrazilianStateCode).forEach((code) => {
      expect(code).toMatch(twoLetterUpper);
    });
  });

  it('includes SP and DF', () => {
    expect(Object.values(BrazilianStateCode)).toContain('SP');
    expect(Object.values(BrazilianStateCode)).toContain('DF');
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
    expect(() => assertValidUF('XX')).toThrow('Invalid UF: XX');
  });

  it('throws Error instance', () => {
    expect(() => assertValidUF('INVALID')).toThrow(Error);
  });
});

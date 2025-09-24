import { isUndefined, isNull, isNumber, isInteger, isString, isDate, integer } from './guards';

describe('Type Guards', () => {
  it('isUndefined should correctly identify undefined values', () => {
    expect(isUndefined(undefined)).toBe(true);
    expect(isUndefined(null)).toBe(false);
    expect(isUndefined(0)).toBe(false);
    expect(isUndefined('')).toBe(false);
  });

  it('isNull should correctly identify null values', () => {
    expect(isNull(null)).toBe(true);
    expect(isNull(undefined)).toBe(false);
    expect(isNull(0)).toBe(false);
    expect(isNull('')).toBe(false);
  });

  it('isNumber should correctly identify number values', () => {
    expect(isNumber(10)).toBe(true);
    expect(isNumber(3.14)).toBe(true);
    expect(isNumber(-5)).toBe(true);
    expect(isNumber(NaN)).toBe(true);
    expect(isNumber(Infinity)).toBe(true);
    expect(isNumber('10')).toBe(false);
    expect(isNumber(null)).toBe(false);
  });

  it('isInteger should correctly identify integer values', () => {
    expect(isInteger(5)).toBe(true);
    expect(isInteger(-100)).toBe(true);
    expect(isInteger(0)).toBe(true);
    expect(isInteger(1.5)).toBe(false);
    expect(isInteger(NaN)).toBe(false);
    expect(isInteger(Infinity)).toBe(false);
    expect(isInteger('5' as unknown as integer)).toBe(false);
  });

  it('isString should correctly identify string values', () => {
    expect(isString('hello')).toBe(true);
    expect(isString('')).toBe(true);
    expect(isString(new String('world'))).toBe(false); // An object, not a primitive
    expect(isString(123)).toBe(false);
    expect(isString(null)).toBe(false);
  });

  it('isDate should correctly identify Date objects', () => {
    expect(isDate(new Date())).toBe(true);
    expect(isDate(new Date('2023-01-01'))).toBe(true);
    expect(isDate('2023-01-01')).toBe(false);
    expect(isDate({})).toBe(false);
    expect(isDate(null)).toBe(false);
  });
});

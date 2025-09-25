import { getWeekdayFromNumber, getWeekdayNumber, getWeekdayOfDate, NumericWeekDay, Weekday } from './getWeekdayOfDate';

describe('getWeekdayOfDate', () => {
  // Test a known date: a Sunday
  it('should return "sunday" for a Sunday date', () => {
    const weekday = getWeekdayOfDate(2023, 11, 26);
    expect(weekday).toBe<Weekday>('sunday');
  });

  // Test a known date: a Monday
  it('should return "monday" for a Monday date', () => {
    const weekday = getWeekdayOfDate(2023, 11, 27);
    expect(weekday).toBe<Weekday>('monday');
  });

  // Test the first day of the year
  it('should return "sunday" for January 1, 2023', () => {
    const weekday = getWeekdayOfDate(2023, 1, 1);
    expect(weekday).toBe<Weekday>('sunday');
  });

  // Test a leap year date (2024 is a leap year)
  it('should return "thursday" for March 14, 2024 (a leap year)', () => {
    const weekday = getWeekdayOfDate(2024, 3, 14);
    expect(weekday).toBe<Weekday>('thursday');
  });

  // Test a date from a different century
  it('should return "wednesday" for October 12, 1492', () => {
    const weekday = getWeekdayOfDate(1492, 10, 12);
    expect(weekday).toBe<Weekday>('wednesday');
  });

  // Test a day at the end of a month
  it('should handle end-of-month correctly', () => {
    const weekday = getWeekdayOfDate(2023, 9, 30);
    expect(weekday).toBe<Weekday>('saturday');
  });

  // Test the last day of the year
  it('should return "sunday" for December 31, 2023', () => {
    const weekday = getWeekdayOfDate(2023, 12, 31);
    expect(weekday).toBe<Weekday>('sunday');
  });
});

describe('getWeekdayNumber', () => {
  it.each([
    ['monday', 1],
    ['tuesday', 2],
    ['wednesday', 3],
    ['thursday', 4],
    ['friday', 5],
    ['saturday', 6],
    ['sunday', 7],
  ] as const)('should return $2 for $1', (weekday: Weekday, result: number) => {
    expect(getWeekdayNumber(weekday)).toBe(result);
  });
});

describe('getWeekdayFromNumber', () => {
  // Test all weekday numbers to ensure the correct string is returned
  it.each([
    ['monday', 1],
    ['tuesday', 2],
    ['wednesday', 3],
    ['thursday', 4],
    ['friday', 5],
    ['saturday', 6],
    ['sunday', 7],
  ] as const)('should return "monday" for 1', (result: Weekday, numericWeekDay: number) => {
    expect(getWeekdayFromNumber(numericWeekDay as NumericWeekDay)).toBe(result);
  });
});

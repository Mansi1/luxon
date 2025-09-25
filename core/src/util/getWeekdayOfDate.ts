const WEEKDAY = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

export type Weekday = (typeof WEEKDAY)[number];
export type NumericWeekDay = (1 | 2 | 3 | 4 | 5 | 6 | 7) & { __type: 'weekday' };
/**
 * Calculates the day of the week for a given date.
 *
 * @param {number} year The year (e.g., 2023).
 * @param {number} month The month (1-12).
 * @param {number} day The day of the month (1-31).
 * @returns {Weekday} The day of the week as a lowercase string (e.g., 'monday').
 */
export const getWeekdayOfDate = (year: number, month: number, day: number): Weekday => {
  const d = new Date(Date.UTC(year, month - 1, day));
  const jsDay = d.getUTCDay();

  return WEEKDAY[jsDay];
};

export const getWeekdayNumber = (weekday: Weekday): NumericWeekDay => {
  const index = WEEKDAY.indexOf(weekday);
  // The Date object returns 0-6 where 0 is Sunday.
  // Our convention is 1-7 where 1 is Monday.
  // We add 1 to the index to get the correct number,
  // then handle the Sunday edge case.
  return (index === 0 ? 7 : index) as NumericWeekDay;
};

export const isNumericWeekDay = (weekday: number): weekday is NumericWeekDay => {
  return weekday >= 1 && weekday <= 7;
};

/**
 * Converts a weekday number to its corresponding string.
 *
 * @param {number} weekday The day of the week as a number (1 = Monday, 7 = Sunday).
 * @returns {Weekday} The weekday string (e.g., 'monday').
 */
export function getWeekdayFromNumber(weekday: NumericWeekDay): Weekday {
  // Handle Sunday (which is 7 in our convention but 0 in Date.getUTCDay())
  if (weekday === 7) {
    return WEEKDAY[0];
  }

  // Return the string for all other days. The array is zero-indexed, so we subtract 1.
  return WEEKDAY[weekday];
}

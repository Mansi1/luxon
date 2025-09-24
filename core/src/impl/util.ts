/*
  This is just a junk drawer, containing anything used across multiple classes.
  Because Luxon is small(ish), this should stay small and we won't worry about splitting
  it up into, say, parsingUtil.js and basicUtil.js and so on. But they are divided up by feature area.
*/

import { InvalidArgumentError } from '../errors';
import Settings from '../settings';
import { TimeZoneNameFormat } from '../zone';
import { dayOfWeek, isoWeekdayToLocal } from './conversions';

// CAPABILITIES

// OBJECTS AND ARRAYS

export function bestBy(arr, by, compare) {
  if (arr.length === 0) {
    return undefined;
  }
  return arr.reduce((best, next) => {
    const pair = [by(next), next];
    if (!best) {
      return pair;
    } else if (compare(best[0], pair[0]) === best[0]) {
      return best;
    } else {
      return pair;
    }
  }, null)[1];
}

export function hasOwnProperty<T, K extends PropertyKey>(obj: T, prop: K): obj is T & Record<K, unknown> {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

export function validateWeekSettings(settings: WeekSettings) {
  if (settings == null) {
    //todo: remove that shit its validating
    return null;
  } else if (typeof settings !== 'object') {
    throw new InvalidArgumentError('Week settings must be an object');
  } else {
    if (
      !integerBetween(settings.firstDay, 1, 7) ||
      !integerBetween(settings.minimalDays, 1, 7) ||
      !Array.isArray(settings.weekend) ||
      settings.weekend.some((v) => !integerBetween(v, 1, 7))
    ) {
      throw new InvalidArgumentError('Invalid week settings');
    }
    //todo: its validating shoud not do manipulations
    return {
      firstDay: settings.firstDay,
      minimalDays: settings.minimalDays,
      weekend: Array.from(settings.weekend),
    };
  }
}

// NUMBERS AND STRINGS

export function integerBetween(thing: number, bottom: number, top: number) {
  return isInteger(thing) && thing >= bottom && thing <= top;
}

// x % n but takes the sign of n instead of x
export function floorMod(x: number, n: number) {
  return x - n * Math.floor(x / n);
}

export function padStart(input: number, n = 2) {
  const isNeg = input < 0;
  let padded;
  if (isNeg) {
    padded = '-' + ('' + -input).padStart(n, '0');
  } else {
    padded = ('' + input).padStart(n, '0');
  }
  return padded;
}

export function parseInteger(string: string) {
  if (isUndefined(string) || string === null || string === '') {
    return undefined;
  } else {
    return parseInt(string, 10);
  }
}

export function parseFloating(string: string) {
  if (isUndefined(string) || string === null || string === '') {
    return undefined;
  } else {
    return parseFloat(string);
  }
}

export function parseMillis(fraction: string | null | undefined): number | undefined {
  // Return undefined (instead of 0) in these cases, where fraction is not set
  if (isUndefined(fraction) || fraction === null || fraction === '') {
    return undefined;
  } else {
    const f = parseFloat('0.' + fraction) * 1000;
    return Math.floor(f);
  }
}

export type Rounding = 'expand' | 'trunc' | 'floor' | 'round' | 'ceil';

export function roundTo(number: number, digits: number, rounding: Rounding = 'round'): number {
  const factor = 10 ** digits;
  switch (rounding) {
    case 'expand':
      return number > 0 ? Math.ceil(number * factor) / factor : Math.floor(number * factor) / factor;
    case 'trunc':
      return Math.trunc(number * factor) / factor;
    case 'round':
      return Math.round(number * factor) / factor;
    case 'floor':
      return Math.floor(number * factor) / factor;
    case 'ceil':
      return Math.ceil(number * factor) / factor;
    default:
      return assertNever(rounding, `Value rounding ${rounding} is out of range`);
  }
}

export const assertNever = (_type: never, message: string): never => {
  throw new Error(message);
};

// DATE BASICS

export function isLeapYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function daysInYear(year: number) {
  return isLeapYear(year) ? 366 : 365;
}

export function daysInMonth(year: number, month: number) {
  const modMonth = floorMod(month - 1, 12) + 1,
    modYear = year + (month - modMonth) / 12;

  if (modMonth === 2) {
    return isLeapYear(modYear) ? 29 : 28;
  } else {
    return [31, null, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][modMonth - 1];
  }
}

// convert a calendar object to a local timestamp (epoch, but with the offset baked in)
export function objToLocalTS(obj) {
  let d = Date.UTC(obj.year, obj.month - 1, obj.day, obj.hour, obj.minute, obj.second, obj.millisecond);

  // for legacy reasons, years between 0 and 99 are interpreted as 19XX; revert that
  if (obj.year < 100 && obj.year >= 0) {
    d = new Date(d);
    // set the month and day again, this is necessary because year 2000 is a leap year, but year 100 is not
    // so if obj.year is in 99, but obj.day makes it roll over into year 100,
    // the calculations done by Date.UTC are using year 2000 - which is incorrect
    d.setUTCFullYear(obj.year, obj.month - 1, obj.day);
  }
  return +d;
}

// adapted from moment.js: https://github.com/moment/moment/blob/000ac1800e620f770f4eb31b5ae908f6167b0ab2/src/lib/units/week-calendar-utils.js
function firstWeekOffset(year, minDaysInFirstWeek, startOfWeek) {
  const fwdlw = isoWeekdayToLocal(dayOfWeek(year, 1, minDaysInFirstWeek), startOfWeek);
  return -fwdlw + minDaysInFirstWeek - 1;
}

export function weeksInWeekYear(weekYear, minDaysInFirstWeek = 4, startOfWeek = 1) {
  const weekOffset = firstWeekOffset(weekYear, minDaysInFirstWeek, startOfWeek);
  const weekOffsetNext = firstWeekOffset(weekYear + 1, minDaysInFirstWeek, startOfWeek);
  return (daysInYear(weekYear) - weekOffset + weekOffsetNext) / 7;
}

export function untruncateYear(year) {
  if (year > 99) {
    return year;
  } else return year > Settings.twoDigitCutoffYear ? 1900 + year : 2000 + year;
}

// PARSING

export function parseZoneInfo(
  ts: number,
  offsetFormat: TimeZoneNameFormat | undefined,
  locale: string | undefined,
  timeZone: string | null = null
): string | null {
  const date = new Date(ts),
    intlOpts: Intl.DateTimeFormatOptions = {
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    };

  if (timeZone) {
    intlOpts.timeZone = timeZone;
  }

  const modified = { timeZoneName: offsetFormat, ...intlOpts };

  const parsed = new Intl.DateTimeFormat(locale, modified)
    .formatToParts(date)
    .find((m) => m.type.toLowerCase() === 'timezonename');
  return parsed ? parsed.value : null;
}

// signedOffset('-5', '30') -> -330
export function signedOffset(offHourStr: string, offMinuteStr: string) {
  let offHour = parseInt(offHourStr, 10);

  // don't || this because we want to preserve -0
  if (Number.isNaN(offHour)) {
    offHour = 0;
  }

  const offMin = parseInt(offMinuteStr, 10) || 0,
    offMinSigned = offHour < 0 || Object.is(offHour, -0) ? -offMin : offMin;
  return offHour * 60 + offMinSigned;
}

// COERCION

export function asNumber(value: unknown) {
  const numericValue = Number(value);
  if (typeof value === 'boolean' || value === '' || !Number.isFinite(numericValue))
    throw new InvalidArgumentError(`Invalid unit value ${value}`);
  return numericValue;
}

export function normalizeObject(obj, normalizer) {
  const normalized = {};
  for (const u in obj) {
    if (hasOwnProperty(obj, u)) {
      const v = obj[u];
      if (v === undefined || v === null) continue;
      normalized[normalizer(u)] = asNumber(v);
    }
  }
  return normalized;
}

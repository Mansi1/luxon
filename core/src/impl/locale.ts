import { hasLocaleWeekInfo, hasRelative, integerBetween, padStart, roundTo, validateWeekSettings } from './util.js';
import { Cache } from './cache';
import * as English from './english.js';
import Settings, { WeekSettings } from '../settings.js';
import DateTime from '../datetime.js';
import IANAZone from '../zones/IANAZone.js';
import { InvalidArgumentError } from '../errors.js';

export type WeedInfo = {
  firstDay: number;
  minimalDays: number;
  weekend: Array<number>;
};

type LocalOption<Option> = {
  locale: string;
  opts?: Option;
};

const caches: Array<{ clear: () => void }> = [];

const getCachedLF = new Cache<Intl.ListFormat, LocalOption<Intl.ListFormatOptions>>(
  ({ locale, opts = {} }) => JSON.stringify([locale, opts]),
  ({ locale, opts = {} }) => new Intl.ListFormat(locale, opts),
  (cache) => {
    caches.push(cache);
  }
).getAndSet;

const getCachedDTF = new Cache<Intl.DateTimeFormat, { locale: string; opts?: Intl.DateTimeFormatOptions }>(
  ({ locale, opts = {} }) => JSON.stringify([locale, opts]),
  ({ locale, opts = {} }) => new Intl.DateTimeFormat(locale, opts),
  (cache) => {
    caches.push(cache);
  }
).getAndSet;

const getCachedINF = new Cache<Intl.NumberFormat, LocalOption<Intl.NumberFormatOptions>>(
  ({ locale, opts = {} }) => JSON.stringify([locale, opts]),
  ({ locale, opts = {} }) => new Intl.NumberFormat(locale, opts),
  (cache) => {
    caches.push(cache);
  }
).getAndSet;

const getCachedRTF = new Cache<Intl.RelativeTimeFormat, LocalOption<Intl.RelativeTimeFormatOptions>>(
  ({ locale, opts = {} }) => {
    //@ts-expect-error fixme
    const { base, ...cacheKeyOpts } = opts;
    // exclude `base` from the options
    return JSON.stringify([locale, cacheKeyOpts]);
  },
  ({ locale, opts = {} }) => new Intl.RelativeTimeFormat(locale, opts),
  (cache) => {
    caches.push(cache);
  }
).getAndSet;

const getCachedIntResolvedOptions = new Cache<Intl.ResolvedDateTimeFormatOptions, string>(
  (locString) => locString,
  (locString) => new Intl.DateTimeFormat(locString).resolvedOptions(),
  (cache) => {
    caches.push(cache);
  }
).getAndSet;

const getCachedWeekInfo = new Cache<WeedInfo, string>(
  (locString) => locString,
  (locString) => {
    const locale = new Intl.Locale(locString);
    // browsers currently implement this as a property, but spec says it should be a getter function
    //@ts-expect-error fixme
    let data = 'getWeekInfo' in locale ? locale.getWeekInfo() : locale.weekInfo;
    // minimalDays was removed from WeekInfo: https://github.com/tc39/proposal-intl-locale-info/issues/86
    if (!('minimalDays' in data)) {
      data = { ...fallbackWeekSettings, ...data };
    }
    return data;
  },
  (cache) => {
    caches.push(cache);
  }
).getAndSet;

const systemLocale = () =>
  new Cache<string, 'static'>(
    () => 'static',
    () => new Intl.DateTimeFormat().resolvedOptions().locale,
    (cache) => {
      caches.push(cache);
    }
  ).getAndSet('static');

function parseLocaleString(localeStr: string) {
  // I really want to avoid writing a BCP 47 parser
  // see, e.g. https://github.com/wooorm/bcp-47
  // Instead, we'll do this:

  // a) if the string has no -u extensions, just leave it alone
  // b) if it does, use Intl to resolve everything
  // c) if Intl fails, try again without the -u

  // private subtags and unicode subtags have ordering requirements,
  // and we're not properly parsing this, so just strip out the
  // private ones if they exist.
  const xIndex = localeStr.indexOf('-x-');
  if (xIndex !== -1) {
    localeStr = localeStr.substring(0, xIndex);
  }

  const uIndex = localeStr.indexOf('-u-');
  if (uIndex === -1) {
    return [localeStr];
  } else {
    let options;
    let selectedStr;
    try {
      options = getCachedDTF({ locale: localeStr }).resolvedOptions();
      selectedStr = localeStr;
    } catch (e) {
      const smaller = localeStr.substring(0, uIndex);
      options = getCachedDTF({ locale: smaller }).resolvedOptions();
      selectedStr = smaller;
    }

    const { numberingSystem, calendar } = options;
    return [selectedStr, numberingSystem, calendar];
  }
}

function intlConfigString(localeStr: string, numberingSystem?: string, outputCalendar?: string) {
  if (outputCalendar || numberingSystem) {
    if (!localeStr.includes('-u-')) {
      localeStr += '-u';
    }

    if (outputCalendar) {
      localeStr += `-ca-${outputCalendar}`;
    }

    if (numberingSystem) {
      localeStr += `-nu-${numberingSystem}`;
    }
    return localeStr;
  } else {
    return localeStr;
  }
}

function mapMonths(f) {
  const ms = [];
  for (let i = 1; i <= 12; i++) {
    const dt = DateTime.utc(2009, i, 1);
    ms.push(f(dt));
  }
  return ms;
}

function mapWeekdays(f) {
  const ms = [];
  for (let i = 1; i <= 7; i++) {
    const dt = DateTime.utc(2016, 11, 13 + i);
    ms.push(f(dt));
  }
  return ms;
}

function listStuff(loc, length, englishFn, intlFn) {
  const mode = loc.listingMode();

  if (mode === 'error') {
    return null;
  } else if (mode === 'en') {
    return englishFn(length);
  } else {
    return intlFn(length);
  }
}

function supportsFastNumbers(loc) {
  if (loc.numberingSystem && loc.numberingSystem !== 'latn') {
    return false;
  } else {
    return (
      loc.numberingSystem === 'latn' ||
      !loc.locale ||
      loc.locale.startsWith('en') ||
      getCachedIntResolvedOptions(loc.locale).numberingSystem === 'latn'
    );
  }
}

/**
 * @private
 */

class PolyNumberFormatter {
  private padTo;
  private floor;
  private inf;

  constructor(intl: string, forceSimple: boolean, opts) {
    this.padTo = opts.padTo || 0;
    this.floor = opts.floor || false;

    const { padTo, floor, ...otherOpts } = opts;

    if (!forceSimple || Object.keys(otherOpts).length > 0) {
      const intlOpts = { useGrouping: false, ...opts };
      if (opts.padTo > 0) intlOpts.minimumIntegerDigits = opts.padTo;
      this.inf = getCachedINF({ locale: intl, opts: intlOpts });
    }
  }

  format(i) {
    if (this.inf) {
      const fixed = this.floor ? Math.floor(i) : i;
      return this.inf.format(fixed);
    } else {
      // to match the browser's numberformatter defaults
      const fixed = this.floor ? Math.floor(i) : roundTo(i, 3);
      return padStart(fixed, this.padTo);
    }
  }
}

/**
 * @private
 */

class PolyDateFormatter {
  private opts;
  private originalZone;
  private dt;
  private dtf;

  constructor(dt, intl, opts) {
    this.opts = opts;
    this.originalZone = undefined;

    let z = undefined;
    if (this.opts.timeZone) {
      // Don't apply any workarounds if a timeZone is explicitly provided in opts
      this.dt = dt;
    } else if (dt.zone.type === 'fixed') {
      // UTC-8 or Etc/UTC-8 are not part of tzdata, only Etc/GMT+8 and the like.
      // That is why fixed-offset TZ is set to that unless it is:
      // 1. Representing offset 0 when UTC is used to maintain previous behavior and does not become GMT.
      // 2. Unsupported by the browser:
      //    - some do not support Etc/
      //    - < Etc/GMT-14, > Etc/GMT+12, and 30-minute or 45-minute offsets are not part of tzdata
      const gmtOffset = -1 * (dt.offset / 60);
      const offsetZ = gmtOffset >= 0 ? `Etc/GMT+${gmtOffset}` : `Etc/GMT${gmtOffset}`;
      if (dt.offset !== 0 && IANAZone.create(offsetZ).valid) {
        z = offsetZ;
        this.dt = dt;
      } else {
        // Not all fixed-offset zones like Etc/+4:30 are present in tzdata so
        // we manually apply the offset and substitute the zone as needed.
        z = 'UTC';
        this.dt = dt.offset === 0 ? dt : dt.setZone('UTC').plus({ minutes: dt.offset });
        this.originalZone = dt.zone;
      }
    } else if (dt.zone.type === 'system') {
      this.dt = dt;
    } else if (dt.zone.type === 'iana') {
      this.dt = dt;
      z = dt.zone.name;
    } else {
      // Custom zones can have any offset / offsetName so we just manually
      // apply the offset and substitute the zone as needed.
      z = 'UTC';
      this.dt = dt.setZone('UTC').plus({ minutes: dt.offset });
      this.originalZone = dt.zone;
    }

    const intlOpts = { ...this.opts };
    intlOpts.timeZone = intlOpts.timeZone || z;
    this.dtf = getCachedDTF({ locale: intl, opts: intlOpts });
  }

  format() {
    if (this.originalZone) {
      // If we have to substitute in the actual zone name, we have to use
      // formatToParts so that the timezone can be replaced.
      return this.formatToParts()
        .map(({ value }) => value)
        .join('');
    }
    return this.dtf.format(this.dt.toJSDate());
  }

  formatToParts() {
    const parts = this.dtf.formatToParts(this.dt.toJSDate());
    if (this.originalZone) {
      return parts.map((part) => {
        if (part.type === 'timeZoneName') {
          const offsetName = this.originalZone.offsetName(this.dt.ts, {
            locale: this.dt.locale,
            format: this.opts.timeZoneName,
          });
          return {
            ...part,
            value: offsetName,
          };
        } else {
          return part;
        }
      });
    }
    return parts;
  }

  resolvedOptions() {
    return this.dtf.resolvedOptions();
  }
}

/**
 * @private
 */
class PolyRelFormatter {
  private opts;
  private rtf;

  constructor(intl: string, isEnglish: boolean, opts: Intl.RelativeTimeFormatOptions) {
    this.opts = { style: 'long', ...opts };
    if (!isEnglish && hasRelative()) {
      this.rtf = getCachedRTF({ locale: intl, opts });
    }
  }

  format(count, unit) {
    if (this.rtf) {
      return this.rtf.format(count, unit);
    } else {
      return English.formatRelativeTime(unit, count, this.opts.numeric, this.opts.style !== 'long');
    }
  }

  formatToParts(count, unit) {
    if (this.rtf) {
      return this.rtf.formatToParts(count, unit);
    } else {
      return [];
    }
  }
}

const fallbackWeekSettings: WeedInfo = {
  firstDay: 1,
  minimalDays: 4,
  weekend: [6, 7],
};

/**
 * @private
 */
export default class Locale {
  static validateWeekSettings(settings: WeekSettings) {
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

  static fromOpts(opts) {
    return Locale.create(opts.locale, opts.numberingSystem, opts.outputCalendar, opts.weekSettings, opts.defaultToEN);
  }

  static create(
    locale?: string,
    numberingSystem?: string,
    outputCalendar?: string,
    weekSettings?: any,
    defaultToEN = false
  ) {
    const specifiedLocale = locale || Settings.defaultLocale;
    // the system locale is useful for human-readable strings but annoying for parsing/formatting known formats
    const localeR = specifiedLocale || (defaultToEN ? 'en-US' : systemLocale());
    const numberingSystemR = numberingSystem || Settings.defaultNumberingSystem;
    const outputCalendarR = outputCalendar || Settings.defaultOutputCalendar;
    const weekSettingsR = Locale.validateWeekSettings(weekSettings) || Settings.defaultWeekSettings;
    return new Locale(localeR, numberingSystemR, outputCalendarR, weekSettingsR, specifiedLocale);
  }

  static resetCache() {
    caches.forEach((cache) => cache.clear());
  }

  static fromObject({
    locale,
    numberingSystem,
    outputCalendar,
    weekSettings,
  }: { locale?: string; numberingSystem?: string; outputCalendar?: string; weekSettings?: any } = {}) {
    return Locale.create(locale, numberingSystem, outputCalendar, weekSettings);
  }

  private locale;
  private numberingSystem;
  private outputCalendar;
  private weekSettings;
  private intl: string;
  private weekdaysCache;
  private monthsCache;
  private meridiemCache;
  private eraCache;
  private specifiedLocale;
  private fastNumbersCached;

  constructor(locale, numbering, outputCalendar, weekSettings, specifiedLocale) {
    const [parsedLocale, parsedNumberingSystem, parsedOutputCalendar] = parseLocaleString(locale);

    this.locale = parsedLocale;
    this.numberingSystem = numbering || parsedNumberingSystem || null;
    this.outputCalendar = outputCalendar || parsedOutputCalendar || null;
    this.weekSettings = weekSettings;
    this.intl = intlConfigString(this.locale, this.numberingSystem, this.outputCalendar);

    this.weekdaysCache = { format: {}, standalone: {} };
    this.monthsCache = { format: {}, standalone: {} };
    this.meridiemCache = null;
    this.eraCache = {};

    this.specifiedLocale = specifiedLocale;
    this.fastNumbersCached = null;
  }

  get fastNumbers() {
    if (this.fastNumbersCached == null) {
      this.fastNumbersCached = supportsFastNumbers(this);
    }

    return this.fastNumbersCached;
  }

  listingMode() {
    const isActuallyEn = this.isEnglish();
    const hasNoWeirdness =
      (this.numberingSystem === null || this.numberingSystem === 'latn') &&
      (this.outputCalendar === null || this.outputCalendar === 'gregory');
    return isActuallyEn && hasNoWeirdness ? 'en' : 'intl';
  }

  clone(alts) {
    if (!alts || Object.getOwnPropertyNames(alts).length === 0) {
      return this;
    } else {
      return Locale.create(
        alts.locale || this.specifiedLocale,
        alts.numberingSystem || this.numberingSystem,
        alts.outputCalendar || this.outputCalendar,
        validateWeekSettings(alts.weekSettings) || this.weekSettings,
        alts.defaultToEN || false
      );
    }
  }

  redefaultToEN(alts = {}) {
    return this.clone({ ...alts, defaultToEN: true });
  }

  redefaultToSystem(alts = {}) {
    return this.clone({ ...alts, defaultToEN: false });
  }

  months(length, format = false) {
    return listStuff(this, length, English.months, () => {
      // Workaround for "ja" locale: formatToParts does not label all parts of the month
      // as "month" and for this locale there is no difference between "format" and "non-format".
      // As such, just use format() instead of formatToParts() and take the whole string
      const monthSpecialCase = this.intl === 'ja' || this.intl.startsWith('ja-');
      format &&= !monthSpecialCase;
      const intl = format ? { month: length, day: 'numeric' } : { month: length },
        formatStr = format ? 'format' : 'standalone';
      if (!this.monthsCache[formatStr][length]) {
        const mapper = !monthSpecialCase
          ? (dt) => this.extract(dt, intl, 'month')
          : (dt) => this.dtFormatter(dt, intl).format();
        this.monthsCache[formatStr][length] = mapMonths(mapper);
      }
      return this.monthsCache[formatStr][length];
    });
  }

  weekdays(length, format = false) {
    return listStuff(this, length, English.weekdays, () => {
      const intl = format ? { weekday: length, year: 'numeric', month: 'long', day: 'numeric' } : { weekday: length },
        formatStr = format ? 'format' : 'standalone';
      if (!this.weekdaysCache[formatStr][length]) {
        this.weekdaysCache[formatStr][length] = mapWeekdays((dt) => this.extract(dt, intl, 'weekday'));
      }
      return this.weekdaysCache[formatStr][length];
    });
  }

  meridiems() {
    return listStuff(
      this,
      undefined,
      () => English.meridiems,
      () => {
        // In theory there could be aribitrary day periods. We're gonna assume there are exactly two
        // for AM and PM. This is probably wrong, but it's makes parsing way easier.
        if (!this.meridiemCache) {
          const intl = { hour: 'numeric', hourCycle: 'h12' };
          this.meridiemCache = [DateTime.utc(2016, 11, 13, 9), DateTime.utc(2016, 11, 13, 19)].map((dt) =>
            this.extract(dt, intl, 'dayperiod')
          );
        }

        return this.meridiemCache;
      }
    );
  }

  eras(length) {
    return listStuff(this, length, English.eras, () => {
      const intl = { era: length };

      // This is problematic. Different calendars are going to define eras totally differently. What I need is the minimum set of dates
      // to definitely enumerate them.
      if (!this.eraCache[length]) {
        this.eraCache[length] = [DateTime.utc(-40, 1, 1), DateTime.utc(2017, 1, 1)].map((dt) =>
          this.extract(dt, intl, 'era')
        );
      }

      return this.eraCache[length];
    });
  }

  extract(dt, intlOpts, field) {
    const df = this.dtFormatter(dt, intlOpts),
      results = df.formatToParts(),
      matching = results.find((m) => m.type.toLowerCase() === field);
    return matching ? matching.value : null;
  }

  numberFormatter(opts = {}) {
    // this forcesimple option is never used (the only caller short-circuits on it, but it seems safer to leave)
    // (in contrast, the rest of the condition is used heavily)
    //@ts-expect-error fixme
    return new PolyNumberFormatter(this.intl, opts.forceSimple || this.fastNumbers, opts);
  }

  dtFormatter(dt, intlOpts = {}) {
    return new PolyDateFormatter(dt, this.intl, intlOpts);
  }

  relFormatter(opts = {}) {
    return new PolyRelFormatter(this.intl, this.isEnglish(), opts);
  }

  listFormatter(opts: Intl.ListFormatOptions = {}): Intl.ListFormat {
    return getCachedLF({ locale: this.intl, opts });
  }

  isEnglish() {
    return (
      this.locale === 'en' ||
      this.locale.toLowerCase() === 'en-us' ||
      getCachedIntResolvedOptions(this.intl).locale.startsWith('en-us')
    );
  }

  getWeekSettings() {
    if (this.weekSettings) {
      return this.weekSettings;
    } else if (!hasLocaleWeekInfo()) {
      return fallbackWeekSettings;
    } else {
      return getCachedWeekInfo(this.locale);
    }
  }

  getStartOfWeek() {
    return this.getWeekSettings().firstDay;
  }

  getMinDaysInFirstWeek() {
    return this.getWeekSettings().minimalDays;
  }

  getWeekendDays() {
    return this.getWeekSettings().weekend;
  }

  equals(other) {
    return (
      this.locale === other.locale &&
      this.numberingSystem === other.numberingSystem &&
      this.outputCalendar === other.outputCalendar
    );
  }

  toString() {
    return `Locale(${this.locale}, ${this.numberingSystem}, ${this.outputCalendar})`;
  }
}

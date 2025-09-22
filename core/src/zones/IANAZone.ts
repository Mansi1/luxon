import { parseZoneInfo, isUndefined, objToLocalTS } from '../impl/util.js';
import Zone, { OffsetFormat, ZoneOffsetOptions } from '../zone.js';
import { Cache } from '../impl/cache.js';

type OffsetDo = {
  year: number;
  month: number;
  day: number;
  era: 'BC' | string;
  hour: number;
  minute: number;
  second: number;
};

/**
 * A zone identified by an IANA identifier, like America/New_York
 * @implements {Zone}
 */
export default class IANAZone extends Zone {
  protected static ianaZoneCache = new Cache<IANAZone, string>(
    (name) => name,
    (name) => new IANAZone(name)
  );

  protected static dtfCache = new Cache<Intl.DateTimeFormat, string>(
    (zoneName) => zoneName,
    (zoneName) =>
      new Intl.DateTimeFormat('en-US', {
        hour12: false,
        timeZone: zoneName,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        era: 'short',
      })
  );

  static create(name: string): IANAZone {
    return IANAZone.ianaZoneCache.getAndSet(name);
  }

  /**
   * Reset local caches. Should only be necessary in testing scenarios.
   */
  static resetCache(): void {
    IANAZone.ianaZoneCache.clear();
    IANAZone.dtfCache.clear();
  }

  /**
   * Returns whether the provided string is a valid specifier. This only checks the string's format, not that the specifier identifies a known zone; see isValidZone for that.
   * @param {string} s - The string to check validity on
   * @example IANAZone.isValidSpecifier("America/New_York") //=> true
   * @example IANAZone.isValidSpecifier("Sport~~blorp") //=> false
   * @deprecated For backward compatibility, this forwards to isValidZone, better use `isValidZone()` directly instead.
   * @return {boolean}
   */
  static isValidSpecifier(s: string): boolean {
    return this.isValidZone(s);
  }

  /**
   * Returns whether the provided string identifies a real zone
   * @param {string} zone - The string to check
   * @example IANAZone.isValidZone("America/New_York") //=> true
   * @example IANAZone.isValidZone("Fantasia/Castle") //=> false
   * @example IANAZone.isValidZone("Sport~~blorp") //=> false
   * @return {boolean}
   */
  static isValidZone(zone: string): boolean {
    return IANAZone.normalizeZone(zone) != null;
  }

  /**
   * Normalize the name of the provided IANA zone or return null
   * if it is not a valid IANA zone.
   * @param {string} zone - The string to normalize
   * @example IANAZone.normalizeZone("America/New_York") //=> "America/New_York"
   * @example IANAZone.normalizeZone("america/NEw_York") //=> "America/New_York"
   * @example IANAZone.normalizeZone("EST5EDT") //=> "America/New_York"
   * @example IANAZone.normalizeZone("Fantasia/Castle") //=> null
   * @example IANAZone.normalizeZone("Sport~~blorp") //=> null
   */
  static normalizeZone(zone: string): string | null {
    if (!zone) {
      return null;
    }
    try {
      return new Intl.DateTimeFormat('en-US', { timeZone: zone }).resolvedOptions().timeZone;
    } catch (e) {
      return null;
    }
  }

  private valid: boolean;
  private zoneName: string;

  constructor(name: string) {
    super();
    const normalizedName = IANAZone.normalizeZone(name);

    this.valid = normalizedName != null;

    // For backwards compatibility we only normalize in casing, otherwise would also normalize something like
    // EST5EDT to America/New_York.
    this.zoneName = normalizedName && normalizedName.toLowerCase() === name.toLowerCase() ? normalizedName : name;
  }

  /**
   * The type of zone. `iana` for all instances of `IANAZone`.
   */
  get type(): string {
    return 'iana';
  }

  /**
   * The name of this zone (i.e. the IANA zone name).
   */
  get name(): string {
    return this.zoneName;
  }

  /**
   * Returns whether the offset is known to be fixed for the whole year:
   * Always returns false for all IANA zones.
   */
  get isUniversal(): boolean {
    return false;
  }

  /**
   * Returns the offset's common name (such as EST) at the specified timestamp
   * @override
   * @param {number} ts - Epoch milliseconds for which to get the name
   * @param {Object} opts - Options to affect the format
   * @param {string} opts.format - What style of offset to return. Accepts 'long' or 'short'.
   * @param {string} opts.locale - What locale to return the offset name in.
   * @return {string | null}
   */
  offsetName(ts: number, { format, locale }: Partial<ZoneOffsetOptions>): string | null {
    return parseZoneInfo(ts, format, locale, this.name);
  }

  /**
   * Returns the offset's value as a string
   * @override
   * @param {number} ts - Epoch milliseconds for which to get the offset
   * @param {string} format - What style of offset to return.
   *                          Accepts 'narrow', 'short', or 'techie'. Returning '+6', '+06:00', or '+0600' respectively
   * @return {string}
   */
  formatOffset(ts: number, format: OffsetFormat) {
    return Zone.formatOffset(this.offset(ts), format);
  }

  private partsOffset(dtf: Intl.DateTimeFormat, date: Date): OffsetDo {
    const formatted = dtf.formatToParts(date);
    const offset: Partial<OffsetDo> = {};
    for (let i = 0; i < formatted.length; i++) {
      const { type, value } = formatted[i];

      switch (type) {
        case 'year':
        case 'month':
        case 'day':
        case 'hour':
        case 'minute':
        case 'second':
          const intValue = parseInt(value, 10);
          offset[type] = intValue;
          break;
        case 'era':
          offset.era = value;
          break;
        default:
          continue;
      }
    }

    return offset as OffsetDo;
  }

  private hackyOffset(dtf: Intl.DateTimeFormat, date: Date): OffsetDo {
    const formatted = dtf.format(date).replace(/\u200E/g, ''),
      parsed = /(\d+)\/(\d+)\/(\d+) (AD|BC),? (\d+):(\d+):(\d+)/.exec(formatted);
    if (parsed === null) {
      throw new Error('Failed ot parse the offset IANAZone hackyOffset :?');
    }
    const [, fMonth, fDay, fYear, fadOrBc, fHour, fMinute, fSecond] = parsed;
    return {
      year: parseInt(fYear, 10),
      month: parseInt(fMonth, 10),
      day: parseInt(fDay, 10),
      era: fadOrBc,
      hour: parseInt(fHour, 10),
      minute: parseInt(fMinute, 10),
      second: parseInt(fSecond, 10),
    };
  }

  /**
   * Return the offset in minutes for this zone at the specified timestamp.
   * @override
   * @param {number} ts - Epoch milliseconds for which to compute the offset
   * @return {number}
   */
  offset(ts: number): number {
    if (!this.valid) return NaN;
    const date = new Date(ts);

    if (isNaN(date.getMilliseconds())) return NaN;

    const dtf = IANAZone.dtfCache.getAndSet(this.name);
    let offset: OffsetDo;
    if ('formatToParts' in dtf) {
      offset = this.partsOffset(dtf, date);
    } else {
      offset = this.hackyOffset(dtf, date);
    }

    let { year, month, day, era, hour, minute, second } = offset;
    if (era === 'BC') {
      year = -Math.abs(year) + 1;
    }

    // because we're using hour12 and https://bugs.chromium.org/p/chromium/issues/detail?id=1025564&can=2&q=%2224%3A00%22%20datetimeformat
    const adjustedHour = hour === 24 ? 0 : hour;

    const asUTC = objToLocalTS({
      year,
      month,
      day,
      hour: adjustedHour,
      minute,
      second,
      millisecond: 0,
    });

    let asTS = +date;
    const over = asTS % 1000;
    asTS -= over >= 0 ? over : 1000 + over;
    return (asUTC - asTS) / (60 * 1000);
  }

  /**
   * Return whether this Zone is equal to another zone
   * @override
   * @param {Zone} otherZone - the zone to compare
   * @return {boolean}
   */
  equals(otherZone: Zone) {
    return otherZone instanceof IANAZone && otherZone.name === this.name;
  }

  /**
   * Return whether this Zone is valid.
   * @override
   * @type {boolean}
   */
  get isValid() {
    return this.valid;
  }
}

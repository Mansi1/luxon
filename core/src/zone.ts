import { padStart } from './impl/util';

export type TimeZoneNameFormat = 'short' | 'long';

export type OffsetFormat = 'narrow' | 'short' | 'techie';

export interface ZoneOffsetOptions {
  /**
   * What style of offset to return.
   */
  format: TimeZoneNameFormat;
  /**
   * What locale to return the offset name in.
   */
  locale: string;
}

export default abstract class Zone {
  /**
   * Returns the offset's value as a string
   * @param {number} ts - Epoch milliseconds for which to get the offset
   * @param {string} format - What style of offset to return.
   *                          Accepts 'narrow', 'short', or 'techie'. Returning '+6', '+06:00', or '+0600' respectively
   * @return {string}
   */
  static formatOffset(offset: number, format: OffsetFormat) {
    const hours = Math.trunc(Math.abs(offset / 60)),
      minutes = Math.trunc(Math.abs(offset % 60)),
      sign = offset >= 0 ? '+' : '-';

    switch (format) {
      case 'short':
        return `${sign}${padStart(hours, 2)}:${padStart(minutes, 2)}`;
      case 'narrow':
        return `${sign}${hours}${minutes > 0 ? `:${minutes}` : ''}`;
      case 'techie':
        return `${sign}${padStart(hours, 2)}${padStart(minutes, 2)}`;
      default:
        throw new RangeError(`Value format ${format} is out of range for property format`);
    }
  }

  static isZone(o: unknown): o is Zone {
    return o instanceof Zone;
  }
  /**
   * The type of zone
   * @type {string}
   */
  abstract get type(): string;

  /**
   * The name of this zone.
   * @abstract
   * @type {string}
   */
  abstract get name(): string;

  /**
   * The IANA name of this zone.
   * Defaults to `name` if not overwritten by a subclass.
   * @type {string}
   */
  get ianaName(): string {
    return this.name;
  }

  /**
   * Returns whether the offset is known to be fixed for the whole year.
   * @abstract
   * @type {boolean}
   */
  abstract get isUniversal(): boolean;

  /**
   * Returns the offset's common name (such as EST) at the specified timestamp
   * @abstract
   * @param {number} ts - Epoch milliseconds for which to get the name
   * @param {Object} opts - Options to affect the format
   * @param {string} opts.format - What style of offset to return. Accepts 'long' or 'short'.
   * @param {string} opts.locale - What locale to return the offset name in.
   * @return {string}
   */
  abstract offsetName(ts: number, opts?: Partial<ZoneOffsetOptions>): string | null;
  /**
   * Returns the offset's value as a string
   * @abstract
   * @param {number} ts - Epoch milliseconds for which to get the offset
   * @param {string} format - What style of offset to return.
   *                          Accepts 'narrow', 'short', or 'techie'. Returning '+6', '+06:00', or '+0600' respectively
   * @return {string}
   */
  abstract formatOffset(ts: number, format: OffsetFormat): string;

  /**
   * Return the offset in minutes for this zone at the specified timestamp.
   * @param {number} ts - Epoch milliseconds for which to compute the offset
   * @return {number}
   */
  abstract offset(ts: number): number;

  /**
   * Return whether this Zone is equal to another zone
   * @param {Zone} otherZone - the zone to compare
   * @return {boolean}
   */
  abstract equals(otherZone: Zone): boolean;

  /**
   * Return whether this Zone is valid.
   * @abstract
   * @type {boolean}
   */
  abstract get isValid(): boolean;
}

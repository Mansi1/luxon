import { parseZoneInfo } from '../impl/util.js';
import Zone, { OffsetFormat, ZoneOffsetOptions } from '../zone.js';

/**
 * Represents the local zone for this JavaScript environment.
 * @implements {Zone}
 */
export default class SystemZone extends Zone {
  private static system: SystemZone | null = null;
  /**
   * Get a singleton instance of the local zone
   * @return {SystemZone}
   */
  static get instance(): SystemZone {
    if (SystemZone.system === null) {
      SystemZone.system = new SystemZone();
    }
    return SystemZone.system;
  }

  /** @override **/
  get type() {
    return 'system';
  }

  /** @override **/
  get name() {
    return new Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  /** @override **/
  get isUniversal() {
    return false;
  }

  /** @override **/
  offsetName(ts: number, { locale, format }: Partial<ZoneOffsetOptions>) {
    return parseZoneInfo(ts, format, locale);
  }

  /** @override **/
  formatOffset(ts: number, format: OffsetFormat) {
    return Zone.formatOffset(this.offset(ts), format);
  }

  /** @override **/
  offset(ts: number) {
    return -new Date(ts).getTimezoneOffset();
  }

  /** @override **/
  equals(otherZone: Zone) {
    return otherZone.type === 'system' && otherZone instanceof SystemZone;
  }

  /** @override **/
  get isValid() {
    return true;
  }
}

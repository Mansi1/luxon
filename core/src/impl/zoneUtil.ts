import Zone from '../zone';
import IANAZone from '../zones/IANAZone';
import FixedOffsetZone from '../zones/fixedOffsetZone';
import InvalidZone from '../zones/invalidZone';

import { isUndefined, isString, isNumber, isNull } from '../util/guards';
import SystemZone from '../zones/systemZone';

export const normalizeZone = (input: Zone | string | number | undefined, defaultZone: Zone): Zone => {
  if (isUndefined(input) || isNull(input)) {
    return defaultZone;
  }

  if (isString(input)) {
    const lowered = input.toLowerCase();
    if (lowered === 'default') {
      return defaultZone;
    }
    if (lowered === 'local' || lowered === 'system') {
      return SystemZone.instance;
    }

    if (lowered === 'utc' || lowered === 'gmt') {
      return FixedOffsetZone.utcInstance;
    }
    return FixedOffsetZone.parseSpecifier(lowered) || IANAZone.create(input);
  }

  if (isNumber(input)) {
    return FixedOffsetZone.instance(input);
  }

  if (Zone.isZone(input)) {
    return input;
  }

  return new InvalidZone(input);
};

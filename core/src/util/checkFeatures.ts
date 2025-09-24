import { isUndefined } from './guards';

export const hasIntlFeature = (): boolean => {
  try {
    return !isUndefined(Intl);
  } catch (e) {
    return false;
  }
};
export const hasIntlFeatureRelativeTimeFormat = (): boolean => {
  try {
    return hasIntlFeature() && !isUndefined(Intl.RelativeTimeFormat);
  } catch (e) {
    return false;
  }
};

export const hasIntlFeauteLocaleWeekInfo = (): boolean => {
  try {
    return (
      hasIntlFeature() &&
      !isUndefined(Intl.Locale) &&
      ('weekInfo' in Intl.Locale.prototype || 'getWeekInfo' in Intl.Locale.prototype)
    );
  } catch (e) {
    return false;
  }
};

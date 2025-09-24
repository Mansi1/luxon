// --- Tests for Intl Feature Guards ---

import { hasIntlFeature, hasIntlFeauteLocaleWeekInfo, hasIntlFeatureRelativeTimeFormat } from './checkFeatures';

// Corrected approach for mocking globals to avoid TypeError
describe('Intl Feature Guards', () => {
  const originalIntl = global.Intl;

  // Use before/afterEach to handle cleanup
  afterEach(() => {
    global.Intl = originalIntl;
  });

  it('hasIntlFeature should return true if Intl is defined', () => {
    expect(hasIntlFeature()).toBe(true);
  });

  it('hasIntlFeature should return false if Intl is undefined', () => {
    // Direct assignment
    global.Intl = undefined as any;
    expect(hasIntlFeature()).toBe(false);
  });

  it('hasIntlFeatureRelativeTimeFormat should return false if Intl.RelativeTimeFormat is undefined', () => {
    // Direct assignment of a mock object
    global.Intl = { RelativeTimeFormat: undefined } as any;
    expect(hasIntlFeatureRelativeTimeFormat()).toBe(false);
  });

  it('hasIntlFeatureRelativeTimeFormat should return false if Intl.RelativeTimeFormat throws an error', () => {
    // Correct way to mock an error-throwing getter on a mock object
    const mockIntl = {
      get RelativeTimeFormat() {
        throw new Error();
      },
    };
    global.Intl = mockIntl as any;
    expect(hasIntlFeatureRelativeTimeFormat()).toBe(false);
  });

  it('hasIntlFeauteLocaleWeekInfo should return false if Intl.Locale is undefined', () => {
    global.Intl = { Locale: undefined } as any;
    expect(hasIntlFeauteLocaleWeekInfo()).toBe(false);
  });

  it('hasIntlFeauteLocaleWeekInfo should return true if weekInfo is available', () => {
    const mockLocale = {
      prototype: {
        weekInfo: {},
      },
    };
    global.Intl = { Locale: mockLocale } as any;
    expect(hasIntlFeauteLocaleWeekInfo()).toBe(true);
  });
});

import { Cache, SimpleCache, SingeltonCache, StringSimpleCache } from './cache';

describe('test caches', () => {
  it('test cache', () => {
    const mockedInitFn = jest.fn();
    const testingCache = new Cache<Date, string>(mockedInitFn);
    const date1 = new Date();
    const date2 = new Date(date1.getMilliseconds() + 5000);
    expect(mockedInitFn).toHaveBeenCalledTimes(1);
    expect(mockedInitFn).toHaveBeenCalledWith(testingCache);
    expect(testingCache.get('date1')).toBeUndefined();
    expect(testingCache.set('date1', date1)).toEqual(date1);
    expect(testingCache.set('date2', date2)).toEqual(date2);

    expect(testingCache.get('date1')).toEqual(date1);
    expect(testingCache.get('date2')).toEqual(date2);

    expect(testingCache.values()).toEqual([date1, date2]);

    testingCache.clear();

    expect(testingCache.values()).toEqual([]);
  });

  it('test simple cache', () => {
    const mockedCreateFn = jest.fn((millis) => new Date(millis));
    const mockedInitFn = jest.fn();
    const testingCache = new SimpleCache<Date, number>((millis) => `millis-${millis}`, mockedCreateFn, mockedInitFn);

    expect(mockedInitFn).toHaveBeenCalledTimes(1);
    expect(mockedInitFn).toHaveBeenCalledWith(testingCache);

    const firstMillis = new Date().getMilliseconds();
    const dataGetFirst = testingCache.getAndSet(firstMillis);
    const dataGetSecond = testingCache.getAndSet(firstMillis);
    expect(mockedCreateFn).toHaveBeenCalledTimes(1);
    expect(mockedCreateFn).toHaveBeenCalledWith(firstMillis);
    expect(dataGetFirst).toEqual(new Date(firstMillis));
    expect(dataGetSecond).toEqual(new Date(firstMillis));
    expect(dataGetFirst).toEqual(dataGetSecond);

    expect(testingCache.values()).toEqual([new Date(firstMillis)]);

    testingCache.clear();

    expect(testingCache.values()).toEqual([]);
  });

  it('test string simple cache', () => {
    const datesCreated: Array<Date> = [];

    const mockedCreateFn = jest.fn(() => {
      const newDate = new Date();
      datesCreated.push(newDate);
      return newDate;
    });

    const mockedInitFn = jest.fn();
    const testingCache = new StringSimpleCache<Date>(mockedCreateFn, mockedInitFn);

    expect(mockedInitFn).toHaveBeenCalledTimes(1);
    expect(mockedInitFn).toHaveBeenCalledWith(testingCache);

    //@ts-expect-error
    expect(testingCache.cache.get('test')).toBeUndefined();

    testingCache.getAndSet('test');

    //@ts-expect-error
    expect(testingCache.cache.get('test')).toEqual(datesCreated[datesCreated.length - 1]);

    testingCache.clear();

    //@ts-expect-error
    expect(testingCache.cache.get('test')).toBeUndefined();

    testingCache.getAndSet('test');

    expect(datesCreated.length).toEqual(2);
  });

  it('test singelton cache', () => {
    const datesCreated: Array<Date> = [];

    const mockedCreateFn = jest.fn(() => {
      const newDate = new Date();
      datesCreated.push(newDate);
      return newDate;
    });

    const mockedInitFn = jest.fn();
    const testingCache = new SingeltonCache<Date>(mockedCreateFn, mockedInitFn);

    expect(mockedInitFn).toHaveBeenCalledTimes(1);
    expect(mockedInitFn).toHaveBeenCalledWith(testingCache);

    //@ts-expect-error
    expect(testingCache.get()).toBeUndefined();

    testingCache.getAndSet();

    //@ts-expect-error
    expect(testingCache.get()).toEqual(datesCreated[datesCreated.length - 1]);

    testingCache.clear();

    //@ts-expect-error
    expect(testingCache.get()).toBeUndefined();

    testingCache.getAndSet();

    expect(datesCreated.length).toEqual(2);
  });
});

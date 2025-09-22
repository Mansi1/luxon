export class Cache<T, Key> {
  private cache: Record<string, T> = {};

  constructor(
    public keyFn: (key: Key) => string,
    public create: (key: Key) => T,
    init?: (cache: Cache<T, Key>) => void
  ) {
    init?.(this);
  }

  get = (key: string): T | undefined => {
    return this.cache[key];
  };
  set = (key: string, data: T): T => {
    this.cache[key] = data;
    return data;
  };
  getAndSet = (key: Key): T => {
    const cacheKey = this.keyFn(key);
    const data = this.get(cacheKey);
    if (data) {
      return data;
    } else {
      const newData = this.create(key);
      return this.set(cacheKey, newData);
    }
  };

  clear = (): void => {
    this.cache = {};
  };
}

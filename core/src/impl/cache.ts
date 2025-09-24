export interface ClearCache {
  clear(): void;
}

export interface ValuesCache<T> {
  values(): Array<T>;
}

export class Cache<T, Key extends string> implements ClearCache, ValuesCache<T> {
  private cache: Record<string, T> = {};

  constructor(onCreatListner?: (cache: Cache<T, Key>) => void) {
    onCreatListner?.(this);
  }

  get(key: Key): T | undefined {
    return this.cache[key];
  }

  set(key: Key, data: T): T {
    this.cache[key] = data;
    return data;
  }

  values(): Array<T> {
    return Object.values(this.cache);
  }

  clear(): void {
    this.cache = {};
  }
}

export class SimpleCache<T, Key> implements ClearCache, ValuesCache<T> {
  private cache: Cache<T, string>;
  constructor(
    public keyFn: (key: Key) => string,
    private create: (key: Key) => T,
    onCreatListner?: (cache: SimpleCache<T, Key>) => void
  ) {
    this.cache = new Cache();
    onCreatListner?.(this);
  }

  clear() {
    this.cache.clear();
  }

  values(): Array<T> {
    return this.cache.values();
  }

  public getAndSet(key: Key): T {
    const cacheKey = this.keyFn(key);
    const data = this.cache.get(cacheKey);
    if (data) {
      return data;
    } else {
      return this.cache.set(cacheKey, this.create(key));
    }
  }
}

export class StringSimpleCache<T> extends SimpleCache<T, string> {
  constructor(create: (key: string) => T, onCreatListner?: (cache: StringSimpleCache<T>) => void) {
    super((key) => key, create);
    onCreatListner?.(this);
  }
}

export class SingeltonCache<T> implements ClearCache {
  private singelton: T | undefined = undefined;

  constructor(private create: () => T, onCreatListner?: (cache: SingeltonCache<T>) => void) {
    onCreatListner?.(this);
  }

  getAndSet(): T {
    const data = this.get();
    if (data) {
      return data;
    } else {
      return this.set(this.create());
    }
  }

  private get(): T | undefined {
    return this.singelton;
  }

  private set(data: T): T {
    this.singelton = data;
    return data;
  }

  clear(): void {
    this.singelton = undefined;
  }
}

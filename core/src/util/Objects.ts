class ObjectsImpl {
  keys<T extends object>(object: T): (keyof T)[] {
    return Object.keys(object) as (keyof T)[];
  }
  entries<T extends object>(
    object: T
  ): {
    [K in keyof T]: [K, T[K]];
  }[keyof T][] {
    return Object.entries(object) as any;
  }
}

export const Objects = new ObjectsImpl();

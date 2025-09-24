export const ensureArray = <T>(thing: T | T[]): T[] => {
  return Array.isArray(thing) ? thing : [thing];
};

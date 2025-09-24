export type integer = number & { __type: 'integer' };

export const isUndefined = (o: unknown): o is undefined => {
  return typeof o === 'undefined';
};

export const isNull = (o: unknown): o is null => {
  return Object.is(o, null);
};
export const isNumber = (o: unknown): o is number => {
  return typeof o === 'number';
};

export const isInteger = (o: unknown): o is integer => {
  return typeof o === 'number' && o % 1 === 0;
};

export const isString = (o: unknown): o is string => {
  return typeof o === 'string';
};

export const isDate = (o: unknown): o is Date => {
  return Object.prototype.toString.call(o) === '[object Date]';
};

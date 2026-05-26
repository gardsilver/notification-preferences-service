import { inspect } from 'util';
import { Type } from '@nestjs/common';

export const objToJsonString = (obj: unknown): string => inspect(obj, { depth: null });

export const isStaticMethod = (type: Type | object | null | undefined, methodName: string): boolean => {
  if (type === null || type === undefined) {
    return false;
  }

  return (
    methodName in type &&
    typeof (type as Record<string, unknown>)[methodName] === 'function' &&
    !('get' in type) &&
    !('set' in type)
  );
};

export const enumKeys = <T extends object>(e: T) => {
  const keys = Object.keys(e);
  const isStringEnum = isNaN(Number(keys[0]));
  return isStringEnum ? keys : keys.slice(keys.length / 2);
};

export const enumValues = <T extends Record<string, unknown>>(e: T) => {
  const values = Object.values(e);
  const isNumEnum = e[e[values[0] as string] as string] === values[0];
  return isNumEnum ? values.slice(values.length / 2) : values;
};

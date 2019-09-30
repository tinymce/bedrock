import * as Type from './Type';

const Arr = {
  contains: (values: any[], value: any): boolean =>
    values.indexOf(value) > -1
};

const Obj = {
  keys: (obj: object): string[] =>
    Object.keys(obj)
};

export interface Comparison {
  eq: boolean;
  why: () => string;
}

const pass = (): Comparison =>
  ({eq: true, why: () => ''});

const fail = (why: () => string): Comparison =>
  ({eq: false, why: why});

const failCompare = (x: any, y: any, prefix?: string): Comparison => {
  return fail(() => (prefix || 'Values were different') + ': [' + String(x) + '] vs [' + String(y) + ']');
};

const isEquatableType = (x: string): boolean =>
  Arr.contains(['undefined', 'boolean', 'number', 'string', 'function', 'xml', 'null'], x);

const compareArrays = (x: any[], y: any[]): Comparison => {
  if (x.length !== y.length) {
    return failCompare(x.length, y.length, 'Array lengths were different');
  }

  for (let i = 0; i < x.length; i++) {
    const result = doCompare(x[i], y[i]);
    if (!result.eq) {
      return fail(() => 'Array elements ' + i + ' were different: ' + result.why());
    }
  }
  return pass();
};

const sortArray = (x: any[]): any[] => {
  const y = x.slice();
  y.sort();
  return y;
};

const sortedKeys = (o: object) =>
  sortArray(Obj.keys(o));

const compareObjects = (x: any, y: any) => {
  const constructorX = x.constructor;
  const constructorY = y.constructor;
  if (constructorX !== constructorY) {
    return failCompare(constructorX, constructorY, 'Constructors were different');
  }

  const keysX = sortedKeys(x);
  const keysY = sortedKeys(y);

  const keysResult = compareArrays(keysX, keysY);
  if (!keysResult.eq) {
    return failCompare(JSON.stringify(keysX), JSON.stringify(keysY), 'Object keys were different');
  }

  for (const i in x) {
    if (x.hasOwnProperty(i)) {
      const xValue = x[i];
      const yValue = y[i];
      const valueResult = doCompare(xValue, yValue);
      if (!valueResult.eq) {
        return fail(() => 'Objects were different for key: [' + i + ']: ' + valueResult.why());
      }
    }
  }
  return pass();
};

const doCompare = (x: any, y: any): Comparison => {
  if (x === y) return pass();

  const typeX = Type.typeOf(x);
  const typeY = Type.typeOf(y);

  if (typeX !== typeY) return failCompare(typeX, typeY, 'Types were different');

  if (isEquatableType(typeX)) {
    if (x !== y) return failCompare(x, y, 'Reference equality failed');

  } else if (x == null) {
    if (y !== null) return failCompare(x, y, 'Both values were not null');

  } else if (typeX === 'array') {
    const arrayResult = compareArrays(x, y);
    if (!arrayResult.eq) return arrayResult;

  } else if (typeX === 'object') {
    const objectResult = compareObjects(x, y);
    if (!objectResult.eq) return objectResult;
  }
  return pass();
};

export const compare = (x: any, y: any): Comparison => {
  const result = doCompare(x, y);
  const bar = '-----------------------------------------------------------------------';

  return {
    eq: result.eq,
    why: () => result.why() + '\n' + bar + '\n' + JSON.stringify(x) + '\n' + bar + '\n' + JSON.stringify(y) + '\n' + bar + '\n'
  };
};

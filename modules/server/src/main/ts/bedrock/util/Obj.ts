export const toLowerCaseKeys = (items: Record<string, any>): Record<string, any> => {
  const clone: Record<string, any> = {};

  Object.keys(items).forEach((key) => {
    clone[key.toLowerCase()] = items[key];
  });

  return clone;
};

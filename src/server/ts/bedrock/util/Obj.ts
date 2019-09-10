export const toLowerCaseKeys = (items: Record<string, any>) => {
  const clone = {};

  Object.keys(items).forEach((key) => {
    clone[key.toLowerCase()] = items[key];
  });

  return clone;
};

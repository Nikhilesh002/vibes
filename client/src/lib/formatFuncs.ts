export const makeFirstLetterUp = (str: string) => {
  if (!str) return "";
  return str[0].toUpperCase() + str.slice(1);
};

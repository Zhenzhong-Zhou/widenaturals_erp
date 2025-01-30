export const capitalizeFirstLetter = (text: string | null | undefined): string => {
  if (!text) return 'Unknown';
  return text.charAt(0).toUpperCase() + text.slice(1);
};

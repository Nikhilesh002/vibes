export const makeFirstLetterUp = (str: string) => {
  if (!str) return '';
  return str[0].toUpperCase() + str.slice(1);
};

export const timeElapsed = (dateNumber: number) => {
  const now = new Date();
  const past = new Date(dateNumber);
  const elapsed = now.getTime() - past.getTime();

  const seconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);

  if (years > 0) return `${years} years ago`;
  if (months > 0) return `${months} months ago`;
  if (days > 0) return `${days} days ago`;
  if (hours > 0) return `${hours} hours ago`;
  if (minutes > 0) return `${minutes} minutes ago`;
  return `${seconds} seconds ago`;
};

export const formatDescription = (description: string) => {
  if (!description) return '';
  return description.length > 100 ? description.slice(0, 100) + '...' : description;
};

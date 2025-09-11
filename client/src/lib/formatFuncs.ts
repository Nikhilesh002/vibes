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

  if (years > 1) return `${years} years ago`;
  if (years === 1) return `1 year ago`;
  if (months > 1) return `${months} months ago`;
  if (months === 1) return `1 month ago`;
  if (days > 1) return `${days} days ago`;
  if (days === 1) return `1 day ago`;
  if (hours > 1) return `${hours} hours ago`;
  if (hours === 1) return `1 hour ago`;
  if (minutes > 1) return `${minutes} minutes ago`;
  if (minutes === 1) return `1 minute ago`;
  if (seconds <= 10) return `just now`;
  return `${seconds} seconds ago`;
};

export const formatViews = (views: number) => {
  if (views < 1000) return views.toString();
  if (views < 1_000_000) return (views / 1000).toFixed(1) + 'K';
  if (views < 1_000_000_000) return (views / 1_000_000).toFixed(1) + 'M';
  return (views / 1_000_000_000).toFixed(1) + 'B';
};

export const formatDescription = (description: string) => {
  if (!description) return '';
  return description.length > 100 ? description.slice(0, 100) + '...' : description;
};

const staticBaseURL = import.meta.env.VITE_STATIC_BASE_URL;

export const formatImageUrl = (url: string | null) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${staticBaseURL}${url}`;
};

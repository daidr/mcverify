export const randomString = (length: number): string => {
  const chars =
    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

export const getUrl = (
  base: string,
  url: string,
  querys?: { [key: string]: string },
): string => {
  const _url = new URL(url, base);
  if (!querys) return _url.toString();

  for (const key in querys) {
    _url.searchParams.set(key, querys[key]);
  }
  return _url.toString();
};

export const ellipsisUuid = (uuid: string): string => {
  return uuid.slice(0, 4) + '...' + uuid.slice(-4);
};

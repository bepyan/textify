export type Platform = 'naver' | 'youtube' | 'unknown';

export function detectPlatform(url: string): Platform {
  if (url.includes('naver')) {
    return 'naver';
  }

  if (url.includes('youtube') || url.includes('youtu.be')) {
    return 'youtube';
  }

  return 'unknown';
}

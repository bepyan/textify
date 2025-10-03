export interface YouTubeVideoInfo {
  videoId: string;
}

/**
 * 다양한 형태의 유튜브 URL을 파싱하여 videoId를 추출합니다.
 *
 * @param url - 유튜브 URL
 * @example
 * https://www.youtube.com/watch?v=utImgpthqoo
 * https://youtube.com/watch?v=utImgpthqoo
 * https://youtu.be/utImgpthqoo
 * https://m.youtube.com/watch?v=utImgpthqoo
 * https://www.youtube.com/embed/utImgpthqoo
 * https://www.youtube.com/v/utImgpthqoo
 *
 * @returns YouTubeVideoInfo 객체 또는 null (파싱 실패 시)
 */
export function parseYouTubeUrl(url: string): YouTubeVideoInfo | null {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);

    // 호스트가 유튜브가 아닌 경우
    const isYouTube =
      urlObj.hostname.includes('youtube.com') ||
      urlObj.hostname.includes('youtu.be');

    if (!isYouTube) {
      return null;
    }

    // 1. youtu.be 단축 URL
    // https://youtu.be/utImgpthqoo
    if (urlObj.hostname === 'youtu.be') {
      const videoId = urlObj.pathname.slice(1); // Remove leading /
      if (videoId) {
        return { videoId };
      }
    }

    // 2. watch 형태 (쿼리 파라미터)
    // https://www.youtube.com/watch?v=utImgpthqoo
    // https://youtube.com/watch?v=utImgpthqoo
    // https://m.youtube.com/watch?v=utImgpthqoo
    if (urlObj.pathname.includes('/watch')) {
      const videoId = urlObj.searchParams.get('v');
      if (videoId) {
        return { videoId };
      }
    }

    // 3. embed 형태
    // https://www.youtube.com/embed/utImgpthqoo
    const embedMatch = urlObj.pathname.match(/^\/embed\/([^/?]+)/);
    if (embedMatch) {
      const videoId = embedMatch[1];
      return { videoId };
    }

    // 4. /v/ 형태
    // https://www.youtube.com/v/utImgpthqoo
    const vMatch = urlObj.pathname.match(/^\/v\/([^/?]+)/);
    if (vMatch) {
      const videoId = vMatch[1];
      return { videoId };
    }

    return null;
  } catch {
    return null;
  }
}

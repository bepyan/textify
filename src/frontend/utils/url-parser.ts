// URL parsing utilities for content extraction
export interface ParsedUrl {
  platform: 'youtube' | 'naver' | 'unknown';
  id: string | null;
  isValid: boolean;
}

/**
 * Parse URL to determine platform and extract content ID
 */
export function parseUrl(url: string): ParsedUrl {
  try {
    const urlObj = new URL(url);

    // YouTube URL patterns
    if (
      urlObj.hostname.includes('youtube.com') ||
      urlObj.hostname.includes('youtu.be')
    ) {
      return parseYouTubeUrl(urlObj);
    }

    // Naver blog URL patterns
    if (urlObj.hostname.includes('blog.naver.com')) {
      return parseNaverBlogUrl(urlObj);
    }

    return { platform: 'unknown', id: null, isValid: false };
  } catch {
    return { platform: 'unknown', id: null, isValid: false };
  }
}

function parseYouTubeUrl(url: URL): ParsedUrl {
  // Extract video ID from various YouTube URL formats
  let videoId: string | null = null;

  if (url.hostname.includes('youtu.be')) {
    // Short URL: https://youtu.be/VIDEO_ID
    videoId = url.pathname.slice(1);
  } else if (url.pathname === '/watch') {
    // Standard URL: https://www.youtube.com/watch?v=VIDEO_ID
    videoId = url.searchParams.get('v');
  }

  const isValid = videoId !== null && videoId.length === 11;
  return { platform: 'youtube', id: videoId, isValid };
}

function parseNaverBlogUrl(url: URL): ParsedUrl {
  // Extract post ID from Naver blog URL
  // Format: https://blog.naver.com/USER_ID/POST_ID
  const pathParts = url.pathname.split('/').filter(Boolean);

  if (pathParts.length >= 2) {
    const postId = pathParts[1];
    const isValid = /^\d+$/.test(postId); // Post ID should be numeric
    return { platform: 'naver', id: postId, isValid };
  }

  return { platform: 'naver', id: null, isValid: false };
}

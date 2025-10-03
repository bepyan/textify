import { useMutation } from '@tanstack/react-query';

import { client } from '@fe/lib/api';

import { detectPlatform } from './detect-platform';
import { parseNaverBlogUrl } from './naver-blog-url-pharser';
import { extractYouTubeTranscriptInBrowser } from './youtube-extractor';
import { parseYouTubeUrl } from './youtube-url-parser';

export function useExtractMutation() {
  return useMutation({
    mutationFn: async (url: string) => {
      const platform = detectPlatform(url);
      switch (platform) {
        case 'naver': {
          const naverBlogInfo = parseNaverBlogUrl(url);
          if (!naverBlogInfo) {
            return null;
          }

          const result = await client.api.extract.naver.$get({
            query: {
              blogId: naverBlogInfo.blogId,
              logNo: naverBlogInfo.logNo,
            },
          });

          if (!result.ok) {
            return null;
          }

          const data = await result.json();
          return data.content;
        }
        case 'youtube': {
          const youtubeVideoInfo = parseYouTubeUrl(url);
          if (!youtubeVideoInfo) {
            return null;
          }

          // 프론트엔드에서 직접 추출 (서버에서는 유튜브가 차단함)
          const content = await extractYouTubeTranscriptInBrowser(
            youtubeVideoInfo.videoId,
          );
          return content;
        }
        case 'unknown': {
          return null;
        }
      }
    },
  });
}

import { useMutation } from '@tanstack/react-query';

import { client } from '@fe/lib/api';

import { detectPlatform } from './detect-platform';
import { parseNaverBlogUrl } from './naver-blog-url-pharser';
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

          // 1. 서버에서 영상 정보 및 자막 트랙 정보 가져오기
          const result = await client.api.extract.youtube.$get({
            query: {
              videoId: youtubeVideoInfo.videoId,
            },
          });

          if (!result.ok) {
            return null;
          }

          const videoInfo = await result.json();

          return videoInfo;
        }
        case 'unknown': {
          return null;
        }
      }
    },
  });
}

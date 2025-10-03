import { useMutation } from '@tanstack/react-query';

import { client } from '@fe/lib/api';

import { detectPlatform } from './detect-platform';
import { parseNaverBlogUrl } from './naver-blog-url-pharser';

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
              userId: naverBlogInfo.blogId,
              postId: naverBlogInfo.logNo,
            },
          });

          if (!result.ok) {
            return null;
          }

          const data = await result.json();
          return data.content;
        }
        case 'youtube': {
          return null;
        }
        case 'unknown': {
          return null;
        }
      }
    },
  });
}

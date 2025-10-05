import { useMutation } from '@tanstack/react-query';

import { client } from '@fe/lib/api';

import { detectPlatform } from './detect-platform';
import { parseNaverBlogUrl } from './naver-blog-url-parser';
import { parseYouTubeUrl } from './youtube-url-parser';

export function useExtractMutation() {
  return useMutation({
    mutationFn: async (url: string): Promise<string | null> => {
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

          const result = await client.api.extract.youtube.$get({
            query: {
              videoId: youtubeVideoInfo.videoId,
            },
          });

          if (!result.ok) {
            return null;
          }

          const videoInfo = await result.json();
          const videoLength = msToTime(
            parseInt(videoInfo.info.lengthSeconds) * 1000,
          );
          let content = `# ${videoInfo.info.title}\n${videoInfo.info.author} ${videoLength}\n\n\n`;

          content += videoInfo.caption.events
            .map((event) => {
              return event.segs
                .map((seg) => `${msToTime(event.tStartMs)} ${seg.utf8}`)
                .join(' ');
            })
            .join('\n');

          return content;
        }
        case 'unknown': {
          return null;
        }
      }
    },
  });
}

// ============================================================================
// Helpers
// ============================================================================

function msToTime(ms: number) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor(ms / 60 / 1000);
  return `${minutes}:${seconds}`;
}

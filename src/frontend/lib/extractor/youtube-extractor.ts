/**
 * 프론트엔드(브라우저)에서 유튜브 자막을 직접 추출합니다.
 * 서버 환경에서는 유튜브의 보안 메커니즘으로 인해 작동하지 않으므로
 * 브라우저에서 직접 추출하는 방식을 사용합니다.
 */

interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  name?: { simpleText?: string };
}

interface CaptionEvent {
  segs?: Array<{ utf8?: string }>;
}

interface CaptionData {
  events?: CaptionEvent[];
}

export async function extractYouTubeTranscriptInBrowser(
  videoId: string,
): Promise<string> {
  try {
    // 1. 영상 페이지 가져오기
    const videoPageUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const response = await fetch(videoPageUrl, {
      headers: {
        'User-Agent': navigator.userAgent,
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch video page: ${response.status}`);
    }

    const html = await response.text();

    // 2. 영상 제목 추출
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    const title = titleMatch
      ? titleMatch[1].replace(' - YouTube', '').trim()
      : 'YouTube Video';

    // 3. captionTracks 추출
    const captionTracksMatch = html.match(/"captionTracks":\s*(\[[^\]]+\])/);

    if (!captionTracksMatch) {
      throw new Error(
        '이 영상에는 자막이 없습니다. 자막이 활성화된 영상을 선택해주세요.',
      );
    }

    let captionTracks: CaptionTrack[];
    try {
      captionTracks = JSON.parse(captionTracksMatch[1]);
    } catch {
      throw new Error('자막 정보를 파싱하는데 실패했습니다.');
    }

    if (!Array.isArray(captionTracks) || captionTracks.length === 0) {
      throw new Error('자막 트랙을 찾을 수 없습니다.');
    }

    // 4. 한국어 자막 우선 선택, 없으면 영어, 없으면 첫 번째 자막
    let selectedTrack = captionTracks.find(
      (track) => track.languageCode === 'ko' || track.languageCode === 'kr',
    );

    if (!selectedTrack) {
      selectedTrack = captionTracks.find(
        (track) =>
          track.languageCode === 'en' || track.languageCode === 'en-US',
      );
    }

    if (!selectedTrack) {
      selectedTrack = captionTracks[0];
    }

    // 5. 자막 데이터 가져오기 (JSON3 형식)
    const captionUrl = `${selectedTrack.baseUrl}&fmt=json3`;
    const captionResponse = await fetch(captionUrl);

    if (!captionResponse.ok) {
      throw new Error(
        `자막을 가져오는데 실패했습니다: ${captionResponse.status}`,
      );
    }

    const responseText = await captionResponse.text();

    if (!responseText || responseText.length === 0) {
      throw new Error('자막 데이터가 비어있습니다. 다른 영상을 시도해주세요.');
    }

    let captionData: CaptionData;
    try {
      captionData = JSON.parse(responseText);
    } catch {
      throw new Error('자막 데이터를 파싱하는데 실패했습니다.');
    }

    // 6. 자막 텍스트 추출
    const lines: string[] = [];

    if (captionData.events) {
      for (const event of captionData.events) {
        if (event.segs) {
          const text = event.segs
            .map((seg) => seg.utf8 || '')
            .join('')
            .trim();

          if (text) {
            lines.push(text);
          }
        }
      }
    }

    if (lines.length === 0) {
      throw new Error('자막 텍스트를 추출할 수 없습니다.');
    }

    // 7. 마크다운 형식으로 변환
    const markdown = [
      `# ${title}`,
      '',
      `> **Video ID:** ${videoId}`,
      `> **Language:** ${selectedTrack.name?.simpleText || selectedTrack.languageCode}`,
      '',
      '## Transcript',
      '',
      lines.join(' '),
    ].join('\n');

    return markdown;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('유튜브 자막 추출 중 오류가 발생했습니다.');
  }
}

import {
  type YoutubeCaptionTrack,
  type YoutubeCaptionData,
  type YoutubeInfo,
} from './youtube';

export class YouTubeExtractor {
  // ----------------------------------------------------------------------------
  // Core
  // ----------------------------------------------------------------------------

  static async getVideoInfo(videoId: string) {
    // 1. Fetch HTML
    const html = await this.fetchHtml(videoId);

    // 2. Extract Data
    const title = this.extractTitle(html);
    const apiKey = this.extractApiKey(html);
    if (!apiKey) {
      throw new Error('Crawled HTML does not contain apiKey');
    }

    // 3. Fetch Detail
    const detailData = await this.fetchDetail(videoId, apiKey);
    const captionTracks =
      detailData.captions.playerCaptionsTracklistRenderer.captionTracks;
    const targetCaptionTrack = this.getTargetCaptionTrack(captionTracks);

    // 4. Fetch Caption Tracks
    const captionData = await this.fetchCaptionTracks(
      targetCaptionTrack.baseUrl,
    );

    // 5. Return
    return { title, captionTracks, captionData };
  }

  private static getTargetCaptionTrack(captionTracks: YoutubeCaptionTrack[]) {
    console.log(captionTracks);
    return (
      captionTracks.find((track) => track.vssId === '.ko') ||
      captionTracks.find((track) => track.languageCode === 'en') ||
      captionTracks[0]
    );
  }

  // ----------------------------------------------------------------------------
  // Fetch
  // ----------------------------------------------------------------------------

  private static async fetchHtml(videoId: string) {
    const videoPageUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const htmlResponse = await fetch(videoPageUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (!htmlResponse.ok) {
      throw new Error(`Failed to fetch video page: ${htmlResponse.status}`);
    }

    const html = await htmlResponse.text();
    return html;
  }

  // @see https://github.com/jdepoix/youtube-transcript-api/blob/master/youtube_transcript_api/_transcripts.py#L445
  private static async fetchDetail(videoId: string, key: string) {
    const playerResponse = await fetch(
      `https://youtubei.googleapis.com/youtubei/v1/player?key=${key}`,
      {
        method: 'POST',
        body: JSON.stringify({
          context: {
            client: {
              clientName: 'ANDROID',
              clientVersion: '20.10.38',
            },
          },
          videoId,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    const playerData = await playerResponse.json();
    return playerData as YoutubeInfo;
  }

  //
  private static async fetchCaptionTracks(url: string) {
    // XML format to JSON format
    let apiUrl = url.replace('&fmt=srv3', '&fmt=json3');
    if (!apiUrl.includes('&fmt=json3')) {
      apiUrl += '&fmt=json3';
    }

    const captionTracksResponse = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    const captionData = await captionTracksResponse.json();
    return captionData as YoutubeCaptionData;
  }

  // ----------------------------------------------------------------------------
  // Data Extraction
  // ----------------------------------------------------------------------------

  private static extractTitle(html: string) {
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (!titleMatch) {
      console.error('No title found');
      return null;
    }
    return titleMatch[1].replace(' - YouTube', '').trim();
  }

  private static extractApiKey(html: string) {
    const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":\s*"([a-zA-Z0-9_-]+)/);
    if (!apiKeyMatch) {
      console.log('No INNERTUBE_API_KEY found');
      return null;
    }
    return apiKeyMatch[1];
  }

  // /**
  //  * @deprecated - Crawled caption tracks URL is invalid.
  //  */
  // private static extractCaptionTracks(html: string) {
  //   const captionTracksMatch = html.match(/"captionTracks":\s*(\[[^\]]+\])/);
  //   if (!captionTracksMatch) {
  //     console.log('No caption tracks found');
  //     return [];
  //   }

  //   try {
  //     const captionTracks = JSON.parse(captionTracksMatch[1]) as CaptionTrack[];
  //     if (!Array.isArray(captionTracks)) {
  //       throw new Error('Invalid caption tracks');
  //     }
  //     return captionTracks;
  //   } catch (e) {
  //     console.error(e);
  //     return [];
  //   }
  // }
}

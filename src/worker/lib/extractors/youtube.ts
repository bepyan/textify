// YouTube Content Extractor for Textify
// Extracts subtitles and metadata from YouTube videos using YouTube Data API v3

import type {
  ContentExtractor,
  ExtractionResult,
  YouTubeExtractorOptions,
  ExtractedContent,
  ExtractionError,
  SubtitleTrack,
  YouTubeVideoInfo,
  YouTubeSubtitleData,
} from '../../types';

export class YouTubeExtractor
  implements ContentExtractor<YouTubeExtractorOptions>
{
  private apiKey: string;
  private baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.YOUTUBE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('YouTube API key not provided. Some features may not work.');
    }
  }

  /**
   * Validate if URL is a valid YouTube URL
   */
  async validate(url: string): Promise<boolean> {
    try {
      const videoId = this.extractVideoId(url);
      return videoId !== null && videoId.length === 11;
    } catch {
      return false;
    }
  }

  /**
   * Extract video ID from YouTube URL
   */
  extractVideoId(url: string): string | null {
    if (!url || typeof url !== 'string') {
      return null;
    }

    // Standard YouTube watch URL
    const watchMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    );
    if (watchMatch) {
      return watchMatch[1];
    }

    // YouTube short URL
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) {
      return shortMatch[1];
    }

    return null;
  }

  /**
   * Extract content from YouTube video
   */
  async extract(
    url: string,
    options: YouTubeExtractorOptions = {},
  ): Promise<ExtractionResult> {
    const startTime = Date.now();

    try {
      // Validate URL
      const videoId = this.extractVideoId(url);
      if (!videoId) {
        return this.createErrorResult(
          'INVALID_URL',
          'Invalid YouTube URL format',
          startTime,
        );
      }

      // Get video info
      const videoInfo = await this.getVideoInfo(videoId);
      if (!videoInfo) {
        return this.createErrorResult(
          'CONTENT_NOT_FOUND',
          'Video not found or private',
          startTime,
        );
      }

      // Get subtitles
      const subtitleData = await this.getSubtitles(videoId, options);
      if (!subtitleData) {
        return this.createErrorResult(
          'NO_SUBTITLES',
          'No subtitles available for this video',
          startTime,
        );
      }

      // Create extracted content
      const extractedContent: ExtractedContent = {
        id: crypto.randomUUID(),
        sourceUrl: url,
        sourceType: 'youtube',
        title: videoInfo.title,
        content: subtitleData.content,
        language: subtitleData.language,
        timestamp: new Date(),
        metadata: {
          videoId: videoInfo.id,
          duration: videoInfo.duration,
          availableLanguages: videoInfo.availableLanguages,
          hasTimestamps: subtitleData.hasTimestamps,
          extractionMethod: 'youtube-api',
          processingTime: Date.now() - startTime,
          contentLength: subtitleData.content.length,
        },
      };

      return {
        success: true,
        data: extractedContent,
        processingTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('YouTube extraction error:', error);

      if (error.message.includes('quota')) {
        return this.createErrorResult(
          'RATE_LIMITED',
          'YouTube API quota exceeded',
          startTime,
          true,
        );
      }

      if (error.message.includes('timeout')) {
        return this.createErrorResult(
          'TIMEOUT',
          'Request timed out',
          startTime,
          true,
        );
      }

      return this.createErrorResult(
        'EXTRACTION_FAILED',
        'Failed to extract content',
        startTime,
        false,
        error.message,
      );
    }
  }

  /**
   * Get available subtitle languages for a video
   */
  async getAvailableLanguages(url: string): Promise<string[]> {
    try {
      const videoId = this.extractVideoId(url);
      if (!videoId) {
        return [];
      }

      const videoInfo = await this.getVideoInfo(videoId);
      return videoInfo?.availableLanguages || [];
    } catch {
      return [];
    }
  }

  /**
   * Get video information from YouTube API
   */
  private async getVideoInfo(
    videoId: string,
  ): Promise<YouTubeVideoInfo | null> {
    if (!this.apiKey) {
      throw new Error('YouTube API key required');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/videos?id=${videoId}&part=snippet,contentDetails&key=${this.apiKey}`,
        {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(5000), // 5 second timeout
        },
      );

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('YouTube API quota exceeded');
        }
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        return null;
      }

      const video = data.items[0];
      const duration = this.parseDuration(video.contentDetails.duration);

      // Get available caption languages
      const availableLanguages = await this.getCaptionLanguages(videoId);

      return {
        id: videoId,
        title: video.snippet.title,
        duration,
        availableLanguages,
      };
    } catch (error) {
      console.error('Error fetching video info:', error);
      throw error;
    }
  }

  /**
   * Get available caption languages
   */
  private async getCaptionLanguages(videoId: string): Promise<string[]> {
    if (!this.apiKey) {
      return [];
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/captions?videoId=${videoId}&part=snippet&key=${this.apiKey}`,
        {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(5000),
        },
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();

      if (!data.items) {
        return [];
      }

      return data.items.map((caption: any) => caption.snippet.language);
    } catch {
      return [];
    }
  }

  /**
   * Get subtitles for a video
   */
  private async getSubtitles(
    videoId: string,
    options: YouTubeExtractorOptions,
  ): Promise<YouTubeSubtitleData | null> {
    const { language = 'en', includeTimestamps = false } = options;

    try {
      // Get caption tracks
      const captionTracks = await this.getCaptionTracks(videoId);
      if (captionTracks.length === 0) {
        return null;
      }

      // Find preferred language or fallback
      let selectedTrack = captionTracks.find(
        (track) => track.language === language,
      );
      if (!selectedTrack) {
        // Fallback to first available track
        selectedTrack = captionTracks[0];
      }

      // Download subtitle content
      const subtitleContent = await this.downloadSubtitles(selectedTrack.url);
      if (!subtitleContent) {
        return null;
      }

      // Parse and format subtitles
      const formattedContent = this.formatSubtitles(
        subtitleContent,
        includeTimestamps,
      );

      return {
        language: selectedTrack.language,
        content: formattedContent,
        hasTimestamps: includeTimestamps,
      };
    } catch (error) {
      console.error('Error getting subtitles:', error);
      return null;
    }
  }

  /**
   * Get caption tracks for a video
   */
  private async getCaptionTracks(videoId: string): Promise<SubtitleTrack[]> {
    if (!this.apiKey) {
      return [];
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/captions?videoId=${videoId}&part=snippet&key=${this.apiKey}`,
        {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(5000),
        },
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();

      if (!data.items) {
        return [];
      }

      return data.items.map((caption: any) => ({
        language: caption.snippet.language,
        languageName: caption.snippet.name,
        isAutoGenerated: caption.snippet.trackKind === 'ASR',
        url: `${this.baseUrl}/captions/${caption.id}?key=${this.apiKey}`,
        format: 'srt' as const,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Download subtitle content
   */
  private async downloadSubtitles(url: string): Promise<string | null> {
    try {
      const response = await fetch(url, {
        headers: { Accept: 'text/plain' },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        return null;
      }

      return await response.text();
    } catch {
      return null;
    }
  }

  /**
   * Format subtitle content
   */
  private formatSubtitles(content: string, includeTimestamps: boolean): string {
    if (!content) return '';

    // Parse SRT format
    const subtitleBlocks = content.split(/\n\s*\n/);
    const formattedLines: string[] = [];

    for (const block of subtitleBlocks) {
      const lines = block.trim().split('\n');
      if (lines.length < 3) continue;

      const timestamp = lines[1];
      const text = lines.slice(2).join(' ').trim();

      if (text) {
        if (includeTimestamps) {
          const simpleTimestamp = this.extractSimpleTimestamp(timestamp);
          formattedLines.push(`[${simpleTimestamp}] ${text}`);
        } else {
          formattedLines.push(text);
        }
      }
    }

    return formattedLines.join('\n');
  }

  /**
   * Extract simple timestamp from SRT timestamp
   */
  private extractSimpleTimestamp(timestamp: string): string {
    // Convert "00:01:23,456 --> 00:01:26,789" to "01:23"
    const match = timestamp.match(/(\d{2}):(\d{2}):(\d{2})/);
    if (match) {
      const [, hours, minutes, seconds] = match;
      if (hours === '00') {
        return `${minutes}:${seconds}`;
      }
      return `${hours}:${minutes}:${seconds}`;
    }
    return '00:00';
  }

  /**
   * Parse YouTube duration format (PT4M13S)
   */
  private parseDuration(duration: string): number {
    if (!duration) return 0;

    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);

    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * Create error result
   */
  private createErrorResult(
    code: ExtractionError['code'],
    message: string,
    startTime: number,
    retryable: boolean = false,
    details?: string,
  ): ExtractionResult {
    return {
      success: false,
      error: {
        code,
        message,
        details,
        retryable,
      },
      processingTime: Date.now() - startTime,
      timestamp: new Date(),
    };
  }
}

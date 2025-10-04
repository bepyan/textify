// ============================================================================
// /api/player
// ============================================================================

export interface YoutubeInfo {
  responseContext: object;
  playabilityStatus: object;
  streamingData: object;
  playbackTracking: object;
  captions: YoutubeCaptions;
  videoDetails: YoutubeVideoDetails;
  playerConfig: object;
  storyboards: object;
  trackingParams: string;
  attestation: object;
  endscreen: object;
  overlay: object;
  playerSettingsMenuData: object;
  playerOverlayLayerRenderers: object[];
  adBreakHeartbeatParams: string;
  frameworkUpdates: object;
}

export interface YoutubeCaptions {
  playerCaptionsTracklistRenderer: {
    captionTracks: YoutubeCaptionTrack[];
    audioTracks: unknown[];
    translationLanguages: unknown[];
    defaultAudioTrackIndex: number;
    defaultTranslationSourceTrackIndices: number[];
  };
}

export interface YoutubeCaptionTrack {
  baseUrl: string;
  name: {
    runs: [];
  };
  vssId: string;
  languageCode: string;
  kind?: string;
  isTranslatable: boolean;
  trackName: string;
}

export interface YoutubeVideoDetails {
  videoId: string;
  title: string;
  lengthSeconds: string;
  keywords: string[];
  channelId: string;
  isOwnerViewing: boolean;
  shortDescription: string;
  isCrawlable: boolean;
  thumbnail: { thumbnails: unknown[] };
  allowRatings: boolean;
  viewCount: string; // '488830'
  author: string;
  isPrivate: boolean;
  isUnpluggedCorpus: boolean;
  isLiveContent: boolean;
}

// ============================================================================
// /api/timedtext
// ============================================================================

export interface YoutubeCaptionData {
  wireMagic: 'pb3' | string;
  pens: Record<string, unknown>[];
  wsWinStyles: Record<string, unknown>[];
  wpWinPositions: Record<string, unknown>[];
  events: YoutubeCaptionEvent[];
}

export interface YoutubeCaptionEvent {
  tStartMs: number;
  dDurationMs: number;
  segs: {
    utf8: string;
  }[];
}

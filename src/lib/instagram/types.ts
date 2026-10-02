export type InstagramMediaType = "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";

export interface InstagramMediaItem {
  id: string;
  caption?: string;
  media_type: InstagramMediaType;
  media_url: string;
  permalink: string;
  thumbnail_url?: string;
  timestamp: string;
  username?: string;
  is_reel?: boolean;
  reel_duration?: string;
  is_pinned?: boolean;
  is_hidden?: boolean;
}

export interface InstagramFeedResponse {
  data: InstagramMediaItem[];
  isFallback: boolean;
  lastSynced: string;
  error?: string;
}

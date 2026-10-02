export type InstagramMediaType = "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";

export type InstagramConnectionStatus =
  | "CONNECTED"
  | "NOT_CONNECTED"
  | "EXPIRED"
  | "ERROR";

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
  is_pinned?: boolean;
  is_hidden?: boolean;
}

export interface InstagramFeedResponse {
  data: InstagramMediaItem[];
  isFallback: boolean;
  connectionStatus: InstagramConnectionStatus;
  connectedAccount?: {
    username: string;
    instagramUserId: string;
    connectedAt: string;
    expiresAt?: string;
  };
  lastSynced: string;
  error?: string;
}

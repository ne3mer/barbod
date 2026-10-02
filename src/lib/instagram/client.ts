import "server-only";
import type { InstagramFeedResponse, InstagramMediaItem } from "./types";

// Curated high-res editorial Barbod Atelier fallback items
const FALLBACK_ATELIER_POSTS: InstagramMediaItem[] = [
  {
    id: "atelier-post-1",
    caption: "Precision skin fade & classic beard sculpture at Barbod Barber Atelier, Budapest. #barbodbarberhu #budapestbarber #precisioncut",
    media_type: "IMAGE",
    media_url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1200&auto=format&fit=crop",
    permalink: "https://www.instagram.com/barbod.barber.hu",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    username: "barbod.barber.hu",
    is_pinned: true,
  },
  {
    id: "atelier-post-2",
    caption: "The art of hot towel beard treatment. Pure luxury grooming in the heart of Budapest.",
    media_type: "VIDEO",
    media_url: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=900&auto=format&fit=crop",
    thumbnail_url: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=900&auto=format&fit=crop",
    permalink: "https://www.instagram.com/barbod.barber.hu",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    username: "barbod.barber.hu",
    is_reel: true,
    reel_duration: "00:24",
  },
  {
    id: "atelier-post-3",
    caption: "Tailored scissor work for modern elegance. Details matter.",
    media_type: "IMAGE",
    media_url: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=900&auto=format&fit=crop",
    permalink: "https://www.instagram.com/barbod.barber.hu",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    username: "barbod.barber.hu",
  },
  {
    id: "atelier-post-4",
    caption: "Behind the scenes at the atelier. Precision tools for precision craftsmanship.",
    media_type: "CAROUSEL_ALBUM",
    media_url: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=900&auto=format&fit=crop",
    permalink: "https://www.instagram.com/barbod.barber.hu",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    username: "barbod.barber.hu",
  },
  {
    id: "atelier-post-5",
    caption: "Classic taper fade styled with matte finish pomade. Barbod Signature Cut.",
    media_type: "IMAGE",
    media_url: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=900&auto=format&fit=crop",
    permalink: "https://www.instagram.com/barbod.barber.hu",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    username: "barbod.barber.hu",
  },
  {
    id: "atelier-post-6",
    caption: "Atmosphere & architectural details of our Budapest grooming studio.",
    media_type: "IMAGE",
    media_url: "https://images.unsplash.com/photo-1512690459411-b9245aed614b?q=80&w=900&auto=format&fit=crop",
    permalink: "https://www.instagram.com/barbod.barber.hu",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    username: "barbod.barber.hu",
  },
];

// In-Memory cache store
let cachedResponse: InstagramFeedResponse | null = null;
let cacheExpiryTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour server cache

export async function fetchInstagramFeed(forceRefresh = false): Promise<InstagramFeedResponse> {
  const now = Date.now();

  if (!forceRefresh && cachedResponse && now < cacheExpiryTime) {
    return cachedResponse;
  }

  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID;

  if (!token) {
    const fallbackRes: InstagramFeedResponse = {
      data: FALLBACK_ATELIER_POSTS,
      isFallback: true,
      lastSynced: new Date().toISOString(),
      error: "INSTAGRAM_ACCESS_TOKEN env variable is not configured.",
    };
    cachedResponse = fallbackRes;
    cacheExpiryTime = now + CACHE_TTL_MS;
    return fallbackRes;
  }

  try {
    // Official Meta Graph API / Basic Display Endpoint
    const endpoint = accountId
      ? `https://graph.facebook.com/v19.0/${accountId}/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username&limit=12&access_token=${encodeURIComponent(token)}`
      : `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username&limit=12&access_token=${encodeURIComponent(token)}`;

    const res = await fetch(endpoint, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      console.warn("[Instagram API Warning]:", res.status, errJson);
      throw new Error(errJson?.error?.message || `Instagram API HTTP ${res.status}`);
    }

    const json = await res.json();
    const rawItems: Record<string, unknown>[] = Array.isArray(json?.data) ? json.data : [];

    if (rawItems.length === 0) {
      throw new Error("Instagram API returned empty media list.");
    }

    const formattedData: InstagramMediaItem[] = rawItems.map((item) => {
      const captionStr = typeof item.caption === "string" ? item.caption : "";
      const mediaType = typeof item.media_type === "string" ? (item.media_type as "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM") : "IMAGE";
      const mediaUrl = typeof item.media_url === "string" ? item.media_url : "";
      const thumbnailUrl = typeof item.thumbnail_url === "string" ? item.thumbnail_url : undefined;
      const permalink = typeof item.permalink === "string" ? item.permalink : "https://www.instagram.com/barbod.barber.hu";
      const timestamp = typeof item.timestamp === "string" ? item.timestamp : new Date().toISOString();
      const username = typeof item.username === "string" ? item.username : "barbod.barber.hu";

      const isVideo = mediaType === "VIDEO";
      const isReel = isVideo && (captionStr.toLowerCase().includes("reel") || captionStr.toLowerCase().includes("#reel"));

      return {
        id: String(item.id ?? Math.random()),
        caption: captionStr || "Barbod Barber Atelier",
        media_type: mediaType,
        media_url: isVideo ? thumbnailUrl || mediaUrl : mediaUrl,
        thumbnail_url: thumbnailUrl,
        permalink,
        timestamp,
        username,
        is_reel: isReel,
        reel_duration: isReel ? "00:15" : undefined,
      };
    });

    const successRes: InstagramFeedResponse = {
      data: formattedData,
      isFallback: false,
      lastSynced: new Date().toISOString(),
    };

    cachedResponse = successRes;
    cacheExpiryTime = now + CACHE_TTL_MS;
    return successRes;

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Instagram API unavailable.";
    console.error("[Instagram Feed Fetch Error]:", errorMsg);

    // Serve stale cache if available, otherwise fallback posts
    if (cachedResponse && cachedResponse.data.length > 0) {
      return {
        ...cachedResponse,
        error: errorMsg || "Using cached feed due to temporary API issue.",
      };
    }

    const fallbackRes: InstagramFeedResponse = {
      data: FALLBACK_ATELIER_POSTS,
      isFallback: true,
      lastSynced: new Date().toISOString(),
      error: errorMsg,
    };

    cachedResponse = fallbackRes;
    cacheExpiryTime = now + CACHE_TTL_MS;
    return fallbackRes;
  }
}

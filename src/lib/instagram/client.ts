import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptToken } from "./crypto";
import type { InstagramFeedResponse, InstagramMediaItem, InstagramConnectionStatus } from "./types";

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

interface DatabaseConnectionRecord {
  accessToken: string;
  username: string;
  instagramUserId: string;
  connectedAt: string;
  expiresAt?: string;
  isExpired: boolean;
}

function parseRecord(record: {
  encrypted_access_token: string;
  username?: string | null;
  instagram_user_id?: string | null;
  connected_at?: string | null;
  token_expires_at?: string | null;
}): DatabaseConnectionRecord | null {
  try {
    const rawToken = decryptToken(record.encrypted_access_token);
    const expiresAt = record.token_expires_at ? new Date(record.token_expires_at) : null;
    const isExpired = Boolean(expiresAt && expiresAt.getTime() < Date.now());

    return {
      accessToken: rawToken,
      username: record.username || "barbod.barber.hu",
      instagramUserId: record.instagram_user_id || "",
      connectedAt: record.connected_at || new Date().toISOString(),
      expiresAt: record.token_expires_at || undefined,
      isExpired,
    };
  } catch (err: unknown) {
    console.warn("[Instagram Token Decryption Error]:", err instanceof Error ? err.message : String(err));
    return null;
  }
}

/**
 * Resolve Instagram connection record from database via Supabase.
 */
export async function getDatabaseInstagramConnection(businessId?: string): Promise<DatabaseConnectionRecord | null> {
  try {
    const supabase = await createClient();
    let query = supabase.from("instagram_connections").select("*");

    if (businessId) {
      query = query.eq("business_id", businessId);
    }

    const { data: record, error } = await query.order("updated_at", { ascending: false }).limit(1).maybeSingle();

    if (!error && record && record.encrypted_access_token) {
      return parseRecord(record);
    }

    // Fallback to service role admin client if called from unauthenticated public page or background worker
    const adminClient = createAdminClient();
    if (!adminClient) return null;

    let adminQuery = adminClient.from("instagram_connections").select("*");
    if (businessId) {
      adminQuery = adminQuery.eq("business_id", businessId);
    }

    const { data: adminRecord, error: adminErr } = await adminQuery.order("updated_at", { ascending: false }).limit(1).maybeSingle();

    if (!adminErr && adminRecord && adminRecord.encrypted_access_token) {
      return parseRecord(adminRecord);
    }

    return null;
  } catch (err: unknown) {
    console.warn("[Instagram Connection DB Lookup Warning]:", err instanceof Error ? err.message : String(err));
    return null;
  }
}

/**
 * Main function to fetch Instagram Feed (cached 1hr).
 */
export async function fetchInstagramFeed(forceRefresh = false, businessId?: string): Promise<InstagramFeedResponse> {
  const now = Date.now();

  if (!forceRefresh && cachedResponse && now < cacheExpiryTime) {
    return cachedResponse;
  }

  // 1. Try to load database connection record first
  const dbConnection = await getDatabaseInstagramConnection(businessId);

  // If connection exists but token is expired
  if (dbConnection && dbConnection.isExpired) {
    const expiredRes: InstagramFeedResponse = {
      data: FALLBACK_ATELIER_POSTS,
      isFallback: true,
      connectionStatus: "EXPIRED",
      connectedAccount: {
        username: dbConnection.username,
        instagramUserId: dbConnection.instagramUserId,
        connectedAt: dbConnection.connectedAt,
        expiresAt: dbConnection.expiresAt,
      },
      lastSynced: new Date().toISOString(),
      error: "Instagram OAuth access token has expired. Re-authorization required.",
    };
    cachedResponse = expiredRes;
    cacheExpiryTime = now + CACHE_TTL_MS;
    return expiredRes;
  }

  // Determine active token (database connection token preferred, environment token fallback if set)
  const token = dbConnection?.accessToken || process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!token) {
    const notConnectedRes: InstagramFeedResponse = {
      data: FALLBACK_ATELIER_POSTS,
      isFallback: true,
      connectionStatus: "NOT_CONNECTED",
      lastSynced: new Date().toISOString(),
    };
    cachedResponse = notConnectedRes;
    cacheExpiryTime = now + CACHE_TTL_MS;
    return notConnectedRes;
  }

  try {
    // Official Instagram Platform API / v22.0 media endpoint
    const endpoint = `https://graph.instagram.com/v22.0/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username&limit=12&access_token=${encodeURIComponent(token)}`;

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
      const username = typeof item.username === "string" ? item.username : dbConnection?.username || "barbod.barber.hu";

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
      };
    });

    const successRes: InstagramFeedResponse = {
      data: formattedData,
      isFallback: false,
      connectionStatus: "CONNECTED",
      connectedAccount: dbConnection
        ? {
            username: dbConnection.username,
            instagramUserId: dbConnection.instagramUserId,
            connectedAt: dbConnection.connectedAt,
            expiresAt: dbConnection.expiresAt,
          }
        : {
            username: formattedData[0]?.username || "barbod.barber.hu",
            instagramUserId: "env_configured",
            connectedAt: new Date().toISOString(),
          },
      lastSynced: new Date().toISOString(),
    };

    cachedResponse = successRes;
    cacheExpiryTime = now + CACHE_TTL_MS;
    return successRes;

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Instagram API unavailable.";
    console.error("[Instagram Feed Fetch Error]:", errorMsg);

    const isExpired = errorMsg.toLowerCase().includes("expired") || errorMsg.toLowerCase().includes("invalid OAuth");
    const connectionStatus: InstagramConnectionStatus = isExpired ? "EXPIRED" : dbConnection ? "ERROR" : "NOT_CONNECTED";

    const fallbackRes: InstagramFeedResponse = {
      data: FALLBACK_ATELIER_POSTS,
      isFallback: true,
      connectionStatus,
      connectedAccount: dbConnection
        ? {
            username: dbConnection.username,
            instagramUserId: dbConnection.instagramUserId,
            connectedAt: dbConnection.connectedAt,
            expiresAt: dbConnection.expiresAt,
          }
        : undefined,
      lastSynced: new Date().toISOString(),
      error: errorMsg,
    };

    cachedResponse = fallbackRes;
    cacheExpiryTime = now + CACHE_TTL_MS;
    return fallbackRes;
  }
}

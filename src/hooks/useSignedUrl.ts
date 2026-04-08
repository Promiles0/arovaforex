import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const SIGNED_URL_EXPIRY = 3600; // 1 hour

/**
 * Extracts the storage path from a Supabase public URL or returns the path as-is.
 * Handles both full public URLs and plain storage paths.
 */
function extractStoragePath(imageUrl: string): string {
  // If it's already a plain path (no http), return as-is
  if (!imageUrl.startsWith("http")) return imageUrl;

  // Extract path from Supabase public URL pattern:
  // https://<ref>.supabase.co/storage/v1/object/public/forecasts/<path>
  const marker = "/storage/v1/object/public/forecasts/";
  const idx = imageUrl.indexOf(marker);
  if (idx !== -1) {
    return decodeURIComponent(imageUrl.substring(idx + marker.length));
  }

  // Fallback: return original URL (external URLs stay as-is)
  return imageUrl;
}

/**
 * Returns true if the URL is a Supabase forecasts storage URL (needs signing).
 */
function isForecastStorageUrl(url: string): boolean {
  if (!url.startsWith("http")) return true; // plain path
  return url.includes("/storage/v1/object/public/forecasts/");
}

/**
 * Hook to get a signed URL for a forecast image.
 * If the URL is external (not from forecasts bucket), returns it unchanged.
 */
export function useSignedUrl(imageUrl: string | null | undefined): string {
  const [signedUrl, setSignedUrl] = useState<string>("");

  useEffect(() => {
    if (!imageUrl) {
      setSignedUrl("");
      return;
    }

    // If it's not a forecasts storage URL, use directly
    if (!isForecastStorageUrl(imageUrl)) {
      setSignedUrl(imageUrl);
      return;
    }

    const path = extractStoragePath(imageUrl);

    const getSignedUrl = async () => {
      const { data, error } = await supabase.storage
        .from("forecasts")
        .createSignedUrl(path, SIGNED_URL_EXPIRY);

      if (error || !data?.signedUrl) {
        console.error("Failed to get signed URL:", error);
        setSignedUrl(""); // Will show no image
        return;
      }

      setSignedUrl(data.signedUrl);
    };

    getSignedUrl();
  }, [imageUrl]);

  return signedUrl;
}

/**
 * Hook to get signed URLs for multiple forecast images at once.
 */
export function useSignedUrls(imageUrls: string[]): Map<string, string> {
  const [urlMap, setUrlMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!imageUrls.length) return;

    const forecastPaths: { original: string; path: string }[] = [];
    const directUrls = new Map<string, string>();

    for (const url of imageUrls) {
      if (!isForecastStorageUrl(url)) {
        directUrls.set(url, url);
      } else {
        forecastPaths.push({ original: url, path: extractStoragePath(url) });
      }
    }

    if (!forecastPaths.length) {
      setUrlMap(directUrls);
      return;
    }

    const getSignedUrls = async () => {
      const { data, error } = await supabase.storage
        .from("forecasts")
        .createSignedUrls(
          forecastPaths.map((p) => p.path),
          SIGNED_URL_EXPIRY
        );

      const result = new Map(directUrls);

      if (!error && data) {
        data.forEach((item, index) => {
          if (item.signedUrl) {
            result.set(forecastPaths[index].original, item.signedUrl);
          }
        });
      }

      setUrlMap(result);
    };

    getSignedUrls();
  }, [JSON.stringify(imageUrls)]);

  return urlMap;
}

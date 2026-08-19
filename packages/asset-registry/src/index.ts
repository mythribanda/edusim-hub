/**
 * @edusim/asset-registry
 *
 * Typed client for the EduSim asset library.
 *
 * Usage:
 *   import { searchAssets } from '@edusim/asset-registry';
 *   const results = await searchAssets({ tags: ['physics', 'round'], tier: 'middle' });
 */

import type { Asset, AgeTier } from "@edusim/shared-types";

export type { Asset, AgeTier };

// ---------------------------------------------------------------------------
// Query shape
// ---------------------------------------------------------------------------

export interface SearchAssetsParams {
  /** Filter by one or more tags (OR semantics — any matching tag qualifies). */
  tags?: string[];
  /** Only return assets whose tier_allowed includes this tier. */
  tier?: AgeTier | string;
  /** Case-insensitive substring match against asset name and slug. */
  search?: string;
  /** Maximum number of results (server cap: 500, default: 200). */
  limit?: number;
  /** Pagination offset (default: 0). */
  offset?: number;
}

// ---------------------------------------------------------------------------
// Wire response shape (mirrors AssetOut on the FastAPI side)
// ---------------------------------------------------------------------------

interface AssetsApiResponse {
  success: boolean;
  total: number;
  assets: Asset[];
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Base URL of the EduSim API service.
 *
 * Resolution order (first truthy value wins):
 *  1. `window.__EDUSIM_API_URL__` — runtime override set by the host app
 *  2. `import.meta.env.VITE_API_URL` — Vite-injected at build time
 *  3. `process.env.NEXT_PUBLIC_API_URL` — Next.js injected at build time
 *  4. Hard-coded development fallback: http://localhost:8001
 */
function getApiBase(): string {
  // 1. Runtime override (set in index.html or app entry before any fetch)
  if (typeof window !== "undefined" && (window as any).__EDUSIM_API_URL__) {
    return String((window as any).__EDUSIM_API_URL__).replace(/\/$/, "");
  }
  // 2. Vite public env — injected at bundle time for all VITE_ prefixed vars
  try {
    // @ts-ignore — import.meta.env is injected by Vite; TS may not know the key
    const viteUrl = import.meta.env.VITE_API_URL;
    if (viteUrl) return String(viteUrl).replace(/\/$/, "");
  } catch {
    // not a Vite environment
  }
  // 3. Next.js public env
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }
  // 4. Dev fallback
  return "http://localhost:8001";
}


// ---------------------------------------------------------------------------
// Main client function
// ---------------------------------------------------------------------------

/**
 * Search assets from the EduSim asset registry.
 *
 * @param params  - Filter / pagination options (all optional).
 * @param authToken - Optional Bearer token. When provided, sent in the
 *                    Authorization header (required once you add RLS to assets).
 * @returns       A promise resolving to an array of typed Asset objects.
 *
 * @throws        Re-throws network errors. On a non-OK HTTP response, throws
 *                an Error with the HTTP status and body.
 */
export async function searchAssets(
  params: SearchAssetsParams = {},
  authToken?: string
): Promise<Asset[]> {
  const url = new URL(`${getApiBase()}/api/assets`);

  if (params.tags && params.tags.length > 0) {
    url.searchParams.set("tags", params.tags.join(","));
  }
  if (params.tier) {
    url.searchParams.set("tier", params.tier);
  }
  if (params.search) {
    url.searchParams.set("search", params.search);
  }
  if (params.limit !== undefined) {
    url.searchParams.set("limit", String(params.limit));
  }
  if (params.offset !== undefined) {
    url.searchParams.set("offset", String(params.offset));
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const res = await fetch(url.toString(), { headers });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `searchAssets: HTTP ${res.status} ${res.statusText} — ${body}`
    );
  }

  const data = (await res.json()) as AssetsApiResponse;
  return data.assets ?? [];
}

// ---------------------------------------------------------------------------
// Convenience helpers
// ---------------------------------------------------------------------------

/**
 * Fetch a single page of assets with all query params supported.
 * Returns the full envelope (total count + assets array) for use in
 * paginated UIs.
 */
export async function searchAssetsWithMeta(
  params: SearchAssetsParams = {},
  authToken?: string
): Promise<{ total: number; assets: Asset[] }> {
  const url = new URL(`${getApiBase()}/api/assets`);

  if (params.tags && params.tags.length > 0) {
    url.searchParams.set("tags", params.tags.join(","));
  }
  if (params.tier) url.searchParams.set("tier", params.tier);
  if (params.search) url.searchParams.set("search", params.search);
  if (params.limit !== undefined)
    url.searchParams.set("limit", String(params.limit));
  if (params.offset !== undefined)
    url.searchParams.set("offset", String(params.offset));

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

  const res = await fetch(url.toString(), { headers });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `searchAssetsWithMeta: HTTP ${res.status} ${res.statusText} — ${body}`
    );
  }

  const data = (await res.json()) as AssetsApiResponse;
  return { total: data.total ?? 0, assets: data.assets ?? [] };
}

// Re-export the version constant
export const ASSET_REGISTRY_VERSION = "0.2.0";

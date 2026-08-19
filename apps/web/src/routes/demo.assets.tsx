import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useMemo } from "react";
import { AssetPicker, sanitizeSvg, svgToDataUri } from "@edusim/ui";
import type { Asset } from "@edusim/shared-types";
import { searchAssetsWithMeta } from "@edusim/asset-registry";



// ---------------------------------------------------------------------------
// Route definition
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/demo/assets")({
  component: AssetDemoPage,
});

// ---------------------------------------------------------------------------
// Demo page
// ---------------------------------------------------------------------------

function AssetDemoPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [serverSearch, setServerSearch] = useState("");
  const [serverTier, setServerTier] = useState<string>("");
  const [serverTags, setServerTags] = useState<string>("");

  const fetchAssets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Parameters<typeof searchAssetsWithMeta>[0] = { limit: 200 };
      if (serverSearch.trim()) params.search = serverSearch.trim();
      if (serverTier) params.tier = serverTier;
      if (serverTags.trim()) params.tags = serverTags.split(",").map((t) => t.trim()).filter(Boolean);

      const result = await searchAssetsWithMeta(params);
      setAssets(result.assets);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load assets");
    } finally {
      setIsLoading(false);
    }
  }, [serverSearch, serverTier, serverTags]);

  // Load on mount + whenever server-side params change
  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  return (
    <div style={pageStyles.root}>
      {/* ── Hero header ── */}
      <div style={pageStyles.hero}>
        <span style={pageStyles.badge}>🧪 Demo</span>
        <h1 style={pageStyles.heading}>Asset Picker</h1>
        <p style={pageStyles.sub}>
          Browsable, searchable simulation asset library. Click any tile to select it.
        </p>
        <div style={pageStyles.statsRow}>
          <span style={pageStyles.stat}>{isLoading ? "…" : total} assets in registry</span>
          {selectedAsset && (
            <span style={{ ...pageStyles.stat, background: "#6C63FF", color: "white" }}>
              ✓ Selected: {selectedAsset.name}
            </span>
          )}
        </div>
      </div>

      {/* ── Server-side filter bar ── */}
      <details style={pageStyles.filterPanel}>
        <summary style={pageStyles.filterSummary}>⚙️ Server-side filters (hit Apply to re-fetch)</summary>
        <div style={pageStyles.filterBody}>
          <label style={pageStyles.label}>
            Search (server)
            <input
              style={pageStyles.filterInput}
              placeholder="e.g. ball"
              value={serverSearch}
              onChange={(e) => setServerSearch(e.target.value)}
            />
          </label>
          <label style={pageStyles.label}>
            Age tier
            <select
              style={pageStyles.filterInput}
              value={serverTier}
              onChange={(e) => setServerTier(e.target.value)}
            >
              <option value="">All tiers</option>
              <option value="primary">Primary</option>
              <option value="middle">Middle</option>
              <option value="high_school">High school</option>
              <option value="university">University</option>
            </select>
          </label>
          <label style={pageStyles.label}>
            Tags (comma-separated)
            <input
              style={pageStyles.filterInput}
              placeholder="e.g. physics,round"
              value={serverTags}
              onChange={(e) => setServerTags(e.target.value)}
            />
          </label>
          <button style={pageStyles.applyBtn} onClick={fetchAssets}>
            Apply filters
          </button>
        </div>
      </details>

      {/* ── Error state ── */}
      {error && (
        <div style={pageStyles.errorBox}>
          <strong>⚠️ Could not reach the API:</strong> {error}
          <br />
          <small>Make sure the dev server is running on port 8001.</small>
        </div>
      )}

      {/* ── Main picker ── */}
      <div style={pageStyles.pickerWrap}>
        <AssetPicker
          assets={assets}
          isLoading={isLoading}
          selectedId={selectedAsset?.id ?? null}
          onSelect={(asset) => {
            const next = selectedAsset?.id === asset.id ? null : asset;
            setSelectedAsset(next);
            if (next) {
              // Verifiable in browser DevTools console
              console.log("%c[AssetPicker] Selected asset:", "color:#6C63FF;font-weight:bold", next);
            }
          }}
          title={undefined}
          searchPlaceholder="Search by name or slug…"
        />
      </div>

      {/* ── Selected asset preview panel ── */}
      {selectedAsset && (
        <div style={pageStyles.preview}>
          <div style={pageStyles.previewHeader}>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>
              {selectedAsset.name}
            </h2>
            <button
              style={pageStyles.closeBtn}
              onClick={() => setSelectedAsset(null)}
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>

          <div style={pageStyles.previewBody}>
            {/* SVG preview — sanitized before render */}
            <div style={pageStyles.previewSvgBox}>
              {selectedAsset.svg_content ? (
                <img
                  src={svgToDataUri(sanitizeSvg(selectedAsset.svg_content))}
                  alt={selectedAsset.name}
                  style={{ width: "120px", height: "120px", objectFit: "contain" }}
                />
              ) : (
                <span style={{ fontSize: "60px" }}>🖼</span>
              )}
            </div>

            {/* Meta */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={pageStyles.metaRow}>
                <span style={pageStyles.metaLabel}>Slug</span>
                <code style={pageStyles.metaValue}>{selectedAsset.slug}</code>
              </div>
              <div style={pageStyles.metaRow}>
                <span style={pageStyles.metaLabel}>Tags</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {selectedAsset.tags.map((t) => (
                    <span key={t} style={pageStyles.tagPill}>{t}</span>
                  ))}
                </div>
              </div>
              <div style={pageStyles.metaRow}>
                <span style={pageStyles.metaLabel}>Tiers</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {selectedAsset.tier_allowed.map((t) => (
                    <span key={t} style={{ ...pageStyles.tagPill, background: "#E8FFF0", color: "#1A7A40" }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div style={pageStyles.metaRow}>
                <span style={pageStyles.metaLabel}>ID</span>
                <code style={{ ...pageStyles.metaValue, fontSize: "11px", color: "#aaa" }}>
                  {selectedAsset.id}
                </code>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const pageStyles = {
  root: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #F8F7FF 0%, #EDF2FF 100%)",
    padding: "32px 24px 64px",
    fontFamily: "'Nunito', 'Poppins', system-ui, sans-serif",
    boxSizing: "border-box" as const,
  },
  hero: {
    textAlign: "center" as const,
    marginBottom: "32px",
  },
  badge: {
    display: "inline-block",
    background: "#6C63FF22",
    color: "#6C63FF",
    borderRadius: "999px",
    padding: "4px 14px",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    marginBottom: "12px",
    textTransform: "uppercase" as const,
  },
  heading: {
    margin: "0 0 10px",
    fontSize: "clamp(28px, 5vw, 44px)",
    fontWeight: 900,
    color: "#1A1A2E",
    letterSpacing: "-0.02em",
  },
  sub: {
    margin: "0 auto 16px",
    maxWidth: "480px",
    color: "#666",
    fontSize: "16px",
    lineHeight: 1.6,
  },
  statsRow: {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
    flexWrap: "wrap" as const,
  },
  stat: {
    background: "#fff",
    border: "1px solid #E8E8F0",
    borderRadius: "999px",
    padding: "5px 14px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#444",
  },
  filterPanel: {
    background: "#fff",
    borderRadius: "16px",
    border: "1px solid #E8E8F0",
    padding: "12px 20px",
    marginBottom: "24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  filterSummary: {
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "14px",
    color: "#555",
    userSelect: "none" as const,
  },
  filterBody: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "16px",
    alignItems: "flex-end",
    paddingTop: "16px",
  },
  label: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
    fontSize: "12px",
    fontWeight: 700,
    color: "#666",
    minWidth: "160px",
  },
  filterInput: {
    padding: "9px 12px",
    borderRadius: "10px",
    border: "1.5px solid #DDD",
    fontSize: "14px",
    fontFamily: "inherit",
    outline: "none",
    background: "#FAFAFE",
  } as React.CSSProperties,
  applyBtn: {
    padding: "10px 22px",
    borderRadius: "12px",
    border: "none",
    background: "#6C63FF",
    color: "white",
    fontWeight: 700,
    fontSize: "14px",
    cursor: "pointer",
    fontFamily: "inherit",
    alignSelf: "flex-end",
    boxShadow: "0 3px 10px rgba(108,99,255,0.3)",
    transition: "transform 0.1s",
  } as React.CSSProperties,
  errorBox: {
    background: "#FFF5F5",
    border: "1.5px solid #FFBBBB",
    borderRadius: "14px",
    padding: "16px 20px",
    color: "#CC2222",
    marginBottom: "24px",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  pickerWrap: {
    background: "#fff",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
    border: "1px solid #EFEFFF",
  },
  preview: {
    marginTop: "28px",
    background: "#fff",
    borderRadius: "24px",
    border: "2px solid #6C63FF44",
    boxShadow: "0 8px 32px rgba(108,99,255,0.12)",
    overflow: "hidden",
  },
  previewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    borderBottom: "1px solid #F0EFFF",
    background: "#FAFAFE",
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
    color: "#999",
    padding: "4px 8px",
    borderRadius: "8px",
    lineHeight: 1,
  } as React.CSSProperties,
  previewBody: {
    display: "flex",
    gap: "24px",
    padding: "24px",
    flexWrap: "wrap" as const,
    alignItems: "flex-start",
  },
  previewSvgBox: {
    width: "140px",
    height: "140px",
    borderRadius: "20px",
    background: "#F6F6FB",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    border: "2px solid #EFEFFF",
  },
  metaRow: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
    marginBottom: "12px",
  },
  metaLabel: {
    minWidth: "52px",
    fontSize: "11px",
    fontWeight: 800,
    color: "#aaa",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    paddingTop: "2px",
  },
  metaValue: {
    fontSize: "13px",
    background: "#F6F6FB",
    padding: "2px 8px",
    borderRadius: "6px",
    color: "#333",
    wordBreak: "break-all" as const,
  },
  tagPill: {
    background: "#F0EFFF",
    color: "#6C63FF",
    borderRadius: "999px",
    padding: "3px 10px",
    fontSize: "12px",
    fontWeight: 600,
  } as React.CSSProperties,
};

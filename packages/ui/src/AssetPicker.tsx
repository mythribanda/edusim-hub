import * as React from 'react';
import type { Asset } from '@edusim/shared-types';
import { sanitizeSvg, svgToDataUri } from './svgSanitizer';

// ---------------------------------------------------------------------------
// Inline styles — zero external deps, works in any React app
// ---------------------------------------------------------------------------

const styles = {
  root: {
    fontFamily: "'Nunito', 'Poppins', system-ui, sans-serif",
    width: '100%',
  } as React.CSSProperties,

  header: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '12px',
    alignItems: 'center',
    marginBottom: '16px',
  } as React.CSSProperties,

  searchWrap: {
    position: 'relative' as const,
    flexGrow: 1,
    minWidth: '200px',
  } as React.CSSProperties,

  searchIcon: {
    position: 'absolute' as const,
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none' as const,
    color: '#999',
    fontSize: '16px',
  } as React.CSSProperties,

  searchInput: {
    width: '100%',
    boxSizing: 'border-box' as const,
    padding: '12px 16px 12px 42px',
    borderRadius: '16px',
    border: '2px solid #E8E8F0',
    fontSize: '16px',
    fontFamily: 'inherit',
    background: '#FAFAFE',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  } as React.CSSProperties,

  tagRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    marginBottom: '20px',
  } as React.CSSProperties,

  tagChip: (active: boolean): React.CSSProperties => ({
    padding: '6px 16px',
    borderRadius: '999px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    fontFamily: 'inherit',
    transition: 'all 0.15s',
    background: active ? '#6C63FF' : '#F0EFFF',
    color: active ? '#fff' : '#6C63FF',
    boxShadow: active ? '0 2px 8px rgba(108,99,255,0.35)' : 'none',
    transform: active ? 'scale(1.05)' : 'scale(1)',
  }),

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
    gap: '14px',
  } as React.CSSProperties,

  tile: (selected: boolean, hovered: boolean): React.CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '16px 8px 12px',
    borderRadius: '20px',
    border: selected
      ? '2.5px solid #6C63FF'
      : hovered
      ? '2.5px solid #B8B3FF'
      : '2.5px solid transparent',
    background: selected
      ? '#F0EFFF'
      : hovered
      ? '#FAF9FF'
      : '#FFFFFF',
    cursor: 'pointer',
    boxShadow: hovered || selected
      ? '0 6px 20px rgba(108,99,255,0.18)'
      : '0 2px 8px rgba(0,0,0,0.06)',
    transform: hovered ? 'translateY(-3px) scale(1.03)' : 'none',
    transition: 'all 0.18s cubic-bezier(0.34,1.56,0.64,1)',
    userSelect: 'none',
    minHeight: '130px',
  }),

  svgWrap: {
    width: '72px',
    height: '72px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '14px',
    background: '#F6F6FB',
    overflow: 'hidden',
    flexShrink: 0,
  } as React.CSSProperties,

  tileName: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#333',
    textAlign: 'center' as const,
    lineHeight: 1.3,
    maxWidth: '110px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,

  empty: {
    gridColumn: '1 / -1',
    textAlign: 'center' as const,
    padding: '48px 24px',
    color: '#999',
    fontSize: '15px',
  } as React.CSSProperties,

  skeleton: {
    borderRadius: '20px',
    background: 'linear-gradient(90deg, #f0f0f8 25%, #e8e8f5 50%, #f0f0f8 75%)',
    backgroundSize: '200% 100%',
    animation: 'assetPickerShimmer 1.4s infinite',
    minHeight: '130px',
  } as React.CSSProperties,

  badge: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#888',
    background: '#F0F0F8',
    borderRadius: '6px',
    padding: '2px 6px',
    marginTop: '2px',
  } as React.CSSProperties,

  selectedBadge: {
    position: 'absolute' as const,
    top: '8px',
    right: '8px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: '#6C63FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '11px',
    fontWeight: 700,
    boxShadow: '0 2px 6px rgba(108,99,255,0.4)',
  } as React.CSSProperties,
};

// ---------------------------------------------------------------------------
// Inject keyframe once
// ---------------------------------------------------------------------------

let shimmerInjected = false;
function injectShimmer() {
  if (shimmerInjected || typeof document === 'undefined') return;
  shimmerInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes assetPickerShimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    .asset-picker-search:focus {
      border-color: #6C63FF !important;
      box-shadow: 0 0 0 3px rgba(108,99,255,0.15) !important;
    }
  `;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
// AssetTile — individual grid cell
// ---------------------------------------------------------------------------

interface AssetTileProps {
  asset: Asset;
  selected: boolean;
  onSelect: (asset: Asset) => void;
}

function AssetTile({ asset, selected, onSelect }: AssetTileProps) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`Select ${asset.name}`}
      style={{ position: 'relative', ...styles.tile(selected, hovered) }}
      onClick={() => onSelect(asset)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(asset)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {selected && (
        <span style={styles.selectedBadge} aria-hidden>✓</span>
      )}
      <div style={styles.svgWrap}>
        {asset.svg_content ? (
          <img
            src={svgToDataUri(sanitizeSvg(asset.svg_content))}
            alt={asset.name}
            width={64}
            height={64}
            style={{ objectFit: 'contain' }}
          />
        ) : (
          <span style={{ fontSize: '32px' }}>🖼</span>
        )}
      </div>
      <span style={styles.tileName}>{asset.name}</span>
      {asset.tags.length > 0 && (
        <span style={styles.badge}>{asset.tags[0]}</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface AssetPickerProps {
  /** All assets to show (fetched by the parent). */
  assets: Asset[];
  /** Show skeleton tiles while loading. */
  isLoading?: boolean;
  /** Currently selected asset id (controlled). */
  selectedId?: string | null;
  /** Called when user clicks a tile. */
  onSelect: (asset: Asset) => void;
  /** All unique tag strings — shown as filter chips. If omitted, derived from assets. */
  availableTags?: string[];
  /** Placeholder text for the search input. */
  searchPlaceholder?: string;
  /** Optional heading shown above the picker. */
  title?: string;
}

export function AssetPicker({
  assets,
  isLoading = false,
  selectedId = null,
  onSelect,
  availableTags,
  searchPlaceholder = 'Search assets…',
  title,
}: AssetPickerProps) {
  React.useEffect(() => { injectShimmer(); }, []);

  const [search, setSearch] = React.useState('');
  const [activeTag, setActiveTag] = React.useState<string | null>(null);

  // Derive tag list from assets when not provided
  const tags = React.useMemo<string[]>(() => {
    if (availableTags) return availableTags;
    const set = new Set<string>();
    assets.forEach((a) => a.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [assets, availableTags]);

  // Client-side filter: search + active tag
  const filtered = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    return assets.filter((a) => {
      const matchSearch = !q || a.name.toLowerCase().includes(q) || a.slug.toLowerCase().includes(q);
      const matchTag = !activeTag || a.tags.includes(activeTag);
      return matchSearch && matchTag;
    });
  }, [assets, search, activeTag]);

  return (
    <div style={styles.root}>
      {title && (
        <h2 style={{ margin: '0 0 16px', fontSize: '22px', fontWeight: 800, color: '#1A1A2E' }}>
          {title}
        </h2>
      )}

      {/* Search bar */}
      <div style={styles.header}>
        <div style={styles.searchWrap}>
          <span style={styles.searchIcon} aria-hidden>🔍</span>
          <input
            id="asset-picker-search"
            className="asset-picker-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            style={styles.searchInput}
            aria-label="Search assets"
          />
        </div>
        {activeTag && (
          <button
            onClick={() => setActiveTag(null)}
            style={{ ...styles.tagChip(false), background: '#FFE9E9', color: '#CC3333' }}
            aria-label="Clear tag filter"
          >
            ✕ Clear filter
          </button>
        )}
      </div>

      {/* Tag chips */}
      {tags.length > 0 && (
        <div style={styles.tagRow} role="group" aria-label="Filter by tag">
          <button
            style={styles.tagChip(activeTag === null)}
            onClick={() => setActiveTag(null)}
            aria-pressed={activeTag === null}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              style={styles.tagChip(activeTag === tag)}
              onClick={() => setActiveTag(tag === activeTag ? null : tag)}
              aria-pressed={activeTag === tag}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div
        style={styles.grid}
        role="listbox"
        aria-label={title ?? 'Asset picker'}
        aria-multiselectable={false}
      >
        {isLoading
          ? Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={styles.skeleton} aria-hidden="true" />
            ))
          : filtered.length === 0
          ? <div style={styles.empty}>No assets match your search.</div>
          : filtered.map((asset) => (
              <AssetTile
                key={asset.id}
                asset={asset}
                selected={asset.id === selectedId}
                onSelect={onSelect}
              />
            ))
        }
      </div>
    </div>
  );
}

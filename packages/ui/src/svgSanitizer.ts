/**
 * Lightweight SVG sanitizer.
 *
 * Strategy:
 *  • Parse the SVG with DOMParser (browser-native, zero deps).
 *  • Walk every element and remove:
 *      - <script> nodes entirely
 *      - All event-handler attributes (on*)
 *      - `javascript:` hrefs / src values
 *      - <foreignObject> (can embed arbitrary HTML)
 *      - `use` elements pointing to external URLs (data exfil)
 *  • Serialise back to a string with XMLSerializer.
 *
 * Falls back to the raw string in non-browser environments (SSR),
 * where <img data:image/svg+xml> is the only rendering path anyway.
 *
 * This is intentionally simple — it is NOT a drop-in replacement for
 * DOMPurify. It covers the common attack surface for SVG assets stored
 * in our own database. If user-supplied SVGs are ever accepted, switch
 * to DOMPurify with { USE_PROFILES: { svg: true } }.
 */

const BLOCKED_ELEMENTS = new Set(["script", "foreignobject", "iframe", "object", "embed", "base"]);
const BLOCKED_ATTR_PATTERN = /^on/i;
const BLOCKED_URL_ATTRS = new Set(["href", "src", "xlink:href", "action", "formaction"]);
const JAVASCRIPT_URI = /^\s*javascript\s*:/i;

export function sanitizeSvg(raw: string): string {
  // SSR / non-browser: return as-is (rendered only via <img> data URI — safe)
  if (typeof window === "undefined" || !window.DOMParser) return raw;

  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(raw, "image/svg+xml");
  } catch {
    return ""; // unparseable — discard
  }

  // DOMParser sets a <parsererror> element on malformed input
  if (doc.querySelector("parsererror")) return "";

  const root = doc.documentElement;

  const walk = (node: Element) => {
    // Remove blocked elements (iterate a copy — live NodeList mutates)
    const children = Array.from(node.children);
    for (const child of children) {
      if (BLOCKED_ELEMENTS.has(child.tagName.toLowerCase())) {
        child.remove();
        continue;
      }
      walk(child);
    }

    // Scrub attributes on this node
    const attrs = Array.from(node.attributes);
    for (const attr of attrs) {
      // Drop all on* event handlers
      if (BLOCKED_ATTR_PATTERN.test(attr.name)) {
        node.removeAttribute(attr.name);
        continue;
      }
      // Drop javascript: URIs in URL-bearing attributes
      if (BLOCKED_URL_ATTRS.has(attr.name.toLowerCase()) && JAVASCRIPT_URI.test(attr.value)) {
        node.removeAttribute(attr.name);
        continue;
      }
    }

    // Special case: <use> — block external URL references
    if (node.tagName.toLowerCase() === "use") {
      const href = node.getAttribute("href") || node.getAttribute("xlink:href") || "";
      if (href.startsWith("http") || href.startsWith("//")) {
        node.remove();
      }
    }
  };

  walk(root);

  return new XMLSerializer().serializeToString(doc);
}

/**
 * Returns a `data:image/svg+xml` URI ready for use in <img src>.
 * Safe in all browsers — scripts inside SVGs loaded via <img> are never executed.
 */
export function svgToDataUri(svgContent: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
}

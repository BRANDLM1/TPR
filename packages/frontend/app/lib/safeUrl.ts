// Guards links that originate in the database (DynamicPoint.link,
// ImpactStat.link) before they reach an anchor's href.
//
// Content is authored in Prisma Studio, so this is not defense against an
// anonymous attacker — it's defense against a compromised or careless Studio
// account turning a "Learn more" link into script execution. `javascript:`
// and `data:` URLs run in the page's origin when clicked; MapCanvas builds
// its popup anchors with raw DOM calls, which have no built-in scheme
// filtering the way React's href handling does.
//
// Returns the URL when it is safe to link to, or null when the caller should
// render no link at all.

const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

export function safeUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Same-origin paths are fine and have no protocol to check. Reject
  // protocol-relative ("//evil.example") so it can't slip through as a path.
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;

  try {
    const parsed = new URL(trimmed);
    return SAFE_PROTOCOLS.has(parsed.protocol) ? parsed.toString() : null;
  } catch {
    // Not parseable as an absolute URL — don't guess at a scheme.
    return null;
  }
}

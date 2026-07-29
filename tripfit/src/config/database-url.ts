const POSTGRES_PROTOCOLS = new Set(["postgres:", "postgresql:"]);

/**
 * Returns a normalized PostgreSQL URL or null when the value is absent or
 * malformed. It deliberately does not log the supplied value because it can
 * contain database credentials.
 */
export function parseDatabaseUrl(value: string | undefined): string | null {
  if (!value?.trim()) {
    return null;
  }

  try {
    const url = new URL(value.trim());

    if (!POSTGRES_PROTOCOLS.has(url.protocol) || !url.hostname) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

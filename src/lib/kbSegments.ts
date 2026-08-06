export function parseKbSegments(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(',')
        .map((part) =>
          part
            .trim()
            .toLowerCase()
            .replace(/&/g, ' and ')
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .replace(/_+/g, '_')
            .slice(0, 64)
        )
        .filter(Boolean)
    )
  ).slice(0, 20)
}

export function formatKbSegments(segments?: string[]): string {
  return (segments ?? []).join(', ')
}

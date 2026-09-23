export function formatDateTime(iso: string, style: 'short' | 'medium' = 'medium'): string {
  try {
    return new Date(iso).toLocaleString('fr-FR', { dateStyle: style, timeStyle: 'short' });
  } catch {
    return iso;
  }
}

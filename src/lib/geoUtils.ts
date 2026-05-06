export const MEDIA_TYPE_COLORS: Record<string, string> = {
  audio: '#22c55e',
  video: '#3b82f6',
  text: '#7c3aed',
  image: '#f59e0b',
  document: '#ef4444',
};

export const MEDIA_TYPE_LABELS: Record<string, string> = {
  audio: 'Audio',
  video: 'Video',
  text: 'Text',
  image: 'Image',
  document: 'Document',
};

export function formatContributionDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

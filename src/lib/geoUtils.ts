export const MEDIA_TYPE_COLORS: Record<string, string> = {
  audio: '#1D9E75',
  video: '#378ADD',
  text: '#534AB7',
  image: '#BA7517',
  document: '#D85A30',
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

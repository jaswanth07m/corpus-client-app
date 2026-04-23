export interface ContributionLocation {
  latitude: number;
  longitude: number;
}

export type MediaType = 'audio' | 'video' | 'text' | 'image' | 'document';

export interface ContributionItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  location: ContributionLocation | null;
  media_type: string;
  language: string;
  reviewed: boolean;
  size?: number;
  duration?: number;
  release_rights?: string;
  creator?: string;
  file_hash?: string;
  snr_frequency?: number;
  category_ids?: string[];
}

export interface UserContributionsResponse {
  user_id: string;
  total_contributions: number;
  contributions_by_media_type: {
    text: number;
    audio: number;
    image: number;
    video: number;
    document: number;
  };
  audio_contributions: ContributionItem[];
  video_contributions: ContributionItem[];
  text_contributions: ContributionItem[];
  image_contributions: ContributionItem[];
  document_contributions: ContributionItem[];
  audio_duration?: number;
  video_duration?: number;
}

export interface FlatContribution extends Omit<ContributionItem, 'location'> {
  location: ContributionLocation;
}

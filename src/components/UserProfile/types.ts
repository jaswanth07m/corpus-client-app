export interface UserProfile {
  id: string;
  username: string;
  email: string;
  phone: string;
  name: string;
  gender?: string;
  dateOfBirth?: string;
  place?: string;
  isActive: boolean;
  hasGivenConsent: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface DailyStats {
  uploads_today: number;
  total_uploads: number;
  last_upload_date: string;
  streak_days: number;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ContributionItem {
  id: string;
  size: number;
  category_id: string;
  reviewed: boolean;
  title: string;
  duration?: number;
  timestamp?: string;
  location?: Coordinates;
}

export interface UserContributions {
  totalContributions: number;
  contributionsByType: {
    text: number;
    audio: number;
    image: number;
    video: number;
  };
  audioContributions: ContributionItem[];
  videoContributions: ContributionItem[];
  textContributions: ContributionItem[];
  imageContributions: ContributionItem[];
  audioDuration: number;
  videoDuration: number;
}

export type MediaType = 'text' | 'audio' | 'video' | 'image';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { axiosInstance } from '@/api/axiosInstance';
import type { UserContributionsResponse, FlatContribution } from '@/types/geo';

type MediaType = 'audio' | 'video' | 'text' | 'image' | 'document';

async function fetchContributions(
  userIdentifier: string,
): Promise<FlatContribution[]> {
  console.debug(
    '[useContributionGeo] fetching for identifier:',
    userIdentifier,
  );

  try {
    // BACKEND_URL is already 'https://api.corpus.swecha.org/api/v1'
    // so the path here must NOT repeat /api/v1
    const response = await axiosInstance.get<UserContributionsResponse>(
      `/users/${userIdentifier}/contributions`,
    );

    console.debug('[useContributionGeo] response:', response.data);

    const data = response.data;

    const entries: [keyof UserContributionsResponse, MediaType][] = [
      ['audio_contributions', 'audio'],
      ['video_contributions', 'video'],
      ['text_contributions', 'text'],
      ['image_contributions', 'image'],
      ['document_contributions', 'document'],
    ];

    const flattened: FlatContribution[] = [];
    for (const [key, mediaType] of entries) {
      const items = data[key];
      if (Array.isArray(items)) {
        for (const item of items) {
          flattened.push({ ...item, media_type: mediaType });
        }
      }
    }

    const geoTagged = flattened.filter(
      (item) =>
        item.location != null &&
        typeof item.location.latitude === 'number' &&
        typeof item.location.longitude === 'number',
    ) as FlatContribution[];

    console.debug(
      `[useContributionGeo] ${geoTagged.length} geotagged / ${flattened.length} total`,
    );

    return geoTagged;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail ?? err.message;
      console.error(
        `[useContributionGeo] HTTP ${status ?? 'network error'} — ${detail}`,
        err,
      );
      throw new Error(
        status === 401
          ? 'Unauthorized (401) — your session may have expired'
          : status === 404
            ? 'User not found (404)'
            : `Request failed (${status ?? 'network error'}): ${detail}`,
      );
    }
    console.error('[useContributionGeo] unexpected error:', err);
    throw err;
  }
}

export function useContributionGeo(userIdentifier: string) {
  return useQuery({
    queryKey: ['contributions-geo', userIdentifier],
    queryFn: () => fetchContributions(userIdentifier),
    enabled:
      typeof userIdentifier === 'string' && userIdentifier.trim().length > 0,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export default useContributionGeo;

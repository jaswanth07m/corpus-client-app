import { BACKEND_URL } from '@/lib/constants';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

export type ReviewFilters = {
  language?: string[];
  media_type?: string[];
  category_ids?: string[];
  source_label?: string;
  release_rights?: string;
  published_date?: string;
  is_fully_proofread?: boolean;
  extraction_type?: string;
  model_name?: string;
  version?: 'initial' | 'latest';
};

type EventFilters = {
  language?: string[] | null;
  media_type?: string[] | null;
  category_ids?: string[] | null;
  source_label?: string | null;
  release_rights?: string | null;
  published_date?: string | null;
  is_fully_proofread?: boolean | null;
  extraction_type?: string | null;
  model_name?: string | null;
  version?: 'initial' | 'latest' | null;
};

type EventResponse = {
  filters?: EventFilters | null;
  limit?: number;
};

type FallbackReason =
  | 'missing-token'
  | 'no-event'
  | 'empty-filters'
  | 'conflict'
  | 'request-failed';

type ResolvedReviewFilters = {
  filters: ReviewFilters;
  source: 'backend' | 'fallback';
  reason?: FallbackReason;
};

function sanitizeFilters(filters: ReviewFilters): ReviewFilters {
  const sanitized: ReviewFilters = {};

  if (Array.isArray(filters.language) && filters.language.length > 0) {
    sanitized.language = filters.language;
  }

  if (Array.isArray(filters.media_type) && filters.media_type.length > 0) {
    sanitized.media_type = filters.media_type;
  }

  if (Array.isArray(filters.category_ids) && filters.category_ids.length > 0) {
    sanitized.category_ids = filters.category_ids;
  }

  if (typeof filters.source_label === 'string' && filters.source_label.trim()) {
    sanitized.source_label = filters.source_label;
  }

  if (
    typeof filters.release_rights === 'string' &&
    filters.release_rights.trim()
  ) {
    sanitized.release_rights = filters.release_rights;
  }

  if (
    typeof filters.published_date === 'string' &&
    filters.published_date.trim()
  ) {
    sanitized.published_date = filters.published_date;
  }

  if (typeof filters.is_fully_proofread === 'boolean') {
    sanitized.is_fully_proofread = filters.is_fully_proofread;
  }

  if (
    typeof filters.extraction_type === 'string' &&
    filters.extraction_type.trim()
  ) {
    sanitized.extraction_type = filters.extraction_type;
  }

  if (typeof filters.model_name === 'string' && filters.model_name.trim()) {
    sanitized.model_name = filters.model_name;
  }

  if (filters.version === 'initial' || filters.version === 'latest') {
    sanitized.version = filters.version;
  }

  return sanitized;
}

function normalizeEventFilters(filters?: EventFilters | null): ReviewFilters {
  return sanitizeFilters({
    language: filters?.language ?? undefined,
    media_type: filters?.media_type ?? undefined,
    category_ids: filters?.category_ids ?? undefined,
    source_label: filters?.source_label ?? undefined,
    release_rights: filters?.release_rights ?? undefined,
    published_date: filters?.published_date ?? undefined,
    is_fully_proofread: filters?.is_fully_proofread ?? undefined,
    extraction_type: filters?.extraction_type ?? undefined,
    model_name: filters?.model_name ?? undefined,
    version: filters?.version ?? undefined,
  });
}

function hasUsableEventFilters(filters: ReviewFilters): boolean {
  return Boolean(
    filters.language ||
    (filters.media_type && filters.media_type.length > 0) ||
    (filters.category_ids && filters.category_ids.length > 0) ||
    filters.source_label ||
    filters.release_rights ||
    filters.published_date ||
    typeof filters.is_fully_proofread === 'boolean' ||
    filters.extraction_type ||
    filters.model_name ||
    filters.version,
  );
}

function mergeFilters(
  fallbackFilters: ReviewFilters,
  eventFilters: ReviewFilters,
): ReviewFilters {
  return sanitizeFilters({
    ...fallbackFilters,
    ...eventFilters,
    media_type:
      eventFilters.media_type && eventFilters.media_type.length > 0
        ? eventFilters.media_type
        : fallbackFilters.media_type,
    category_ids:
      eventFilters.category_ids && eventFilters.category_ids.length > 0
        ? eventFilters.category_ids
        : fallbackFilters.category_ids,
  });
}

async function resolveReviewFilters(
  token: string | null,
  pageRoute: string,
  fallbackFilters: ReviewFilters,
): Promise<ResolvedReviewFilters> {
  const sanitizedFallback = sanitizeFilters(fallbackFilters);

  if (!token) {
    return {
      filters: sanitizedFallback,
      source: 'fallback',
      reason: 'missing-token',
    };
  }

  try {
    const response = await fetch(`${BACKEND_URL}/events/current`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Page-Route': pageRoute,
      },
    });

    if (response.status === 409) {
      return {
        filters: sanitizedFallback,
        source: 'fallback',
        reason: 'conflict',
      };
    }

    if (!response.ok) {
      return {
        filters: sanitizedFallback,
        source: 'fallback',
        reason: 'request-failed',
      };
    }

    const eventData = (await response.json()) as EventResponse | null;
    if (!eventData) {
      return {
        filters: sanitizedFallback,
        source: 'fallback',
        reason: 'no-event',
      };
    }

    const normalizedEventFilters = normalizeEventFilters(eventData.filters);
    if (!hasUsableEventFilters(normalizedEventFilters)) {
      return {
        filters: sanitizedFallback,
        source: 'fallback',
        reason: 'empty-filters',
      };
    }

    return {
      filters: mergeFilters(sanitizedFallback, normalizedEventFilters),
      source: 'backend',
    };
  } catch (error) {
    return {
      filters: sanitizedFallback,
      source: 'fallback',
      reason: 'request-failed',
    };
  }
}

function getFallbackToast(reason: FallbackReason): {
  message: string;
  variant: 'info' | 'error';
} {
  switch (reason) {
    case 'conflict':
      return {
        message:
          'Multiple backend events matched this tool. Using default filters.',
        variant: 'error',
      };
    case 'request-failed':
      return {
        message:
          'Backend event filters are unavailable. Using default filters.',
        variant: 'error',
      };
    case 'missing-token':
    case 'no-event':
    case 'empty-filters':
      return {
        message:
          'No backend event filters found for this tool. Using defaults.',
        variant: 'info',
      };
  }
}

export function useToolEventFilters(fallbackFilters: ReviewFilters) {
  const toastKeyRef = useRef<string | null>(null);
  const sanitizedFallback = useMemo(
    () => sanitizeFilters(fallbackFilters),
    [fallbackFilters],
  );

  const [reviewFilters, setReviewFilters] =
    useState<ReviewFilters>(sanitizedFallback);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    const pageRoute =
      typeof window !== 'undefined' ? window.location.pathname : '';

    async function loadFilters() {
      setIsReady(false);
      const token = localStorage.getItem('token');
      const result = await resolveReviewFilters(
        token,
        pageRoute,
        sanitizedFallback,
      );

      if (isCancelled) {
        return;
      }

      setReviewFilters(result.filters);
      setIsReady(true);

      if (result.source === 'fallback' && result.reason) {
        const toastKey = `${pageRoute}:${result.reason}`;
        if (toastKeyRef.current !== toastKey) {
          const fallbackToast = getFallbackToast(result.reason);
          if (fallbackToast.variant === 'error') {
            toast.error(fallbackToast.message);
          } else {
            toast.info(fallbackToast.message);
          }
          toastKeyRef.current = toastKey;
        }
      }
    }

    void loadFilters();

    return () => {
      isCancelled = true;
    };
  }, [sanitizedFallback]);

  return { reviewFilters, isReady };
}

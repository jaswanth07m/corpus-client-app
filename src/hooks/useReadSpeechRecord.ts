import { useState, useCallback } from 'react';
import { axiosInstance } from '@/api/axiosInstance';

export interface RecordDetail {
  id: string;
  title?: string;
  text?: string;
  transcription?: string;
  content?: string;
  language?: string;
  media_type?: string;
  category_ids?: string[];
  release_rights?: string;
  file_url?: string;
  extracted_text?: {
    transcription?: string;
    segments?: { text: string }[];
  };
}

export function collectIds(data: unknown): string[] {
  if (!data) return [];

  if (Array.isArray(data)) {
    return data
      .map((item) => {
        if (typeof item === 'string') return item;
        if (typeof item.record_id === 'string') return item.record_id;
        if (typeof item.id === 'string') return item.id;
        return '';
      })
      .filter(Boolean);
  }

  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    for (const key of ['record_ids', 'records', 'data']) {
      const arr = obj[key];
      if (Array.isArray(arr) && arr.length > 0) {
        return arr
          .map((item: unknown) => {
            if (typeof item === 'string') return item;
            if (typeof item === 'object' && item !== null) {
              const f = item as Record<string, unknown>;
              if (typeof f.record_id === 'string') return f.record_id;
              if (typeof f.id === 'string') return f.id;
            }
            return '';
          })
          .filter(Boolean) as string[];
      }
    }
  }

  return [];
}

export interface ReadSpeechRecordState {
  records: RecordDetail[];
  loading: boolean;
  error: string | null;
}

export function useReadSpeechRecord() {
  const [state, setState] = useState<ReadSpeechRecordState>({
    records: [],
    loading: false,
    error: null,
  });
  const [recordIds, setRecordIds] = useState<string[]>([]);

  const fetchRecords = useCallback(
    async (limit = 5, filters?: Record<string, unknown>) => {
      const activeFilters = filters ?? {
        language: ['telugu'],
        media_type: ['text'],
      };
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const reviewResponse = await axiosInstance.post('/records/for-review', {
          filters: activeFilters,
          limit,
        });

        const ids = collectIds(reviewResponse.data);
        if (ids.length === 0) {
          setState({
            records: [],
            loading: false,
            error: 'No sentences available. Try again later.',
          });
          return;
        }

        setRecordIds(ids);

        const detailResponses: RecordDetail[] = [];
        for (const id of ids) {
          const detail = (await axiosInstance.get(`/records/${id}`))
            .data as RecordDetail;
          if (detail.file_url) {
            try {
              const contentRes = await fetch(detail.file_url);
              if (contentRes.ok) {
                detail.text = (await contentRes.text()).trim();
              }
            } catch {
              // file content not available
            }
          }
          if (!detail.text) {
            continue;
          }
          detailResponses.push(detail);
          if (detailResponses.length >= limit) break;
        }

        setState({
          records: detailResponses,
          loading: false,
          error: null,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load sentences.';
        setState((prev) => ({ ...prev, loading: false, error: message }));
      }
    },
    [],
  );

  return {
    ...state,
    recordIds,
    refetch: (filters?: Record<string, unknown>) => fetchRecords(5, filters),
  };
}

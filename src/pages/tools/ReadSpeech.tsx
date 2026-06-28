import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Mic,
  Square,
  RotateCcw,
  MapPin,
  Check,
  SkipForward,
  ArrowLeft,
  Loader2,
  Volume2,
  Play,
  Globe,
  Settings2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { NetworkStrengthIndicator } from '@/components/NetworkStrengthIndicator';
import { useReadSpeechRecord, collectIds } from '@/hooks/useReadSpeechRecord';
import type { RecordDetail } from '@/hooks/useReadSpeechRecord';
import { useToolEventFilters } from '@/hooks/useToolEventFilters';
import type { ReviewFilters } from '@/hooks/useToolEventFilters';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useAuth } from '@/hooks/useAuth';
import { axiosInstance } from '@/api/axiosInstance';
import { BACKEND_URL } from '@/lib/constants';
import LocationPicker from '@/components/LocationPicker';

interface SavedLocation {
  lat: number;
  lng: number;
  label: string;
}

const MIN_RECORDING_DURATION = 5;
const LOCATION_STORAGE_KEY = 'read_speech_location';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function Waveform({ data }: { data: Uint8Array | null }) {
  if (!data) return null;
  const bars: React.ReactNode[] = [];
  const step = Math.max(1, Math.floor(data.length / 64));
  for (let i = 0; i < data.length; i += step) {
    const height = Math.max(2, (data[i] / 255) * 48);
    bars.push(
      <div
        key={i}
        className="w-0.5 bg-emerald-500 rounded-full transition-all duration-75"
        style={{ height: `${height}px` }}
      />,
    );
  }
  return <div className="flex items-end gap-[2px] h-12">{bars}</div>;
}

function SlotCard({
  index,
  isRecorded,
  isCurrent,
  isSubmitting,
  isPlaying,
  onPlay,
  onPause,
  onReRecord,
  recorder,
}: {
  index: number;
  isRecorded: boolean;
  isCurrent: boolean;
  isSubmitting: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReRecord: () => void;
  recorder: {
    status: string;
    duration: number;
    frequencyData: Uint8Array | null;
  };
}) {
  const { t } = useTranslation();
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
        isCurrent
          ? 'border-emerald-500 bg-emerald-50 shadow-sm'
          : isRecorded
            ? 'border-slate-200 bg-white'
            : 'border-slate-100 bg-slate-50'
      }`}
    >
      <span
        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
          isRecorded
            ? 'bg-emerald-500 text-white'
            : isCurrent
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-200 text-slate-500'
        }`}
      >
        {isRecorded ? <Check className="h-3.5 w-3.5" /> : index + 1}
      </span>

      <span
        className={`text-sm flex-1 truncate ${
          isCurrent
            ? 'text-emerald-700 font-medium'
            : isRecorded
              ? 'text-slate-700'
              : 'text-slate-400'
        }`}
      >
        {isCurrent
          ? 'Recording'
          : isRecorded
            ? `Sentence ${index + 1}`
            : `Sentence ${index + 1}`}
      </span>

      {isRecorded && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={isPlaying ? onPause : onPlay}
            disabled={isSubmitting}
            className="p-1 hover:bg-slate-100 rounded"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Square className="h-3.5 w-3.5 text-slate-500" />
            ) : (
              <Play className="h-3.5 w-3.5 text-slate-500" />
            )}
          </button>
          <button
            type="button"
            onClick={onReRecord}
            disabled={isSubmitting}
            className="p-1 hover:bg-slate-100 rounded"
            title={t('media.rerecord')}
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>
      )}

      {isCurrent && recorder.status === 'recording' && (
        <span className="text-xs font-mono text-emerald-600 shrink-0">
          {formatDuration(recorder.duration)}
        </span>
      )}
    </div>
  );
}

export default function ReadSpeech() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const fallbackFilters = useMemo<ReviewFilters>(
    () => ({ language: ['telugu'], media_type: ['text'] }),
    [],
  );
  const { reviewFilters, isReady: areReviewFiltersReady } =
    useToolEventFilters(fallbackFilters);

  const {
    records: fetchedRecords,
    loading: fetchLoading,
    error: fetchError,
    recordIds,
    refetch,
  } = useReadSpeechRecord();

  const [sourceRecordIds, setSourceRecordIds] = useState<string[]>([]);

  useEffect(() => {
    if (recordIds.length > 0) {
      setSourceRecordIds(recordIds);
    }
  }, [recordIds]);

  useEffect(() => {
    if (areReviewFiltersReady) {
      refetch(reviewFilters);
    }
  }, [areReviewFiltersReady]);
  const recorder = useAudioRecorder();
  const [sentences, setSentences] = useState<RecordDetail[]>([]);
  const [recordings, setRecordings] = useState<(Blob | null)[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [playingIndex, setPlayingIndex] = useState(-1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [savedLocation, setSavedLocation] = useState<SavedLocation | null>(
    () => {
      try {
        const stored = localStorage.getItem(LOCATION_STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    },
  );
  const [showAccentPrompt, setShowAccentPrompt] = useState(!savedLocation);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${BACKEND_URL}/categories/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json().catch(() => []))
      .then((cats: { id: string; name: string }[]) => {
        const readSpeech = cats.find(
          (c) => c.name?.toLowerCase() === 'read-speech',
        );
        const fallback = cats[0];
        setSelectedCategory(readSpeech || fallback);
        if (!readSpeech) {
          console.warn(
            'Read-Speech category not found, using:',
            fallback?.name,
          );
        }
      })
      .catch(() => {});
  }, []);

  const allRecorded = useMemo(
    () => recordings.length === 5 && recordings.every((r) => r !== null),
    [recordings],
  );

  const currentSentence = sentences[currentIndex];
  const isCurrentRecorded = recordings[currentIndex] !== null;

  useEffect(() => {
    if (fetchedRecords.length > 0) {
      const batch = fetchedRecords.slice(0, 5);
      setSentences(batch);
      setRecordings(new Array(batch.length).fill(null));
      setCurrentIndex(0);
      recorder.resetRecording();
      setSubmitting(false);
      setSubmitProgress(null);
    }
  }, [fetchedRecords]);

  const handleLocationSaved = useCallback((lat: number, lng: number) => {
    setShowLocationPicker(false);
    setShowAccentPrompt(false);
    fetch(`${BACKEND_URL}/location/verify-location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: lat, longitude: lng }),
    })
      .then((res) => res.json().catch(() => null))
      .then((data) => {
        const label =
          data?.formatted_address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        const location: SavedLocation = { lat, lng, label };
        setSavedLocation(location);
        localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
      })
      .catch(() => {
        const location: SavedLocation = {
          lat,
          lng,
          label: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        };
        setSavedLocation(location);
        localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
      });
  }, []);

  const handlePlayRecording = useCallback(
    (index: number) => {
      const blob = recordings[index];
      if (!blob) return;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        audioRef.current = null;
        setPlayingIndex(-1);
      };
      audio.play().catch(() => {});
      setPlayingIndex(index);
    },
    [recordings],
  );

  const handlePauseRecording = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingIndex(-1);
  }, []);

  const handleReRecord = useCallback(
    (index: number) => {
      setRecordings((prev) => {
        const next = [...prev];
        next[index] = null;
        return next;
      });
      setCurrentIndex(index);
      recorder.resetRecording();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingIndex(-1);
    },
    [recorder],
  );

  const handleNext = useCallback(() => {
    const nextUnrecorded = recordings.findIndex(
      (r, i) => r === null && i > currentIndex,
    );
    const next = nextUnrecorded !== -1 ? nextUnrecorded : currentIndex + 1;
    if (next < 5) {
      setCurrentIndex(next);
      recorder.resetRecording();
    }
  }, [currentIndex, recorder, recordings]);

  const handleSkip = useCallback(async () => {
    if (!areReviewFiltersReady) return;
    setLoadingMore(true);
    try {
      const response = await axiosInstance.post('/records/for-review', {
        filters: reviewFilters,
        limit: 1,
      });
      const ids = collectIds(response.data);
      if (ids.length > 0) {
        const detail = await axiosInstance.get<RecordDetail>(
          `/records/${ids[0]}`,
        );
        setSentences((prev) => {
          const next = [...prev];
          next[currentIndex] = detail.data;
          return next;
        });
        setRecordings((prev) => {
          const next = [...prev];
          next[currentIndex] = null;
          return next;
        });
      }
    } catch {
      toast.error(t('readSpeech.skipFailed'));
    } finally {
      setLoadingMore(false);
    }
    recorder.resetRecording();
  }, [currentIndex, recorder, t, reviewFilters, areReviewFiltersReady]);

  const handleSubmitAll = useCallback(async () => {
    if (!allRecorded || submitting) return;
    setSubmitting(true);
    setSubmitProgress({ current: 0, total: 5 });

    const token = localStorage.getItem('token');

    for (let i = 0; i < 5; i++) {
      const blob = recordings[i];
      const sentence = sentences[i];
      if (!blob || !sentence) continue;

      setSubmitProgress({ current: i + 1, total: 5 });

      try {
        const uploadUuid = crypto.randomUUID();
        const filename = `recording-${Date.now()}-${i}.webm`;

        const chunkFormData = new FormData();
        chunkFormData.append('chunk', blob);
        chunkFormData.append('filename', filename);
        chunkFormData.append('chunk_index', '0');
        chunkFormData.append('total_chunks', '1');
        chunkFormData.append('upload_uuid', uploadUuid);

        const chunkRes = await fetch(`${BACKEND_URL}/records/upload/chunk`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: chunkFormData,
        });

        if (!chunkRes.ok) {
          throw new Error(`Failed to upload sentence ${i + 1}`);
        }

        const title = 'Accents Map activity';
        const displayText = (sentence.text || sentence.title || '').trim();
        const description = `Accents Map activity Sentence: ${displayText}`;

        const catId =
          selectedCategory?.id || (sentence.category_ids?.[0] ?? '');

        const finalizeFormData = new FormData();
        finalizeFormData.append('upload_uuid', uploadUuid);
        finalizeFormData.append('title', title);
        finalizeFormData.append('description', description);
        finalizeFormData.append('category_ids', JSON.stringify([catId]));
        finalizeFormData.append('user_id', user?.id || '');
        finalizeFormData.append('media_type', 'audio');
        finalizeFormData.append('use_uid_filename', 'false');
        finalizeFormData.append('total_chunks', '1');
        finalizeFormData.append('filename', filename);
        finalizeFormData.append('release_rights', 'creator');
        finalizeFormData.append('language', 'telugu');

        const sourceId = sourceRecordIds[i];
        if (sourceId) {
          finalizeFormData.append('record_tags', JSON.stringify([sourceId]));
        }

        if (savedLocation) {
          finalizeFormData.append('latitude', String(savedLocation.lat));
          finalizeFormData.append('longitude', String(savedLocation.lng));
        }

        const finalizeRes = await fetch(`${BACKEND_URL}/records/upload`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: finalizeFormData,
        });

        if (!finalizeRes.ok) {
          let userMsg = t('readSpeech.submitFailed');
          try {
            const errJson = await finalizeRes.json().catch(() => null);
            if (errJson?.error_type === 'validation_error') {
              const fields = errJson.errors
                ?.map((e: { field: string }) => e.field)
                .join(', ');
              userMsg = `${t('readSpeech.validationFailed')}: ${t('readSpeech.checkFields')} ${fields}`;
            } else if (finalizeRes.status === 500) {
              userMsg = t('readSpeech.serverError');
            } else if (finalizeRes.status === 400) {
              userMsg = t('readSpeech.invalidRequest');
            }
          } catch {
            /* use default message */
          }
          throw new Error(userMsg);
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : t('readSpeech.submitFailed');
        toast.error(`${t('readSpeech.sentence')} ${i + 1}: ${msg}`);
      }
    }

    toast.success(t('readSpeech.batchSubmitted', { count: 5 }));
    setSubmitting(false);
    setSubmitProgress(null);
    setRecordings(new Array(5).fill(null));
    setSentences([]);

    setTimeout(() => {
      refetch();
    }, 1500);
  }, [
    recordings,
    sentences,
    savedLocation,
    user,
    allRecorded,
    submitting,
    refetch,
    t,
    selectedCategory,
    sourceRecordIds,
  ]);

  const rightPanel = (
    <div className="flex flex-col gap-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <SlotCard
          key={i}
          index={i}
          isRecorded={recordings[i] !== null}
          isCurrent={i === currentIndex}
          isSubmitting={submitting}
          isPlaying={i === playingIndex}
          onPlay={() => handlePlayRecording(i)}
          onPause={handlePauseRecording}
          onReRecord={() => handleReRecord(i)}
          recorder={{
            status: recorder.status,
            duration: recorder.duration,
            frequencyData: recorder.frequencyData,
          }}
        />
      ))}
    </div>
  );

  const mainContent = (
    <>
      {!currentSentence ? (
        <div className="flex items-center justify-center h-full text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>{t('common.loading')}</span>
        </div>
      ) : (
        <>
          {/* Mobile slot indicator */}
          <div className="flex items-center justify-center gap-2 mb-4 md:hidden">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  recordings[i] !== null
                    ? 'bg-emerald-500 text-white'
                    : i === currentIndex
                      ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500'
                      : 'bg-slate-200 text-slate-500'
                }`}
              >
                {recordings[i] !== null ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  i + 1
                )}
              </div>
            ))}
          </div>

          {/* Sentence display */}
          <Card className="w-full mb-6">
            <CardContent className="p-8">
              <p className="text-xl leading-relaxed text-slate-800 text-center font-medium">
                {currentSentence.text || currentSentence.title || ''}
              </p>
            </CardContent>
          </Card>

          {/* Recording controls */}
          <div className="flex flex-col items-center gap-4">
            {recorder.status === 'idle' && !isCurrentRecorded && (
              <Button
                size="lg"
                className="h-16 w-16 rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-lg"
                onClick={recorder.startRecording}
              >
                <Mic className="h-8 w-8" />
              </Button>
            )}

            {recorder.status === 'recording' && (
              <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                <Waveform data={recorder.frequencyData} />
                <div className="w-full">
                  <div className="text-sm text-slate-500 mb-1">
                    <span className="font-mono">
                      {formatDuration(recorder.duration)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        recorder.duration >= MIN_RECORDING_DURATION
                          ? 'bg-emerald-500'
                          : 'bg-amber-500'
                      }`}
                      style={{
                        width: `${Math.min(100, (recorder.duration / MIN_RECORDING_DURATION) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <Button
                  size="lg"
                  className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700 shadow-lg"
                  onClick={recorder.stopRecording}
                >
                  <Square className="h-6 w-6" />
                </Button>
              </div>
            )}

            {recorder.status === 'error' && (
              <div className="text-center space-y-3">
                <p className="text-red-600 text-sm">{recorder.error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={recorder.resetRecording}
                >
                  {t('common.retry')}
                </Button>
              </div>
            )}

            {recorder.status === 'stopped' && recorder.blob && (
              <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                {recorder.duration < MIN_RECORDING_DURATION && (
                  <div className="w-full bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                    <p>{t('readSpeech.recordingTooShort')}</p>
                  </div>
                )}

                <audio
                  controls
                  src={recorder.blobUrl || ''}
                  className="w-full"
                />

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      recorder.resetRecording();
                    }}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    {t('media.recordAgain')}
                  </Button>

                  {currentIndex < 4 ? (
                    <Button
                      onClick={() => {
                        setRecordings((prev) => {
                          const next = [...prev];
                          next[currentIndex] = recorder.blob!;
                          return next;
                        });
                        handleNext();
                      }}
                      disabled={recorder.duration < MIN_RECORDING_DURATION}
                    >
                      {t('readSpeech.next')}
                      <ArrowLeft className="h-4 w-4 ml-1 rotate-180" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setRecordings((prev) => {
                          const next = [...prev];
                          next[currentIndex] = recorder.blob!;
                          return next;
                        });
                        recorder.resetRecording();
                      }}
                      disabled={recorder.duration < MIN_RECORDING_DURATION}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      {t('readSpeech.done')}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Skip button */}
          {recorder.status !== 'recording' && !isCurrentRecorded && (
            <button
              type="button"
              onClick={handleSkip}
              disabled={loadingMore}
              className="mt-4 text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1 mx-auto"
            >
              {loadingMore ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <SkipForward className="h-3 w-3" />
              )}
              {t('readSpeech.skip')}
            </button>
          )}
        </>
      )}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/tools">
                <button className="p-2 hover:bg-slate-100 rounded-xl transition-all duration-200 border border-slate-200">
                  <ArrowLeft className="h-5 w-5 text-slate-700" />
                </button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {t('tools.readSpeech')}
                </h1>
                <p className="text-sm text-slate-500">
                  {t('tools.readSpeechDescription')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NetworkStrengthIndicator />
            </div>
          </div>
        </div>
      </div>

      {/* Location display below nav */}
      {savedLocation && (
        <div className="max-w-7xl mx-auto px-6 pt-3 flex justify-end">
          <button
            type="button"
            onClick={() => setShowLocationPicker(true)}
            className="flex items-center gap-1.5 text-xs text-slate-600 bg-white border border-slate-200 rounded-md px-3 py-1.5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all"
            title={t('common.edit')}
          >
            <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span className="max-w-[400px]">{savedLocation.label}</span>
          </button>
        </div>
      )}

      {/* Accent location prompt overlay */}
      {showAccentPrompt && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <MapPin className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {t('readSpeech.accentPromptTitle')}
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                {t('readSpeech.accentPromptDescription')}
              </p>
            </div>
            <Button
              size="lg"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={() => setShowLocationPicker(true)}
            >
              <MapPin className="h-5 w-5 mr-2" />
              {t('readSpeech.chooseLocation')}
            </Button>
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 max-w-7xl mx-auto p-6 w-full">
        {fetchLoading && sentences.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" />
              <p className="text-slate-500 text-sm">{t('common.loading')}</p>
            </div>
          </div>
        ) : fetchError && sentences.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-3">
              <p className="text-red-600 text-sm">{fetchError}</p>
              <Button variant="outline" size="sm" onClick={refetch}>
                {t('common.retry')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-6">
            {/* Left panel — main recording area */}
            <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
              {mainContent}

              {/* Submit button when all recorded */}
              {allRecorded && !submitting && (
                <div className="mt-8 text-center">
                  <Button
                    size="lg"
                    className="bg-emerald-600 hover:bg-emerald-700 px-8"
                    onClick={handleSubmitAll}
                  >
                    <Globe className="h-5 w-5 mr-2" />
                    {t('readSpeech.submitAll', { count: 5 })}
                  </Button>
                </div>
              )}

              {/* Submit progress */}
              {submitProgress && (
                <div className="mt-8 w-full max-w-sm text-center">
                  <p className="text-sm text-slate-600 mb-2">
                    {t('readSpeech.submittingProgress', {
                      current: submitProgress.current,
                      total: submitProgress.total,
                    })}
                  </p>
                  <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div
                      className="bg-emerald-500 h-2.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${(submitProgress.current / submitProgress.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right panel — 5 slots */}
            {sentences.length > 0 && (
              <div className="w-64 shrink-0 hidden md:block">
                <div className="sticky top-24">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                    {t('readSpeech.sentences')}
                  </p>
                  {rightPanel}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Location picker modal */}
      {showLocationPicker && (
        <LocationPicker
          onLocationSelect={handleLocationSaved}
          onClose={() => setShowLocationPicker(false)}
        />
      )}
    </div>
  );
}

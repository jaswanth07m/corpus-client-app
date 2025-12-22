import React, { useEffect, useState } from 'react';
import {
  User,
  Clock,
  History,
  ChevronDown,
  ChevronUp,
  Pencil,
  ImageIcon,
  Video,
  Mic,
  Music,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { BACKEND_URL } from '@/lib/constants';

interface PeerReviewCardProps {
  user_id: string;
  username?: string;
  record_id: string;
  title: string;
  description: string;
  media_type: string;
  release_rights: string;
  dataUrl: string;
  language?: string;
}

interface HistoryEntry {
  uid: string;
  version_number: number;
  changed_by: string;
  created_at: string;
  change_type: string;
  change_source: string;
  field_changes: Record<string, { old_value: unknown; new_value: unknown }>;
}

const languages = [
  'assamese',
  'bengali',
  'bodo',
  'dogri',
  'gujarati',
  'hindi',
  'kannada',
  'kashmiri',
  'konkani',
  'maithili',
  'malayalam',
  'marathi',
  'meitei',
  'nepali',
  'odia',
  'punjabi',
  'sanskrit',
  'santali',
  'sindhi',
  'tamil',
  'telugu',
  'urdu',
];

const releaseOptions = [
  { key: 'creator', value: 'This work is created by Author' },
  {
    key: 'downloaded',
    value:
      "Author downloaded this from the internet and/or Author don't know if it is free to share",
  },
  { key: 'others', value: 'Not Done By Author' },
];

function formatDate(ts?: string) {
  try {
    return ts ? new Date(ts).toLocaleString() : 'N/A';
  } catch {
    return 'N/A';
  }
}

const PeerReviewCard: React.FC<PeerReviewCardProps> = ({
  user_id,
  username,
  record_id,
  title,
  description,
  media_type,
  release_rights,
  dataUrl,
  language: propLanguage,
}) => {
  const [changed, setChanged] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [newTitle, setNewTitle] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newLanguage, setNewLanguage] = useState<string>('');
  const [relRights, setRelRights] = useState<string>('');
  const [sourceLabel, setSourceLabel] = useState<string>('');

  const [titleError, setTitleError] = useState<string | null>(null);
  const [descError, setDescError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // history
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [expandedVersionUid, setExpandedVersionUid] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setNewTitle(title ?? '');
    setNewDescription(description ?? '');
    setNewLanguage(propLanguage ?? '');
    setRelRights(release_rights ?? '');
    setSourceLabel('');
  }, [title, description, release_rights, propLanguage]);

  const countMeaningfulWords = (s: string) =>
    s.split(' ').filter((w) => w.trim().length > 2).length;

  const markChanged = () => {
    if (!changed) setChanged(true);
  };

  const handleEditAndSubmit = async () => {
    setSubmitError(null);

    // Validate inputs before submitting
    if (!newTitle || newTitle.trim().length < 8) {
      setTitleError('Title must be at least 8 characters long.');
      return;
    }

    if (!newDescription || newDescription.trim().length < 32) {
      setDescError('Description must be at least 32 characters long.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setSubmitError('Authentication token not found. Please log in again.');
      return;
    }

    setIsSubmitting(true);

    try {
      const requestBody: {
        title: string;
        description: string;
        language: string;
        release_rights: string;
        source_label?: string;
      } = {
        title: newTitle,
        description: newDescription,
        language: newLanguage || propLanguage || '',
        release_rights: relRights || release_rights || '',
      };

      // Add source_label only if release rights is 'others'
      if (relRights === 'others' && sourceLabel.trim()) {
        requestBody.source_label = sourceLabel.trim();
      }

      const response = await fetch(`${BACKEND_URL}/records/${record_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        const fieldMessages = Array.isArray(errorData.errors)
          ? errorData.errors
              .map(
                (e: { field: string; message: string }) =>
                  `${e.field}: ${e.message}`,
              )
              .join('\n')
          : '';

        const message = [
          errorData.message ||
            `Failed to submit review: ${response.status} ${response.statusText}`,
          fieldMessages,
        ]
          .filter(Boolean)
          .join('\n');

        throw new Error(message);
      }

      // Update local state with new values to reflect the changes
      // This should trigger a re-render with the new values
      setChanged(false);
      setEditMode(false);

      // Optionally show success feedback to the user
      console.log(record_id);
      console.log('Review submitted successfully:', requestBody);
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitError(
        error instanceof Error ? error.message : 'An unknown error occurred',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon size={20} className="text-blue-600" />;
      case 'video':
        return <Video size={20} className="text-red-600" />;
      case 'audio':
        return <Mic size={20} className="text-green-600" />;
      default:
        return <div className="text-gray-500 text-sm">?</div>;
    }
  };

  // fetch history for current record_id (immediate)
  const fetchRecordHistory = async () => {
    if (!record_id) return;
    const token = localStorage.getItem('token');
    setLoadingHistory(true);
    setError(null);
    try {
      const res = await fetch(
        `${BACKEND_URL}/history/record/${record_id}/history`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      );
      if (!res.ok) {
        const text = await res.text().catch(() => null);
        throw new Error(
          `Failed to fetch history: ${res.status} ${res.statusText}${text ? ` - ${text}` : ''}`,
        );
      }
      const data = await res.json();
      setHistory(Array.isArray(data) ? (data as HistoryEntry[]) : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unknown error while fetching history',
      );
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const renderMedia = () => {
    const containerClass =
      'w-full h-[280px] bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden flex items-center justify-center';

    if (media_type === 'image') {
      return (
        <div className={containerClass}>
          <img
            src={dataUrl}
            alt="uploaded media"
            className="w-full h-full object-contain"
            loading="lazy"
          />
        </div>
      );
    }

    if (media_type === 'video') {
      return (
        <div className={containerClass}>
          <video
            controls
            className="w-full h-full object-cover"
            preload="metadata"
          >
            <source src={dataUrl} />
          </video>
        </div>
      );
    }

    if (media_type === 'audio') {
      return (
        <div className="w-full h-[200px] bg-gradient-to-br from-emerald-50 to-cyan-50 overflow-hidden p-6">
          <div className="flex flex-col items-center justify-center gap-4 h-full">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Music size={40} className="text-white" />
            </div>
            <div className="w-full max-w-md">
              <audio controls className="w-full" preload="metadata">
                <source src={dataUrl} />
              </audio>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-600 font-medium">
                Audio Track
              </span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={containerClass}>
        <p className="text-slate-400">Unsupported media</p>
      </div>
    );
  };

  const toggleExpandVersion = (uid: string) => {
    setExpandedVersionUid((s) => (s === uid ? null : uid));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 max-w-xl mx-auto mb-4">
      {/* Header - Compact */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${username || user_id}`} className="group">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <User size={20} className="text-white" />
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              {username || user_id}
            </h3>
            {getMediaIcon(media_type)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              if (!showHistory) {
                await fetchRecordHistory();
              }
              setShowHistory((prev) => !prev);
            }}
            title="Show history"
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-expanded={showHistory}
          >
            <History size={18} className="text-slate-600" />
          </button>

          <button
            type="button"
            onClick={() => setEditMode((s) => !s)}
            className={`p-2 rounded-lg transition-all ${
              editMode
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title={editMode ? 'Disable Edit Mode' : 'Enable Edit Mode'}
          >
            <Pencil size={18} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Media */}
      <div className="overflow-hidden bg-slate-50">{renderMedia()}</div>

      {/* Content */}
      <div className="px-4 pb-4 space-y-3">
        {showHistory && (
          <div className="border border-slate-200 rounded-lg bg-slate-50 p-4 mt-3">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} className="text-slate-500" />
              <h4 className="text-sm font-bold text-slate-800">Edit History</h4>
              {loadingHistory && (
                <span className="text-xs text-slate-500">loading...</span>
              )}
              {error && <span className="text-xs text-red-500">{error}</span>}
              {!loadingHistory && history.length === 0 && (
                <span className="text-xs text-slate-500">no history</span>
              )}
            </div>

            <ul className="space-y-1.5">
              {history.map((entry) => {
                const uid = entry.uid ?? JSON.stringify(entry).slice(0, 8);
                const isExpanded = expandedVersionUid === uid;
                const versionNumber = entry.version_number ?? '—';
                const changedBy = entry.changed_by ?? 'N/A';
                const createdAt = entry.created_at ?? undefined;

                return (
                  <li
                    key={uid}
                    className="border border-gray-200 rounded-md overflow-hidden bg-white"
                  >
                    <button
                      onClick={() => toggleExpandVersion(uid)}
                      className="w-full flex justify-between items-center p-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="text-left">
                        <p className="text-xs font-semibold text-gray-800">
                          Version {versionNumber}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(createdAt)} by{' '}
                          <span className="font-medium">{changedBy}</span>
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="p-3 bg-white border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                          <p>
                            <strong className="text-gray-600">Type:</strong>{' '}
                            <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                              {entry.change_type || 'N/A'}
                            </span>
                          </p>
                          <p>
                            <strong className="text-gray-600">Source:</strong>{' '}
                            <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                              {entry.change_source || 'N/A'}
                            </span>
                          </p>
                        </div>
                        {entry.field_changes &&
                          Object.keys(entry.field_changes).length > 0 && (
                            <div>
                              <strong className="text-xs font-semibold text-gray-700">
                                Field Changes:
                              </strong>
                              <ul className="mt-1.5 space-y-1.5">
                                {Object.entries(entry.field_changes).map(
                                  ([field, change]) => {
                                    const formattedField = field
                                      .replace(/_/g, ' ')
                                      .split(' ')
                                      .map(
                                        (word) =>
                                          word.charAt(0).toUpperCase() +
                                          word.slice(1),
                                      )
                                      .join(' ');

                                    return (
                                      <li
                                        key={field}
                                        className="p-2 border border-gray-200 rounded bg-gray-50"
                                      >
                                        <strong className="text-xs font-semibold text-gray-800">
                                          {formattedField}
                                        </strong>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className="text-xs font-medium text-red-500">
                                            OLD:
                                          </span>
                                          <span className="font-mono text-xs text-red-700 bg-red-50 px-1.5 py-0.5 rounded line-through">
                                            {String(change.old_value ?? 'N/A')}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className="text-xs font-medium text-green-500">
                                            NEW:
                                          </span>
                                          <span className="font-mono text-xs text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                                            {String(change.new_value ?? 'N/A')}
                                          </span>
                                        </div>
                                      </li>
                                    );
                                  },
                                )}
                              </ul>
                            </div>
                          )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {editMode ? (
          <div className="mt-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Title
            </label>
            <Input
              value={newTitle || (!editMode ? title : newTitle)}
              onChange={(e) => {
                const t = e.target.value;
                setNewTitle(t);
                markChanged();
                if (t.trim().length < 8) {
                  setTitleError('Title must be at least 8 characters long.');
                } else if (countMeaningfulWords(t) < 2) {
                  setTitleError(
                    'Title must contain at least 2 meaningful words.',
                  );
                } else {
                  setTitleError(null);
                }
              }}
              className={`text-sm font-medium h-10 ${!editMode ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-300 focus:border-emerald-500 focus:ring-emerald-500'}`}
              readOnly={!editMode}
              placeholder="Enter title"
            />
            {titleError && (
              <p className="text-xs text-red-500 mt-1.5 font-medium">
                {titleError}
              </p>
            )}
          </div>
        ) : (
          <div className="pt-2">
            <h1 className="text-center font-bold text-xl text-slate-900">
              {newTitle}
            </h1>
          </div>
        )}

        {editMode ? (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description
            </label>
            <textarea
              value={
                newDescription || (!editMode ? description : newDescription)
              }
              onChange={(e) => {
                const d = e.target.value;
                setNewDescription(d);
                markChanged();
                if (d.trim().length < 32) {
                  setDescError(
                    'Description must be at least 32 characters long.',
                  );
                } else if (countMeaningfulWords(d) < 10) {
                  setDescError(
                    'Description must contain at least 10 meaningful words.',
                  );
                } else {
                  setDescError(null);
                }
              }}
              readOnly={!editMode}
              rows={3}
              className={`w-full p-3 border rounded-lg text-sm resize-none ${
                !editMode
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-white border-slate-300 focus:border-emerald-500 focus:ring-emerald-500'
              }`}
              placeholder="Enter description"
            />
            {descError && (
              <p className="text-xs text-red-500 mt-1.5 font-medium">
                {descError}
              </p>
            )}
            <p className="text-xs text-slate-500 mt-1.5">
              {countMeaningfulWords(newDescription || description)} meaningful
              words
            </p>
          </div>
        ) : (
          <div className="pt-2">
            <p className="text-center text-slate-700 leading-relaxed">
              {newDescription}
            </p>
          </div>
        )}

        {/* Language + Release Rights */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Language
            </label>
            <Select
              onValueChange={(val) => {
                setNewLanguage(val);
                markChanged();
              }}
            >
              <SelectTrigger
                className={`w-full h-9 text-sm ${
                  !editMode
                    ? 'bg-gray-50 border-gray-200 pointer-events-none opacity-80'
                    : ''
                }`}
              >
                <SelectValue
                  placeholder={newLanguage || propLanguage || 'NA'}
                />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Release Rights
            </label>
            <Select
              value={relRights || release_rights}
              onValueChange={(val) => {
                setRelRights(val);
                markChanged();
                if (val !== 'others') setSourceLabel('');
              }}
            >
              <SelectTrigger
                className={`w-full h-9 text-sm ${
                  !editMode
                    ? 'bg-gray-50 border-gray-200 pointer-events-none opacity-80'
                    : ''
                }`}
              >
                <SelectValue
                  placeholder={relRights || release_rights || 'Select'}
                />
              </SelectTrigger>
              <SelectContent>
                {releaseOptions.map((opt) => (
                  <SelectItem key={opt.key} value={opt.key}>
                    {opt.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {relRights === 'others' && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Source Label
            </label>
            <Input
              className={`h-9 text-sm ${!editMode ? 'bg-gray-50 border-gray-200' : ''}`}
              value={sourceLabel}
              onChange={(e) => {
                setSourceLabel(e.target.value);
                markChanged();
              }}
              readOnly={!editMode}
              placeholder="Specify source"
            />
          </div>
        )}

        {/* Actions */}
        {changed && (
          <div className="flex gap-3 pt-2">
            <button
              className={`flex-1 px-4 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-lg hover:bg-emerald-600 transition-all shadow-md hover:shadow-lg ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={handleEditAndSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Changes'}
            </button>

            <button
              onClick={() => {
                setNewTitle(title ?? '');
                setNewDescription(description ?? '');
                setNewLanguage(propLanguage ?? '');
                setRelRights(release_rights ?? '');
                setSourceLabel('');
                setChanged(false);
                setSubmitError(null);
                setTitleError(null);
                setDescError(null);
                setEditMode(false);
              }}
              className="flex-1 px-4 py-2.5 border-2 border-slate-300 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
          </div>
        )}

        {submitError && (
          <p className="text-xs text-red-500 font-medium text-center mt-1 whitespace-pre-line">
            {submitError}
          </p>
        )}
      </div>
    </div>
  );
};

export default PeerReviewCard;

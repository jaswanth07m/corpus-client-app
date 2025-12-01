import React, { useEffect, useState } from 'react';
import {
  User,
  Clock,
  History,
  ChevronDown,
  ChevronUp,
  Pencil,
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
  record_id: string;
  title: string;
  description: string;
  media_type: string;
  release_rights: string;
  dataUrl: string;
  language?: string;
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
    key: 'download',
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
  const [history, setHistory] = useState<Array<unknown> | null>(null);
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
        throw new Error(
          errorData.message ||
            `Failed to submit review: ${response.status} ${response.statusText}`,
        );
      }

      // Update local state with new values to reflect the changes
      // This should trigger a re-render with the new values
      setChanged(false);
      setEditMode(false);

      // Optionally show success feedback to the user
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
      setHistory(Array.isArray(data) ? data : []);
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
    if (media_type === 'image') {
      return (
        <img
          src={dataUrl}
          alt="uploaded media"
          style={{
            maxHeight: '25rem',
            maxWidth: '100%',
            width: 'auto',
            height: 'auto',
            display: 'block',
            margin: '0 auto',
          }}
          className="object-contain"
        />
      );
    }
    if (media_type === 'video') {
      return (
        <video controls style={{ maxHeight: '25rem' }} className="w-full">
          <source src={dataUrl} />
        </video>
      );
    }
    if (media_type === 'audio') {
      return (
        <audio controls className="w-full">
          <source src={dataUrl} />
        </audio>
      );
    }
    return <p className="text-gray-500">Unsupported media</p>;
  };

  const toggleExpandVersion = (uid: string) => {
    setExpandedVersionUid((s) => (s === uid ? null : uid));
  };

  return (
    <div
      style={{ backgroundColor: '#f2f2f2ff' }}
      className="border shadow-md rounded-md p-4 mb-4 max-w-xl mx-auto relative"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-3 items-center">
          <div className="bg-gray-200 rounded-full p-2">
            <Link to={`/userProfile/${user_id}`}>
              <User size={26} className="text-gray-600" />
            </Link>
          </div>
          <div className="flex flex-col">
            <h3 className="font-semibold text-gray-800">{user_id}</h3>
            <p className="text-sm text-gray-500">{media_type.toUpperCase()}</p>
          </div>
        </div>

        {/* Right controls: history icon + edit checkbox */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={async () => {
              // Fetch history data if we're opening the history panel
              if (!showHistory) {
                await fetchRecordHistory();
              }
              // Toggle the history panel visibility
              setShowHistory((prev) => !prev);
            }}
            title="Show history"
            className="p-2 rounded hover:bg-gray-200"
            aria-expanded={showHistory}
          >
            <History size={18} className="text-gray-600" />
          </button>

          {/* Edit toggle pencil button */}
          <button
            type="button"
            onClick={() => setEditMode((s) => !s)}
            className={`
            p-2 rounded-md transition-all
            ${
              editMode
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }
          `}
            title={editMode ? 'Disable Edit Mode' : 'Enable Edit Mode'}
          >
            <Pencil size={18} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="mb-2">
        <Input
          value={newTitle || (!editMode ? title : newTitle)}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const t = e.target.value;
            setNewTitle(t);
            markChanged();
            if (t.trim().length < 8) {
              setTitleError('Title must be at least 8 characters long.');
            } else if (countMeaningfulWords(t) < 2) {
              setTitleError('Title must contain at least 2 meaningful words.');
            } else {
              setTitleError(null);
            }
          }}
          className={`${!editMode ? 'bg-gray-200' : 'bg-white'}`}
          readOnly={!editMode}
          placeholder="Title"
        />
        {titleError && <div className="text-xs text-red-500">{titleError}</div>}
      </div>

      {/* Description */}
      <div className="mb-3">
        <textarea
          value={newDescription || (!editMode ? description : newDescription)}
          onChange={(e) => {
            const d = e.target.value;
            setNewDescription(d);
            markChanged();
            if (d.trim().length < 32) {
              setDescError('Description must be at least 32 characters long.');
            } else if (countMeaningfulWords(d) < 10) {
              setDescError(
                'Description must contain at least 10 meaningful words.',
              );
            } else {
              setDescError(null);
            }
          }}
          readOnly={!editMode}
          rows={4}
          className={`w-full p-2 border rounded ${!editMode ? 'bg-gray-200' : 'bg-white'}`}
          placeholder="Description"
        />
        {descError && <div className="text-xs text-red-500">{descError}</div>}
        <div className="text-xs text-gray-400 mt-1">
          {countMeaningfulWords(newDescription || description)} meaningful words
        </div>
      </div>

      {/* Inline row: Language + Release Rights (+ sourceLabel if others) */}
      <div className="flex flex-wrap gap-3 justify-around items-end mb-3">
        <div className="w-1/3 min-w-[260px]">
          <label className="block text-xs font-medium mb-1">Language</label>
          <Select
            onValueChange={(val: string) => {
              setNewLanguage(val);
              markChanged();
            }}
          >
            <SelectTrigger
              className={`w-full ${!editMode ? 'bg-gray-200 pointer-events-none opacity-80' : ''}`}
            >
              <SelectValue placeholder={newLanguage || propLanguage || 'NA'} />
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

        <div className="w-1/3 min-w-[260px]">
          <label className="block text-xs font-medium mb-1">
            Release Rights
          </label>
          <Select
            value={relRights || release_rights}
            onValueChange={(val: string) => {
              setRelRights(val);
              markChanged();
              if (val !== 'others') setSourceLabel('');
            }}
          >
            <SelectTrigger
              className={`w-full ${!editMode ? 'bg-gray-200 pointer-events-none opacity-80' : ''}`}
            >
              <SelectValue
                placeholder={
                  relRights || release_rights || 'Select release rights'
                }
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

        {relRights === 'others' && (
          <div className="w-full min-w-[200px]">
            <label className="block text-xs font-medium mb-1">
              Source Label
            </label>
            <Input
              className={!editMode ? 'bg-gray-200' : ''}
              value={sourceLabel}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setSourceLabel(e.target.value);
                markChanged();
              }}
              readOnly={!editMode}
              placeholder="Specify source"
            />
          </div>
        )}
      </div>

      {showHistory && (
        <div className="mb-4 border rounded-lg bg-white p-3">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-gray-500" />
            <h4 className="text-sm font-semibold">Edit history (changes)</h4>
            {loadingHistory && (
              <span className="text-xs text-gray-500 ml-2">loading...</span>
            )}
            {error && (
              <span className="text-xs text-red-500 ml-2">{error}</span>
            )}
            {!loadingHistory && history.length === 0 && (
              <span className="text-xs text-gray-500 ml-2">
                no history found
              </span>
            )}
          </div>

          <ul className="space-y-2">
            {history.map((entry) => {
              const uid = entry.uid ?? JSON.stringify(entry).slice(0, 8);
              const isExpanded = expandedVersionUid === uid;
              const versionNumber = entry.version_number ?? '—';
              const changedBy = entry.changed_by ?? 'N/A';
              const createdAt = entry.created_at ?? undefined;

              return (
                <li
                  key={uid}
                  className="border rounded-lg overflow-hidden bg-white"
                >
                  <button
                    onClick={() => toggleExpandVersion(uid)}
                    className="w-full flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="text-left">
                      <p className="font-semibold text-gray-800">
                        Version {versionNumber}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(createdAt)} by{' '}
                        <span className="font-medium">{changedBy}</span>
                      </p>
                    </div>
                    <div>
                      {isExpanded ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-4 bg-white">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
                        <p>
                          <strong className="text-gray-600">
                            Change Type:
                          </strong>{' '}
                          <span className="font-mono bg-gray-100 px-1 rounded">
                            {entry.change_type || 'N/A'}
                          </span>
                        </p>
                        <p>
                          <strong className="text-gray-600">
                            Change Source:
                          </strong>{' '}
                          <span className="font-mono bg-gray-100 px-1 rounded">
                            {entry.change_source || 'N/A'}
                          </span>
                        </p>
                      </div>
                      {entry.field_changes &&
                        Object.keys(entry.field_changes).length > 0 && (
                          <div>
                            <strong className="text-base font-semibold text-gray-700">
                              Field Changes:
                            </strong>
                            <ul className="mt-2 space-y-2">
                              {Object.entries(entry.field_changes).map(
                                ([field, change]: [
                                  string,
                                  { old_value: unknown; new_value: unknown },
                                ]) => {
                                  // Format field name to be more readable
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
                                      className="p-2 border rounded-md bg-gray-50"
                                    >
                                      <strong className="font-semibold text-gray-800">
                                        {formattedField}
                                      </strong>
                                      <div className="flex items-center mt-1">
                                        <span className="text-xs font-medium text-red-500 mr-2">
                                          OLD:
                                        </span>
                                        <span className="font-mono text-sm text-red-700 bg-red-50 p-1 rounded line-through">
                                          {String(change.old_value ?? 'N/A')}
                                        </span>
                                      </div>
                                      <div className="flex items-center mt-1">
                                        <span className="text-xs font-medium text-green-500 mr-2">
                                          NEW:
                                        </span>
                                        <span className="font-mono text-sm text-green-700 bg-green-50 p-1 rounded">
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

      {/* Media (now below history) */}
      <div style={{ maxHeight: '25rem' }} className="mb-3">
        {renderMedia()}
      </div>

      <div className="text-xs text-gray-500 mt-1">
        *If not changed anything then default for all will be yes.
      </div>

      {/* Actions */}
      <div className="flex justify-center mt-4 gap-3">
        {changed && (
          <button
            className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition ${isSubmitting ? 'opacity-50' : ''}`}
            onClick={handleEditAndSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Changes'}
          </button>
        )}

        {changed && (
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
            className="px-4 py-2 border rounded"
          >
            Cancel Editing
          </button>
        )}
      </div>

      {submitError && (
        <div className="text-xs text-red-500 mt-1 ml-1 font-medium text-center">
          {submitError}
        </div>
      )}
    </div>
  );
};

export default PeerReviewCard;

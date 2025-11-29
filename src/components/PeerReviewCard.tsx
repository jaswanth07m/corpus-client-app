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

  const handleEditAndSubmit = () => {
    setSubmitError(null);
    // replace with actual PATCH/PUT
    console.log('Edit & Submit payload:', {
      title: newTitle,
      description: newDescription,
      language: newLanguage,
      release_rights: relRights,
      source_label: relRights === 'others' ? sourceLabel : undefined,
    });
    setChanged(false);
    setEditMode(false);
  };

  const handleSubmit = () => {
    setSubmitError(null);
    console.log('Submit payload (no edits):', {
      title,
      description,
      release_rights,
    });
  };

  // fetch history for current record_id (lazy)
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

  useEffect(() => {
    if (showHistory && history == null) {
      fetchRecordHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHistory, record_id]);

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
            onClick={() => setShowHistory((s) => !s)}
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
            <h4 className="text-sm font-semibold">Edit history (snapshots)</h4>
            {loadingHistory && (
              <span className="text-xs text-gray-500 ml-2">loading...</span>
            )}
            {error && (
              <span className="text-xs text-red-500 ml-2">{error}</span>
            )}
            {!loadingHistory && history && history.length === 0 && (
              <span className="text-xs text-gray-500 ml-2">
                no history found
              </span>
            )}
          </div>

          <ul className="space-y-2">
            {history &&
              history.map((entry) => {
                const uid =
                  entry.uid ??
                  entry.record_id ??
                  JSON.stringify(entry).slice(0, 8);
                const isExpanded = expandedVersionUid === uid;
                const versionNumber = entry.version_number ?? '—';
                const changedBy =
                  entry.changed_by ?? entry.record_snapshot?.user_id ?? 'N/A';
                const createdAt =
                  entry.created_at ??
                  entry.record_snapshot?.snapshot_timestamp ??
                  undefined;
                const snapshot = entry.record_snapshot ?? null;

                return (
                  <li
                    key={uid}
                    className="border rounded-lg overflow-hidden bg-gray-50"
                  >
                    <button
                      onClick={() => toggleExpandVersion(uid)}
                      className="w-full flex justify-between items-center p-3 bg-white hover:bg-gray-50 transition-colors"
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

                    {isExpanded && snapshot && (
                      <div className="p-3 bg-white border-t">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="text-xs text-gray-500">Title</div>
                            <div className="font-medium text-gray-800 break-words">
                              {snapshot.title ?? '—'}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-500">
                              Language
                            </div>
                            <div className="font-medium text-gray-800">
                              {snapshot.language ?? '—'}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-500">
                              Release Rights
                            </div>
                            <div className="font-medium text-gray-800">
                              {snapshot.release_rights ?? '—'}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-500">
                              Snapshot Time
                            </div>
                            <div className="font-medium text-gray-800">
                              {formatDate(
                                snapshot.snapshot_timestamp ??
                                  snapshot.updated_at,
                              )}
                            </div>
                          </div>

                          <div className="md:col-span-2">
                            <div className="text-xs text-gray-500">
                              Description
                            </div>
                            <div className="text-gray-800">
                              {snapshot.description ?? '—'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {isExpanded && !snapshot && (
                      <div className="p-3 text-sm text-gray-600">
                        No snapshot available for this version.
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
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            onClick={handleSubmit}
          >
            Submit Changes
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

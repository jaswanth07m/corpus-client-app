import React, { useEffect, useState } from 'react';
import { User } from 'lucide-react'; // profile icon
import { Link } from 'react-router-dom';
import { Input } from './ui/input';
import { StarRating } from './StarRating';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Value } from '@radix-ui/react-select';

interface PeerReviewCardProps {
  user_id: string;
  title: string;
  description: string;
  media_type: string;
  release_rights: string;
  dataUrl: string;
  // optional incoming language if you ever provide it
  language?: string;
  location?: string;
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
  {
    key: 'creator',
    value: 'This work is created by me and anyone is free to use it.',
  },
  {
    key: 'download',
    value:
      "I downloaded this from the internet and/or I don't know if it is free to share.",
  },
  {
    key: 'others',
    value: 'Others',
  },
];

const PeerReviewCard: React.FC<PeerReviewCardProps> = ({
  user_id,
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

  const [rating, setRating] = useState(0);

  const [titleError, setTitleError] = useState<string | null>(null);
  const [descError, setDescError] = useState<string | null>(null);
  const [sumbitError, setSubmiteError] = useState<string | null>(null);

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
    if (rating === 0) {
      setSubmiteError('*Rating Must be given');
      return;
    }
    setSubmiteError(null);
    console.log('Edit & Submit payload:', {
      title: newTitle,
      description: newDescription,
      language: newLanguage,
      release_rights: relRights,
      source_label: relRights === 'others' ? sourceLabel : undefined,
      rating,
    });
    setChanged(false);
    setEditMode(false);
  };

  const handleSubmit = () => {
    if (rating === 0) {
      setSubmiteError('*Rating Must be given');
      return;
    }
    setSubmiteError(null);
    console.log('Submit payload (no edits):', {
      title,
      description,
      release_rights,
      rating,
    });
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

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Edit</label>
          <input
            type="checkbox"
            checked={editMode}
            onChange={(e) => {
              setEditMode(e.target.checked);
            }}
            className="w-4 h-4"
          />
        </div>
      </div>

      <div className="mb-2">
        <Input
          value={newTitle || (!editMode ? title : newTitle)}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const newTitle = e.target.value;
            setNewTitle(newTitle);
            if (newTitle.trim().length < 8) {
              setTitleError('Title must be at least 8 characters long.');
            } else if (countMeaningfulWords(newTitle) < 2) {
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
            const newDescription = e.target.value;
            setNewDescription(newDescription);
            if (newDescription.trim().length < 32) {
              setDescError('Description must be at least 32 characters long.');
            } else if (countMeaningfulWords(newDescription) < 10) {
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
          <label className={'block text-xs font-medium mb-1'}>Language</label>
          <Select
            value={newLanguage}
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
              if (val !== 'others') {
                setSourceLabel('');
              }
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
                  {opt.key}
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

      {/* Media */}
      <div style={{ maxHeight: '25rem' }} className="mb-3">
        {renderMedia()}
      </div>

      {/* Rating area */}
      <div className="rate bg-gray-50 p-1 justify-center flex px-10 rounded-xl border mt-4">
        <div className="mb-2">
          <label className="block font-medium mb-1">
            Your Rating of this post
          </label>
          <StarRating rating={rating} setRating={setRating} />
        </div>
      </div>

      <div className="text-xs text-gray-500 mt-1">
        *If not changed anything then default for all will be yes.
      </div>

      {/* Actions */}
      <div className="flex justify-center mt-4 gap-3">
        {changed ? (
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            onClick={handleEditAndSubmit}
          >
            Edit & Submit
          </button>
        ) : (
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            onClick={handleSubmit}
          >
            Submit
          </button>
        )}

        {/* Reset button reverts to prop values */}
        <button
          onClick={() => {
            setNewTitle(title ?? '');
            setNewDescription(description ?? '');
            setNewLanguage(propLanguage ?? '');
            setRelRights(release_rights ?? '');
            setSourceLabel('');
            setChanged(false);
            setSubmiteError(null);
            setTitleError(null);
            setDescError(null);
            setEditMode(false);
          }}
          className="px-4 py-2 border rounded"
        >
          Reset
        </button>
      </div>

      {sumbitError && (
        <div className="text-xs text-red-500 mt-1 ml-1 font-medium text-center">
          {sumbitError}
        </div>
      )}
    </div>
  );
};

export default PeerReviewCard;

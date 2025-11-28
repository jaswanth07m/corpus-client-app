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

interface PeerReviewCardProps {
  user_id: string;
  title: string;
  description: string;
  media_type: string;
  release_rights: string;
  dataUrl: string;
}

const PeerReviewCard: React.FC<PeerReviewCardProps> = ({
  user_id,
  title,
  description,
  media_type,
  release_rights,
  dataUrl,
}) => {
  const [titleRelevant, setTitleRelevant] = useState(true);
  const [descRelevant, setDescRelevant] = useState(true);
  const [validRelRight, setValidRelRight] = useState(true);
  const [changed, setChanged] = useState(false);

  const [rating, setRating] = useState(0);

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newRelRights, setNewRelRights] = useState<string>(
    String(release_rights ?? ''),
  );

  const [titleError, setTitleError] = useState<string | null>(null);
  const [descError, setDescError] = useState<string | null>(null);
  const [sumbitError, setSubmiteError] = useState<string | null>(null);

  const countMeaningfulWords = (s: string) => {
    return s.split(' ').filter((w) => w.length > 2).length;
  };

  useEffect(() => {
    const ch = !titleRelevant || !descRelevant || !validRelRight;
    setChanged(ch);
  }, [titleRelevant, descRelevant, validRelRight]);

  const handleEditAndSubmit = () => {
    if (rating == 0) {
      setSubmiteError('*Rating Must be given');
      return;
    }
    console.log('Edit');
  };

  const handleSubmit = () => {
    if (rating == 0) {
      setSubmiteError('*Rating Must be given');
      return;
    }
    console.log('normal');
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
      className="border shadow-md rounded-md p-4 mb-4 max-w-xl mx-auto"
    >
      <div className="flex gap-3 items-center mb-3">
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

      <p className="font-semibold text-gray-900 mb-1">{title}</p>

      <p className="text-gray-700 mb-3">{description}</p>
      <div className="text-xs text-black-500 mb-2 ">
        Release Rights: {release_rights}
      </div>

      <div style={{ maxHeight: '25rem' }} className="mb-3">
        {renderMedia()}
      </div>

      <div className="rate bg-gray-50 p-5 px-10 rounded-xl border mt-4">
        <h3 className="font-semibold text-center text-2xl text-gray-800 mb-3">
          Review
        </h3>

        <div className="flex justify-around">
          <div className="flex flex-col justify-between">
            <div className="mb-3">
              <label className="block font-medium mb-1">
                Is the title relevant?
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="titleCorrect"
                    onChange={() => setTitleRelevant(true)}
                    value="yes"
                    className="w-4 h-4"
                  />
                  Yes
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="titleCorrect"
                    onChange={() => setTitleRelevant(false)}
                    value="no"
                    className="w-4 h-4"
                  />
                  No
                </label>
              </div>
            </div>

            <div className="mb-3">
              <label className="block font-medium mb-1">
                Are Release-Rights Valid?
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="release-rights-correct"
                    onChange={() => setValidRelRight(true)}
                    value="yes"
                    className="w-4 h-4"
                  />
                  Yes
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="release-rights-correct"
                    onChange={() => setValidRelRight(false)}
                    value="no"
                    className="w-4 h-4"
                  />
                  No
                </label>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between">
            <div className="mb-3">
              <label className="block font-medium mb-1">
                Is the description relevant?
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="descriptionCorrect"
                    onChange={() => {
                      setDescRelevant(true);
                    }}
                    value="yes"
                    className="w-4 h-4"
                  />
                  Yes
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="descriptionCorrect"
                    onChange={() => {
                      setDescRelevant(false);
                    }}
                    value="no"
                    className="w-4 h-4"
                  />
                  No
                </label>
              </div>
            </div>

            <div className="mb-2">
              <label className="block font-medium mb-1">
                Your Rating of this post
              </label>
              <StarRating rating={rating} setRating={setRating} />
            </div>
          </div>
        </div>

        {changed && !titleRelevant && (
          <div>
            <Input
              required
              type="text"
              placeholder="Enter relevant title"
              onChange={(e) => {
                const newTitle = e.target.value;
                setNewTitle(newTitle);
                if (newTitle.trim().length < 8) {
                  setTitleError('*Title must be at least 8 characters long.');
                } else if (countMeaningfulWords(newTitle) < 2) {
                  setTitleError(
                    '*Title must contain at least 2 meaningful words.',
                  );
                } else {
                  setTitleError(null);
                }
              }}
            />
            {titleError && (
              <div className="text-xs text-red-500 mt-1 ml-1 font-medium">
                {titleError}
              </div>
            )}
          </div>
        )}
        {changed && !descRelevant && (
          <div className="mt-2">
            <Input
              required
              type="text"
              placeholder="Enter relevant Desc"
              onChange={(e) => {
                const newDescription = e.target.value;
                setNewDesc(newDescription);
                if (newDescription.trim().length < 32) {
                  setDescError(
                    '*Description must be at least 32 characters long.',
                  );
                } else if (countMeaningfulWords(newDescription) < 10) {
                  setDescError(
                    '*Description must contain at least 10 meaningful words.',
                  );
                } else {
                  setDescError(null);
                }
              }}
            />
            {descError && (
              <div className="text-xs text-red-500 mt-1 ml-1 font-medium">
                {descError}
              </div>
            )}
          </div>
        )}

        {changed && !validRelRight && (
          <div className="mt-2">
            <Select value={newRelRights} onValueChange={setNewRelRights}>
              <SelectTrigger>
                <SelectValue
                  defaultValue={'Please Select Correct Release Type'}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="creator">Creator</SelectItem>
                <SelectItem value="downloaded">Denied</SelectItem>
                <SelectItem value="others">Others</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 mt-1">
        *If not changed anything then default for all will be yes.
      </div>

      <div className="flex justify-center mt-4">
        {changed ? (
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-blue-700 transition"
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

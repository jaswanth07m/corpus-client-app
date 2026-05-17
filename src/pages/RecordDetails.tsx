import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  User,
  Loader2,
  Download,
  Link as LinkIcon,
  Clock,
  MapPin,
  FileText,
  Globe,
  Shield,
  UserCircle,
  Tag,
  Check,
  X,
  Music,
  Pencil,
  Save,
} from 'lucide-react';
import { BACKEND_URL } from '@/lib/constants';
import { toast } from 'sonner';
import CopyUrlButton from '@/components/CopyUrlButton';
import { ContributionItem } from '@/components/MediaDetailModal';
import CategoryTags from '@/components/CategoryTags';
import { useLanguages } from '@/lib/languages';

const RecordDetails: React.FC<{ isSharedView?: boolean }> = ({
  isSharedView = false,
}) => {
  const { languages } = useLanguages();
  const { t } = useTranslation();
  const { recordId } = useParams<{ recordId: string }>();
  const [record, setRecord] = useState<ContributionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [autoLoadAttempted, setAutoLoadAttempted] = useState(false);
  const [copied, setCopied] = useState(false);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    language: '',
    release_rights: '',
    category_ids: [] as string[],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isUuid = (value: string) =>
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
      value,
    );

  const normalizeCategoryIds = (categoryIds: string[]) =>
    categoryIds
      .map((id) => {
        const normalized = id.trim().startsWith('urn:uuid:')
          ? id.trim().slice('urn:uuid:'.length)
          : id.trim();
        return isUuid(normalized) ? normalized : null;
      })
      .filter((id): id is string => Boolean(id));

  useEffect(() => {
    const fetchRecordDetails = async () => {
      if (!recordId) return;

      setLoading(true);
      setError(null);

      try {
        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
          throw new Error('Authentication required');
        }
        setToken(storedToken);

        const response = await fetch(`${BACKEND_URL}/records/${recordId}`, {
          method: 'GET',
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setRecord(data);

        // Determine current user ID from various possible localStorage keys
        const rawUser = localStorage.getItem('user');
        const parsedUser = rawUser ? JSON.parse(rawUser) : {};

        const currentUserId =
          localStorage.getItem('user_id') ||
          localStorage.getItem('id') ||
          parsedUser?.id ||
          parsedUser?.user_id ||
          parsedUser?.sub;

        const isOwner =
          String(currentUserId).trim() === String(data.user_id).trim();

        // Debug logs (temporary)
        console.log('currentUserId:', currentUserId);
        console.log('data.user_id:', data.user_id);
        console.log('isOwnProfile result:', isOwner);

        setIsOwnProfile(isOwner);

        if (
          data.media_type &&
          ['audio', 'video', 'document', 'image'].includes(data.media_type)
        ) {
          try {
            const mediaResponse = await fetch(
              `${BACKEND_URL}/records/${recordId}/record-url?expires_minutes=60`,
              {
                method: 'GET',
                headers: {
                  Authorization: `Bearer ${storedToken}`,
                  'Content-Type': 'application/json',
                },
              },
            );
            if (mediaResponse.ok) {
              const mediaData = await mediaResponse.json();
              if (mediaData.record_url) {
                setPreviewUrl(mediaData.record_url);
              }
            }
          } catch (mediaErr) {
            console.error('Error fetching media URL:', mediaErr);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRecordDetails();
  }, [recordId]);

  useEffect(() => {
    const autoLoadMedia = async () => {
      if (
        isSharedView &&
        record &&
        ['image', 'audio', 'video', 'document'].includes(
          record.media_type || '',
        ) &&
        !previewUrl &&
        !autoLoadAttempted
      ) {
        setAutoLoadAttempted(true);
        try {
          const storedToken = localStorage.getItem('token') || token;
          const mediaResponse = await fetch(
            `${BACKEND_URL}/records/${recordId}/record-url?expires_minutes=60`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${storedToken}`,
                'Content-Type': 'application/json',
              },
            },
          );
          if (mediaResponse.ok) {
            const mediaData = await mediaResponse.json();
            if (mediaData.record_url) {
              setPreviewUrl(mediaData.record_url);
            }
          }
        } catch (mediaErr) {
          console.error('Error auto-loading media:', mediaErr);
        }
      }
    };

    if (record) {
      autoLoadMedia();
    }
  }, [record, isSharedView, recordId, token, previewUrl, autoLoadAttempted]);

  const formatSizeMB = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${(bytes / 1024).toFixed(2)} KB` : `${mb.toFixed(2)} MB`;
  };

  const formatTimestamp = (timestamp: string | undefined): string => {
    if (!timestamp) return 'Not available';
    try {
      return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return String(timestamp);
    }
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/shared/${recordId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(t('messages.linkCopiedSuccessfully'));
  };

  const handleEdit = () => {
    if (!record) return;
    setFormData({
      title: record.title || '',
      description: record.description || '',
      language: record.language || '',
      release_rights: record.release_rights || '',
      category_ids: normalizeCategoryIds(
        record.category_ids || (record.category_id ? [record.category_id] : []),
      ),
    });
    setSaveError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSaveError(null);
    // Reset form data to original values
    if (record) {
      setFormData({
        title: record.title || '',
        description: record.description || '',
        language: record.language || '',
        release_rights: record.release_rights || '',
        category_ids: normalizeCategoryIds(
          record.category_ids ||
            (record.category_id ? [record.category_id] : []),
        ),
      });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (categoryIds: string[]) => {
    setFormData((prev) => ({
      ...prev,
      category_ids: normalizeCategoryIds(categoryIds),
    }));
  };

  const handleSave = async () => {
    if (!record || !token || !recordId) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const categoryIds = normalizeCategoryIds(formData.category_ids);

      console.log('Sending to API:', {
        title: formData.title,
        description: formData.description,
        language: formData.language,
        release_rights: formData.release_rights,
        category_ids: categoryIds,
      });

      const response = await fetch(`${BACKEND_URL}/records/${recordId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          language: formData.language,
          release_rights: formData.release_rights,
          category_ids: categoryIds,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to update record';
        try {
          const errorData = await response.json();
          if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else if (typeof errorData?.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (Array.isArray(errorData?.detail)) {
            // FastAPI validation errors come as an array
            errorMessage = errorData.detail
              .map((e: unknown) => {
                if (
                  typeof e === 'object' &&
                  e !== null &&
                  'msg' in e &&
                  typeof (e as { msg?: unknown }).msg === 'string'
                ) {
                  return (e as { msg: string }).msg;
                }
                return JSON.stringify(e);
              })
              .join(', ');
          } else if (typeof errorData?.message === 'string') {
            errorMessage = errorData.message;
          } else {
            errorMessage = JSON.stringify(errorData);
          }
        } catch {
          errorMessage = `HTTP error: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const updatedRecord = await response.json();
      console.log('API response:', updatedRecord);
      setRecord((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          ...updatedRecord,
          title: formData.title,
          description: formData.description,
          language: formData.language,
          release_rights: formData.release_rights,
          category_ids: categoryIds,
        };
      });
      toast.success(t('messages.recordUpdatedSuccessfully'));
      setIsEditing(false);
      setSaveError(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : JSON.stringify(error);
      setSaveError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4 font-medium">
            {t('messages.error')}
            {error}
          </p>
          <Link to="/" className="text-blue-600 hover:underline">
            {t('common.goBackHome')}
          </Link>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{t('common.recordNotFound')}</p>
          <Link to="/" className="text-blue-600 hover:underline">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  const fileSize =
    record.size || record.file_size || record.fileSize || record.bytes;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Media Section - Full Width */}
        <div className="mb-8">
          {/* Creator Info - Inline at top */}
          <div className="mb-4">
            <Link
              to={`/profile/${record.user_id || record.user_name || record.username || ''}`}
              className="inline-flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center shadow-sm">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="block font-semibold text-gray-900">
                  {record.creator ||
                    record.user_name ||
                    record.username ||
                    'Unknown'}
                </span>
                <span className="block text-sm text-gray-500">
                  @
                  {record.user_name ||
                    record.username ||
                    record.user_id ||
                    'unknown'}
                </span>
              </div>
            </Link>
          </div>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gray-900">
            {record.media_type === 'document' ? (
              previewUrl ? (
                <div className="w-full h-[500px] flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                  <FileText className="w-20 h-20 text-blue-500 mb-4" />
                  <p className="text-xl font-semibold text-gray-700 mb-4">
                    {record.title || 'Document'}
                  </p>
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    {t('common.viewDocument')}
                  </a>
                </div>
              ) : (
                <div className="w-full h-[500px] flex items-center justify-center bg-gray-800">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
                </div>
              )
            ) : record.media_type === 'image' ? (
              previewUrl ? (
                <img
                  src={previewUrl}
                  alt={record.title || 'Image'}
                  className="w-full h-[500px] object-contain bg-gray-900"
                />
              ) : (
                <div className="w-full h-[500px] flex items-center justify-center bg-gray-800">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
                </div>
              )
            ) : previewUrl ? (
              <div>
                {record.media_type === 'audio' ? (
                  <div className="w-full py-8 bg-slate-50 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg mb-4">
                      <Music size={36} className="text-white" />
                    </div>
                    <div className="w-full max-w-md px-4">
                      <audio src={previewUrl} controls className="w-full" />
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-slate-600 font-medium">
                        Audio Track
                      </span>
                    </div>
                  </div>
                ) : (
                  <video
                    src={previewUrl}
                    className="w-full h-[500px] object-contain bg-gray-900"
                    controls
                    preload="metadata"
                  />
                )}
              </div>
            ) : (
              <div className="w-full h-[500px] flex items-center justify-center bg-gray-800">
                <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
              </div>
            )}
          </div>
        </div>

        {/* Copy Link Button */}
        <div className="flex justify-end -mt-2 mb-6">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-600" />
            ) : (
              <LinkIcon className="w-3.5 h-3.5" />
            )}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Details Card */}
          <div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-6 pt-5 pb-2 flex items-center justify-between">
                <span className="inline-block px-3 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg shadow-sm">
                  Details
                </span>

                {!isEditing && isOwnProfile && (
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 rounded-lg shadow-sm transition-all flex items-center gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                )}

                {isEditing && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
              <div className="p-6 pt-2 space-y-5">
                {/* Title & Description */}
                <div className="border-b border-gray-100 pb-5">
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full text-2xl font-bold text-gray-900 mb-3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Enter title..."
                      />
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-gray-600 leading-relaxed"
                        placeholder="Enter description..."
                      />
                    </>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold text-gray-900 mb-3">
                        {record.title || 'Untitled'}
                      </h2>
                      <p className="text-gray-600 leading-relaxed">
                        {record.description || 'No description available'}
                      </p>
                    </>
                  )}
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Timestamp - always read-only */}
                  <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-blue-50 transition-colors group">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                        Date
                      </p>
                      <p className="text-sm font-semibold text-gray-800">
                        {formatTimestamp(record.timestamp || record.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Location - always read-only */}
                  <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-blue-50 transition-colors group">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                        Location
                      </p>
                      <p className="text-sm font-semibold text-gray-800">
                        {record.location &&
                        typeof record.location.latitude === 'number' &&
                        typeof record.location.longitude === 'number'
                          ? `${record.location.latitude.toFixed(4)}, ${record.location.longitude.toFixed(4)}`
                          : 'Not available'}
                      </p>
                    </div>
                  </div>

                  {/* File Size - always read-only */}
                  <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-blue-50 transition-colors group">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                        Size
                      </p>
                      <p className="text-sm font-semibold text-gray-800">
                        {fileSize ? formatSizeMB(fileSize) : 'Not available'}
                      </p>
                    </div>
                  </div>

                  {/* Language - editable in edit mode */}
                  <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-blue-50 transition-colors group">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <Globe className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                        Language
                      </p>
                      {isEditing ? (
                        <select
                          name="language"
                          value={formData.language || ''}
                          onChange={handleSelectChange}
                          className="w-full px-2 py-1 text-sm font-semibold text-gray-800 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        >
                          <option value="">
                            {t('common.SelectALanguage')}
                          </option>
                          {languages.map((lang) => (
                            <option key={lang} value={lang}>
                              {lang}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-sm font-semibold text-gray-800">
                          {record.language || 'Not specified'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Release Rights - editable in edit mode */}
                  <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-blue-50 transition-colors group">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                        Rights
                      </p>
                      {isEditing ? (
                        <select
                          name="release_rights"
                          value={formData.release_rights || ''}
                          onChange={handleSelectChange}
                          className="w-full px-2 py-1 text-sm font-semibold text-gray-800 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        >
                          <option value="">
                            {t('common.selectReleaseRights')}
                          </option>
                          <option value="creator">
                            {t(
                              'ui.this.work.is.created.by.me.and.anyone.is.free.to.use.it',
                            )}
                          </option>
                          <option value="others">{t('common.others')}</option>
                          <option value="downloaded">
                            {t(
                              'common.iDownloadedThisFromTheInternetAndorIDontKnowIfItIsFreeToShare',
                            )}
                          </option>
                        </select>
                      ) : (
                        <p className="text-sm font-semibold text-gray-800">
                          {record.release_rights || 'Not specified'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Categories */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-5 h-5 text-blue-600" />
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Categories
                    </p>
                  </div>
                  {isEditing ? (
                    <CategoryTags
                      categoryIds={formData.category_ids}
                      token={token}
                      editable={true}
                      onCategoryIdsChange={handleCategoryChange}
                    />
                  ) : (
                    <CategoryTags
                      categoryIds={
                        record.category_ids ||
                        (record.category_id ? [record.category_id] : [])
                      }
                      token={token}
                    />
                  )}
                </div>

                {/* Reviewed Badge */}
                {record.reviewed && (
                  <div className="pt-3">
                    <span className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
                      <Check className="w-4 h-4 mr-1.5" />
                      {t('common.reviewedAndVerified')}
                    </span>
                  </div>
                )}

                {/* Save Error */}
                {saveError && isEditing && (
                  <div className="pt-3">
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                      {saveError}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordDetails;

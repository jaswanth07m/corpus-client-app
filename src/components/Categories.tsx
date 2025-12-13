import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  LogOut,
  User,
  Type,
  Mic,
  Video,
  Camera,
  FileText,
  FileCheck,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import ContentInput from './ContentInput';
import { BACKEND_URL } from '@/lib/constants';
import posthog from 'posthog-js';

const decodeJWTToken = (token: string): { exp: number; sub: string } | null => {
  try {
    // JWT tokens have 3 parts separated by dots: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT token format');
    }

    // Decode the payload (second part)
    const payload = parts[1];

    // Add padding if needed (JWT base64 encoding might not have padding)
    const paddedPayload = payload + '='.repeat((4 - (payload.length % 4)) % 4);

    // Decode base64
    const decodedPayload = atob(paddedPayload);

    // Parse JSON
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
};

interface Category {
  id: string;
  name: string;
  title: string;
  description: string;
  published: boolean;
  rank: number;
  created_at: string;
  updated_at: string;
}

interface CategoriesProps {
  token: string;
  onBack: () => void;
  onLogout: () => void;
  //onProfile: () => void;
  onContentInput: (categoryId: string, categoryName: string) => void;
  onSessionExpired?: () => void; // Add this prop for session expiration callback
  preSelectedMediaType?:
    | 'text'
    | 'audio'
    | 'video'
    | 'image'
    | 'document'
    | null;
  preSelectedCategoryId?: string | null;
  preSelectedCategoryName?: string | null;
}

interface UploadOption {
  type: 'text' | 'audio' | 'video' | 'image' | 'document';
  icon: React.ReactNode;
  title: string;
  description: string;
  accept: string;
}

const Categories: React.FC<CategoriesProps> = ({
  token,
  onBack,
  onLogout,
  //onProfile,
  onContentInput,
  onSessionExpired,
  preSelectedMediaType,
  preSelectedCategoryId,
  preSelectedCategoryName,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [uploadMode, setUploadMode] = useState<
    'text' | 'audio' | 'video' | 'image' | 'document' | null
  >(null);
  const [title, setTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [uploading, setUploading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [locationRequested, setLocationRequested] = useState(false);
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [userId, setUserId] = useState<string>('');
  const [description, setDescription] = useState(''); // New state for description
  const [descriptionError, setDescriptionError] = useState(false); // New state for description error

  const [releaseRights, setreleaseRights] = useState('');
  const [creator, setCreator] = useState('');
  const [selectedLanguage, setSelectedLangugae] = useState('');

  const CHUNK_SIZE = 5 * 1024 * 1024; // 40MB maximum per chunk
  const MAX_RETRY_ATTEMPTS = 5; // Maximum retry attempts per chunk
  const RETRY_DELAY_MS = 1000; // Base delay for exponential backoff

  const [uploadUuid, setUploadUuid] = useState<string>('');
  const [uploadedChunks, setUploadedChunks] = useState<Set<number>>(new Set());
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const [userSearch, setUserSearch] = useState<string>('');
  const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false);

  const uploadOptions: UploadOption[] = [
    {
      type: 'text',
      icon: <Type className="h-8 w-8" />,
      title: 'Text Input',
      description: 'Type your content',
      accept: '',
    },
    {
      type: 'audio',
      icon: <Mic className="h-8 w-8" />,
      title: 'Audio Recording',
      description: 'Record your voice',
      accept: 'audio/*',
    },
    {
      type: 'video',
      icon: <Video className="h-8 w-8" />,
      title: 'Video Content',
      description: 'Record or upload video',
      accept: 'video/*',
    },
    {
      type: 'image',
      icon: <Camera className="h-8 w-8" />,
      title: 'Photo Capture',
      description: 'Take or upload photos',
      accept: 'image/*',
    },
    {
      type: 'document' as const,
      icon: <FileText className="w-6 h-6" />,
      title: 'Document Upload',
      description: 'Upload document files (PDF, DOCX, etc.)',
      accept: '.pdf,.doc,.docx,.txt',
    },
  ];

  // Helper function to check if the response indicates session expiration
  const isSessionExpired = (response: Response): boolean => {
    return response.status === 401 || response.status === 403;
  };

  // Helper function to handle session expiration
  const handleSessionExpiration = (
    message: string = 'Session expired. Please login again.',
  ) => {
    toast.error(message);
    // Clear any stored auth data
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');

    // Call the session expired callback if provided
    if (onSessionExpired) {
      onSessionExpired();
    } else {
      // Fallback: call onLogout if no specific handler
      onLogout();
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-select media type if pre-selected from MediaTypeWheel
  useEffect(() => {
    if (preSelectedMediaType) {
      console.log('Setting upload mode to:', preSelectedMediaType);
      // Just set upload mode, user will select category from dropdown
      setUploadMode(preSelectedMediaType);
      setShowUploadOptions(false);
      if (!locationRequested && !location) {
        requestLocation();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preSelectedMediaType]);

  // REPLACE YOUR EXISTING fetchUserProfile FUNCTION WITH THIS
  const fetchUserProfile = async () => {
    try {
      // First try to decode user ID from JWT token
      const tokenPayload = decodeJWTToken(token);
      if (tokenPayload) {
        // Check if token is expired
        if (tokenPayload.exp && Date.now() >= tokenPayload.exp * 1000) {
          handleSessionExpiration(
            'Your session has expired. Please login again.',
          );
          return;
        }

        const userId = tokenPayload.sub;
        if (userId) {
          setUserId(userId.toString());
          return; // Exit early if we got the user ID from token
        }
      }

      // Fallback: Try to fetch from API
      const response = await fetch(`${BACKEND_URL}/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (isSessionExpired(response)) {
        handleSessionExpiration(
          'Your session has expired. Please login again.',
        );
        return;
      }

      if (response.ok) {
        const userData = await response.json();

        // Try multiple possible field names for user ID
        const userId =
          userData.id || userData.uid || userData.user_id || userData.sub;
        if (userId) {
          setUserId(userId.toString());
        } else {
          console.error('User ID not found in profile response:', userData);
          toast.error('User ID not found. Please try logging in again.');
        }
      } else {
        console.error('Failed to fetch user profile, status:', response.status);
        const errorData = await response.json().catch(() => ({}));
        console.error('Profile fetch error:', errorData);
        toast.error(
          'Failed to get user information. Please try logging in again.',
        );
      }
    } catch (error) {
      console.error('User profile error:', error);
      toast.error(
        'Failed to get user information. Please try logging in again.',
      );
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/categories/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (isSessionExpired(response)) {
        handleSessionExpiration(
          'Your session has expired. Please login again.',
        );
        return;
      }

      if (response.ok) {
        const data = await response.json();
        const publishedCategories = data
          .filter((cat: Category) => cat.published)
          .sort((a: Category, b: Category) => a.rank - b.rank);
        setCategories(publishedCategories);
      } else {
        toast.error('Failed to fetch categories');
      }
    } catch (error) {
      console.error('Categories Error:', error);
      toast.error('Network error. Please try again.');
    }
    setLoading(false);
  };

  const getCategoryIcon = (name: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      fables: '📚',
      events: '🎉',
      music: '🎵',
      places: '🏛️',
      food: '🍽️',
      people: '👥',
      literature: '📖',
      architecture: '🏗️',
      skills: '⚡',
      images: '🖼️',
      culture: '🎭',
      'flora_&_fauna': '🌿',
      education: '🎓',
      vegetation: '🌱',
      folk_songs: '🎶',
      traditional_skills: '🛠️',
      local_cultural_history: '🏛️',
      local_history: '📜',
      food_agriculture: '🌾',
      old_newspapers: '📰',
      'folk tales': '📓',
    };
    return iconMap[name] || '📂';
  };

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
    setShowUploadOptions(true);
  };

  const handleUploadOptionSelect = (option: UploadOption) => {
    resetUploadState();
    setUploadMode(option.type);
    setShowUploadOptions(false);
    if (!locationRequested && !location) {
      requestLocation();
    }
  };

  const requestLocation = () => {
    setLocationError('');
    setLocationRequested(true);
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      toast.error('Geolocation not supported');
      setShowManualLocation(true);
      return;
    }

    toast.info('Requesting location access...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationError('');
        setShowManualLocation(false);
        toast.success('Location access granted!');
      },
      (error) => {
        console.error('Location error:', error);
        let errorMessage = 'Location access failed. ';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage +=
              'Please allow location access in your browser settings, reload the page, or enter your location manually.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
            break;
        }

        setLocationError(errorMessage);
        toast.error(errorMessage);
        setShowManualLocation(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      },
    );
  };

  const handleManualLocationSubmit = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || isNaN(lng)) {
      toast.error('Please enter valid latitude and longitude values');
      return;
    }

    if (lat < -90 || lat > 90) {
      toast.error('Latitude must be between -90 and 90');
      return;
    }

    if (lng < -180 || lng > 180) {
      toast.error('Longitude must be between -180 and 180');
      return;
    }

    setLocation({ lat, lng });
    setLocationError('');
    setShowManualLocation(false);
    toast.success('Location set manually!');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    resetUploadState();
    if (file) {
      setSelectedFile(file);
    }
  };

  // Step 2.1: Create Chunk Upload Function
  const uploadChunk = async (
    chunk: Blob,
    chunkIndex: number,
    totalChunks: number,
    uploadUuid: string,
    filename: string,
  ): Promise<boolean> => {
    const maxRetries = MAX_RETRY_ATTEMPTS;
    let attempt = 0;

    while (attempt < maxRetries) {
      await new Promise((resolve) =>
        setTimeout(resolve, attempt * 1.1 ** attempt * 1000),
      );
      try {
        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('filename', filename);
        formData.append('chunk_index', chunkIndex.toString());
        formData.append('total_chunks', totalChunks.toString());
        formData.append('upload_uuid', uploadUuid);

        const response = await fetch(`${BACKEND_URL}/records/upload/chunk`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (response.ok) {
          return true;
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error(`Upload failed (attempt ${attempt + 1}):`, errorData);

          if (response.status === 401 || response.status === 403) {
            handleSessionExpiration(
              'Session expired during upload. Please login again.',
            );
            return false;
          }
        }
      } catch (error) {
        console.error(`Upload error (attempt ${attempt + 1}):`, error);
      }

      attempt++;
      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    return false;
  };

  // Step 2.2: Create Lazy Chunk Reading Function
  const readChunk = async (file: File, chunkIndex: number): Promise<Blob> => {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    return file.slice(start, end);
  };

  const getTotalChunks = (file: File): number => {
    return Math.ceil(file.size / CHUNK_SIZE);
  };

  // Step 2.3: Create Upload Finalization Function
  const finalizeUpload = async ({
    uploadUuid,
    totalChunks,
    filename,
  }: {
    uploadUuid: string;
    totalChunks: number;
    filename: string;
  }): Promise<boolean> => {
    try {
      const formData = new FormData();
      formData.append('upload_uuid', uploadUuid);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category_id', selectedCategory!.id);
      formData.append('user_id', userId);
      formData.append('media_type', uploadMode || '');
      formData.append('latitude', location!.lat.toString());
      formData.append('longitude', location!.lng.toString());
      formData.append('use_uid_filename', 'false');
      formData.append('total_chunks', totalChunks.toString());
      formData.append('filename', filename);
      formData.append('release_rights', releaseRights);
      if (releaseRights === 'others') {
        formData.append('creator', creator);
      }
      formData.append('language', selectedLanguage);

      const response = await fetch(`${BACKEND_URL}/records/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Upload finalization failed:', errorData);
        toast.error(errorData.message);
        return false;
      }
    } catch (error) {
      console.error('Upload finalization error:', error);
      return false;
    }
  };

  // Step 3.2: Implement Lazy Chunk Upload Sequence
  const uploadChunksSequentially = async (
    file: File,
    uploadUuid: string,
  ): Promise<boolean> => {
    const totalChunks = getTotalChunks(file);
    let allChunksSuccessful = true;

    for (let i = 0; i < totalChunks; i++) {
      // Skip already uploaded chunks
      if (uploadedChunks.has(i)) {
        const progress = ((i + 1) / totalChunks) * 100;
        setUploadProgress(progress);
        continue;
      }

      // Read chunk lazily only when needed
      const chunk = await readChunk(file, i);

      const success = await uploadChunk(
        chunk,
        i,
        totalChunks,
        uploadUuid,
        file.name,
      );

      if (success) {
        setUploadedChunks((prev) => new Set([...prev, i]));
        // Update progress state
        const progress = ((i + 1) / totalChunks) * 100;
        setUploadProgress(progress);
      } else {
        allChunksSuccessful = false;
        break; // Stop on first failure, allow retry
      }
    }

    return allChunksSuccessful;
  };

  // Reset upload state function
  const resetUploadState = () => {
    // Reset Categories component upload state
    setUploadUuid('');
    setUploadedChunks(new Set());
    setUploadProgress(0);
    setIsUploading(false);
  };

  const partialResetUploadState = () => {
    setUploadProgress(0);
    setIsUploading(false);
  };

  // Step 3.1: Modify handleUpload Function
  const handleUpload = async () => {
    // Validation checks (existing logic)
    if (!selectedCategory || !title.trim()) {
      toast.error('Please provide a title');
      return;
    }

    if (!location) {
      toast.error(
        'Location is required. Please enable location access or enter manually.',
      );
      if (!showManualLocation) {
        setShowManualLocation(true);
      }
      return;
    }

    if (!userId) {
      toast.error('User ID not found. Please try logging in again.');
      return;
    }

    if (!releaseRights) {
      toast.error('Release Rights not found. Check for release rights');
      return;
    }

    if (releaseRights == 'downloaded') {
      toast.error(
        'Upload any works created by you or you can upload works of your family members/friends with their permission.',
      );
      return; // <-- Add return here to block upload if releaseRights is 'internet'
    }

    if (!selectedLanguage) {
      toast.error('Select a Langauge');
    }

    // Prepare file for upload
    let fileToUpload = selectedFile;
    if (uploadMode === 'text') {
      if (!textContent.trim()) {
        toast.error('Please enter text content');
        return;
      }
      const textBlob = new Blob([textContent], { type: 'text/plain' });
      fileToUpload = new File([textBlob], 'text-content.txt', {
        type: 'text/plain',
      });
    } else if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    // Initialize upload state
    const newUploadUuid = uploadUuid || crypto.randomUUID();
    setUploadUuid(newUploadUuid);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload chunks sequentially with lazy reading
      const success = await uploadChunksSequentially(
        fileToUpload!,
        newUploadUuid,
      );

      if (success) {
        const totalChunks = getTotalChunks(fileToUpload!);
        // Finalize upload
        const finalized = await finalizeUpload({
          uploadUuid: newUploadUuid,
          totalChunks: totalChunks,
          filename: fileToUpload!.name,
        });
        if (finalized) {
          toast.success(
            'Content uploaded successfully! Redirecting to Peer Review...',
          );
          resetUploadState();
          posthog.capture('upload_success');
          // Redirect to peer review after successful upload
          setTimeout(() => {
            window.location.href = '/peer-review';
          }, 1500);
        } else {
          posthog.capture('upload_finalization_failed');
          partialResetUploadState();
        }
      } else {
        posthog.capture('upload_error');
        toast.error('Upload failed. Please try again.');
        partialResetUploadState();
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Network error. Please check your connection and try again.');
      partialResetUploadState();
      posthog.capture('upload_error');
      posthog.captureException(error);
    }

    setIsUploading(false);
  };

  const handleBack = () => {
    // Go back to MediaTypeWheel by calling onBack
    onBack();
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setShowUploadOptions(false);
    setUploadMode(null);
    setTitle('');
    setTextContent('');
    setSelectedFile(null);
    setLocationRequested(false);
    setLocation(null);
    setLocationError('');
    setShowManualLocation(false);
    setManualLat('');
    setManualLng('');
  };

  // Debug log
  console.log(
    'Categories render - uploadMode:',
    uploadMode,
    'preSelectedMediaType:',
    preSelectedMediaType,
    'loading:',
    loading,
  );

  // Show upload form if uploadMode is set (even while loading categories)
  if (uploadMode) {
    console.log('Rendering ContentInput with uploadMode:', uploadMode);
    return (
      <ContentInput
        uploadMode={uploadMode}
        selectedCategory={selectedCategory}
        categories={categories}
        setSelectedCategory={setSelectedCategory}
        title={title}
        setTitle={setTitle}
        textContent={textContent}
        setTextContent={setTextContent}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
        location={location}
        setLocation={setLocation}
        locationError={locationError}
        setLocationError={setLocationError}
        showManualLocation={showManualLocation}
        setShowManualLocation={setShowManualLocation}
        manualLat={manualLat}
        setManualLat={setManualLat}
        manualLng={manualLng}
        setManualLng={setManualLng}
        uploading={uploading}
        token={token}
        userId={userId}
        description={description}
        setDescription={setDescription} // Pass setDescription
        descriptionError={descriptionError} // Pass descriptionError
        setDescriptionError={setDescriptionError} // Pass setDescriptionError
        onBack={handleBack}
        onUpload={handleUpload}
        requestLocation={requestLocation}
        handleManualLocationSubmit={handleManualLocationSubmit}
        handleFileSelect={handleFileSelect}
        // Phase 4: Chunked upload progress props
        chunkedUploadProgress={uploadProgress}
        isChunkedUploading={isUploading}
        releaseRights={releaseRights}
        setreleaseRights={setreleaseRights}
        creator={creator}
        setCreator={setCreator}
        selectedLanguage={selectedLanguage}
        setSelectedLangugae={setSelectedLangugae}
      />
    );
  }

  // Upload Options Modal
  if (showUploadOptions && selectedCategory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-4 max-w-7xl mx-auto">
            <button
              className="p-2.5 hover:bg-slate-100 rounded-xl transition-all duration-200 border border-slate-200 hover:border-slate-300"
              onClick={handleBackToCategories}
            >
              <ArrowLeft className="h-5 w-5 text-slate-700" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {selectedCategory.title}
              </h1>
              <p className="text-slate-600 text-base">
                Choose how you'd like to contribute
              </p>
            </div>
          </div>
        </div>

        {/* Upload Options */}
        <div className="px-6 py-10">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {uploadOptions.map((option) => (
                <div
                  key={option.type}
                  className="group cursor-pointer bg-white rounded-xl p-6 shadow-sm hover:shadow-lg border border-gray-200 hover:border-emerald-400 transition-all duration-300 hover:-translate-y-1"
                  onClick={() => handleUploadOptionSelect(option)}
                >
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="text-emerald-600 group-hover:scale-110 transition-transform duration-300">
                      {option.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2 text-slate-800 group-hover:text-emerald-600 transition-colors">
                        {option.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Categories View
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Instagram-like Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Swecha Corpus</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Conditionally render the search input field when visible */}
            {isSearchVisible && (
              <div className="flex flex-row items-center animate-fade-in">
                <div className="relative">
                  <input
                    className="text-slate-900 px-4 py-2.5 pl-10 rounded-l-xl text-sm sm:text-base w-56 sm:w-72 focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-slate-300 shadow-sm"
                    value={userSearch}
                    onKeyDown={(e) => {
                      if (e.key == 'Enter') {
                        e.preventDefault();
                        window.location.href = `/userProfile/${userSearch}`;
                        setIsSearchVisible(false);
                      }
                    }}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                    }}
                    placeholder="Search by User ID..."
                    type="text"
                    autoFocus
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
                <button
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-r-xl transition-all duration-200 shadow-sm"
                  onClick={() => {
                    window.location.href = `/userProfile/${userSearch}`;
                    setIsSearchVisible(false);
                  }}
                >
                  <Search size={20} className="text-white" />
                </button>
                <button
                  className="ml-2 p-2.5 hover:bg-slate-100 rounded-xl transition-all duration-200 border border-slate-200"
                  onClick={() => setIsSearchVisible(false)}
                  title="Close"
                >
                  <svg
                    className="w-5 h-5 text-slate-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}

            {/* Icon buttons with enhanced styling */}
            {!isSearchVisible && (
              <div className="relative group">
                <button
                  className="p-3 hover:bg-emerald-50 rounded-xl transition-all duration-200 border border-slate-200 hover:border-emerald-400 hover:shadow-md"
                  onClick={() => setIsSearchVisible(true)}
                >
                  <Search className="h-5 w-5 text-slate-700 group-hover:text-emerald-600" />
                </button>
                <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Search Users
                </span>
              </div>
            )}

            <Link to="/peer-review">
              <div className="relative group">
                <button className="p-3 hover:bg-emerald-50 rounded-xl transition-all duration-200 border border-slate-200 hover:border-emerald-400 hover:shadow-md">
                  <svg
                    className="h-5 w-5 text-slate-700 group-hover:text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </button>
                <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Peer Review
                </span>
              </div>
            </Link>

            <Link to="/annotations">
              <div className="relative group">
                <button className="p-3 hover:bg-amber-50 rounded-xl transition-all duration-200 border border-slate-200 hover:border-amber-400 hover:shadow-md">
                  <FileCheck className="h-5 w-5 text-slate-700 group-hover:text-amber-600" />
                </button>
                <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Annotations
                </span>
              </div>
            </Link>

            <Link to="/myprofile">
              <div className="relative group">
                <button className="p-3 hover:bg-blue-50 rounded-xl transition-all duration-200 border border-slate-200 hover:border-blue-400 hover:shadow-md">
                  <User className="h-5 w-5 text-slate-700 group-hover:text-blue-600" />
                </button>
                <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Profile
                </span>
              </div>
            </Link>

            <div className="relative group">
              <button
                className="p-3 hover:bg-red-50 rounded-xl transition-all duration-200 border border-slate-200 hover:border-red-400 hover:shadow-md"
                onClick={onLogout}
              >
                <LogOut className="h-5 w-5 text-slate-700 group-hover:text-red-600" />
              </button>
              <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Logout
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="flex-1 px-4 py-6 pb-24 overflow-y-auto bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Categories
            </h2>
            <p className="text-slate-600 text-sm">
              Choose a category to contribute content
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                onClick={() => handleCategoryClick(category)}
                className="group cursor-pointer bg-white rounded-xl p-6 shadow-sm hover:shadow-lg border border-gray-200 hover:border-emerald-400 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <span className="text-5xl group-hover:scale-110 transition-transform duration-300">
                    {getCategoryIcon(category.name)}
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-800 mb-2 group-hover:text-emerald-600 transition-colors text-lg">
                      {category.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                      {category.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Instagram-style Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 z-50 shadow-lg">
        <div className="flex items-center justify-around max-w-2xl mx-auto">
          <button
            onClick={() => (window.location.href = '/')}
            className="flex flex-col items-center gap-1 p-2 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <svg
              className="w-6 h-6 text-slate-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="text-xs text-slate-600">Home</span>
          </button>

          <Link
            to="/peer-review"
            className="flex flex-col items-center gap-1 p-2 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <svg
              className="w-6 h-6 text-slate-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span className="text-xs text-slate-600">Review</span>
          </Link>

          <Link
            to="/annotations"
            className="flex flex-col items-center gap-1 p-2 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <FileCheck className="w-6 h-6 text-slate-700" />
            <span className="text-xs text-slate-600">Annotate</span>
          </Link>

          <Link
            to="/myprofile"
            className="flex flex-col items-center gap-1 p-2 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <User className="w-6 h-6 text-slate-700" />
            <span className="text-xs text-slate-600">Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Categories;

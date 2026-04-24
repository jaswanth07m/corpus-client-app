import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { BACKEND_URL } from '@/lib/constants';
import {
  organisationTypes,
  workLocations,
  educationCategories,
  specificStreams,
  yearList,
  laptopOS,
  laptopRAM,
  mobileOS,
  mobileRAM,
  internetSpeeds,
  dailyDataLimits,
  internshipLanguages,
  proficiencyLevels,
  collegeList,
} from '@/lib/profileConstants';
import { toast } from 'sonner';
import {
  X,
  Pencil,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  Youtube,
  Music2,
  Globe,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  Building,
  Home,
  Heart,
  Camera,
  Volume2,
  MessageSquare,
  Hash,
  GlobeIcon,
  AtSign,
  Lock,
  Eye,
  EyeOff,
  Map,
  Navigation,
  Star,
  Earth,
} from 'lucide-react';
import LocationPicker from '@/components/LocationPicker';

// Define constants for dropdown options
const LANGUAGE_OPTIONS = [
  { value: 'assamese', label: 'Assamese' },
  { value: 'bengali', label: 'Bengali' },
  { value: 'bodo', label: 'Bodo' },
  { value: 'dogri', label: 'Dogri' },
  { value: 'gujarati', label: 'Gujarati' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'kannada', label: 'Kannada' },
  { value: 'kashmiri', label: 'Kashmiri' },
  { value: 'konkani', label: 'Konkani' },
  { value: 'maithili', label: 'Maithili' },
  { value: 'malayalam', label: 'Malayalam' },
  { value: 'marathi', label: 'Marathi' },
  { value: 'meitei', label: 'Meitei' },
  { value: 'nepali', label: 'Nepali' },
  { value: 'odia', label: 'Odia' },
  { value: 'punjabi', label: 'Punjabi' },
  { value: 'sanskrit', label: 'Sanskrit' },
  { value: 'santali', label: 'Santali' },
  { value: 'sindhi', label: 'Sindhi' },
  { value: 'tamil', label: 'Tamil' },
  { value: 'telugu', label: 'Telugu' },
  { value: 'urdu', label: 'Urdu' },
];

const SOCIAL_MEDIA_PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'custom', label: 'Custom' },
];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const PROFICIENCY_LEVELS = [
  { value: 'basic', label: 'Basic' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'proficient', label: 'Proficient' },
];

const PRIVACY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
];

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface PlacesLived {
  places: {
    latitude: number;
    longitude: number;
  }[];
}

interface SocialMediaProfile {
  platform:
    | 'instagram'
    | 'x'
    | 'linkedin'
    | 'facebook'
    | 'youtube'
    | 'tiktok'
    | 'custom';
  url: string;
}

interface LanguageProficiency {
  language: string;
  proficiency: 'basic' | 'intermediate' | 'proficient';
}

interface Category {
  id: number;
  name: string;
}

interface UserProfile {
  id: string;
  username?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  current_place?: string | null;
  short_bio?: string | null;
  profession?: string | null;
  organisation?: string | null;
  places_lived?: PlacesLived | null;
  from_place?: Coordinates | null;
  social_media_profiles?: { profiles: SocialMediaProfile[] } | null;
  language_proficiencies?: { proficiencies: LanguageProficiency[] } | null;
  is_active?: boolean | null;
  phone_privacy?: string | null;
  email_privacy?: string | null;
  profile_picture_path?: string | null;
  profile_complete?: boolean | null;
  // Internship fields
  organisation_type?: string | null;
  work_location?: string | null;
  rural_area_access?: string | null;
  permanent_postal_address?: string | null;
  college_institution?: string | null;
  education_category?: string | null;
  specific_stream?: string | null;
  current_year_of_study?: string | null;
  college_roll_number?: string | null;
  task_registered_id?: string | null;
  internship_languages?: Record<string, string> | null;
  resume_record_id?: string | null;
  has_laptop?: string | null;
  laptop_os?: string | null;
  laptop_ram?: string | null;
  mobile_os?: string | null;
  mobile_ram?: string | null;
  internet_speed?: string | null;
  daily_data_limit?: string | null;
  has_completed_ai_courses?: string | null;
  ai_courses_list?: string | null;
}

interface UserProfileInfoProps {
  userId: string;
  onClose: () => void;
  onUpdate: (updatedProfile: UserProfile) => void;
}

// Reusable InfoBox components
function InfoBox({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="p-4 border rounded-xl bg-gray-50 flex items-start gap-2">
      {Icon && <Icon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />}
      <div>
        <p className="text-gray-500 text-sm">{label}</p>
        <p className="text-gray-900 font-medium break-all">{value}</p>
      </div>
    </div>
  );
}

function InfoBoxFull({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="p-4 border rounded-xl bg-gray-50 w-full flex items-start gap-2">
      {Icon && <Icon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />}
      <div>
        <p className="text-gray-500 text-sm">{label}</p>
        <p className="text-gray-900 font-medium break-all">{value}</p>
      </div>
    </div>
  );
}

// Component to display proficiency as stars
function ProficiencyStars({
  proficiency,
}: {
  proficiency: 'basic' | 'intermediate' | 'proficient';
}) {
  const getStarCount = () => {
    switch (proficiency) {
      case 'basic':
        return 1;
      case 'intermediate':
        return 2;
      case 'proficient':
        return 3;
      default:
        return 0;
    }
  };

  const filledStars = getStarCount();

  return (
    <div className="flex gap-1">
      {[1, 2, 3].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${star <= filledStars ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
}

// Component to display location timeline
function LocationTimeline({
  fromPlace,
  placesLived,
  fromPlaceAddress,
  placesLivedAddresses,
}: {
  fromPlace: Coordinates | null;
  placesLived: PlacesLived | null;
  fromPlaceAddress: string | null;
  placesLivedAddresses: { [key: string]: string };
}) {
  return (
    <div className="w-full p-2">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Top Section: {t('common.from.place')} */}
        {fromPlace && (
          <div className="relative bg-blue-50/80 p-4 border-b border-blue-100">
            <div className="flex gap-3">
              {/* Icon Column */}
              <div className="flex flex-col items-center">
                <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600 shadow-sm">
                  <Home size={16} />
                </div>
              </div>

              {/* Content Column */}
              <div className="flex-1 pt-0.5">
                <p className="text-gray-500 text-sm">From Place</p>
                <p className="mt-1 text-sm text-gray-700">
                  {fromPlaceAddress ||
                    `${fromPlace.latitude.toFixed(6)}, ${fromPlace.longitude.toFixed(6)}`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Section: {t('common.places.lived')} */}
        {placesLived?.places && placesLived.places.length > 0 && (
          <div className="p-4 pt-5">
            <p className="text-gray-500 text-sm mb-3 ml-10">Places Lived</p>

            <div className="space-y-3">
              {placesLived.places.map((place, index) => {
                const addressKey = `${place.latitude},${place.longitude}`;
                const formattedAddress = placesLivedAddresses[addressKey];

                return (
                  <div key={index} className="relative flex gap-3 group">
                    {/* Timeline Line (Background) */}
                    {index < placesLived.places.length - 1 && (
                      <div className="absolute top-8 left-4 w-0.5 bg-gray-300 h-10"></div>
                    )}

                    {/* Icon */}
                    <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white ring-2 ring-white shadow-sm shrink-0">
                      <Earth size={14} />
                    </div>

                    {/* Content Card */}
                    <div className="flex-1 bg-gray-50 rounded border border-gray-100 p-3 hover:bg-gray-100 transition-colors">
                      <h4 className="font-medium text-gray-900 text-sm">
                        {formattedAddress ||
                          `${place.latitude.toFixed(6)}, ${place.longitude.toFixed(6)}`}
                      </h4>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SocialMediaProfilesBox({
  profiles,
}: {
  profiles: SocialMediaProfile[];
}) {
  const getIconForPlatform = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Instagram className="w-5 h-5" />;
      case 'x':
      case 'twitter':
        return <Twitter className="w-5 h-5" />;
      case 'linkedin':
        return <Linkedin className="w-5 h-5" />;
      case 'facebook':
        return <Facebook className="w-5 h-5" />;
      case 'youtube':
        return <Youtube className="w-5 h-5" />;
      case 'tiktok':
        return <Music2 className="w-5 h-5" />;
      default:
        return <Globe className="w-5 h-5" />;
    }
  };

  return (
    <div className="p-4 border rounded-xl bg-gray-50 w-full">
      <div className="flex flex-wrap gap-3">
        {profiles.map((social, index) => (
          <a
            key={index}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-900 hover:text-blue-500 transition-colors"
          >
            {getIconForPlatform(social.platform)}
          </a>
        ))}
      </div>
    </div>
  );
}

const UserProfileInfo: React.FC<UserProfileInfoProps> = ({
  userId,
  onClose,
  onUpdate,
}) => {
  const { t } = useTranslation();
  const [originalProfile, setOriginalProfile] = useState<UserProfile | null>(
    null,
  );
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    username: null,
    name: null,
    email: null,
    gender: null,
    date_of_birth: null,
    current_place: null,
    short_bio: null,
    profession: null,
    organisation: null,
    places_lived: null,
    from_place: null,
    social_media_profiles: null,
    language_proficiencies: null,
    is_active: null,
    phone_privacy: null,
    email_privacy: null,
    profile_picture_path: null,
    profile_complete: null,
    organisation_type: null,
    work_location: null,
    rural_area_access: null,
    permanent_postal_address: null,
    college_institution: null,
    education_category: null,
    specific_stream: null,
    current_year_of_study: null,
    college_roll_number: null,
    task_registered_id: null,
    internship_languages: null,
    resume_record_id: null,
    has_laptop: null,
    laptop_os: null,
    laptop_ram: null,
    mobile_os: null,
    mobile_ram: null,
    internet_speed: null,
    daily_data_limit: null,
    has_completed_ai_courses: null,
    ai_courses_list: null,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [editing, setEditing] = useState<boolean>(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [viewingResume, setViewingResume] = useState(false);
  const [currentUserInfo, setCurrentUserInfo] = useState<{
    id: string;
    username: string;
  } | null>(null);

  const handleResumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error(t('common.pleaseUploadAPdfFile'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('common.fileSizeMustBeLessThan5mb'));
      return;
    }

    const token = localStorage.getItem('token');
    if (!token || !currentUserInfo) {
      toast.error(t('common.authenticationRequiredForUpload'));
      return;
    }

    setResumeUploading(true);

    try {
      // 1. Fetch categories
      const catRes = await fetch(`${BACKEND_URL}/categories/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!catRes.ok) throw new Error('Failed to fetch categories');
      const categories: Category[] = await catRes.json();

      const resumeCat = categories.find(
        (c) => c.name.toLowerCase() === 'resume',
      );
      const internshipCat = categories.find(
        (c) => c.name.toLowerCase() === 'internship',
      );

      if (!resumeCat || !internshipCat) {
        toast.error(
          t(
            'common.categoriesResumeAndorInternshipNotFoundPleaseContactAnAdmin',
          ),
        );
        setResumeUploading(false);
        return;
      }

      const uploadUuid = crypto.randomUUID();

      // 2. Upload chunk
      const chunkData = new FormData();
      chunkData.append('chunk', file);
      chunkData.append('filename', file.name);
      chunkData.append('chunk_index', '0');
      chunkData.append('total_chunks', '1');
      chunkData.append('upload_uuid', uploadUuid);

      const chunkRes = await fetch(`${BACKEND_URL}/records/upload/chunk`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: chunkData,
      });

      if (!chunkRes.ok) throw new Error('Chunk upload failed');

      // 3. Finalize
      const finalizeData = new FormData();
      finalizeData.append('upload_uuid', uploadUuid);
      finalizeData.append('title', `Resume — ${currentUserInfo.username}`);
      finalizeData.append(
        'description',
        `This is a resume document uploaded by ${currentUserInfo.username} to complete their professional profile during a profile update.`,
      );
      finalizeData.append(
        'category_ids',
        JSON.stringify([resumeCat.id, internshipCat.id]),
      );
      finalizeData.append('user_id', currentUserInfo.id);
      finalizeData.append('media_type', 'document');
      finalizeData.append('release_rights', 'creator');
      finalizeData.append('language', 'english');
      finalizeData.append('total_chunks', '1');
      finalizeData.append('filename', file.name);

      const finalizeRes = await fetch(`${BACKEND_URL}/records/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: finalizeData,
      });

      if (!finalizeRes.ok) {
        const errData = await finalizeRes.json();
        throw new Error(errData.detail || 'Finalization failed');
      }

      const result = await finalizeRes.json();
      handleChange('resume_record_id', result.uid);
      toast.success(t('messages.resumeUploadedSuccessfully'));
    } catch (err: unknown) {
      console.error('Resume upload error:', err);
      toast.error(
        err instanceof Error ? err.message : 'Failed to upload resume',
      );
    } finally {
      setResumeUploading(false);
    }
  };

  const handleViewResume = async () => {
    if (!profile.resume_record_id) return;

    setViewingResume(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${BACKEND_URL}/records/${profile.resume_record_id}/record-url`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error('Failed to get resume URL');
      const data = await res.json();
      window.open(data.record_url, '_blank');
    } catch (err) {
      console.error('Error viewing resume:', err);
      toast.error(t('common.failedToViewResume'));
    } finally {
      setViewingResume(false);
    }
  };
  const [currentUserLoaded, setCurrentUserLoaded] = useState<boolean>(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [currentLocationIndex, setCurrentLocationIndex] = useState<
    number | null
  >(null);
  const [fromPlaceAddress, setFromPlaceAddress] = useState<string | null>(null);
  const [placesLivedAddresses, setPlacesLivedAddresses] = useState<{
    [key: string]: string;
  }>({});

  // Get current user info to determine if viewing own profile
  useEffect(() => {
    const getCurrentUserInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          return null;
        }

        const response = await fetch(`${BACKEND_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Could not get current user profile');
        }

        const userData = await response.json();
        setCurrentUserInfo({ id: userData.id, username: userData.username });
        setCurrentUserLoaded(true);
      } catch (err) {
        console.error('Error getting current user info:', err);
        setCurrentUserLoaded(true); // Still set to true to stop waiting
      }
    };

    getCurrentUserInfo();
  }, []);

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error(t('common.authenticationTokenNotFound'));
          return;
        }

        const response = await fetch(`${BACKEND_URL}/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch profile: ${response.status}`);
        }

        const data = await response.json();
        setProfile(data);
        setOriginalProfile({ ...data }); // Store original profile for comparison

        // Fetch formatted address for from_place if it exists
        if (data.from_place) {
          fetchFormattedAddress(
            data.from_place.latitude,
            data.from_place.longitude,
          );
        }

        // Fetch formatted addresses for places lived if they exist
        if (data.places_lived?.places && data.places_lived.places.length > 0) {
          data.places_lived.places.forEach((place) => {
            fetchFormattedAddress(place.latitude, place.longitude, true);
          });
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error(t('nav.failedToLoadProfileData'));
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, t]);

  // Fetch formatted address when from_place changes
  useEffect(() => {
    if (profile.from_place) {
      fetchFormattedAddress(
        profile.from_place.latitude,
        profile.from_place.longitude,
      );
    } else {
      setFromPlaceAddress(null);
    }
  }, [profile.from_place]);

  // Fetch formatted addresses when places_lived changes
  useEffect(() => {
    if (
      profile.places_lived?.places &&
      profile.places_lived.places.length > 0
    ) {
      profile.places_lived.places.forEach((place) => {
        fetchFormattedAddress(place.latitude, place.longitude, true);
      });
    } else {
      setPlacesLivedAddresses({});
    }
  }, [profile.places_lived]);

  // Function to fetch formatted address for coordinates
  const fetchFormattedAddress = async (
    latitude: number,
    longitude: number,
    isPlacesLived: boolean = false,
  ) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Authentication token not found');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/location/verify-location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          latitude,
          longitude,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch location: ${response.status}`);
      }

      const data = await response.json();

      if (isPlacesLived) {
        // Format as "city, state, country" for places lived
        const addressParts = [];
        if (data.city) addressParts.push(data.city);
        if (data.state) addressParts.push(data.state);
        if (data.country) addressParts.push(data.country);

        const formattedAddress =
          addressParts.length > 0
            ? addressParts.join(', ')
            : `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

        setPlacesLivedAddresses((prev) => ({
          ...prev,
          [`${latitude},${longitude}`]: formattedAddress,
        }));
      } else {
        // Use full formatted address for from_place
        setFromPlaceAddress(
          data.formatted_address ||
            `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        );
      }
    } catch (error) {
      console.error('Error fetching formatted address:', error);
      const fallback = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

      if (isPlacesLived) {
        setPlacesLivedAddresses((prev) => ({
          ...prev,
          [`${latitude},${longitude}`]: fallback,
        }));
      } else {
        setFromPlaceAddress(fallback);
      }
    }
  };

  const handleChange = (
    field: keyof UserProfile,
    value: UserProfile[keyof UserProfile],
  ) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication token not found');
        setSaving(false);
        return;
      }

      // Prepare the update payload - only include fields that have changed
      const updatePayload: Partial<UserProfile> = {};

      if (originalProfile) {
        (Object.keys(profile) as (keyof UserProfile)[]).forEach((key) => {
          if (key !== 'id') {
            // Compare the current value with the original value
            const currentValue = profile[key];
            const originalValue = originalProfile[key];

            // Only add to payload if the value has changed
            if (
              JSON.stringify(currentValue) !== JSON.stringify(originalValue)
            ) {
              updatePayload[key] = currentValue;
            }
          }
        });
      } else {
        // If no original profile, send all non-null values
        (Object.keys(profile) as (keyof UserProfile)[]).forEach((key) => {
          const value = profile[key];
          if (value !== null && key !== 'id') {
            updatePayload[key] = value;
          }
        });
      }

      // If no changes detected, show message and return
      if (Object.keys(updatePayload).length === 0) {
        toast.info(t('common.noChangesToSave'));
        setEditing(false);
        return;
      }

      const response = await fetch(`${BACKEND_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || `Failed to update profile: ${response.status}`,
        );
      }

      const updatedProfile = await response.json();
      onUpdate(updatedProfile);
      toast.success(t('messages.profileUpdatedSuccessfully'));
      setEditing(false); // Exit editing mode after successful update
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update profile',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg">
          {t('messages.loadingProfile')}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-lg border border-gray-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 sm:p-8">
          <div className="flex justify-end items-center gap-2">
            {currentUserLoaded &&
              currentUserInfo &&
              (currentUserInfo.id === userId ||
                currentUserInfo.username === userId) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (editing) {
                      setEditing(false);
                    } else {
                      setEditing(true);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg flex items-center ${
                    editing
                      ? 'bg-red-100 hover:bg-red-200 text-red-700'
                      : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                  }`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {editing ? (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {/* Username */}
                <div>
                  <Label htmlFor="username">{t('auth.username')}</Label>
                  <Input
                    id="username"
                    value={profile.username || ''}
                    onChange={(e) => handleChange('username', e.target.value)}
                    placeholder={t('auth.enterUsername')}
                    minLength={3}
                    maxLength={50}
                  />
                </div>

                {/* Name */}
                <div>
                  <Label htmlFor="name">{t('user.fullName')}</Label>
                  <Input
                    id="name"
                    value={profile.name || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder={t('user.enterFullName')}
                  />
                </div>

                {/* Gender */}
                <div>
                  <Label htmlFor="gender">{t('auth.gender')}</Label>
                  <Select
                    value={profile.gender || ''}
                    onValueChange={(value) => handleChange('gender', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('common.selectGender')} />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {t(`auth.${option.value}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date of Birth */}
                <div>
                  <Label htmlFor="date_of_birth">{t('auth.dateOfBirth')}</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={profile.date_of_birth || ''}
                    onChange={(e) =>
                      handleChange('date_of_birth', e.target.value)
                    }
                  />
                </div>

                {/* Short Bio */}
                <div className="md:col-span-2">
                  <Label htmlFor="short_bio">{t('user.shortBio')}</Label>
                  <Textarea
                    id="short_bio"
                    value={profile.short_bio || ''}
                    onChange={(e) => handleChange('short_bio', e.target.value)}
                    placeholder={t('nav.tellUsAboutYourself')}
                    maxLength={500}
                    rows={4}
                  />
                </div>

                {/* Current Place */}
                <div>
                  <Label htmlFor="current_place">
                    {t('common.current.place')}
                  </Label>
                  <Input
                    id="current_place"
                    value={profile.current_place || ''}
                    onChange={(e) =>
                      handleChange('current_place', e.target.value)
                    }
                    placeholder={t('common.enter.current.place')}
                  />
                </div>

                {/* From Place */}
                <div className="md:col-span-2">
                  <Label htmlFor="from_place">{t('common.from.place')}</Label>
                  <div className="flex gap-2 mt-1">
                    {profile.from_place ? (
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">
                          {fromPlaceAddress ||
                            `${profile.from_place.latitude.toFixed(6)}, ${profile.from_place.longitude.toFixed(6)}`}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 flex-1">
                        {t('common.noLocationSet')}
                      </p>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCurrentLocationIndex(-1); // Special index for from_place
                        setShowLocationPicker(true);
                      }}
                    >
                      {profile.from_place
                        ? t('common.edit')
                        : t('profile.setLocation')}
                    </Button>
                    {profile.from_place && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          handleChange('from_place', null);
                        }}
                      >
                        {t('common.remove')}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Profession */}
                <div>
                  <Label htmlFor="profession">{t('user.profession')}</Label>
                  <Input
                    id="profession"
                    value={profile.profession || ''}
                    onChange={(e) => handleChange('profession', e.target.value)}
                    placeholder={t('common.enter.profession')}
                    maxLength={200}
                  />
                </div>

                {/* Organisation */}
                <div>
                  <Label htmlFor="organisation">{t('user.organisation')}</Label>
                  <Input
                    id="organisation"
                    value={profile.organisation || ''}
                    onChange={(e) =>
                      handleChange('organisation', e.target.value)
                    }
                    placeholder={t('common.enter.organisation')}
                    maxLength={200}
                  />
                </div>

                {/* Horizontal divider */}
                <div className="md:col-span-2 my-2 border-t border-gray-200"></div>

                {/* Language Proficiencies */}
                <div className="md:col-span-2">
                  <Label htmlFor="language_proficiencies">
                    {t('ui.language.proficiencies')}
                  </Label>
                  {(profile.language_proficiencies?.proficiencies || []).map(
                    (lang, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <Select
                          value={lang.language}
                          onValueChange={(value) => {
                            const updatedLangs = [
                              ...(profile.language_proficiencies
                                ?.proficiencies || []),
                            ];
                            updatedLangs[index] = {
                              ...updatedLangs[index],
                              language: value,
                            };
                            handleChange('language_proficiencies', {
                              proficiencies: updatedLangs,
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t('common.selectLanguage')}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {LANGUAGE_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={lang.proficiency}
                          onValueChange={(value) => {
                            const updatedLangs = [
                              ...(profile.language_proficiencies
                                ?.proficiencies || []),
                            ];
                            updatedLangs[index] = {
                              ...updatedLangs[index],
                              proficiency: value as
                                | 'basic'
                                | 'intermediate'
                                | 'proficient',
                            };
                            handleChange('language_proficiencies', {
                              proficiencies: updatedLangs,
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Level" />
                          </SelectTrigger>
                          <SelectContent>
                            {PROFICIENCY_LEVELS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const updatedLangs = [
                              ...(profile.language_proficiencies
                                ?.proficiencies || []),
                            ];
                            updatedLangs.splice(index, 1);
                            handleChange('language_proficiencies', {
                              proficiencies: updatedLangs,
                            });
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ),
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const newLangProf = {
                        language: '',
                        proficiency: 'basic' as const,
                      };
                      const updatedLangs = [
                        ...(profile.language_proficiencies?.proficiencies ||
                          []),
                        newLangProf,
                      ];
                      handleChange('language_proficiencies', {
                        proficiencies: updatedLangs,
                      });
                    }}
                  >
                    {t('common.addLanguage')}
                  </Button>
                </div>

                {/* Horizontal divider */}
                <div className="md:col-span-2 my-2 border-t border-gray-200"></div>

                {/* Places Lived */}
                <div className="md:col-span-2">
                  <Label htmlFor="places_lived">Places Lived</Label>
                  {(profile.places_lived?.places || []).map((place, index) => {
                    const addressKey = `${place.latitude},${place.longitude}`;
                    const formattedAddress = placesLivedAddresses[addressKey];

                    return (
                      <div key={index} className="flex gap-2 mb-2">
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">
                            {formattedAddress ||
                              `${place.latitude.toFixed(4)}, ${place.longitude.toFixed(4)}`}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setCurrentLocationIndex(index);
                            setShowLocationPicker(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const updatedPlaces = [
                              ...(profile.places_lived?.places || []),
                            ];
                            updatedPlaces.splice(index, 1);
                            handleChange('places_lived', {
                              places: updatedPlaces,
                            });
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    );
                  })}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCurrentLocationIndex(
                        profile.places_lived?.places.length || 0,
                      );
                      setShowLocationPicker(true);
                    }}
                  >
                    {t('common.addPlace')}
                  </Button>
                </div>

                {/* Location Picker Modal */}
                {showLocationPicker && (
                  <LocationPicker
                    onLocationSelect={(lat, lng) => {
                      // Check if we're updating from_place or places_lived
                      if (currentLocationIndex === -1) {
                        // Update from_place
                        handleChange('from_place', {
                          latitude: lat,
                          longitude: lng,
                        });
                      } else {
                        // Update the places_lived with the selected location
                        const updatedPlaces = [
                          ...(profile.places_lived?.places || []),
                        ];

                        if (currentLocationIndex !== null) {
                          if (currentLocationIndex < updatedPlaces.length) {
                            // Update existing place
                            updatedPlaces[currentLocationIndex] = {
                              latitude: lat,
                              longitude: lng,
                            };
                          } else {
                            // Add new place
                            updatedPlaces.push({
                              latitude: lat,
                              longitude: lng,
                            });
                          }

                          handleChange('places_lived', {
                            places: updatedPlaces,
                          });
                        }
                      }

                      setShowLocationPicker(false);
                      setCurrentLocationIndex(null);
                    }}
                    onClose={() => {
                      setShowLocationPicker(false);
                      setCurrentLocationIndex(null);
                    }}
                  />
                )}

                {/* Horizontal divider */}
                <div className="md:col-span-2 my-2 border-t border-gray-200"></div>

                {/* Social Media Profiles */}
                <div className="md:col-span-2">
                  <Label htmlFor="social_media_profiles">
                    {t('nav.socialMediaProfiles')}
                  </Label>
                  {(profile.social_media_profiles?.profiles || []).map(
                    (social, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <Select
                          value={social.platform}
                          onValueChange={(value) => {
                            const updatedSocial = [
                              ...(profile.social_media_profiles?.profiles ||
                                []),
                            ];
                            updatedSocial[index] = {
                              ...updatedSocial[index],
                              platform: value,
                            };
                            handleChange('social_media_profiles', {
                              profiles: updatedSocial,
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Platform" />
                          </SelectTrigger>
                          <SelectContent>
                            {SOCIAL_MEDIA_PLATFORMS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          value={social.url}
                          onChange={(e) => {
                            const updatedSocial = [
                              ...(profile.social_media_profiles?.profiles ||
                                []),
                            ];
                            updatedSocial[index] = {
                              ...updatedSocial[index],
                              url: e.target.value,
                            };
                            handleChange('social_media_profiles', {
                              profiles: updatedSocial,
                            });
                          }}
                          placeholder={t('nav.profileUrl')}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const updatedSocial = [
                              ...(profile.social_media_profiles?.profiles ||
                                []),
                            ];
                            updatedSocial.splice(index, 1);
                            handleChange('social_media_profiles', {
                              profiles: updatedSocial,
                            });
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ),
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const newSocial = { platform: 'instagram', url: '' };
                      const updatedSocial = [
                        ...(profile.social_media_profiles?.profiles || []),
                        newSocial,
                      ];
                      handleChange('social_media_profiles', {
                        profiles: updatedSocial,
                      });
                    }}
                  >
                    {t('common.addSocialMedia')}
                  </Button>
                </div>
              </div>

              {/* Internship Profile Section */}
              <div className="md:col-span-2 my-2 border-t border-gray-200"></div>
              <div className="md:col-span-2">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Internship Profile
                </h4>
              </div>

              {/* Organisation Type */}
              <div>
                <Label htmlFor="organisation_type">Organisation Type</Label>
                <SearchableSelect
                  id="organisation_type"
                  value={profile.organisation_type || ''}
                  onChange={(value) => handleChange('organisation_type', value)}
                  options={organisationTypes}
                  placeholder={t('common.selectType')}
                />
              </div>

              {/* {t('user.workLocation')} */}
              <div>
                <Label htmlFor="work_location">Work Location</Label>
                <SearchableSelect
                  id="work_location"
                  value={profile.work_location || ''}
                  onChange={(value) => handleChange('work_location', value)}
                  options={workLocations}
                  placeholder={t('common.selectDistrict')}
                />
              </div>

              {/* Rural Area Access */}
              <div className="md:col-span-2">
                <Label htmlFor="rural_area_access">
                  {t('ui.do.you.have.access.to.any.rural.areas.nearby')}
                </Label>
                <Textarea
                  id="rural_area_access"
                  value={profile.rural_area_access || ''}
                  onChange={(e) =>
                    handleChange('rural_area_access', e.target.value)
                  }
                  placeholder={t(
                    'nav.mentionPlacesAroundYourHometownOrCurrentLocationWhereYouHaveAccessToRuralAreas',
                  )}
                  maxLength={500}
                  rows={3}
                />
              </div>

              {/* Permanent Postal Address */}
              <div className="md:col-span-2">
                <Label htmlFor="permanent_postal_address">
                  Permanent Postal Address
                </Label>
                <Input
                  id="permanent_postal_address"
                  value={profile.permanent_postal_address || ''}
                  onChange={(e) =>
                    handleChange('permanent_postal_address', e.target.value)
                  }
                  placeholder={t('common.enterPermanentPostalAddress')}
                  maxLength={500}
                />
              </div>

              {/* Education & Institution */}
              <div className="md:col-span-2 my-2 border-t border-gray-200"></div>
              <div className="md:col-span-2">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  {t('ui.education.institution')}
                </h4>
              </div>

              {/* College/Institution */}
              <div className="md:col-span-2">
                <Label htmlFor="college_institution">
                  College / Institution
                </Label>
                <SearchableSelect
                  id="college_institution"
                  value={profile.college_institution || ''}
                  onChange={(value) =>
                    handleChange('college_institution', value)
                  }
                  options={collegeList}
                  placeholder={t('common.selectCollege')}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('common.cantFindYourInstitutionSelectOtherNotInList')}
                </p>
              </div>

              {/* Education Category */}
              <div>
                <Label htmlFor="education_category">Education Category</Label>
                <SearchableSelect
                  id="education_category"
                  value={profile.education_category || ''}
                  onChange={(value) =>
                    handleChange('education_category', value)
                  }
                  options={educationCategories}
                  placeholder={t('common.selectCategory')}
                />
              </div>

              {/* Specific Stream */}
              <div>
                <Label htmlFor="specific_stream">Specific Stream</Label>
                <SearchableSelect
                  id="specific_stream"
                  value={profile.specific_stream || ''}
                  onChange={(value) => handleChange('specific_stream', value)}
                  options={specificStreams}
                  placeholder={t('common.selectStream')}
                />
              </div>

              {/* Current Year of Study */}
              <div>
                <Label htmlFor="current_year_of_study">
                  Current Year of Study
                </Label>
                <SearchableSelect
                  id="current_year_of_study"
                  value={profile.current_year_of_study || ''}
                  onChange={(value) =>
                    handleChange('current_year_of_study', value)
                  }
                  options={yearList}
                  placeholder={t('common.selectYear')}
                />
              </div>

              {/* College Roll Number */}
              <div>
                <Label htmlFor="college_roll_number">College Roll Number</Label>
                <Input
                  id="college_roll_number"
                  value={profile.college_roll_number || ''}
                  onChange={(e) =>
                    handleChange('college_roll_number', e.target.value)
                  }
                  placeholder={t('common.enter.roll.number')}
                  maxLength={100}
                />
              </div>

              {/* TASK Registered ID */}
              <div>
                <Label htmlFor="task_registered_id">TASK Registered ID</Label>
                <Input
                  id="task_registered_id"
                  value={profile.task_registered_id || ''}
                  onChange={(e) =>
                    handleChange('task_registered_id', e.target.value)
                  }
                  placeholder={t('ui.enter.task.id.optional')}
                  maxLength={100}
                />
              </div>

              {/* Device & Internet */}
              <div className="md:col-span-2 my-2 border-t border-gray-200"></div>
              <div className="md:col-span-2">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  {t('common.device.internet')}
                </h4>
              </div>

              {/* {t('common.has.laptop')} */}
              <div>
                <Label htmlFor="has_laptop">Has Laptop?</Label>
                <SearchableSelect
                  id="has_laptop"
                  value={profile.has_laptop || ''}
                  onChange={(value) => handleChange('has_laptop', value)}
                  options={[
                    { value: 'Yes', label: 'Yes' },
                    { value: 'No', label: 'No' },
                  ]}
                  placeholder="Select"
                />
              </div>

              {/* {t('common.laptop.os')} */}
              <div>
                <Label htmlFor="laptop_os">Laptop OS</Label>
                <SearchableSelect
                  id="laptop_os"
                  value={profile.laptop_os || ''}
                  onChange={(value) => handleChange('laptop_os', value)}
                  options={laptopOS}
                  placeholder={t('common.selectOs')}
                />
              </div>

              {/* {t('common.laptop.ram')} */}
              <div>
                <Label htmlFor="laptop_ram">Laptop RAM</Label>
                <SearchableSelect
                  id="laptop_ram"
                  value={profile.laptop_ram || ''}
                  onChange={(value) => handleChange('laptop_ram', value)}
                  options={laptopRAM}
                  placeholder={t('common.selectRam')}
                />
              </div>

              {/* {t('common.mobile.os')} */}
              <div>
                <Label htmlFor="mobile_os">Mobile OS</Label>
                <SearchableSelect
                  id="mobile_os"
                  value={profile.mobile_os || ''}
                  onChange={(value) => handleChange('mobile_os', value)}
                  options={mobileOS}
                  placeholder="Select OS"
                />
              </div>

              {/* {t('common.mobile.ram')} */}
              <div>
                <Label htmlFor="mobile_ram">Mobile RAM</Label>
                <SearchableSelect
                  id="mobile_ram"
                  value={profile.mobile_ram || ''}
                  onChange={(value) => handleChange('mobile_ram', value)}
                  options={mobileRAM}
                  placeholder="Select RAM"
                />
              </div>

              {/* Internet Speed */}
              <div>
                <Label htmlFor="internet_speed">Internet Speed</Label>
                <SearchableSelect
                  id="internet_speed"
                  value={profile.internet_speed || ''}
                  onChange={(value) => handleChange('internet_speed', value)}
                  options={internetSpeeds}
                  placeholder={t('common.selectSpeed')}
                />
              </div>

              {/* Daily Data Limit */}
              <div>
                <Label htmlFor="daily_data_limit">Daily Data Limit</Label>
                <SearchableSelect
                  id="daily_data_limit"
                  value={profile.daily_data_limit || ''}
                  onChange={(value) => handleChange('daily_data_limit', value)}
                  options={dailyDataLimits}
                  placeholder={t('common.selectLimit')}
                />
              </div>

              {/* Completed AI Courses */}
              <div>
                <Label htmlFor="has_completed_ai_courses">
                  {t('ui.have.you.completed.any.ai.courses')}
                </Label>
                <SearchableSelect
                  id="has_completed_ai_courses"
                  value={profile.has_completed_ai_courses || ''}
                  onChange={(value) =>
                    handleChange('has_completed_ai_courses', value)
                  }
                  options={[
                    { value: 'Yes', label: 'Yes' },
                    { value: 'No', label: 'No' },
                  ]}
                  placeholder="Select"
                />
              </div>

              {profile.has_completed_ai_courses === 'Yes' && (
                <div className="md:col-span-2">
                  <Label htmlFor="ai_courses_list">
                    List of AI Courses Completed
                  </Label>
                  <p className="text-xs text-gray-500 mb-1">
                    {t('ui.please.list.all.ai.courses.you.have.completed')}
                  </p>
                  <Textarea
                    id="ai_courses_list"
                    value={profile.ai_courses_list || ''}
                    onChange={(e) =>
                      handleChange('ai_courses_list', e.target.value)
                    }
                    placeholder={t('common.list.your.ai.courses')}
                    rows={3}
                  />
                </div>
              )}

              {/* Resume */}
              <div className="md:col-span-2">
                <Label htmlFor="resume">
                  {t('ui.resume.pdf.only.max.5mb')}
                </Label>
                <div className="flex flex-col gap-2 mt-1">
                  <div className="flex items-center gap-2">
                    <Input
                      id="resume"
                      type="file"
                      accept=".pdf"
                      onChange={handleResumeChange}
                      disabled={resumeUploading}
                      className="flex-1"
                    />
                    {profile.resume_record_id && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleViewResume}
                        disabled={viewingResume}
                      >
                        {viewingResume ? 'Loading...' : 'View Current'}
                      </Button>
                    )}
                  </div>
                  {resumeUploading && (
                    <p className="text-xs text-blue-600 animate-pulse">
                      {t('messages.uploadingNewResume')}
                    </p>
                  )}
                  {profile.resume_record_id && (
                    <p className="text-xs text-green-600 font-medium">
                      {t('media.resumeRecordId')}
                      {profile.resume_record_id}
                    </p>
                  )}
                </div>
              </div>

              {/* Internship Languages */}
              <div className="md:col-span-2 my-2 border-t border-gray-200"></div>
              <div className="md:col-span-2">
                <h4 className="text-sm font-semibold text-gray-700 mb-1">
                  {t('common.language.proficiency')}
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  {t('common.selectYourProficiencyLevelForEachLanguage')}
                </p>
              </div>
              <div className="md:col-span-2 space-y-2">
                {internshipLanguages.map((lang) => (
                  <div key={lang} className="flex items-center gap-3">
                    <span className="w-20 text-sm font-medium">{lang}</span>
                    <select
                      value={
                        profile.internship_languages?.[lang] || "Don't know"
                      }
                      onChange={(e) => {
                        const updated = {
                          ...(profile.internship_languages || {}),
                          [lang]: e.target.value,
                        };
                        handleChange('internship_languages', updated);
                      }}
                      className="flex-1 p-2 border rounded-md bg-white text-sm"
                    >
                      {proficiencyLevels.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          ) : (
            // Display mode - show profile information in read-only format with new styling
            <div className="space-y-6">
              {/* Profile Row */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 mb-6">
                {profile.profile_picture_path ? (
                  <img
                    src={profile.profile_picture_path}
                    className="w-24 h-24 rounded-full object-cover border"
                    alt={`${profile.name || profile.username}'s profile`}
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold border">
                    {profile.name
                      ? profile.name.charAt(0).toUpperCase()
                      : profile.username
                        ? profile.username.charAt(0).toUpperCase()
                        : '?'}
                  </div>
                )}
                <div className="text-center sm:text-left">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {profile.name || 'Not provided'}
                  </h3>
                  <p className="text-gray-600 -mt-1">
                    @{profile.username || 'Not provided'}
                  </p>
                  {profile.profession ||
                  profile.organisation ||
                  profile.current_place ? (
                    <p className="text-gray-500 text-sm">
                      {profile.profession && profile.organisation
                        ? `${profile.profession} at ${profile.organisation}${profile.current_place ? ` | ${profile.current_place}` : ''}`
                        : profile.profession || profile.organisation
                          ? `${profile.profession || profile.organisation}${profile.current_place ? ` | ${profile.current_place}` : ''}`
                          : profile.current_place || ''}
                    </p>
                  ) : null}
                  {/* Social Media Profiles */}
                  {profile.social_media_profiles?.profiles &&
                  profile.social_media_profiles.profiles.length > 0 ? (
                    <div className="flex flex-wrap gap-3 mt-2 justify-center sm:justify-start">
                      {profile.social_media_profiles.profiles.map(
                        (social, index) => (
                          <a
                            key={index}
                            href={social.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-900 hover:text-blue-500 transition-colors"
                          >
                            {social.platform === 'instagram' ? (
                              <Instagram className="w-5 h-5" />
                            ) : social.platform === 'x' ||
                              social.platform === 'twitter' ? (
                              <Twitter className="w-5 h-5" />
                            ) : social.platform === 'linkedin' ? (
                              <Linkedin className="w-5 h-5" />
                            ) : social.platform === 'facebook' ? (
                              <Facebook className="w-5 h-5" />
                            ) : social.platform === 'youtube' ? (
                              <Youtube className="w-5 h-5" />
                            ) : social.platform === 'tiktok' ? (
                              <Music2 className="w-5 h-5" />
                            ) : (
                              <Globe className="w-5 h-5" />
                            )}
                          </a>
                        ),
                      )}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Grid Sections */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {profile.short_bio && (
                  <div className="md:col-span-2">
                    <div className="p-4 border rounded-xl bg-gray-50 flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-gray-500 text-sm">Short Bio</p>
                        <p className="text-gray-900 font-medium break-words text-sm">
                          {profile.short_bio}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {profile.date_of_birth && (
                  <InfoBox
                    label={t('common.date.of.birth')}
                    value={profile.date_of_birth}
                    icon={Calendar}
                  />
                )}
                {profile.gender && (
                  <InfoBox label="Gender" value={profile.gender} icon={User} />
                )}
              </div>

              {/* Full width sections */}
              <div className="mt-3 space-y-2">
                {/* Language Proficiencies */}
                {profile.language_proficiencies?.proficiencies &&
                profile.language_proficiencies.proficiencies.length > 0 ? (
                  <div className="w-full -mt-1">
                    <div className="flex items-start gap-2 mb-1">
                      <Hash className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-500 text-sm">
                        {t('ui.language.proficiencies')}
                      </p>
                    </div>
                    <div className="space-y-1">
                      {profile.language_proficiencies.proficiencies.map(
                        (lang, index) => (
                          <div key={index} className="flex gap-2">
                            <div className="p-3 border rounded-lg bg-gray-50 flex-1">
                              <p className="text-gray-900 font-medium break-all">
                                {lang.language.charAt(0).toUpperCase() +
                                  lang.language.slice(1)}
                              </p>
                            </div>
                            <div className="p-3 border rounded-lg bg-gray-50 flex-1 flex items-center justify-center">
                              <ProficiencyStars
                                proficiency={lang.proficiency}
                              />
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Location Timeline - Combines From Place and Places Lived */}
                {(profile.from_place ||
                  (profile.places_lived?.places &&
                    profile.places_lived.places.length > 0)) && (
                  <LocationTimeline
                    fromPlace={profile.from_place}
                    placesLived={profile.places_lived}
                    fromPlaceAddress={fromPlaceAddress}
                    placesLivedAddresses={placesLivedAddresses}
                  />
                )}

                {/* Internship Profile - Read Only */}
                {(profile.organisation_type ||
                  profile.work_location ||
                  profile.college_institution ||
                  profile.education_category ||
                  profile.has_laptop ||
                  profile.internet_speed) && (
                  <div className="w-full mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <p className="text-gray-500 text-sm font-medium">
                        {t('nav.internshipProfile')}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {profile.organisation_type && (
                        <div className="p-3 border rounded-lg bg-gray-50">
                          <p className="text-gray-500 text-xs">
                            {t('categories.organisationType')}
                          </p>
                          <p className="text-gray-900 font-medium text-sm">
                            {profile.organisation_type}
                          </p>
                        </div>
                      )}
                      {profile.work_location && (
                        <div className="p-3 border rounded-lg bg-gray-50">
                          <p className="text-gray-500 text-xs">Work Location</p>
                          <p className="text-gray-900 font-medium text-sm">
                            {profile.work_location}
                          </p>
                        </div>
                      )}
                      {profile.rural_area_access && (
                        <div className="p-3 border rounded-lg bg-gray-50 md:col-span-2">
                          <p className="text-gray-500 text-xs">
                            {t('common.rural.area.access')}
                          </p>
                          <p className="text-gray-900 font-medium text-sm">
                            {profile.rural_area_access}
                          </p>
                        </div>
                      )}
                      {profile.permanent_postal_address && (
                        <div className="p-3 border rounded-lg bg-gray-50 md:col-span-2">
                          <p className="text-gray-500 text-xs">
                            {t('common.permanentPostalAddress')}
                          </p>
                          <p className="text-gray-900 font-medium text-sm">
                            {profile.permanent_postal_address}
                          </p>
                        </div>
                      )}
                      {profile.college_institution && (
                        <div className="p-3 border rounded-lg bg-gray-50 md:col-span-2">
                          <p className="text-gray-500 text-xs">
                            {t('common.college.institution')}
                          </p>
                          <p className="text-gray-900 font-medium text-sm">
                            {profile.college_institution}
                          </p>
                        </div>
                      )}
                      {profile.education_category && (
                        <div className="p-3 border rounded-lg bg-gray-50">
                          <p className="text-gray-500 text-xs">
                            {t('categories.educationCategory')}
                          </p>
                          <p className="text-gray-900 font-medium text-sm">
                            {profile.education_category}
                          </p>
                        </div>
                      )}
                      {profile.specific_stream && (
                        <div className="p-3 border rounded-lg bg-gray-50">
                          <p className="text-gray-500 text-xs">
                            {t('common.specific.stream')}
                          </p>
                          <p className="text-gray-900 font-medium text-sm">
                            {profile.specific_stream}
                          </p>
                        </div>
                      )}
                      {profile.current_year_of_study && (
                        <div className="p-3 border rounded-lg bg-gray-50">
                          <p className="text-gray-500 text-xs">
                            {t('time.currentYearOfStudy')}
                          </p>
                          <p className="text-gray-900 font-medium text-sm">
                            {profile.current_year_of_study}
                          </p>
                        </div>
                      )}
                      {profile.college_roll_number && (
                        <div className="p-3 border rounded-lg bg-gray-50">
                          <p className="text-gray-500 text-xs">
                            {t('common.college.roll.number')}
                          </p>
                          <p className="text-gray-900 font-medium text-sm">
                            {profile.college_roll_number}
                          </p>
                        </div>
                      )}
                      {profile.task_registered_id && (
                        <div className="p-3 border rounded-lg bg-gray-50">
                          <p className="text-gray-500 text-xs">
                            {t('common.task.registered.id')}
                          </p>
                          <p className="text-gray-900 font-medium text-sm">
                            {profile.task_registered_id}
                          </p>
                        </div>
                      )}
                      {profile.has_laptop && (
                        <div className="p-3 border rounded-lg bg-gray-50">
                          <p className="text-gray-500 text-xs">Has Laptop</p>
                          <p className="text-gray-900 font-medium text-sm">
                            {profile.has_laptop}
                          </p>
                        </div>
                      )}
                      {profile.laptop_os && (
                        <div className="p-3 border rounded-lg bg-gray-50">
                          <p className="text-gray-500 text-xs">Laptop OS</p>
                          <p className="text-gray-900 font-medium text-sm">
                            {profile.laptop_os}
                          </p>
                        </div>
                      )}
                      {profile.laptop_ram && (
                        <div className="p-3 border rounded-lg bg-gray-50">
                          <p className="text-gray-500 text-xs">Laptop RAM</p>
                          <p className="text-gray-900 font-medium text-sm">
                            {profile.laptop_ram}
                          </p>
                        </div>
                      )}
                      {profile.mobile_os && (
                        <div className="p-3 border rounded-lg bg-gray-50">
                          <p className="text-gray-500 text-xs">Mobile OS</p>
                          <p className="text-gray-900 font-medium text-sm">
                            {profile.mobile_os}
                          </p>
                        </div>
                      )}
                      {profile.mobile_ram && (
                        <div className="p-3 border rounded-lg bg-gray-50">
                          <p className="text-gray-500 text-xs">Mobile RAM</p>
                          <p className="text-gray-900 font-medium text-sm">
                            {profile.mobile_ram}
                          </p>
                        </div>
                      )}
                      {profile.internet_speed && (
                        <div className="p-3 border rounded-lg bg-gray-50">
                          <p className="text-gray-500 text-xs">
                            {t('common.internet.speed')}
                          </p>
                          <p className="text-gray-900 font-medium text-sm">
                            {profile.internet_speed}
                          </p>
                        </div>
                      )}
                      {profile.daily_data_limit && (
                        <div className="p-3 border rounded-lg bg-gray-50">
                          <p className="text-gray-500 text-xs">
                            {t('common.daily.data.limit')}
                          </p>
                          <p className="text-gray-900 font-medium text-sm">
                            {profile.daily_data_limit}
                          </p>
                        </div>
                      )}
                      {profile.has_completed_ai_courses && (
                        <div className="p-3 border rounded-lg bg-gray-50">
                          <p className="text-gray-500 text-xs">
                            {t('common.completed.ai.courses')}
                          </p>
                          <p className="text-gray-900 font-medium text-sm">
                            {profile.has_completed_ai_courses}
                          </p>
                        </div>
                      )}
                      {profile.ai_courses_list && (
                        <div className="p-3 border rounded-lg bg-gray-50 md:col-span-2">
                          <p className="text-gray-500 text-xs">
                            {t('ui.list.of.ai.courses.completed')}
                          </p>
                          <p className="text-gray-900 font-medium text-sm">
                            {profile.ai_courses_list}
                          </p>
                        </div>
                      )}
                      {profile.resume_record_id && (
                        <div className="p-3 border rounded-lg bg-gray-50 md:col-span-2">
                          <p className="text-gray-500 text-xs mb-2">Resume</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleViewResume}
                            disabled={viewingResume}
                            className="w-full sm:w-auto"
                          >
                            {viewingResume ? 'Opening...' : 'View Resume'}
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Internship Languages */}
                    {profile.internship_languages &&
                      Object.keys(profile.internship_languages).length > 0 && (
                        <div className="mt-3">
                          <p className="text-gray-500 text-sm font-medium mb-1">
                            {t('ui.internship.language.proficiency')}
                          </p>
                          <div className="space-y-1">
                            {Object.entries(profile.internship_languages).map(
                              ([lang, level]) => (
                                <div key={lang} className="flex gap-2">
                                  <div className="p-3 border rounded-lg bg-gray-50 flex-1">
                                    <p className="text-gray-900 font-medium text-sm">
                                      {lang}
                                    </p>
                                  </div>
                                  <div className="p-3 border rounded-lg bg-gray-50 flex-1 flex items-center">
                                    <p className="text-gray-700 text-sm">
                                      {String(level)}
                                    </p>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileInfo;

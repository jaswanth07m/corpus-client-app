import React, { useState, useEffect } from 'react';
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
import { BACKEND_URL } from '@/lib/constants';
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

interface UserProfile {
  id: string;
  username?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null; // Add phone field
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
  profile_picture_path?: string | null; // Add profile picture field
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
      {Icon && <Icon className="w-4 h-4 text-gray-500 mt-0.5" />}
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
      {Icon && <Icon className="w-4 h-4 text-gray-500 mt-0.5" />}
      <div>
        <p className="text-gray-500 text-sm">{label}</p>
        <p className="text-gray-900 font-medium break-all">{value}</p>
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
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [editing, setEditing] = useState<boolean>(false);
  const [currentUserInfo, setCurrentUserInfo] = useState<{
    id: string;
    username: string;
  } | null>(null);
  const [currentUserLoaded, setCurrentUserLoaded] = useState<boolean>(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [currentLocationIndex, setCurrentLocationIndex] = useState<
    number | null
  >(null);

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
          toast.error('Authentication token not found');
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
        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile data');
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

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
        toast.info('No changes to save');
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
      toast.success('Profile updated successfully!');
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
        <div className="bg-white p-6 rounded-lg">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-lg border border-gray-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              Profile Information
            </h2>
            <div className="flex gap-2">
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
                    className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center gap-1"
                  >
                    <Pencil className="h-4 w-4" />
                    {editing ? 'Cancel' : 'Edit'}
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
          </div>

          {editing ? (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {/* Username */}
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={profile.username || ''}
                    onChange={(e) => handleChange('username', e.target.value)}
                    placeholder="Enter username"
                    minLength={3}
                    maxLength={50}
                  />
                </div>

                {/* Name */}
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profile.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>

                {/* Gender */}
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={profile.gender || ''}
                    onValueChange={(value) => handleChange('gender', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date of Birth */}
                <div>
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
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
                  <Label htmlFor="short_bio">Short Bio</Label>
                  <Textarea
                    id="short_bio"
                    value={profile.short_bio || ''}
                    onChange={(e) => handleChange('short_bio', e.target.value)}
                    placeholder="Tell us about yourself"
                    maxLength={500}
                    rows={4}
                  />
                </div>

                {/* Current Place */}
                <div>
                  <Label htmlFor="current_place">Current Place</Label>
                  <Input
                    id="current_place"
                    value={profile.current_place || ''}
                    onChange={(e) =>
                      handleChange('current_place', e.target.value)
                    }
                    placeholder="Enter current place"
                  />
                </div>

                {/* From Place */}
                <div className="md:col-span-2">
                  <Label htmlFor="from_place">From Place</Label>
                  <div className="flex gap-2 mt-1">
                    {profile.from_place ? (
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">
                          {profile.from_place.latitude.toFixed(6)},{' '}
                          {profile.from_place.longitude.toFixed(6)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 flex-1">
                        No location set
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
                      {profile.from_place ? 'Edit' : 'Set Location'}
                    </Button>
                    {profile.from_place && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          handleChange('from_place', null);
                        }}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>

                {/* Profession */}
                <div>
                  <Label htmlFor="profession">Profession</Label>
                  <Input
                    id="profession"
                    value={profile.profession || ''}
                    onChange={(e) => handleChange('profession', e.target.value)}
                    placeholder="Enter profession"
                    maxLength={200}
                  />
                </div>

                {/* Organisation */}
                <div>
                  <Label htmlFor="organisation">Organisation</Label>
                  <Input
                    id="organisation"
                    value={profile.organisation || ''}
                    onChange={(e) =>
                      handleChange('organisation', e.target.value)
                    }
                    placeholder="Enter organisation"
                    maxLength={200}
                  />
                </div>

                {/* Horizontal divider */}
                <div className="md:col-span-2 my-2 border-t border-gray-200"></div>

                {/* Language Proficiencies */}
                <div className="md:col-span-2">
                  <Label htmlFor="language_proficiencies">
                    Language Proficiencies
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
                            <SelectValue placeholder="Select language" />
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
                    Add Language
                  </Button>
                </div>

                {/* Horizontal divider */}
                <div className="md:col-span-2 my-2 border-t border-gray-200"></div>

                {/* Places Lived */}
                <div className="md:col-span-2">
                  <Label htmlFor="places_lived">Places Lived</Label>
                  {(profile.places_lived?.places || []).map((place, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">
                          {place.latitude.toFixed(4)},{' '}
                          {place.longitude.toFixed(4)}
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
                  ))}
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
                    Add Place
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
                    Social Media Profiles
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
                          placeholder="Profile URL"
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
                    Add Social Media
                  </Button>
                </div>

                {/* Horizontal divider */}
                <div className="md:col-span-2 my-2 border-t border-gray-200"></div>

                {/* Only show privacy settings for own profile */}
                {currentUserInfo &&
                  (currentUserInfo.id === userId ||
                    currentUserInfo.username === userId) && (
                    <>
                      {/* Phone Privacy */}
                      <div className="flex items-center justify-between">
                        <Label htmlFor="phone_privacy">Phone Privacy</Label>
                        <Switch
                          id="phone_privacy"
                          checked={profile.phone_privacy === 'private'}
                          onCheckedChange={(checked) =>
                            handleChange(
                              'phone_privacy',
                              checked ? 'private' : 'public',
                            )
                          }
                        />
                      </div>

                      {/* Email Privacy */}
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email_privacy">Email Privacy</Label>
                        <Switch
                          id="email_privacy"
                          checked={profile.email_privacy === 'private'}
                          onCheckedChange={(checked) =>
                            handleChange(
                              'email_privacy',
                              checked ? 'private' : 'public',
                            )
                          }
                        />
                      </div>
                    </>
                  )}
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
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-8">
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
                    <div className="flex flex-wrap gap-3 mt-2">
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

              {/* Short Bio */}
              {profile.short_bio ? (
                <div className="mt-6 p-4 border rounded-xl bg-gray-50 w-full">
                  <p className="text-gray-500 text-sm">Short Bio</p>
                  <p className="text-gray-900 font-medium break-all">
                    {profile.short_bio}
                  </p>
                </div>
              ) : null}

              {/* Grid Sections */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {profile.date_of_birth && (
                  <InfoBox
                    label="Date of Birth"
                    value={profile.date_of_birth}
                    icon={Calendar}
                  />
                )}
                {profile.gender && (
                  <InfoBox label="Gender" value={profile.gender} icon={User} />
                )}
                {(currentUserInfo &&
                (currentUserInfo.id === userId ||
                  currentUserInfo.username === userId)
                  ? profile.email !== null
                  : (profile.email && profile.email_privacy !== 'private') ||
                    profile.email_privacy === 'public') && (
                  <InfoBox
                    label="Email"
                    value={
                      currentUserInfo &&
                      (currentUserInfo.id === userId ||
                        currentUserInfo.username === userId)
                        ? profile.email || 'Not provided'
                        : profile.email_privacy === 'private'
                          ? '****'
                          : profile.email || 'Not provided'
                    }
                    icon={Mail}
                  />
                )}
                {(currentUserInfo &&
                (currentUserInfo.id === userId ||
                  currentUserInfo.username === userId)
                  ? profile.phone !== null
                  : (profile.phone && profile.phone_privacy !== 'private') ||
                    profile.phone_privacy === 'public') && (
                  <InfoBox
                    label="Phone Number"
                    value={
                      currentUserInfo &&
                      (currentUserInfo.id === userId ||
                        currentUserInfo.username === userId)
                        ? profile.phone || 'Not provided'
                        : profile.phone_privacy === 'private'
                          ? '****'
                          : profile.phone || 'Not provided'
                    }
                    icon={Phone}
                  />
                )}
              </div>

              {/* Full width sections */}
              <div className="mt-6 space-y-4">
                {/* Language Proficiencies */}
                {profile.language_proficiencies?.proficiencies &&
                profile.language_proficiencies.proficiencies.length > 0 ? (
                  <div className="w-full">
                    <div className="flex items-start gap-2 mb-2">
                      <Hash className="w-4 h-4 text-gray-500 mt-0.5" />
                      <p className="text-gray-500 text-sm">
                        Language Proficiencies
                      </p>
                    </div>
                    <div className="space-y-2">
                      {profile.language_proficiencies.proficiencies.map(
                        (lang, index) => (
                          <div key={index} className="flex gap-2">
                            <div className="p-3 border rounded-lg bg-gray-50 flex-1">
                              <p className="text-gray-900 font-medium break-all">
                                {lang.language}
                              </p>
                            </div>
                            <div className="p-3 border rounded-lg bg-gray-50 flex-1">
                              <p className="text-gray-900 font-medium break-all">
                                {lang.proficiency}
                              </p>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                ) : null}

                {/* From Place */}
                {profile.from_place ? (
                  <InfoBoxFull
                    label="From Place"
                    value={`${profile.from_place.latitude.toFixed(6)}, ${profile.from_place.longitude.toFixed(6)}`}
                    icon={Home}
                  />
                ) : null}

                {/* Places Lived */}
                {profile.places_lived?.places &&
                profile.places_lived.places.length > 0 ? (
                  <div className="w-full">
                    <div className="flex items-start gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                      <p className="text-gray-500 text-sm">Places Lived</p>
                    </div>
                    <div className="space-y-2">
                      {profile.places_lived.places.map((place, index) => (
                        <div key={index} className="flex gap-2">
                          <div className="p-3 border rounded-lg bg-gray-50 flex-1">
                            <p className="text-gray-900 font-medium break-all">
                              {place.latitude.toFixed(6)}
                            </p>
                          </div>
                          <div className="p-3 border rounded-lg bg-gray-50 flex-1">
                            <p className="text-gray-900 font-medium break-all">
                              {place.longitude.toFixed(6)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileInfo;

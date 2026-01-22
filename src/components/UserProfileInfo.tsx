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
import { BACKEND_URL } from '@/lib/constants';
import { toast } from 'sonner';
import { X, Pencil } from 'lucide-react';
import LocationPicker from '@/components/LocationPicker';

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
}

interface UserProfileInfoProps {
  userId: string;
  onClose: () => void;
  onUpdate: (updatedProfile: UserProfile) => void;
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
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
                    className="flex items-center gap-1"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">
                        Prefer not to say
                      </SelectItem>
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
                            <SelectItem value="assamese">Assamese</SelectItem>
                            <SelectItem value="bengali">Bengali</SelectItem>
                            <SelectItem value="bodo">Bodo</SelectItem>
                            <SelectItem value="dogri">Dogri</SelectItem>
                            <SelectItem value="gujarati">Gujarati</SelectItem>
                            <SelectItem value="hindi">Hindi</SelectItem>
                            <SelectItem value="kannada">Kannada</SelectItem>
                            <SelectItem value="kashmiri">Kashmiri</SelectItem>
                            <SelectItem value="konkani">Konkani</SelectItem>
                            <SelectItem value="maithili">Maithili</SelectItem>
                            <SelectItem value="malayalam">Malayalam</SelectItem>
                            <SelectItem value="marathi">Marathi</SelectItem>
                            <SelectItem value="meitei">Meitei</SelectItem>
                            <SelectItem value="nepali">Nepali</SelectItem>
                            <SelectItem value="odia">Odia</SelectItem>
                            <SelectItem value="punjabi">Punjabi</SelectItem>
                            <SelectItem value="sanskrit">Sanskrit</SelectItem>
                            <SelectItem value="santali">Santali</SelectItem>
                            <SelectItem value="sindhi">Sindhi</SelectItem>
                            <SelectItem value="tamil">Tamil</SelectItem>
                            <SelectItem value="telugu">Telugu</SelectItem>
                            <SelectItem value="urdu">Urdu</SelectItem>
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
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="intermediate">
                              Intermediate
                            </SelectItem>
                            <SelectItem value="proficient">
                              Proficient
                            </SelectItem>
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

                {/* Places Lived */}
                <div className="md:col-span-2">
                  <Label htmlFor="places_lived">Places Lived</Label>
                  {(profile.places_lived?.places || []).map((place, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">
                          Lat: {place.latitude.toFixed(4)}, Lng:{' '}
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
                          updatedPlaces.push({ latitude: lat, longitude: lng });
                        }

                        handleChange('places_lived', { places: updatedPlaces });
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
                            <SelectItem value="instagram">Instagram</SelectItem>
                            <SelectItem value="x">X (Twitter)</SelectItem>
                            <SelectItem value="linkedin">LinkedIn</SelectItem>
                            <SelectItem value="facebook">Facebook</SelectItem>
                            <SelectItem value="youtube">YouTube</SelectItem>
                            <SelectItem value="tiktok">TikTok</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
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

                {/* Only show privacy settings for own profile */}
                {currentUserInfo &&
                  (currentUserInfo.id === userId ||
                    currentUserInfo.username === userId) && (
                    <>
                      {/* Phone Privacy */}
                      <div>
                        <Label htmlFor="phone_privacy">Phone Privacy</Label>
                        <Select
                          value={profile.phone_privacy || ''}
                          onValueChange={(value) =>
                            handleChange('phone_privacy', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select privacy level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Email Privacy */}
                      <div>
                        <Label htmlFor="email_privacy">Email Privacy</Label>
                        <Select
                          value={profile.email_privacy || ''}
                          onValueChange={(value) =>
                            handleChange('email_privacy', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select privacy level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
              </div>

              {/* Short Bio */}
              <div className="mb-6">
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
            // Display mode - show profile information in read-only format
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username */}
                <div>
                  <Label className="text-gray-500">Username</Label>
                  <p className="font-medium">
                    {profile.username || 'Not provided'}
                  </p>
                </div>

                {/* Name */}
                <div>
                  <Label className="text-gray-500">Full Name</Label>
                  <p className="font-medium">
                    {profile.name || 'Not provided'}
                  </p>
                </div>

                {/* Email */}
                <div>
                  <Label className="text-gray-500">Email</Label>
                  <p className="font-medium">
                    {profile.email_privacy === 'private'
                      ? '****'
                      : profile.email || 'Not provided'}
                  </p>
                </div>

                {/* Gender */}
                <div>
                  <Label className="text-gray-500">Gender</Label>
                  <p className="font-medium">
                    {profile.gender || 'Not provided'}
                  </p>
                </div>

                {/* Date of Birth */}
                <div>
                  <Label className="text-gray-500">Date of Birth</Label>
                  <p className="font-medium">
                    {profile.date_of_birth || 'Not provided'}
                  </p>
                </div>

                {/* Current Place */}
                <div>
                  <Label className="text-gray-500">Current Place</Label>
                  <p className="font-medium">
                    {profile.current_place || 'Not provided'}
                  </p>
                </div>

                {/* Profession */}
                <div>
                  <Label className="text-gray-500">Profession</Label>
                  <p className="font-medium">
                    {profile.profession || 'Not provided'}
                  </p>
                </div>

                {/* Organisation */}
                <div>
                  <Label className="text-gray-500">Organisation</Label>
                  <p className="font-medium">
                    {profile.organisation || 'Not provided'}
                  </p>
                </div>

                {/* Language Proficiencies */}
                <div className="md:col-span-2">
                  <Label className="text-gray-500">
                    Language Proficiencies
                  </Label>
                  {profile.language_proficiencies?.proficiencies &&
                  profile.language_proficiencies.proficiencies.length > 0 ? (
                    <div className="space-y-1">
                      {profile.language_proficiencies.proficiencies.map(
                        (lang, index) => (
                          <p key={index} className="font-medium">
                            {lang.language}: {lang.proficiency}
                          </p>
                        ),
                      )}
                    </div>
                  ) : (
                    <p className="font-medium">Not provided</p>
                  )}
                </div>

                {/* Places Lived */}
                <div className="md:col-span-2">
                  <Label className="text-gray-500">Places Lived</Label>
                  {profile.places_lived?.places &&
                  profile.places_lived.places.length > 0 ? (
                    <div className="space-y-1">
                      {profile.places_lived.places.map((place, index) => (
                        <p key={index} className="font-medium">
                          Lat: {place.latitude}, Lng: {place.longitude}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="font-medium">Not provided</p>
                  )}
                </div>

                {/* Social Media Profiles */}
                <div className="md:col-span-2">
                  <Label className="text-gray-500">Social Media Profiles</Label>
                  {profile.social_media_profiles?.profiles &&
                  profile.social_media_profiles.profiles.length > 0 ? (
                    <div className="space-y-1">
                      {profile.social_media_profiles.profiles.map(
                        (social, index) => (
                          <p key={index} className="font-medium">
                            {social.platform}: {social.url}
                          </p>
                        ),
                      )}
                    </div>
                  ) : (
                    <p className="font-medium">Not provided</p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <Label className="text-gray-500">Phone Number</Label>
                  <p className="font-medium">
                    {profile.phone_privacy === 'private'
                      ? '****'
                      : profile.phone || 'Not provided'}
                  </p>
                </div>

                {/* Only show privacy settings for own profile */}
                {currentUserInfo &&
                  (currentUserInfo.id === userId ||
                    currentUserInfo.username === userId) && (
                    <>
                      {/* Phone Privacy */}
                      <div>
                        <Label className="text-gray-500">Phone Privacy</Label>
                        <p className="font-medium">
                          {profile.phone_privacy || 'Not provided'}
                        </p>
                      </div>
                    </>
                  )}

                {/* Only show privacy settings for own profile */}
                {currentUserInfo &&
                  (currentUserInfo.id === userId ||
                    currentUserInfo.username === userId) && (
                    <>
                      {/* Email Privacy */}
                      <div>
                        <Label className="text-gray-500">Email Privacy</Label>
                        <p className="font-medium">
                          {profile.email_privacy || 'Not provided'}
                        </p>
                      </div>
                    </>
                  )}
              </div>

              {/* Short Bio */}
              <div>
                <Label className="text-gray-500">Short Bio</Label>
                <p className="font-medium">
                  {profile.short_bio || 'Not provided'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileInfo;

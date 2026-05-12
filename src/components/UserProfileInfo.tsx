import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BACKEND_URL } from '@/lib/constants';
import { fetchInstitution, InstitutionDetail } from '@/lib/institutionApi';
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
  Phone,
  Calendar,
  MessageSquare,
  Hash,
  Star,
  Home,
  Earth,
  Briefcase,
} from 'lucide-react';

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

interface HardwareDetails {
  workstation_os?: string;
  workstation_ram?: string;
  mobile_os?: string;
  mobile_ram?: string;
  internet_speed?: string;
  daily_data_limit?: string;
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
  organisation_type?: string | null;
  rural_area_access?: string | null;
  permanent_postal_address?: string | null;
  institution_id?: string | null;
  current_year_of_study?: string | null;
  college_roll_number?: string | null;
  task_registered_id?: string | null;
  hardware_details?: HardwareDetails | null;
  resume_record_id?: string | null;
  has_completed_ai_courses?: string | null;
  ai_courses_list?: string | null;
}

interface UserProfileInfoProps {
  userId: string;
  onClose: () => void;
  onUpdate: (updatedProfile: UserProfile) => void;
}

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
        {fromPlace && (
          <div className="relative bg-blue-50/80 p-4 border-b border-blue-100">
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600 shadow-sm">
                  <Home size={16} />
                </div>
              </div>
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

        {placesLived?.places && placesLived.places.length > 0 && (
          <div className="p-4 pt-5">
            <p className="text-gray-500 text-sm mb-3 ml-10">Places Lived</p>
            <div className="space-y-3">
              {placesLived.places.map((place, index) => {
                const addressKey = `${place.latitude},${place.longitude}`;
                const formattedAddress = placesLivedAddresses[addressKey];

                return (
                  <div key={index} className="relative flex gap-3 group">
                    {index < placesLived.places.length - 1 && (
                      <div className="absolute top-8 left-4 w-0.5 bg-gray-300 h-10"></div>
                    )}
                    <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white ring-2 ring-white shadow-sm shrink-0">
                      <Earth size={14} />
                    </div>
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
  const navigate = useNavigate();
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
    organisation_type: null,
    rural_area_access: null,
    permanent_postal_address: null,
    institution_id: null,
    current_year_of_study: null,
    college_roll_number: null,
    task_registered_id: null,
    hardware_details: null,
    resume_record_id: null,
    has_completed_ai_courses: null,
    ai_courses_list: null,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [viewingResume, setViewingResume] = useState(false);
  const [institutionData, setInstitutionData] =
    useState<InstitutionDetail | null>(null);
  const [institutionDataLoading, setInstitutionDataLoading] = useState(false);
  const [currentUserInfo, setCurrentUserInfo] = useState<{
    id: string;
    username: string;
  } | null>(null);
  const [currentUserLoaded, setCurrentUserLoaded] = useState<boolean>(false);
  const [fromPlaceAddress, setFromPlaceAddress] = useState<string | null>(null);
  const [placesLivedAddresses, setPlacesLivedAddresses] = useState<{
    [key: string]: string;
  }>({});

  useEffect(() => {
    const getCurrentUserInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${BACKEND_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) throw new Error('Could not get current user profile');

        const userData = await response.json();
        setCurrentUserInfo({ id: userData.id, username: userData.username });
      } catch (err) {
        console.error('Error getting current user info:', err);
      } finally {
        setCurrentUserLoaded(true);
      }
    };

    getCurrentUserInfo();
  }, []);

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

        if (data.from_place) {
          fetchFormattedAddress(
            data.from_place.latitude,
            data.from_place.longitude,
          );
        }

        if (data.places_lived?.places && data.places_lived.places.length > 0) {
          data.places_lived.places.forEach((place: Coordinates) => {
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

  useEffect(() => {
    if (
      profile.places_lived?.places &&
      profile.places_lived.places.length > 0
    ) {
      profile.places_lived.places.forEach((place: Coordinates) => {
        fetchFormattedAddress(place.latitude, place.longitude, true);
      });
    } else {
      setPlacesLivedAddresses({});
    }
  }, [profile.places_lived]);

  useEffect(() => {
    if (profile.institution_id) {
      setInstitutionDataLoading(true);
      fetchInstitution(profile.institution_id)
        .then((inst) => setInstitutionData(inst))
        .catch(() => setInstitutionData(null))
        .finally(() => setInstitutionDataLoading(false));
    } else {
      setInstitutionData(null);
    }
  }, [profile.institution_id]);

  const specializationLabel = useMemo(() => {
    if (!institutionData) return '';
    const course = institutionData.courses?.[0];
    if (course) {
      const buckets = [
        course.option_a_bucket,
        course.option_b_bucket,
        course.option_c_bucket,
        course.option_d_bucket,
      ].filter((b): b is string => !!b);
      return buckets.length > 0
        ? `${course.course_name} (${buckets.join(', ')})`
        : course.course_name;
    }
    return institutionData.name || institutionData.course_name || '';
  }, [institutionData]);

  const fetchFormattedAddress = async (
    latitude: number,
    longitude: number,
    isPlacesLived: boolean = false,
  ) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${BACKEND_URL}/location/verify-location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ latitude, longitude }),
      });

      if (!response.ok) return;
      const data = await response.json();

      if (isPlacesLived) {
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

  if (loading) {
    if (typeof document === 'undefined') return null;

    return createPortal(
      <div
        className="fixed inset-0"
        style={{ background: 'rgba(0, 0, 0, 0.5)', zIndex: 99998 }}
        onClick={onClose}
      >
        <div
          className="fixed"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 99999,
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '90vw',
            maxWidth: '480px',
            maxHeight: '85vh',
            overflowY: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {t('messages.loadingProfile')}
        </div>
      </div>,
      document.body,
    );
  }

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0"
      style={{ background: 'rgba(0, 0, 0, 0.5)', zIndex: 99998 }}
      onClick={onClose}
    >
      <div
        className="fixed bg-white rounded-3xl shadow-lg border border-gray-200 w-full max-h-[90vh] overflow-y-auto"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 99999,
          width: '90vw',
          maxWidth: '896px',
          padding: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 sm:p-8">
          <div className="flex justify-end items-center gap-2">
            {currentUserLoaded &&
              currentUserInfo &&
              (currentUserInfo.id === userId ||
                currentUserInfo.username === userId) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigate('/complete-profile/step-2', {
                      state: { fromEdit: true },
                    })
                  }
                  className="px-3 py-1.5 rounded-lg flex items-center bg-blue-100 hover:bg-blue-200 text-blue-700"
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
              {profile.phone && (
                <InfoBox
                  label={t('auth.phoneNumber')}
                  value={profile.phone}
                  icon={Phone}
                />
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
                            <ProficiencyStars proficiency={lang.proficiency} />
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              ) : null}

              {/* Location Timeline */}
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
              {(profile.academic_stream ||
                profile.organisation_type ||
                profile.institution_id ||
                profile.hardware_details) && (
                <div className="w-full mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <p className="text-gray-500 text-sm font-medium">
                      {t('nav.internshipProfile')}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(profile.academic_stream || profile.organisation_type) && (
                      <div className="p-3 border rounded-lg bg-gray-50">
                        <p className="text-gray-500 text-xs">
                          {t('categories.organisationType')}
                        </p>
                        <p className="text-gray-900 font-medium text-sm">
                          {profile.academic_stream || profile.organisation_type}
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
                    {institutionData && (
                      <>
                        <div className="p-3 border rounded-lg bg-gray-50">
                          <p className="text-gray-500 text-xs">
                            {t('common.university')}
                          </p>
                          <p className="text-gray-900 font-medium text-sm">
                            {institutionDataLoading ? (
                              <span className="inline-block w-32 h-4 bg-gray-200 animate-pulse rounded" />
                            ) : (
                              institutionData.university_name
                            )}
                          </p>
                        </div>
                        <div className="p-3 border rounded-lg bg-gray-50">
                          <p className="text-gray-500 text-xs">
                            {t('common.college.institution')}
                          </p>
                          <p className="text-gray-900 font-medium text-sm">
                            {institutionDataLoading ? (
                              <span className="inline-block w-32 h-4 bg-gray-200 animate-pulse rounded" />
                            ) : (
                              institutionData.college_name
                            )}
                          </p>
                        </div>
                        <div className="p-3 border rounded-lg bg-gray-50">
                          <p className="text-gray-500 text-xs">
                            {t('common.specialization')}
                          </p>
                          <p className="text-gray-900 font-medium text-sm">
                            {institutionDataLoading ? (
                              <span className="inline-block w-32 h-4 bg-gray-200 animate-pulse rounded" />
                            ) : (
                              specializationLabel
                            )}
                          </p>
                        </div>
                      </>
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
                    {profile.hardware_details && (
                      <>
                        {profile.hardware_details.workstation_os && (
                          <div className="p-3 border rounded-lg bg-gray-50">
                            <p className="text-gray-500 text-xs">
                              {t('common.workstation.os')}
                            </p>
                            <p className="text-gray-900 font-medium text-sm">
                              {profile.hardware_details.workstation_os}
                            </p>
                          </div>
                        )}
                        {profile.hardware_details.workstation_ram && (
                          <div className="p-3 border rounded-lg bg-gray-50">
                            <p className="text-gray-500 text-xs">
                              {t('common.workstation.ram')}
                            </p>
                            <p className="text-gray-900 font-medium text-sm">
                              {profile.hardware_details.workstation_ram}
                            </p>
                          </div>
                        )}
                        {profile.hardware_details.mobile_os && (
                          <div className="p-3 border rounded-lg bg-gray-50">
                            <p className="text-gray-500 text-xs">Mobile OS</p>
                            <p className="text-gray-900 font-medium text-sm">
                              {profile.hardware_details.mobile_os}
                            </p>
                          </div>
                        )}
                        {profile.hardware_details.mobile_ram && (
                          <div className="p-3 border rounded-lg bg-gray-50">
                            <p className="text-gray-500 text-xs">Mobile RAM</p>
                            <p className="text-gray-900 font-medium text-sm">
                              {profile.hardware_details.mobile_ram}
                            </p>
                          </div>
                        )}
                        {profile.hardware_details.internet_speed && (
                          <div className="p-3 border rounded-lg bg-gray-50">
                            <p className="text-gray-500 text-xs">
                              {t('common.internet.speed')}
                            </p>
                            <p className="text-gray-900 font-medium text-sm">
                              {profile.hardware_details.internet_speed}
                            </p>
                          </div>
                        )}
                        {profile.hardware_details.daily_data_limit && (
                          <div className="p-3 border rounded-lg bg-gray-50">
                            <p className="text-gray-500 text-xs">
                              {t('common.daily.data.limit')}
                            </p>
                            <p className="text-gray-900 font-medium text-sm">
                              {profile.hardware_details.daily_data_limit}
                            </p>
                          </div>
                        )}
                      </>
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
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default UserProfileInfo;

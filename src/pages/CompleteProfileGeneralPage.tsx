import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';
import { BACKEND_URL } from '@/lib/constants';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  workstationOS,
  workstationRAM,
  mobileOS,
  mobileRAM,
  internetSpeeds,
  dailyDataLimits,
} from '@/lib/profileConstants';
import { LANGUAGE_OPTIONS } from '@/lib/languages';
import LocationPicker from '@/components/LocationPicker';
import {
  Globe,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  Youtube,
  Music2,
} from 'lucide-react';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface PlacesLived {
  places: { latitude: number; longitude: number }[];
}

interface SocialMediaProfile {
  platform: string;
  url: string;
}

interface LanguageProficiency {
  language: string;
  proficiency: string;
}

interface HardwareDetails {
  workstation_os?: string;
  workstation_ram?: string;
  mobile_os?: string;
  mobile_ram?: string;
  internet_speed?: string;
  daily_data_limit?: string;
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
  phone_privacy?: string | null;
  email_privacy?: string | null;
  rural_area_access?: string | null;
  permanent_postal_address?: string | null;
  hardware_details?: HardwareDetails | null;
  resume_record_id?: string | null;
  has_completed_ai_courses?: string | null;
  ai_courses_list?: string | null;
  is_intern?: boolean;
}

const INTERNSHIP_LANGUAGES = ['Telugu', 'Hindi', 'English', 'Urdu'];

const PROFICIENCY_OPTIONS = [
  { value: 'basic', label: 'Basic' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'proficient', label: 'Proficient' },
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

const PRIVACY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
];

const CompleteProfileGeneralPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode =
    (location.state as { fromEdit?: boolean })?.fromEdit === true;

  const [userId, setUserId] = useState<string | null>(null);
  const [originalProfile, setOriginalProfile] = useState<UserProfile | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeRecordId, setResumeRecordId] = useState<string | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    phone: '',
    gender: '',
    date_of_birth: '',
    current_place: '',
    short_bio: '',
    profession: '',
    organisation: '',
    rural_area_access: '',
    permanent_postal_address: '',
    has_completed_ai_courses: '',
    ai_courses_list: '',
    phone_privacy: '',
    email_privacy: '',
    is_intern: false,
  });

  const [hardwareDetails, setHardwareDetails] = useState<HardwareDetails>({
    workstation_os: '',
    workstation_ram: '',
    mobile_os: '',
    mobile_ram: '',
    internet_speed: '',
    daily_data_limit: '',
  });

  const [hasLaptop, setHasLaptop] = useState('');
  const [fromPlace, setFromPlace] = useState<Coordinates | null>(null);
  const [fromPlaceAddress, setFromPlaceAddress] = useState<string | null>(null);
  const [placesLived, setPlacesLived] = useState<PlacesLived>({ places: [] });
  const [placesLivedAddresses, setPlacesLivedAddresses] = useState<{
    [key: string]: string;
  }>({});
  const [socialMediaProfiles, setSocialMediaProfiles] = useState<
    SocialMediaProfile[]
  >([]);

  const [languageProficiencies, setLanguageProficiencies] = useState<
    LanguageProficiency[]
  >(
    INTERNSHIP_LANGUAGES.map((lang) => ({
      language: lang.toLowerCase(),
      proficiency: '',
    })),
  );

  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [currentLocationIndex, setCurrentLocationIndex] = useState<
    number | null
  >(null);
  const [viewingResume, setViewingResume] = useState(false);

  const [maxDate] = useState(() => {
    const today = new Date();
    const thirteenYearsAgo = new Date(
      today.getFullYear() - 13,
      today.getMonth(),
      today.getDate(),
    );
    return thirteenYearsAgo.toISOString().split('T')[0];
  });

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        const meRes = await fetch(`${BACKEND_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!meRes.ok) throw new Error('Failed to fetch user');
        const me = await meRes.json();
        setUserId(me.id);

        const profileRes = await fetch(`${BACKEND_URL}/users/${me.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!profileRes.ok) throw new Error('Failed to fetch profile');
        const profile: UserProfile = await profileRes.json();
        setOriginalProfile(profile);
        prePopulateForm(profile);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  useEffect(() => {
    if (fromPlace) {
      fetchFormattedAddress(fromPlace.latitude, fromPlace.longitude, false);
    } else {
      setFromPlaceAddress(null);
    }
  }, [fromPlace]);

  useEffect(() => {
    if (placesLived.places.length > 0) {
      placesLived.places.forEach((place) => {
        fetchFormattedAddress(place.latitude, place.longitude, true);
      });
    } else {
      setPlacesLivedAddresses({});
    }
  }, [placesLived]);

  const fetchFormattedAddress = async (
    latitude: number,
    longitude: number,
    isPlacesLivedItem: boolean = false,
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

      if (isPlacesLivedItem) {
        const parts: string[] = [];
        if (data.city) parts.push(data.city);
        if (data.state) parts.push(data.state);
        if (data.country) parts.push(data.country);
        const formatted =
          parts.length > 0
            ? parts.join(', ')
            : `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        setPlacesLivedAddresses((prev) => ({
          ...prev,
          [`${latitude},${longitude}`]: formatted,
        }));
      } else {
        setFromPlaceAddress(
          data.formatted_address ||
            `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        );
      }
    } catch {
      const fallback = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      if (isPlacesLivedItem) {
        setPlacesLivedAddresses((prev) => ({
          ...prev,
          [`${latitude},${longitude}`]: fallback,
        }));
      } else {
        setFromPlaceAddress(fallback);
      }
    }
  };

  const prePopulateForm = (profile: UserProfile) => {
    setFormData({
      username: profile.username || '',
      name: profile.name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      gender: profile.gender || '',
      date_of_birth: profile.date_of_birth || '',
      current_place: profile.current_place || '',
      short_bio: profile.short_bio || '',
      profession: profile.profession || '',
      organisation: profile.organisation || '',
      rural_area_access: profile.rural_area_access || '',
      permanent_postal_address: profile.permanent_postal_address || '',
      has_completed_ai_courses: profile.has_completed_ai_courses || '',
      ai_courses_list: profile.ai_courses_list || '',
      phone_privacy: profile.phone_privacy || '',
      email_privacy: profile.email_privacy || '',
      is_intern: profile.is_intern || false,
    });

    if (profile.hardware_details) {
      setHardwareDetails(profile.hardware_details);
      if (profile.hardware_details.workstation_os) {
        setHasLaptop('Yes');
      }
    }

    if (
      profile.language_proficiencies?.proficiencies &&
      profile.language_proficiencies.proficiencies.length > 0
    ) {
      setLanguageProficiencies(profile.language_proficiencies.proficiencies);
    }

    if (profile.from_place) {
      setFromPlace(profile.from_place);
    }

    if (profile.places_lived) {
      setPlacesLived(profile.places_lived);
    }

    if (profile.social_media_profiles?.profiles) {
      setSocialMediaProfiles(profile.social_media_profiles.profiles);
    }

    if (profile.resume_record_id) {
      setResumeRecordId(profile.resume_record_id);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLanguageChange = (language: string, proficiency: string) => {
    setLanguageProficiencies((prev) =>
      prev.map((lp) =>
        lp.language === language ? { ...lp, proficiency } : lp,
      ),
    );
  };

  const handleAddLanguage = () => {
    setLanguageProficiencies((prev) => [
      ...prev,
      { language: '', proficiency: '' },
    ]);
  };

  const handleRemoveLanguage = (index: number) => {
    setLanguageProficiencies((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLanguageSelectChange = (index: number, language: string) => {
    setLanguageProficiencies((prev) =>
      prev.map((lp, i) => (i === index ? { ...lp, language } : lp)),
    );
  };

  const handleAddSocialMedia = () => {
    setSocialMediaProfiles((prev) => [
      ...prev,
      { platform: 'instagram', url: '' },
    ]);
  };

  const handleRemoveSocialMedia = (index: number) => {
    setSocialMediaProfiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSocialMediaChange = (
    index: number,
    field: 'platform' | 'url',
    value: string,
  ) => {
    setSocialMediaProfiles((prev) =>
      prev.map((sm, i) => (i === index ? { ...sm, [field]: value } : sm)),
    );
  };

  const handleResumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      file.name.includes('..') ||
      file.name.includes('/') ||
      file.name.includes('\\')
    ) {
      toast.error(t('common.invalidFilename'));
      return;
    }

    const dangerousExtensions = [
      '.exe',
      '.bat',
      '.cmd',
      '.com',
      '.pif',
      '.scr',
      '.vbs',
      '.js',
      '.jar',
    ];
    const forbiddenMimeTypes = [
      'application/zip',
      'application/x-tar',
      'application/x-gzip',
      'application/x-7z-compressed',
      'application/x-rar-compressed',
    ];

    const fileExtension = file.name.slice(
      ((file.name.lastIndexOf('.') - 1) >>> 0) + 2,
    );

    if (dangerousExtensions.includes(`.${fileExtension.toLowerCase()}`)) {
      toast.error(t('common.fileTypeNotAllowedForSecurityReasons'));
      return;
    }

    if (forbiddenMimeTypes.includes(file.type)) {
      toast.error(t('common.archiveFileTypesAreNotAllowed'));
      return;
    }

    const MAX_SIZE = 100 * 1024 * 1024; // 100MB matching backend default
    if (file.size > MAX_SIZE) {
      toast.error(t('common.fileSizeMustBeLessThan100mb'));
      return;
    }

    const token = localStorage.getItem('token');
    if (!token || !userId) {
      toast.error(t('common.authenticationRequiredForUpload'));
      return;
    }

    setResumeUploading(true);
    setResumeFileName(file.name);

    try {
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
      const chunkData = new FormData();
      chunkData.append('chunk', file);
      chunkData.append('filename', file.name);
      chunkData.append('chunk_index', '0');
      chunkData.append('total_chunks', '1');
      chunkData.append('upload_uuid', uploadUuid);

      const username = localStorage.getItem('username') || 'user';
      const chunkRes = await fetch(`${BACKEND_URL}/records/upload/chunk`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: chunkData,
      });

      if (!chunkRes.ok) throw new Error('Chunk upload failed');

      const finalizeData = new FormData();
      finalizeData.append('upload_uuid', uploadUuid);
      finalizeData.append('title', `Resume — ${username}`);
      finalizeData.append(
        'description',
        `This resume was uploaded by ${username} to complete their professional profile and showcase their qualifications.`,
      );
      finalizeData.append(
        'category_ids',
        JSON.stringify([resumeCat.id, internshipCat.id]),
      );
      finalizeData.append('user_id', userId);
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
      setResumeRecordId(result.uid);
      toast.success('Resume uploaded successfully');
    } catch (err: unknown) {
      console.error('Resume upload error:', err);
      toast.error(
        err instanceof Error ? err.message : 'Failed to upload resume',
      );
      setResumeFileName(null);
      setResumeRecordId(null);
    } finally {
      setResumeUploading(false);
    }
  };

  const handleViewResume = async () => {
    if (!resumeRecordId) return;
    setViewingResume(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${BACKEND_URL}/records/${resumeRecordId}/record-url`,
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

  const handleLocationSelect = (lat: number, lng: number) => {
    if (currentLocationIndex === -1) {
      setFromPlace({ latitude: lat, longitude: lng });
    } else {
      const updatedPlaces = [...placesLived.places];
      if (currentLocationIndex !== null) {
        if (currentLocationIndex < updatedPlaces.length) {
          updatedPlaces[currentLocationIndex] = {
            latitude: lat,
            longitude: lng,
          };
        } else {
          updatedPlaces.push({ latitude: lat, longitude: lng });
        }
        setPlacesLived({ places: updatedPlaces });
      }
    }
    setShowLocationPicker(false);
    setCurrentLocationIndex(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const token = localStorage.getItem('token');
    if (!token || !userId) {
      toast.error(t('validation.authenticationRequired'));
      setSubmitting(false);
      return;
    }

    if (!formData.email || formData.email.trim() === '') {
      toast.error(t('auth.emailIsRequired'));
      setSubmitting(false);
      return;
    }

    for (const sm of socialMediaProfiles) {
      if (
        sm.url &&
        !sm.url.startsWith('http://') &&
        !sm.url.startsWith('https://')
      ) {
        toast.error(
          `${sm.platform} URL must be a valid URL starting with http:// or https://`,
        );
        setSubmitting(false);
        return;
      }
    }

    const currentProfile: UserProfile = {
      id: userId,
      username: formData.username || null,
      name: formData.name || null,
      email: formData.email || null,
      gender: formData.gender || null,
      date_of_birth: formData.date_of_birth || null,
      current_place: formData.current_place || null,
      short_bio: formData.short_bio || null,
      is_intern: formData.is_intern,
      profession: formData.profession || null,
      organisation: formData.organisation || null,
      places_lived: placesLived.places.length > 0 ? placesLived : null,
      from_place: fromPlace,
      social_media_profiles:
        socialMediaProfiles.length > 0
          ? { profiles: socialMediaProfiles }
          : null,
      language_proficiencies:
        languageProficiencies.filter((lp) => lp.proficiency).length > 0
          ? {
              proficiencies: languageProficiencies.filter(
                (lp) => lp.proficiency,
              ),
            }
          : null,
      phone_privacy: formData.phone_privacy || null,
      email_privacy: formData.email_privacy || null,
      rural_area_access: formData.rural_area_access || null,
      permanent_postal_address: formData.permanent_postal_address || null,
      hardware_details: Object.values(hardwareDetails).some((v) => v !== '')
        ? hardwareDetails
        : null,
      resume_record_id: resumeRecordId,
      has_completed_ai_courses: formData.has_completed_ai_courses || null,
      ai_courses_list: formData.ai_courses_list || null,
    };

    const updatePayload: Record<string, unknown> = {};

    if (originalProfile) {
      (Object.keys(currentProfile) as (keyof UserProfile)[]).forEach((key) => {
        if (key !== 'id') {
          const current = currentProfile[key];
          const original = originalProfile[key];
          if (JSON.stringify(current) !== JSON.stringify(original)) {
            if (
              current !== null &&
              current !== '' &&
              !(Array.isArray(current) && current.length === 0) &&
              !(
                typeof current === 'object' &&
                current !== null &&
                'places' in current &&
                current.places.length === 0
              )
            ) {
              updatePayload[key] = current;
            } else if (original !== null && original !== undefined) {
              updatePayload[key] = current;
            }
          }
        }
      });
    } else {
      (Object.keys(currentProfile) as (keyof UserProfile)[]).forEach((key) => {
        const value = currentProfile[key];
        if (value !== null && value !== '' && key !== 'id') {
          if (
            typeof value === 'object' &&
            !Array.isArray(value) &&
            value !== null
          ) {
            if ('places' in value && value.places.length === 0) return;
            if ('profiles' in value && value.profiles.length === 0) return;
            if ('proficiencies' in value && value.proficiencies.length === 0)
              return;
          }
          updatePayload[key] = value;
        }
      });
    }

    if (Object.keys(updatePayload).length === 0) {
      toast.info(t('common.noChangesToSave'));
      setSubmitting(false);
      // Even if no changes, we should still handle redirection
      if (formData.is_intern) {
        navigate('/complete-profile/step-3', { replace: true });
      } else {
        navigate('/profile', { replace: true });
      }
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatePayload),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(t('messages.profileCompletedSuccessfully'));
        if (formData.is_intern) {
          navigate('/complete-profile/step-3', { replace: true });
        } else {
          navigate('/profile', { replace: true });
        }
      } else {
        const errorMsg = Array.isArray(data.detail)
          ? data.detail.map((e: { msg: string }) => e.msg).join(', ')
          : data.detail || data.message || 'Failed to save profile';
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      toast.error('Network error. Please try again.');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-6 px-4 pb-24">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-xl border border-slate-200">
          <CardHeader className="text-center pb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? t('nav.editProfile') : t('nav.completeYourProfile')}
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              {t('ui.step.1.general.information')}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Identity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">{t('auth.username')}</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => handleChange('username', e.target.value)}
                    placeholder={t('auth.enterUsername')}
                    minLength={3}
                    maxLength={50}
                  />
                </div>
                <div>
                  <Label htmlFor="name">{t('user.fullName')}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder={t('user.enterFullName')}
                  />
                </div>
                <div className="space-y-3">
                  <Label>{t('common.are.you.an.intern')}</Label>
                  <RadioGroup
                    value={formData.is_intern ? 'yes' : 'no'}
                    onValueChange={(value) =>
                      handleChange('is_intern', value === 'yes')
                    }
                    className="flex space-x-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="intern-yes" />
                      <Label
                        htmlFor="intern-yes"
                        className="font-normal cursor-pointer"
                      >
                        Yes
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="intern-no" />
                      <Label
                        htmlFor="intern-no"
                        className="font-normal cursor-pointer"
                      >
                        No
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              {/* Basic Info */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  {t('common.basicInfo')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">{t('auth.phoneNumber')}</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">{t('common.gender')}</Label>
                    <SearchableSelect
                      id="gender"
                      value={formData.gender}
                      onChange={(value) => handleChange('gender', value)}
                      options={[
                        { value: 'male', label: 'Male' },
                        { value: 'female', label: 'Female' },
                        { value: 'other', label: 'Other' },
                      ]}
                      placeholder="Select gender"
                    />
                  </div>
                  <div>
                    <Label htmlFor="date_of_birth">Date of Birth *</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      max={maxDate}
                      value={formData.date_of_birth}
                      onChange={(e) =>
                        handleChange('date_of_birth', e.target.value)
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="short_bio">{t('user.shortBio')}</Label>
                    <Textarea
                      id="short_bio"
                      value={formData.short_bio}
                      onChange={(e) =>
                        handleChange('short_bio', e.target.value)
                      }
                      placeholder={t('nav.tellUsAboutYourself')}
                      maxLength={500}
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="profession">{t('user.profession')}</Label>
                    <Input
                      id="profession"
                      value={formData.profession}
                      onChange={(e) =>
                        handleChange('profession', e.target.value)
                      }
                      placeholder={t('common.enter.profession')}
                      maxLength={200}
                    />
                  </div>
                  <div>
                    <Label htmlFor="organisation">
                      {t('user.organisation')}
                    </Label>
                    <Input
                      id="organisation"
                      value={formData.organisation}
                      onChange={(e) =>
                        handleChange('organisation', e.target.value)
                      }
                      placeholder={t('common.enter.organisation')}
                      maxLength={200}
                    />
                  </div>
                </div>
              </div>

              {/* From Place & Places Lived */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  {t('common.location')}
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="current_place">Current Place *</Label>
                    <Input
                      id="current_place"
                      value={formData.current_place}
                      onChange={(e) =>
                        handleChange('current_place', e.target.value)
                      }
                      placeholder={t('user.cityState')}
                    />
                  </div>
                  <div className="space-y-3 pt-2 border-t">
                    <Label>{t('common.from.place')}</Label>

                    <div className="flex gap-2 mt-1">
                      {fromPlace ? (
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">
                            {fromPlaceAddress ||
                              `${fromPlace.latitude.toFixed(6)}, ${fromPlace.longitude.toFixed(6)}`}
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
                          setCurrentLocationIndex(-1);
                          setShowLocationPicker(true);
                        }}
                      >
                        {fromPlace
                          ? t('common.edit')
                          : t('profile.setLocation')}
                      </Button>
                      {fromPlace && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setFromPlace(null)}
                        >
                          {t('common.remove')}
                        </Button>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>{t('common.places.lived')}</Label>
                    {placesLived.places.map((place, index) => {
                      const addressKey = `${place.latitude},${place.longitude}`;
                      return (
                        <div key={index} className="flex gap-2 mb-2 mt-1">
                          <p className="text-sm text-gray-500 flex-1">
                            {placesLivedAddresses[addressKey] ||
                              `${place.latitude.toFixed(4)}, ${place.longitude.toFixed(4)}`}
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setCurrentLocationIndex(index);
                              setShowLocationPicker(true);
                            }}
                          >
                            {t('common.edit')}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const updated = [...placesLived.places];
                              updated.splice(index, 1);
                              setPlacesLived({ places: updated });
                            }}
                          >
                            {t('common.remove')}
                          </Button>
                        </div>
                      );
                    })}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCurrentLocationIndex(placesLived.places.length);
                        setShowLocationPicker(true);
                      }}
                    >
                      {t('common.addPlace')}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div className="md:col-span-2">
                      <Label htmlFor="rural_area_access">
                        {t('ui.do.you.have.access.to.any.rural.areas.nearby')}
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">
                        {t(
                          'nav.mentionPlacesAroundYourHometownOrCurrentLocationWhereYouHaveAccessToRuralAreas',
                        )}
                      </p>
                      <Textarea
                        id="rural_area_access"
                        value={formData.rural_area_access}
                        onChange={(e) =>
                          handleChange('rural_area_access', e.target.value)
                        }
                        placeholder={t(
                          'ui.eg.nearby.villages.shamirpet.medchal.etc',
                        )}
                        rows={3}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="permanent_postal_address">
                        {t('common.whatIsYourPermanentPostalAddress')}
                      </Label>
                      <Input
                        id="permanent_postal_address"
                        value={formData.permanent_postal_address}
                        onChange={(e) =>
                          handleChange(
                            'permanent_postal_address',
                            e.target.value,
                          )
                        }
                        placeholder={t(
                          'common.enterYourCompletePermanentAddress',
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {showLocationPicker && (
                <LocationPicker
                  onLocationSelect={handleLocationSelect}
                  onClose={() => {
                    setShowLocationPicker(false);
                    setCurrentLocationIndex(null);
                  }}
                />
              )}

              {/* Social Media Profiles */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  {t('nav.socialMediaProfiles')}
                </h3>
                {socialMediaProfiles.map((social, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Select
                      value={social.platform}
                      onValueChange={(value) =>
                        handleSocialMediaChange(index, 'platform', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {SOCIAL_MEDIA_PLATFORMS.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={social.url}
                      onChange={(e) =>
                        handleSocialMediaChange(index, 'url', e.target.value)
                      }
                      placeholder={t('nav.profileUrl')}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleRemoveSocialMedia(index)}
                    >
                      {t('common.remove')}
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddSocialMedia}
                >
                  {t('common.addSocialMedia')}
                </Button>
              </div>

              {/* Language Proficiencies */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {t('common.language.proficiency')}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {t('common.selectYourProficiencyLevelForEachLanguage')}
                </p>
                {languageProficiencies.map((lp, index) => (
                  <div key={index} className="flex gap-2 mb-2 items-start">
                    <div className="flex-1">
                      <Select
                        value={lp.language}
                        onValueChange={(value) =>
                          handleLanguageSelectChange(index, value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('common.selectLanguage')}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Select
                        value={lp.proficiency}
                        onValueChange={(value) =>
                          handleLanguageChange(lp.language, value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Level" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROFICIENCY_OPTIONS.map((p) => (
                            <SelectItem key={p.value} value={p.value}>
                              {p.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleRemoveLanguage(index)}
                    >
                      {t('common.remove')}
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddLanguage}
                >
                  {t('common.addLanguage')}
                </Button>
              </div>

              {/* Resume Upload */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Resume
                </h3>
                <div>
                  <Label htmlFor="resume" className="flex flex-col gap-1 mb-2">
                    <span>{t('common.uploadResumeLabel')}</span>
                    <span className="text-xs font-normal text-slate-500">
                      {t('common.supportedFileTypes')}
                    </span>
                  </Label>
                  <Input
                    id="resume"
                    type="file"
                    accept=".pdf,.doc,.docx,.odt,.rtf,.txt,.pages,.tex"
                    onChange={handleResumeChange}
                    disabled={resumeUploading}
                  />
                  {resumeUploading && (
                    <div className="flex items-center gap-2 mt-2 text-blue-600 text-sm">
                      <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                      {t('messages.uploadingResume')}
                    </div>
                  )}
                  {resumeRecordId && (
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {t('messages.resumeUploadedSuccessfully')}
                        {resumeFileName}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleViewResume}
                        disabled={viewingResume}
                      >
                        {viewingResume ? '...' : t('common.view')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Device & Internet — Hardware Details */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  {t('common.device.internet')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="has_laptop">
                      {t('common.do.you.have.a.laptop')}
                    </Label>
                    <SearchableSelect
                      id="has_laptop"
                      value={hasLaptop}
                      onChange={(value) => setHasLaptop(value)}
                      options={[
                        { value: 'Yes', label: 'Yes' },
                        { value: 'No', label: 'No' },
                      ]}
                      placeholder="Select"
                    />
                  </div>
                  {hasLaptop === 'Yes' && (
                    <>
                      <div>
                        <Label htmlFor="workstation_os">
                          {t('ui.laptop.operating.system')}
                        </Label>
                        <SearchableSelect
                          id="workstation_os"
                          value={hardwareDetails.workstation_os}
                          onChange={(value) =>
                            setHardwareDetails((prev) => ({
                              ...prev,
                              workstation_os: value,
                            }))
                          }
                          options={workstationOS}
                          placeholder={t('common.selectOs')}
                        />
                      </div>
                      <div>
                        <Label htmlFor="workstation_ram">
                          {t('common.laptop.ram')}
                        </Label>
                        <SearchableSelect
                          id="workstation_ram"
                          value={hardwareDetails.workstation_ram}
                          onChange={(value) =>
                            setHardwareDetails((prev) => ({
                              ...prev,
                              workstation_ram: value,
                            }))
                          }
                          options={workstationRAM}
                          placeholder={t('common.selectRam')}
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <Label htmlFor="mobile_os">
                      {t('ui.mobile.operating.system')}
                    </Label>
                    <SearchableSelect
                      id="mobile_os"
                      value={hardwareDetails.mobile_os}
                      onChange={(value) =>
                        setHardwareDetails((prev) => ({
                          ...prev,
                          mobile_os: value,
                        }))
                      }
                      options={mobileOS}
                      placeholder="Select OS"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mobile_ram">{t('common.mobile.ram')}</Label>
                    <SearchableSelect
                      id="mobile_ram"
                      value={hardwareDetails.mobile_ram}
                      onChange={(value) =>
                        setHardwareDetails((prev) => ({
                          ...prev,
                          mobile_ram: value,
                        }))
                      }
                      options={mobileRAM}
                      placeholder="Select RAM"
                    />
                  </div>
                  <div>
                    <Label htmlFor="internet_speed">
                      {t('ui.internet.connection.speed.mbps')}
                    </Label>
                    <SearchableSelect
                      id="internet_speed"
                      value={hardwareDetails.internet_speed}
                      onChange={(value) =>
                        setHardwareDetails((prev) => ({
                          ...prev,
                          internet_speed: value,
                        }))
                      }
                      options={internetSpeeds}
                      placeholder={t('common.selectSpeed')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="daily_data_limit">
                      {t('ui.daily.data.limit.quota')}
                    </Label>
                    <SearchableSelect
                      id="daily_data_limit"
                      value={hardwareDetails.daily_data_limit}
                      onChange={(value) =>
                        setHardwareDetails((prev) => ({
                          ...prev,
                          daily_data_limit: value,
                        }))
                      }
                      options={dailyDataLimits}
                      placeholder={t('common.selectLimit')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="has_completed_ai_courses">
                      {t('ui.have.you.completed.any.ai.courses')}
                    </Label>
                    <SearchableSelect
                      id="has_completed_ai_courses"
                      value={formData.has_completed_ai_courses}
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
                  {formData.has_completed_ai_courses === 'Yes' && (
                    <div className="md:col-span-2">
                      <Label htmlFor="ai_courses_list">
                        {t('ui.list.of.ai.courses.completed')}
                      </Label>
                      <Textarea
                        id="ai_courses_list"
                        value={formData.ai_courses_list}
                        onChange={(e) =>
                          handleChange('ai_courses_list', e.target.value)
                        }
                        placeholder={t(
                          'ui.please.list.all.ai.courses.you.have.completed',
                        )}
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  {t('common.privacySettings')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone_privacy">
                      {t('common.phonePrivacy')}
                    </Label>
                    <SearchableSelect
                      id="phone_privacy"
                      value={formData.phone_privacy}
                      onChange={(value) => handleChange('phone_privacy', value)}
                      options={PRIVACY_OPTIONS}
                      placeholder={t('common.selectPrivacy')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email_privacy">
                      {t('common.emailPrivacy')}
                    </Label>
                    <SearchableSelect
                      id="email_privacy"
                      value={formData.email_privacy}
                      onChange={(value) => handleChange('email_privacy', value)}
                      options={PRIVACY_OPTIONS}
                      placeholder={t('common.selectPrivacy')}
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg"
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('common.saving')}
                    </div>
                  ) : (
                    'Next'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompleteProfileGeneralPage;

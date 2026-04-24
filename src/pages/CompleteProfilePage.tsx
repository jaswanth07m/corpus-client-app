import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';
import { BACKEND_URL } from '@/lib/constants';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
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

interface LanguageProficiency {
  language: string;
  proficiency: string;
}

interface Category {
  id: number;
  name: string;
}

interface CurrentUser {
  id: string;
  username: string;
  profile_complete?: boolean;
}

const CompleteProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeRecordId, setResumeRecordId] = useState<string | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    gender: '',
    date_of_birth: '',
    current_place: '',
    organisation_type: '',
    work_location: '',
    rural_area_access: '',
    permanent_postal_address: '',
    college_institution: '',
    education_category: '',
    specific_stream: '',
    current_year_of_study: '',
    college_roll_number: '',
    task_registered_id: '',
    has_laptop: '',
    laptop_os: '',
    laptop_ram: '',
    mobile_os: '',
    mobile_ram: '',
    internet_speed: '',
    daily_data_limit: '',
    has_completed_ai_courses: '',
    ai_courses_list: '',
  });

  const [languageProficiencies, setLanguageProficiencies] = useState<
    LanguageProficiency[]
  >(
    internshipLanguages.map((lang) => ({
      language: lang,
      proficiency: "Don't know",
    })),
  );

  const [maxDate, setMaxDate] = useState(() => {
    const today = new Date();
    const thirteenYearsAgo = new Date(
      today.getFullYear() - 13,
      today.getMonth(),
      today.getDate(),
    );
    return thirteenYearsAgo.toISOString().split('T')[0];
  });

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch(`${BACKEND_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const user = await res.json();
          setCurrentUser(user);
          if (user.profile_complete) {
            navigate('/', { replace: true });
          }
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    };
    fetchUser();
  }, [navigate]);

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
    if (!token || !currentUser) {
      toast.error(t('common.authenticationRequiredForUpload'));
      return;
    }

    setResumeUploading(true);
    setResumeFileName(file.name);

    try {
      // 1. Fetch categories to find 'resume' and 'internship'
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

      // 2. Upload as a single chunk (since it's < 5MB)
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

      // 3. Finalize upload
      const finalizeData = new FormData();
      finalizeData.append('upload_uuid', uploadUuid);
      finalizeData.append('title', `Resume — ${currentUser.username}`);
      finalizeData.append(
        'description',
        `This is a resume document uploaded by ${currentUser.username} to complete their professional profile for the internship program.`,
      );
      finalizeData.append(
        'category_ids',
        JSON.stringify([resumeCat.id, internshipCat.id]),
      );
      finalizeData.append('user_id', currentUser.id);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Authentication token not found');
      setSubmitting(false);
      return;
    }

    if (!formData.email || formData.email.trim() === '') {
      toast.error(t('auth.emailIsRequired'));
      setSubmitting(false);
      return;
    }

    const payload: Record<string, unknown> = {
      ...formData,
      resume_record_id: resumeRecordId,
      internship_languages: languageProficiencies.reduce(
        (acc, lp) => {
          acc[lp.language.toLowerCase()] = lp.proficiency;
          return acc;
        },
        {} as Record<string, string>,
      ),
    };

    // Remove empty optional fields
    Object.keys(payload).forEach((key) => {
      if (payload[key] === '' || payload[key] === null) {
        delete payload[key];
      }
    });

    try {
      const res = await fetch(`${BACKEND_URL}/auth/complete-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(t('messages.profileCompletedSuccessfully'));
        navigate('/', { replace: true });
      } else {
        toast.error(
          data.detail || data.message || 'Failed to complete profile',
        );
      }
    } catch (err) {
      console.error('Error completing profile:', err);
      toast.error('Network error. Please try again.');
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-6 px-4 pb-24">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-xl border border-slate-200">
          <CardHeader className="text-center pb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {t('nav.completeYourProfile')}
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              {t(
                'ui.please.fill.in.the.remaining.details.to.complete.your.registration',
              )}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Basic Info */}
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
                    required
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
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="current_place">Current Place *</Label>
                  <Input
                    id="current_place"
                    value={formData.current_place}
                    onChange={(e) =>
                      handleChange('current_place', e.target.value)
                    }
                    placeholder={t('user.cityState')}
                    required
                  />
                </div>
              </div>

              {/* Education & Institution */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  {t('common.academic.details')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="organisation_type">
                      {t('categories.organisationType')}
                    </Label>
                    <SearchableSelect
                      id="organisation_type"
                      value={formData.organisation_type}
                      onChange={(value) =>
                        handleChange('organisation_type', value)
                      }
                      options={organisationTypes}
                      placeholder={t('common.selectType')}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="college_institution">
                      {t('common.college.institution')}
                    </Label>
                    <SearchableSelect
                      id="college_institution"
                      value={formData.college_institution}
                      onChange={(value) =>
                        handleChange('college_institution', value)
                      }
                      options={collegeList}
                      placeholder={t('common.selectCollege')}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {t('common.cantFindYourInstitutionSelectOtherNotInList')}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="education_category">
                      {t('categories.educationCategory')}
                    </Label>
                    <SearchableSelect
                      id="education_category"
                      value={formData.education_category}
                      onChange={(value) =>
                        handleChange('education_category', value)
                      }
                      options={educationCategories}
                      placeholder={t('common.selectCategory')}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="specific_stream">
                      {t('common.specific.stream')}
                    </Label>
                    <SearchableSelect
                      id="specific_stream"
                      value={formData.specific_stream}
                      onChange={(value) =>
                        handleChange('specific_stream', value)
                      }
                      options={specificStreams}
                      placeholder={t('common.selectStream')}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="current_year_of_study">
                      {t('time.currentYearOfStudy')}
                    </Label>
                    <SearchableSelect
                      id="current_year_of_study"
                      value={formData.current_year_of_study}
                      onChange={(value) =>
                        handleChange('current_year_of_study', value)
                      }
                      options={yearList}
                      placeholder={t('common.selectYear')}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="college_roll_number">
                      {t('common.college.roll.number')}
                    </Label>
                    <Input
                      id="college_roll_number"
                      value={formData.college_roll_number}
                      onChange={(e) =>
                        handleChange('college_roll_number', e.target.value)
                      }
                      placeholder={t('common.roll.number')}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="task_registered_id">
                      {t('ui.task.registered.id.optional')}
                    </Label>
                    <Input
                      id="task_registered_id"
                      value={formData.task_registered_id}
                      onChange={(e) =>
                        handleChange('task_registered_id', e.target.value)
                      }
                      placeholder={t('common.task.id')}
                    />
                  </div>
                </div>
              </div>

              {/* Work Location */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  {t('user.locationDetails')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="work_location">
                      {t('user.chooseYourWorkLocationForTheInternship')}
                    </Label>
                    <SearchableSelect
                      id="work_location"
                      value={formData.work_location}
                      onChange={(value) => handleChange('work_location', value)}
                      options={workLocations}
                      placeholder={t('common.selectDistrict')}
                      required
                    />
                  </div>
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
                      required
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
                        handleChange('permanent_postal_address', e.target.value)
                      }
                      placeholder={t(
                        'common.enterYourCompletePermanentAddress',
                      )}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Internship Languages */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {t('common.language.proficiency')}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {t('common.selectYourProficiencyLevelForEachLanguage')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {languageProficiencies.map((lp) => (
                    <div key={lp.language}>
                      <Label htmlFor={`lang-${lp.language}`}>
                        {lp.language}
                      </Label>
                      <select
                        id={`lang-${lp.language}`}
                        value={lp.proficiency}
                        onChange={(e) =>
                          handleLanguageChange(lp.language, e.target.value)
                        }
                        className="w-full h-10 border rounded-md px-3 bg-white"
                      >
                        {proficiencyLevels.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resume Upload */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Resume
                </h3>
                <div>
                  <Label htmlFor="resume">
                    {t('common.uploadResumePdfOnlyMax5mb')}
                  </Label>
                  <Input
                    id="resume"
                    type="file"
                    accept=".pdf"
                    onChange={handleResumeChange}
                    disabled={resumeUploading}
                    required={!resumeRecordId}
                  />
                  {resumeUploading && (
                    <div className="flex items-center gap-2 mt-2 text-blue-600 text-sm">
                      <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                      {t('messages.uploadingResume')}
                    </div>
                  )}
                  {resumeRecordId && (
                    <p className="text-sm text-green-600 mt-2 font-medium flex items-center gap-1">
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
                  )}
                </div>
              </div>

              {/* Device & Internet */}
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
                      value={formData.has_laptop}
                      onChange={(value) => handleChange('has_laptop', value)}
                      options={[
                        { value: 'Yes', label: 'Yes' },
                        { value: 'No', label: 'No' },
                      ]}
                      placeholder="Select"
                      required
                    />
                  </div>
                  {formData.has_laptop === 'Yes' && (
                    <>
                      <div>
                        <Label htmlFor="laptop_os">
                          {t('ui.laptop.operating.system')}
                        </Label>
                        <SearchableSelect
                          id="laptop_os"
                          value={formData.laptop_os}
                          onChange={(value) => handleChange('laptop_os', value)}
                          options={laptopOS}
                          placeholder={t('common.selectOs')}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="laptop_ram">
                          {t('common.laptop.ram')}
                        </Label>
                        <SearchableSelect
                          id="laptop_ram"
                          value={formData.laptop_ram}
                          onChange={(value) =>
                            handleChange('laptop_ram', value)
                          }
                          options={laptopRAM}
                          placeholder={t('common.selectRam')}
                          required
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
                      value={formData.mobile_os}
                      onChange={(value) => handleChange('mobile_os', value)}
                      options={mobileOS}
                      placeholder="Select OS"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="mobile_ram">{t('common.mobile.ram')}</Label>
                    <SearchableSelect
                      id="mobile_ram"
                      value={formData.mobile_ram}
                      onChange={(value) => handleChange('mobile_ram', value)}
                      options={mobileRAM}
                      placeholder="Select RAM"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="internet_speed">
                      {t('ui.internet.connection.speed.mbps')}
                    </Label>
                    <SearchableSelect
                      id="internet_speed"
                      value={formData.internet_speed}
                      onChange={(value) =>
                        handleChange('internet_speed', value)
                      }
                      options={internetSpeeds}
                      placeholder={t('common.selectSpeed')}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="daily_data_limit">
                      {t('ui.daily.data.limit.quota')}
                    </Label>
                    <SearchableSelect
                      id="daily_data_limit"
                      value={formData.daily_data_limit}
                      onChange={(value) =>
                        handleChange('daily_data_limit', value)
                      }
                      options={dailyDataLimits}
                      placeholder={t('common.selectLimit')}
                      required
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
                      required
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
                        required
                      />
                    </div>
                  )}
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
                    'Complete Profile'
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

export default CompleteProfilePage;

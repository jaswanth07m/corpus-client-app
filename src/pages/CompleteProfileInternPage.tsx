import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';
import { BACKEND_URL } from '@/lib/constants';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { yearList } from '@/lib/profileConstants';
import InstitutionSelector from '@/components/InstitutionSelector';
import { fetchInstitution, fetchEnums } from '@/lib/institutionApi';

interface UserProfile {
  id: string;
  academic_stream?: string | null;
  institution_id?: string | null;
  current_year_of_study?: string | null;
  college_roll_number?: string | null;
  task_registered_id?: string | null;
}

const CompleteProfileInternPage: React.FC = () => {
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
  const [institutionName, setInstitutionName] = useState<string | null>(null);
  const [academicStreamOptions, setAcademicStreamOptions] = useState<string[]>(
    [],
  );

  const [formData, setFormData] = useState({
    academic_stream: '',
    institution_id: '',
    current_year_of_study: '',
    college_roll_number: '',
    task_registered_id: '',
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

        const [profileRes, enumsRes] = await Promise.all([
          fetch(`${BACKEND_URL}/users/${me.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetchEnums('academic_streams').catch(() => ({
            academic_streams: [],
          })),
        ]);
        if (!profileRes.ok) throw new Error('Failed to fetch profile');
        const profile: UserProfile = await profileRes.json();
        setOriginalProfile(profile);
        prePopulateForm(profile);
        setAcademicStreamOptions(enumsRes.academic_streams || []);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  useEffect(() => {
    if (formData.institution_id) {
      fetchInstitution(formData.institution_id)
        .then((inst) => setInstitutionName(inst.name))
        .catch(() => setInstitutionName(null));
    } else {
      setInstitutionName(null);
    }
  }, [formData.institution_id]);

  const prePopulateForm = (profile: UserProfile) => {
    setFormData({
      academic_stream:
        profile.academic_stream || profile.organisation_type || '',
      institution_id: profile.institution_id || '',
      current_year_of_study: profile.current_year_of_study || '',
      college_roll_number: profile.college_roll_number || '',
      task_registered_id: profile.task_registered_id || '',
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

    const currentProfile: UserProfile = {
      id: userId,
      academic_stream: formData.academic_stream || null,
      institution_id: formData.institution_id || null,
      current_year_of_study: formData.current_year_of_study || null,
      college_roll_number: formData.college_roll_number || null,
      task_registered_id: formData.task_registered_id || null,
    };

    const updatePayload: Record<string, unknown> = {};

    if (originalProfile) {
      (Object.keys(currentProfile) as (keyof UserProfile)[]).forEach((key) => {
        if (key !== 'id') {
          const current = currentProfile[key];
          const original = originalProfile[key];
          if (JSON.stringify(current) !== JSON.stringify(original)) {
            updatePayload[key] = current;
          }
        }
      });
    } else {
      (Object.keys(currentProfile) as (keyof UserProfile)[]).forEach((key) => {
        const value = currentProfile[key];
        if (value !== null && value !== '' && key !== 'id') {
          updatePayload[key] = value;
        }
      });
    }

    if (Object.keys(updatePayload).length === 0) {
      toast.info(t('common.noChangesToSave'));
      setSubmitting(false);
      navigate('/profile', { replace: true });
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
        navigate('/profile', { replace: true });
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
              {t('ui.step.2.academic.details')}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Education & Institution */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  {t('common.academic.details')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="academic_stream">
                      {t('common.academic.stream')}
                    </Label>
                    <SearchableSelect
                      id="academic_stream"
                      value={formData.academic_stream}
                      onChange={(value) =>
                        handleChange('academic_stream', value)
                      }
                      options={academicStreamOptions}
                      placeholder={t('common.selectType')}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <InstitutionSelector
                      institutionId={formData.institution_id}
                      onChange={(institutionId) =>
                        handleChange('institution_id', institutionId)
                      }
                      academicStream={formData.academic_stream}
                      onAcademicStreamLoad={(stream) =>
                        handleChange('academic_stream', stream)
                      }
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

              {/* Submit */}
              <div className="pt-4 flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/complete-profile/step-2')}
                  className="flex-1 h-12 rounded-xl"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-[2] h-12 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg"
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('common.saving')}
                    </div>
                  ) : (
                    t('nav.completeProfile')
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

export default CompleteProfileInternPage;

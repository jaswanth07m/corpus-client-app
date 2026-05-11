import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import {
  fetchInstitutions,
  fetchInstitution,
  fetchUniversityNames,
  fetchCollegeNames,
  InstitutionRow,
} from '@/lib/institutionApi';

interface InstitutionSelectorProps {
  institutionId: string;
  onChange: (institutionId: string) => void;
  disabled?: boolean;
  required?: boolean;
}

const InstitutionSelector: React.FC<InstitutionSelectorProps> = ({
  institutionId,
  onChange,
  disabled = false,
  required = false,
}) => {
  const { t } = useTranslation();

  const [universities, setUniversities] = useState<string[]>([]);
  const [colleges, setColleges] = useState<string[]>([]);
  const [institutions, setInstitutions] = useState<InstitutionRow[]>([]);

  const [selectedUniversityName, setSelectedUniversityName] = useState('');
  const [selectedCollegeName, setSelectedCollegeName] = useState('');
  const [selectedInstitutionId, setSelectedInstitutionId] =
    useState(institutionId);

  const [universitiesLoading, setUniversitiesLoading] = useState(false);
  const [collegesLoading, setCollegesLoading] = useState(false);
  const [institutionsLoading, setInstitutionsLoading] = useState(false);

  const [universitySearch, setUniversitySearch] = useState('');
  const [collegeSearch, setCollegeSearch] = useState('');
  const [institutionSearch, setInstitutionSearch] = useState('');

  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const universitiesDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const collegesDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const institutionsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const doFetchUniversities = useCallback(async (search: string) => {
    setUniversitiesLoading(true);
    try {
      const data = await fetchUniversityNames({ search: search || undefined });
      setUniversities(data);
    } catch {
      // error handled silently
    } finally {
      setUniversitiesLoading(false);
    }
  }, []);

  const doFetchColleges = useCallback(
    async (universityName: string, search: string) => {
      setCollegesLoading(true);
      try {
        const data = await fetchCollegeNames({
          university_name: universityName || undefined,
          search: search || undefined,
        });
        setColleges(data);
      } catch {
        // ignore
      } finally {
        setCollegesLoading(false);
      }
    },
    [],
  );

  const doFetchInstitutions = useCallback(
    async (collegeName: string, universityName: string, search: string) => {
      setInstitutionsLoading(true);
      try {
        const data = await fetchInstitutions({
          college_name: collegeName || undefined,
          university_name: universityName || undefined,
          search: search || undefined,
          limit: 500,
        });
        setInstitutions(data);
      } catch {
        // ignore
      } finally {
        setInstitutionsLoading(false);
      }
    },
    [],
  );

  const loadInitialInstitution = useCallback(
    async (id: string) => {
      try {
        const institution = await fetchInstitution(id);
        setSelectedUniversityName(institution.university_name);
        setSelectedCollegeName(institution.college_name);
        setSelectedInstitutionId(id);
        setUniversities([institution.university_name]);
        setColleges([institution.college_name]);
        setInstitutions([institution]);
        setInitialLoadDone(true);

        // Fetch all options so the dropdowns are fully populated when opened
        doFetchUniversities('');
        doFetchColleges(institution.university_name, '');
        doFetchInstitutions(
          institution.college_name,
          institution.university_name,
          '',
        );
      } catch {
        // institution not found, ignore
      }
    },
    [doFetchUniversities, doFetchColleges, doFetchInstitutions],
  );

  // Pre-populate all three levels when institutionId is provided from outside
  useEffect(() => {
    if (institutionId && !initialLoadDone) {
      loadInitialInstitution(institutionId);
    }
  }, [institutionId, initialLoadDone, loadInitialInstitution]);

  // Fetch all universities on mount when creating a new profile (no institutionId)
  useEffect(() => {
    if (!institutionId && !initialLoadDone) {
      doFetchUniversities('');
      setInitialLoadDone(true);
    }
  }, [institutionId, initialLoadDone, doFetchUniversities]);

  function handleUniversitySearchChange(value: string) {
    setUniversitySearch(value);
    if (universitiesDebounceRef.current)
      clearTimeout(universitiesDebounceRef.current);
    universitiesDebounceRef.current = setTimeout(() => {
      doFetchUniversities(value);
    }, 300);
  }

  function handleCollegeSearchChange(value: string) {
    setCollegeSearch(value);
    if (collegesDebounceRef.current) clearTimeout(collegesDebounceRef.current);
    collegesDebounceRef.current = setTimeout(() => {
      doFetchColleges(selectedUniversityName, value);
    }, 300);
  }

  function handleInstitutionSearchChange(value: string) {
    setInstitutionSearch(value);
    if (institutionsDebounceRef.current)
      clearTimeout(institutionsDebounceRef.current);
    institutionsDebounceRef.current = setTimeout(() => {
      doFetchInstitutions(selectedCollegeName, selectedUniversityName, value);
    }, 300);
  }

  function handleUniversitySelect(value: string) {
    setSelectedUniversityName(value);
    setSelectedCollegeName('');
    setSelectedInstitutionId('');
    setColleges([]);
    setInstitutions([]);
    setCollegeSearch('');
    setInstitutionSearch('');
    onChange('');

    if (value) {
      doFetchColleges(value, '');
    }
  }

  function handleCollegeSelect(value: string) {
    setSelectedCollegeName(value);
    setSelectedInstitutionId('');
    setInstitutions([]);
    setInstitutionSearch('');
    onChange('');

    if (value) {
      doFetchInstitutions(value, selectedUniversityName, '');
    }
  }

  function handleInstitutionSelect(value: string) {
    setSelectedInstitutionId(value);
    onChange(value);
  }

  const universityOptions = universities.map((u) => ({
    value: u,
    label: u,
  }));

  const collegeOptions = colleges.map((c) => ({
    value: c,
    label: c,
  }));

  const institutionOptions = institutions.map((inst) => ({
    value: inst.id,
    label: inst.name,
  }));

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="university">{t('common.university')}</Label>
        <SearchableSelect
          id="university"
          value={selectedUniversityName}
          onChange={handleUniversitySelect}
          options={universityOptions}
          placeholder={t('common.selectUniversity')}
          disabled={disabled || universitiesLoading}
          required={required}
          onSearchChange={handleUniversitySearchChange}
        />
      </div>
      <div>
        <Label htmlFor="college">{t('common.college.institution')}</Label>
        <SearchableSelect
          id="college"
          value={selectedCollegeName}
          onChange={handleCollegeSelect}
          options={collegeOptions}
          placeholder={
            selectedUniversityName
              ? t('common.selectCollege')
              : t('common.pleaseSelectUniversityFirst')
          }
          disabled={disabled || !selectedUniversityName || collegesLoading}
          required={required}
          onSearchChange={handleCollegeSearchChange}
        />
      </div>
      <div>
        <Label htmlFor="specialization">{t('common.specialization')}</Label>
        <SearchableSelect
          id="specialization"
          value={selectedInstitutionId}
          onChange={handleInstitutionSelect}
          options={institutionOptions}
          placeholder={
            selectedCollegeName
              ? t('common.selectSpecialization')
              : t('common.pleaseSelectCollegeFirst')
          }
          disabled={disabled || !selectedCollegeName || institutionsLoading}
          required={required}
          onSearchChange={handleInstitutionSearchChange}
        />
      </div>
    </div>
  );
};

export default InstitutionSelector;

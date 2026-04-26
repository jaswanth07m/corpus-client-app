export function isProfileComplete(profile: Record<string, unknown>): boolean {
  const requiredFields = [
    'email',
    'gender',
    'date_of_birth',
    'current_place',
    'organisation_type',
    'rural_area_access',
    'permanent_postal_address',
    'institution_id',
    'current_year_of_study',
    'college_roll_number',
    'has_completed_ai_courses',
  ];

  for (const field of requiredFields) {
    const value = profile[field];
    if (!value || value === '') return false;
  }

  if (profile.has_completed_ai_courses === 'Yes') {
    const aiList = profile.ai_courses_list;
    if (!aiList || aiList === '') return false;
  }

  return true;
}

export function isProfileComplete(profile: Record<string, unknown>): boolean {
  // Step 2 Fields (Required for everyone)
  const generalRequiredFields = [
    'email',
    'gender',
    'date_of_birth',
    'current_place',
    'rural_area_access',
    'permanent_postal_address',
    'has_completed_ai_courses',
  ];

  for (const field of generalRequiredFields) {
    const value = profile[field];
    if (!value || value === '') return false;
  }

  if (profile.has_completed_ai_courses === 'Yes') {
    const aiList = profile.ai_courses_list;
    if (!aiList || aiList === '') return false;
  }

  // Step 3 Fields (Required only for interns)
  if (profile.is_intern === true) {
    const academicRequiredFields = [
      'institution_id',
      'current_year_of_study',
      'college_roll_number',
    ];

    for (const field of academicRequiredFields) {
      const value = profile[field];
      if (!value || value === '') return false;
    }
  }

  return true;
}

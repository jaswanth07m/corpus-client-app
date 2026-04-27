import { BACKEND_URL } from '@/lib/constants';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export interface Enums {
  districts: string[];
  college_types: string[];
  management_types: string[];
  mediums: string[];
  modes: string[];
}

export interface InstitutionRow {
  id: string;
  name: string;
  college_name: string;
  university_name: string;
  course_name: string;
  medium: string;
  mode: string;
  district: string;
  college_type: string;
}

export interface InstitutionDetail extends InstitutionRow {
  address?: string;
  code?: number;
  management_type?: string;
  option_a_bucket?: string | null;
  option_b_bucket?: string | null;
  option_c_bucket?: string | null;
  option_d_bucket?: string | null;
  cbcs?: boolean;
  revised_intake?: number;
}

const BASE = `${BACKEND_URL}/institutions`;

export function fetchEnums(): Promise<Enums> {
  return fetchJson<Enums>(`${BASE}/enums`);
}

export interface PaginatedParams {
  search?: string;
  skip?: number;
  limit?: number;
}

function buildQuery(
  params: Record<string, string | number | undefined>,
): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      parts.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
      );
    }
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

export function fetchInstitutions(params?: {
  university_name?: string;
  college_name?: string;
  search?: string;
  district?: string;
  college_type?: string;
  management_type?: string;
  medium?: string;
  mode?: string;
  skip?: number;
  limit?: number;
}): Promise<InstitutionRow[]> {
  const qs = buildQuery({
    university_name: params?.university_name,
    college_name: params?.college_name,
    search: params?.search,
    district: params?.district,
    college_type: params?.college_type,
    management_type: params?.management_type,
    medium: params?.medium,
    mode: params?.mode,
    skip: params?.skip ?? 0,
    limit: params?.limit ?? 100,
  });
  return fetchJson<InstitutionRow[]>(`${BASE}${qs}`);
}

export function fetchInstitution(id: string): Promise<InstitutionDetail> {
  return fetchJson<InstitutionDetail>(`${BASE}/${id}`);
}

export function fetchUniversityNames(params?: {
  search?: string;
}): Promise<string[]> {
  const qs = buildQuery({ search: params?.search });
  return fetchJson<string[]>(`${BASE}/university-names${qs}`);
}

export function fetchCollegeNames(params?: {
  university_name?: string;
  search?: string;
}): Promise<string[]> {
  const qs = buildQuery({
    university_name: params?.university_name,
    search: params?.search,
  });
  return fetchJson<string[]>(`${BASE}/college-names${qs}`);
}

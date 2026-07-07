export const BACKEND_URL =
  import.meta.env.VITE_API_SERVER_URL || 'https://api.corpus.swecha.org/api/v1';

export const IS_DOC_DIGITIZATION_VALIDATION =
  import.meta.env.VITE_DOC_DIGITIZATION_VALIDATION === 'true';

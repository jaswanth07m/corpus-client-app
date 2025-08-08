/**
 * Searches for an authentication token in localStorage and sessionStorage.
 * @returns The token string (without "Bearer " prefix) or null if not found.
 */
export const getAuthToken = (): string | null => {
  const possibleKeys = [
    'authToken',
    'token',
    'access_token',
    'accessToken',
    'jwt',
    'jwtToken',
    'authorization',
    'bearer',
  ];

  for (const key of possibleKeys) {
    const token = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (token) {
      return token.replace(/^Bearer\s+/, '');
    }
  }

  console.warn('Authentication token not found in storage.');
  return null;
};

/**
 * Decodes a JWT to extract the user ID from its payload.
 * @param token The JWT string.
 * @returns The user ID string or null if not found or on error.
 */
export const decodeUserIdFromToken = (token: string): string | null => {
  try {
    const payloadEncoded = token.split('.')[1];
    if (!payloadEncoded) {
      throw new Error('Invalid JWT format: Missing payload.');
    }

    const payload = JSON.parse(atob(payloadEncoded));

    const possibleIdKeys = ['user_id', 'userId', 'sub', 'id', 'uid', 'user_pk'];

    for (const key of possibleIdKeys) {
      if (payload[key]) {
        return payload[key].toString();
      }
    }

    console.warn('User ID key not found in JWT payload.', Object.keys(payload));
    return null;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

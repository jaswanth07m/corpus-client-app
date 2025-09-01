import { BACKEND_URL } from './constants';

export const initiatePasswordReset = async (phoneNumber: string) => {
  const response = await fetch(`${BACKEND_URL}/auth/forgot-password/init`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phone: phoneNumber }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to initiate password reset');
  }

  return response.json();
};

export const confirmPasswordReset = async (
  phoneNumber: string,
  otpCode: string,
  newPassword: string,
  confirmPassword: string,
) => {
  const response = await fetch(`${BACKEND_URL}/auth/forgot-password/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone: phoneNumber,
      otp_code: otpCode,
      new_password: newPassword,
      confirm_password: confirmPassword,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to confirm password reset');
  }

  return response.json();
};

/**
 * Unit tests for auth.ts
 * Tests all exported authentication functions:
 * - initiatePasswordReset
 * - confirmPasswordReset
 *
 * Covers API calls, error handling, and edge cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  initiatePasswordReset,
  confirmPasswordReset,
} from '../../../src/lib/auth';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock the constants module
vi.mock('../../../src/lib/constants', () => ({
  BACKEND_URL: 'https://api.example.com',
}));

describe('auth.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initiatePasswordReset()', () => {
    const validPhoneNumber = '+1234567890';
    const expectedUrl = 'https://api.example.com/auth/forgot-password/init';

    describe('success scenarios', () => {
      it('should successfully initiate password reset', async () => {
        const mockResponse = {
          success: true,
          message: 'Password reset initiated',
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await initiatePasswordReset(validPhoneNumber);

        expect(result).toEqual(mockResponse);
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch).toHaveBeenCalledWith(expectedUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phone: validPhoneNumber }),
        });
      });

      it('should handle response with additional data', async () => {
        const mockResponse = {
          success: true,
          message: 'OTP sent successfully',
          otpExpiry: 300,
          requestId: 'abc123',
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await initiatePasswordReset(validPhoneNumber);

        expect(result).toEqual(mockResponse);
      });

      it('should handle different phone number formats', async () => {
        const phoneNumbers = [
          '+1234567890',
          '1234567890',
          '+91-9876543210',
          '9876543210',
        ];

        for (const phone of phoneNumbers) {
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
          });

          const result = await initiatePasswordReset(phone);

          expect(result).toEqual({ success: true });
          expect(mockFetch).toHaveBeenCalledWith(expectedUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ phone }),
          });

          mockFetch.mockClear();
        }
      });
    });

    describe('error scenarios - API errors', () => {
      it('should throw error with message from 400 response', async () => {
        const errorMessage = 'Invalid phone number format';

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ message: errorMessage }),
        });

        await expect(initiatePasswordReset('invalid')).rejects.toThrow(
          errorMessage,
        );
      });

      it('should throw error with message from 404 response', async () => {
        const errorMessage = 'Phone number not found';

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: async () => ({ message: errorMessage }),
        });

        await expect(initiatePasswordReset('+1234567890')).rejects.toThrow(
          errorMessage,
        );
      });

      it('should throw error with message from 401 response', async () => {
        const errorMessage = 'Unauthorized';

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ message: errorMessage }),
        });

        await expect(initiatePasswordReset('+1234567890')).rejects.toThrow(
          errorMessage,
        );
      });

      it('should throw error with message from 429 response (rate limit)', async () => {
        const errorMessage = 'Too many requests. Please try again later.';

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: async () => ({ message: errorMessage }),
        });

        await expect(initiatePasswordReset('+1234567890')).rejects.toThrow(
          errorMessage,
        );
      });

      it('should throw error with message from 500 response', async () => {
        const errorMessage = 'Internal server error';

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ message: errorMessage }),
        });

        await expect(initiatePasswordReset('+1234567890')).rejects.toThrow(
          errorMessage,
        );
      });

      it('should throw error with message from 503 response (service unavailable)', async () => {
        const errorMessage = 'Service temporarily unavailable';

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: async () => ({ message: errorMessage }),
        });

        await expect(initiatePasswordReset('+1234567890')).rejects.toThrow(
          errorMessage,
        );
      });
    });

    describe('error scenarios - fallback messages', () => {
      it('should throw default error when response has no message', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({}),
        });

        await expect(initiatePasswordReset('+1234567890')).rejects.toThrow(
          'Failed to initiate password reset',
        );
      });

      it('should throw default error when message is empty string', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ message: '' }),
        });

        await expect(initiatePasswordReset('+1234567890')).rejects.toThrow(
          'Failed to initiate password reset',
        );
      });

      it('should throw default error when message is null', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ message: null }),
        });

        await expect(initiatePasswordReset('+1234567890')).rejects.toThrow(
          'Failed to initiate password reset',
        );
      });
    });

    describe('error scenarios - network failures', () => {
      it('should throw error when fetch fails with network error', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(initiatePasswordReset('+1234567890')).rejects.toThrow(
          'Network error',
        );
      });

      it('should throw error when fetch fails with timeout', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Request timeout'));

        await expect(initiatePasswordReset('+1234567890')).rejects.toThrow(
          'Request timeout',
        );
      });

      it('should throw error when fetch fails with connection refused', async () => {
        mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

        await expect(initiatePasswordReset('+1234567890')).rejects.toThrow(
          'Failed to fetch',
        );
      });
    });

    describe('edge cases', () => {
      it('should handle empty phone number', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

        const result = await initiatePasswordReset('');

        expect(result).toEqual({ success: true });
        expect(mockFetch).toHaveBeenCalledWith(expectedUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phone: '' }),
        });
      });

      it('should handle phone number with special characters', async () => {
        const phoneWithSpecialChars = '+1-234-567-8900';

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

        const result = await initiatePasswordReset(phoneWithSpecialChars);

        expect(result).toEqual({ success: true });
        expect(mockFetch).toHaveBeenCalledWith(expectedUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phone: phoneWithSpecialChars }),
        });
      });

      it('should handle very long phone number', async () => {
        const longPhoneNumber = '+'.repeat(50);

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

        const result = await initiatePasswordReset(longPhoneNumber);

        expect(result).toEqual({ success: true });
        expect(mockFetch).toHaveBeenCalledWith(expectedUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phone: longPhoneNumber }),
        });
      });

      it('should handle unicode characters in phone number', async () => {
        const phoneWithUnicode = '+1234567890📱';

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

        const result = await initiatePasswordReset(phoneWithUnicode);

        expect(result).toEqual({ success: true });
        expect(mockFetch).toHaveBeenCalledWith(expectedUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phone: phoneWithUnicode }),
        });
      });
    });

    describe('request format validation', () => {
      it('should send correct Content-Type header', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

        await initiatePasswordReset('+1234567890');

        const callArgs = mockFetch.mock.calls[0];
        expect(callArgs[1]?.headers).toEqual({
          'Content-Type': 'application/json',
        });
      });

      it('should send POST method', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

        await initiatePasswordReset('+1234567890');

        const callArgs = mockFetch.mock.calls[0];
        expect(callArgs[1]?.method).toBe('POST');
      });

      it('should send phone in request body', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

        await initiatePasswordReset('+1234567890');

        const callArgs = mockFetch.mock.calls[0];
        const body = JSON.parse(callArgs[1]?.body as string);
        expect(body).toEqual({ phone: '+1234567890' });
      });

      it('should stringify the request body', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

        await initiatePasswordReset('+1234567890');

        const callArgs = mockFetch.mock.calls[0];
        expect(typeof callArgs[1]?.body).toBe('string');
      });
    });
  });

  describe('confirmPasswordReset()', () => {
    const validPhoneNumber = '+1234567890';
    const validOtpCode = '123456';
    const validNewPassword = 'NewPassword123!';
    const validConfirmPassword = 'NewPassword123!';
    const expectedUrl = 'https://api.example.com/auth/forgot-password/confirm';

    describe('success scenarios', () => {
      it('should successfully confirm password reset', async () => {
        const mockResponse = {
          success: true,
          message: 'Password reset successful',
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await confirmPasswordReset(
          validPhoneNumber,
          validOtpCode,
          validNewPassword,
          validConfirmPassword,
        );

        expect(result).toEqual(mockResponse);
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch).toHaveBeenCalledWith(expectedUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: validPhoneNumber,
            otp_code: validOtpCode,
            new_password: validNewPassword,
            confirm_password: validConfirmPassword,
          }),
        });
      });

      it('should handle response with additional data', async () => {
        const mockResponse = {
          success: true,
          message: 'Password updated successfully',
          token: 'new-auth-token',
          userId: 'user123',
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await confirmPasswordReset(
          validPhoneNumber,
          validOtpCode,
          validNewPassword,
          validConfirmPassword,
        );

        expect(result).toEqual(mockResponse);
      });

      it('should handle different OTP code formats', async () => {
        const otpCodes = ['123456', '000000', '999999', '1234'];

        for (const otp of otpCodes) {
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
          });

          const result = await confirmPasswordReset(
            validPhoneNumber,
            otp,
            validNewPassword,
            validConfirmPassword,
          );

          expect(result).toEqual({ success: true });
          expect(mockFetch).toHaveBeenCalledWith(expectedUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              phone: validPhoneNumber,
              otp_code: otp,
              new_password: validNewPassword,
              confirm_password: validConfirmPassword,
            }),
          });

          mockFetch.mockClear();
        }
      });
    });

    describe('error scenarios - API errors', () => {
      it('should throw error with message for invalid OTP', async () => {
        const errorMessage = 'Invalid OTP code';

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ message: errorMessage }),
        });

        await expect(
          confirmPasswordReset(
            validPhoneNumber,
            'wrong-otp',
            validNewPassword,
            validConfirmPassword,
          ),
        ).rejects.toThrow(errorMessage);
      });

      it('should throw error with message for expired OTP', async () => {
        const errorMessage = 'OTP has expired';

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ message: errorMessage }),
        });

        await expect(
          confirmPasswordReset(
            validPhoneNumber,
            'expired-otp',
            validNewPassword,
            validConfirmPassword,
          ),
        ).rejects.toThrow(errorMessage);
      });

      it('should throw error with message for password mismatch', async () => {
        const errorMessage = 'Passwords do not match';

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ message: errorMessage }),
        });

        await expect(
          confirmPasswordReset(
            validPhoneNumber,
            validOtpCode,
            'password1',
            'password2',
          ),
        ).rejects.toThrow(errorMessage);
      });

      it('should throw error with message for weak password', async () => {
        const errorMessage = 'Password does not meet requirements';

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ message: errorMessage }),
        });

        await expect(
          confirmPasswordReset(validPhoneNumber, validOtpCode, 'weak', 'weak'),
        ).rejects.toThrow(errorMessage);
      });

      it('should throw error with message for unknown phone number', async () => {
        const errorMessage = 'Phone number not found';

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: async () => ({ message: errorMessage }),
        });

        await expect(
          confirmPasswordReset(
            '+9999999999',
            validOtpCode,
            validNewPassword,
            validConfirmPassword,
          ),
        ).rejects.toThrow(errorMessage);
      });

      it('should throw error with message for 401 unauthorized', async () => {
        const errorMessage = 'Unauthorized';

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ message: errorMessage }),
        });

        await expect(
          confirmPasswordReset(
            validPhoneNumber,
            validOtpCode,
            validNewPassword,
            validConfirmPassword,
          ),
        ).rejects.toThrow(errorMessage);
      });

      it('should throw error with message for 429 rate limit', async () => {
        const errorMessage = 'Too many attempts. Please try again later.';

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: async () => ({ message: errorMessage }),
        });

        await expect(
          confirmPasswordReset(
            validPhoneNumber,
            validOtpCode,
            validNewPassword,
            validConfirmPassword,
          ),
        ).rejects.toThrow(errorMessage);
      });

      it('should throw error with message for 500 server error', async () => {
        const errorMessage = 'Internal server error';

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ message: errorMessage }),
        });

        await expect(
          confirmPasswordReset(
            validPhoneNumber,
            validOtpCode,
            validNewPassword,
            validConfirmPassword,
          ),
        ).rejects.toThrow(errorMessage);
      });

      it('should throw error with message for 503 service unavailable', async () => {
        const errorMessage = 'Service temporarily unavailable';

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: async () => ({ message: errorMessage }),
        });

        await expect(
          confirmPasswordReset(
            validPhoneNumber,
            validOtpCode,
            validNewPassword,
            validConfirmPassword,
          ),
        ).rejects.toThrow(errorMessage);
      });
    });

    describe('error scenarios - fallback messages', () => {
      it('should throw default error when response has no message', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({}),
        });

        await expect(
          confirmPasswordReset(
            validPhoneNumber,
            validOtpCode,
            validNewPassword,
            validConfirmPassword,
          ),
        ).rejects.toThrow('Failed to confirm password reset');
      });

      it('should throw default error when message is empty string', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ message: '' }),
        });

        await expect(
          confirmPasswordReset(
            validPhoneNumber,
            validOtpCode,
            validNewPassword,
            validConfirmPassword,
          ),
        ).rejects.toThrow('Failed to confirm password reset');
      });

      it('should throw default error when message is null', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ message: null }),
        });

        await expect(
          confirmPasswordReset(
            validPhoneNumber,
            validOtpCode,
            validNewPassword,
            validConfirmPassword,
          ),
        ).rejects.toThrow('Failed to confirm password reset');
      });
    });

    describe('error scenarios - network failures', () => {
      it('should throw error when fetch fails with network error', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(
          confirmPasswordReset(
            validPhoneNumber,
            validOtpCode,
            validNewPassword,
            validConfirmPassword,
          ),
        ).rejects.toThrow('Network error');
      });

      it('should throw error when fetch fails with timeout', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Request timeout'));

        await expect(
          confirmPasswordReset(
            validPhoneNumber,
            validOtpCode,
            validNewPassword,
            validConfirmPassword,
          ),
        ).rejects.toThrow('Request timeout');
      });

      it('should throw error when fetch fails with connection error', async () => {
        mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

        await expect(
          confirmPasswordReset(
            validPhoneNumber,
            validOtpCode,
            validNewPassword,
            validConfirmPassword,
          ),
        ).rejects.toThrow('Failed to fetch');
      });
    });

    describe('edge cases', () => {
      it('should handle empty phone number', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

        const result = await confirmPasswordReset(
          '',
          validOtpCode,
          validNewPassword,
          validConfirmPassword,
        );

        expect(result).toEqual({ success: true });
        expect(mockFetch).toHaveBeenCalledWith(expectedUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: '',
            otp_code: validOtpCode,
            new_password: validNewPassword,
            confirm_password: validConfirmPassword,
          }),
        });
      });

      it('should handle empty OTP code', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

        const result = await confirmPasswordReset(
          validPhoneNumber,
          '',
          validNewPassword,
          validConfirmPassword,
        );

        expect(result).toEqual({ success: true });
        expect(mockFetch).toHaveBeenCalledWith(expectedUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: validPhoneNumber,
            otp_code: '',
            new_password: validNewPassword,
            confirm_password: validConfirmPassword,
          }),
        });
      });

      it('should handle empty password', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

        const result = await confirmPasswordReset(
          validPhoneNumber,
          validOtpCode,
          '',
          '',
        );

        expect(result).toEqual({ success: true });
        expect(mockFetch).toHaveBeenCalledWith(expectedUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: validPhoneNumber,
            otp_code: validOtpCode,
            new_password: '',
            confirm_password: '',
          }),
        });
      });

      it('should handle passwords with special characters', async () => {
        const passwordWithSpecialChars = 'P@$$w0rd!#$%^&*()';

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

        const result = await confirmPasswordReset(
          validPhoneNumber,
          validOtpCode,
          passwordWithSpecialChars,
          passwordWithSpecialChars,
        );

        expect(result).toEqual({ success: true });
        const callArgs = mockFetch.mock.calls[0];
        const body = JSON.parse(callArgs[1]?.body as string);
        expect(body.new_password).toBe(passwordWithSpecialChars);
        expect(body.confirm_password).toBe(passwordWithSpecialChars);
      });

      it('should handle unicode characters in password', async () => {
        const passwordWithUnicode = 'Password🔐123!';

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

        const result = await confirmPasswordReset(
          validPhoneNumber,
          validOtpCode,
          passwordWithUnicode,
          passwordWithUnicode,
        );

        expect(result).toEqual({ success: true });
        const callArgs = mockFetch.mock.calls[0];
        const body = JSON.parse(callArgs[1]?.body as string);
        expect(body.new_password).toBe(passwordWithUnicode);
        expect(body.confirm_password).toBe(passwordWithUnicode);
      });

      it('should handle very long passwords', async () => {
        const longPassword = 'a'.repeat(100);

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

        const result = await confirmPasswordReset(
          validPhoneNumber,
          validOtpCode,
          longPassword,
          longPassword,
        );

        expect(result).toEqual({ success: true });
        const callArgs = mockFetch.mock.calls[0];
        const body = JSON.parse(callArgs[1]?.body as string);
        expect(body.new_password).toBe(longPassword);
        expect(body.confirm_password).toBe(longPassword);
      });

      it('should handle mismatched passwords (client-side does not validate)', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

        const result = await confirmPasswordReset(
          validPhoneNumber,
          validOtpCode,
          'password1',
          'password2',
        );

        // Function sends the request regardless; server validates
        expect(result).toEqual({ success: true });
        const callArgs = mockFetch.mock.calls[0];
        const body = JSON.parse(callArgs[1]?.body as string);
        expect(body.new_password).toBe('password1');
        expect(body.confirm_password).toBe('password2');
      });
    });

    describe('request format validation', () => {
      it('should send correct Content-Type header', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

        await confirmPasswordReset(
          validPhoneNumber,
          validOtpCode,
          validNewPassword,
          validConfirmPassword,
        );

        const callArgs = mockFetch.mock.calls[0];
        expect(callArgs[1]?.headers).toEqual({
          'Content-Type': 'application/json',
        });
      });

      it('should send POST method', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

        await confirmPasswordReset(
          validPhoneNumber,
          validOtpCode,
          validNewPassword,
          validConfirmPassword,
        );

        const callArgs = mockFetch.mock.calls[0];
        expect(callArgs[1]?.method).toBe('POST');
      });

      it('should send all fields in request body', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

        await confirmPasswordReset(
          validPhoneNumber,
          validOtpCode,
          validNewPassword,
          validConfirmPassword,
        );

        const callArgs = mockFetch.mock.calls[0];
        const body = JSON.parse(callArgs[1]?.body as string);
        expect(body).toEqual({
          phone: validPhoneNumber,
          otp_code: validOtpCode,
          new_password: validNewPassword,
          confirm_password: validConfirmPassword,
        });
      });

      it('should use snake_case for field names', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

        await confirmPasswordReset(
          validPhoneNumber,
          validOtpCode,
          validNewPassword,
          validConfirmPassword,
        );

        const callArgs = mockFetch.mock.calls[0];
        const body = JSON.parse(callArgs[1]?.body as string);
        expect(Object.keys(body)).toEqual([
          'phone',
          'otp_code',
          'new_password',
          'confirm_password',
        ]);
      });

      it('should stringify the request body', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

        await confirmPasswordReset(
          validPhoneNumber,
          validOtpCode,
          validNewPassword,
          validConfirmPassword,
        );

        const callArgs = mockFetch.mock.calls[0];
        expect(typeof callArgs[1]?.body).toBe('string');
      });
    });

    describe('parameter order validation', () => {
      it('should respect parameter order: phone, otp, newPassword, confirmPassword', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

        await confirmPasswordReset('phone1', 'otp2', 'pass3', 'pass4');

        const callArgs = mockFetch.mock.calls[0];
        const body = JSON.parse(callArgs[1]?.body as string);
        expect(body.phone).toBe('phone1');
        expect(body.otp_code).toBe('otp2');
        expect(body.new_password).toBe('pass3');
        expect(body.confirm_password).toBe('pass4');
      });
    });
  });

  describe('URL construction', () => {
    it('should use correct URL for initiatePasswordReset', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await initiatePasswordReset('+1234567890');

      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toBe(
        'https://api.example.com/auth/forgot-password/init',
      );
    });

    it('should use correct URL for confirmPasswordReset', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await confirmPasswordReset(
        '+1234567890',
        '123456',
        'Password123!',
        'Password123!',
      );

      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toBe(
        'https://api.example.com/auth/forgot-password/confirm',
      );
    });
  });

  describe('concurrent calls', () => {
    it('should handle multiple concurrent initiatePasswordReset calls', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const promises = [
        initiatePasswordReset('+1111111111'),
        initiatePasswordReset('+2222222222'),
        initiatePasswordReset('+3333333333'),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach((result) => expect(result).toEqual({ success: true }));
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should handle multiple concurrent confirmPasswordReset calls', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const promises = [
        confirmPasswordReset('+1111111111', '111111', 'Pass1!', 'Pass1!'),
        confirmPasswordReset('+2222222222', '222222', 'Pass2!', 'Pass2!'),
        confirmPasswordReset('+3333333333', '333333', 'Pass3!', 'Pass3!'),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach((result) => expect(result).toEqual({ success: true }));
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('error type preservation', () => {
    it('should preserve Error type for initiatePasswordReset', async () => {
      const customError = new Error('Custom error');
      mockFetch.mockRejectedValueOnce(customError);

      try {
        await initiatePasswordReset('+1234567890');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Custom error');
      }
    });

    it('should preserve Error type for confirmPasswordReset', async () => {
      const customError = new Error('Custom error');
      mockFetch.mockRejectedValueOnce(customError);

      try {
        await confirmPasswordReset(
          '+1234567890',
          '123456',
          'Password123!',
          'Password123!',
        );
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Custom error');
      }
    });

    it('should preserve TypeError for fetch failures', async () => {
      const typeError = new TypeError('Failed to fetch');
      mockFetch.mockRejectedValueOnce(typeError);

      try {
        await initiatePasswordReset('+1234567890');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(TypeError);
      }
    });
  });
});

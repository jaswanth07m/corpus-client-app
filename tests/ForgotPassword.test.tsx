import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ForgotPassword from '../src/pages/ForgotPassword';
import { initiatePasswordReset, confirmPasswordReset } from '../src/lib/auth';
import { useToast } from '../src/components/ui/use-toast';

// Mock dependencies
vi.mock('../src/lib/auth');
vi.mock('../src/components/ui/use-toast');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'auth.forgotPassword': 'Forgot Password',
        'auth.phoneNumber': 'Phone Number',
        'auth.enterYourPhoneNumber': 'Enter your phone number',
        'common.91': '+91',
        'auth.sendOtp': 'Send OTP',
        'common.backToLogin': 'Back to Login',
        'auth.otpCode': 'OTP Code',
        'auth.enterOtp': 'Enter OTP',
        'auth.newPassword': 'New Password',
        'auth.enterNewPassword': 'Enter new password',
        'auth.passwordMustBeAtLeast8CharactersAndContain':
          'Password must be at least 8 characters and contain:',
        'common.one.uppercase.letter': 'One uppercase letter',
        'common.one.lowercase.letter': 'One lowercase letter',
        'common.one.number': 'One number',
        'ui.one.special.character': 'One special character',
        'common.confirmNewPassword': 'Confirm new password',
        'common.resetPassword': 'Reset Password',
        'common.backToInitiate': 'Back',
      };
      return translations[key] || key;
    },
  }),
}));

describe('ForgotPassword', () => {
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as vi.Mock).mockReturnValue({ toast: mockToast });
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>,
    );
  };

  describe('Initial Step (Initiate)', () => {
    it('renders the forgot password form', () => {
      renderComponent();
      expect(screen.getByText('Forgot Password')).toBeInTheDocument();
      expect(screen.getByText('Phone Number')).toBeInTheDocument();
      expect(screen.getByText('Send OTP')).toBeInTheDocument();
      expect(screen.getByText('Back to Login')).toBeInTheDocument();
    });

    it('shows validation error for empty phone number', async () => {
      renderComponent();
      const submitButton = screen.getByText('Send OTP');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Phone number must be at least 10 digits'),
        ).toBeInTheDocument();
      });
    });

    it('shows validation error for phone number less than 10 digits', async () => {
      renderComponent();
      const phoneInput = screen.getByPlaceholderText('Enter your phone number');
      fireEvent.change(phoneInput, { target: { value: '12345' } });

      const submitButton = screen.getByText('Send OTP');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Phone number must be at least 10 digits'),
        ).toBeInTheDocument();
      });
    });

    it('allows only numeric input in phone field', async () => {
      renderComponent();
      const phoneInput = screen.getByPlaceholderText('Enter your phone number');

      fireEvent.change(phoneInput, { target: { value: '12345abc67' } });

      expect(phoneInput).toHaveValue('1234567');
    });

    it('restricts phone number to max 10 digits', async () => {
      renderComponent();
      const phoneInput = screen.getByPlaceholderText('Enter your phone number');

      fireEvent.change(phoneInput, { target: { value: '12345678901234' } });

      expect(phoneInput).toHaveValue('1234567890');
    });

    it('calls initiatePasswordReset with valid phone number', async () => {
      vi.mocked(initiatePasswordReset).mockResolvedValue({ success: true });

      renderComponent();
      const phoneInput = screen.getByPlaceholderText('Enter your phone number');
      fireEvent.change(phoneInput, { target: { value: '9876543210' } });

      const submitButton = screen.getByText('Send OTP');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(initiatePasswordReset).toHaveBeenCalledWith('9876543210');
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'OTP Sent',
        description: 'A one-time password has been sent to your phone.',
      });
    });

    it('shows error toast when initiatePasswordReset fails', async () => {
      vi.mocked(initiatePasswordReset).mockRejectedValue(
        new Error('Failed to send OTP'),
      );

      renderComponent();
      const phoneInput = screen.getByPlaceholderText('Enter your phone number');
      fireEvent.change(phoneInput, { target: { value: '9876543210' } });

      const submitButton = screen.getByText('Send OTP');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to send OTP',
          variant: 'destructive',
        });
      });
    });

    it('navigates to login when clicking Back to Login button', () => {
      renderComponent();
      const backButton = screen.getByText('Back to Login');
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('shows error toast when initiatePasswordReset fails with non-Error', async () => {
      vi.mocked(initiatePasswordReset).mockRejectedValue('String error');

      renderComponent();
      const phoneInput = screen.getByPlaceholderText('Enter your phone number');
      fireEvent.change(phoneInput, { target: { value: '9876543210' } });

      const submitButton = screen.getByText('Send OTP');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'An unknown error occurred.',
          variant: 'destructive',
        });
      });
    });

    it('shows loading state during initiate password reset', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(initiatePasswordReset).mockImplementation(() => promise);

      renderComponent();
      const phoneInput = screen.getByPlaceholderText('Enter your phone number');
      fireEvent.change(phoneInput, { target: { value: '9876543210' } });

      const submitButton = screen.getByText('Send OTP');
      fireEvent.click(submitButton);

      // Wait for loading state to appear
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      // Check for loading spinner (svg element)
      expect(submitButton.querySelector('svg')).toBeInTheDocument();

      // Resolve the promise to clean up
      resolvePromise!({ success: true });

      // Wait for the form to transition to confirm step, then check spinner is gone
      await waitFor(() => {
        expect(screen.queryByText('Reset Password')).toBeInTheDocument();
      });
    });
  });

  describe('Confirm Step', () => {
    beforeEach(() => {
      vi.mocked(initiatePasswordReset).mockResolvedValue({ success: true });
    });

    const fillInitiateForm = async () => {
      renderComponent();
      const phoneInput = screen.getByPlaceholderText('Enter your phone number');
      fireEvent.change(phoneInput, { target: { value: '9876543210' } });

      const submitButton = screen.getByText('Send OTP');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('OTP Code')).toBeInTheDocument();
      });
    };

    it('transitions to confirm step after successful OTP initiation', async () => {
      await fillInitiateForm();

      expect(screen.getByText('OTP Code')).toBeInTheDocument();
      expect(screen.getByText('New Password')).toBeInTheDocument();
      expect(screen.getByText('Confirm New Password')).toBeInTheDocument();
      expect(screen.getByText('Reset Password')).toBeInTheDocument();
    });

    it('displays phone number in disabled field on confirm step', async () => {
      await fillInitiateForm();

      const phoneField = screen.getByPlaceholderText(
        'Enter your phone number',
      ) as HTMLInputElement;
      expect(phoneField).toHaveValue('9876543210');
      expect(phoneField).toBeDisabled();
    });

    it('shows validation error for empty OTP', async () => {
      await fillInitiateForm();

      const submitButton = screen.getByText('Reset Password');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('OTP must be 6 digits')).toBeInTheDocument();
      });
    });

    it('shows validation error for OTP less than 6 digits', async () => {
      await fillInitiateForm();

      const otpInput = screen.getByPlaceholderText('Enter OTP');
      fireEvent.change(otpInput, { target: { value: '12345' } });

      const submitButton = screen.getByText('Reset Password');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('OTP must be 6 digits')).toBeInTheDocument();
      });
    });

    it('shows validation error for weak password', async () => {
      await fillInitiateForm();

      const otpInput = screen.getByPlaceholderText('Enter OTP');
      const newPasswordInput =
        screen.getByPlaceholderText('Enter new password');
      const confirmPasswordInput = screen.getByPlaceholderText(
        'Confirm new password',
      );

      fireEvent.change(otpInput, { target: { value: '123456' } });
      fireEvent.change(newPasswordInput, { target: { value: 'weak' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'weak' } });

      const submitButton = screen.getByText('Reset Password');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Password must be at least 8 characters'),
        ).toBeInTheDocument();
      });
    });

    it('shows validation error when passwords do not match', async () => {
      await fillInitiateForm();

      const otpInput = screen.getByPlaceholderText('Enter OTP');
      const newPasswordInput =
        screen.getByPlaceholderText('Enter new password');
      const confirmPasswordInput = screen.getByPlaceholderText(
        'Confirm new password',
      );

      fireEvent.change(otpInput, { target: { value: '123456' } });
      fireEvent.change(newPasswordInput, { target: { value: 'Password1!' } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: 'Password2!' },
      });

      const submitButton = screen.getByText('Reset Password');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
      });
    });

    it('calls confirmPasswordReset with valid data and navigates to login', async () => {
      vi.mocked(confirmPasswordReset).mockResolvedValue({ success: true });

      await fillInitiateForm();

      const otpInput = screen.getByPlaceholderText('Enter OTP');
      const newPasswordInput =
        screen.getByPlaceholderText('Enter new password');
      const confirmPasswordInput = screen.getByPlaceholderText(
        'Confirm new password',
      );

      fireEvent.change(otpInput, { target: { value: '123456' } });
      fireEvent.change(newPasswordInput, { target: { value: 'Password1!' } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: 'Password1!' },
      });

      const submitButton = screen.getByText('Reset Password');
      fireEvent.click(submitButton);

      // Wait for loading state to appear
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      // Wait for loading state to disappear (finally block execution)
      await waitFor(
        () => {
          expect(submitButton).not.toBeDisabled();
        },
        { timeout: 3000 },
      );

      // Verify the API was called
      expect(confirmPasswordReset).toHaveBeenCalledWith(
        '9876543210',
        '123456',
        'Password1!',
        'Password1!',
      );

      // Verify toast was shown
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Password Reset Successful',
        description: 'Your password has been reset successfully.',
      });

      // Verify navigation happened
      await waitFor(
        () => {
          expect(mockNavigate).toHaveBeenCalledWith('/');
        },
        { timeout: 3000 },
      );
    });

    it('shows error toast when confirmPasswordReset fails', async () => {
      vi.mocked(confirmPasswordReset).mockRejectedValue(
        new Error('Failed to reset password'),
      );

      await fillInitiateForm();

      const otpInput = screen.getByPlaceholderText('Enter OTP');
      const newPasswordInput =
        screen.getByPlaceholderText('Enter new password');
      const confirmPasswordInput = screen.getByPlaceholderText(
        'Confirm new password',
      );

      fireEvent.change(otpInput, { target: { value: '123456' } });
      fireEvent.change(newPasswordInput, { target: { value: 'Password1!' } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: 'Password1!' },
      });

      const submitButton = screen.getByText('Reset Password');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to reset password',
          variant: 'destructive',
        });
      });

      // Verify loading state was cleared (finally block)
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('shows error toast when confirmPasswordReset fails with non-Error', async () => {
      vi.mocked(confirmPasswordReset).mockRejectedValue('String error');

      await fillInitiateForm();

      const otpInput = screen.getByPlaceholderText('Enter OTP');
      const newPasswordInput =
        screen.getByPlaceholderText('Enter new password');
      const confirmPasswordInput = screen.getByPlaceholderText(
        'Confirm new password',
      );

      fireEvent.change(otpInput, { target: { value: '123456' } });
      fireEvent.change(newPasswordInput, { target: { value: 'Password1!' } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: 'Password1!' },
      });

      const submitButton = screen.getByText('Reset Password');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'An unknown error occurred.',
          variant: 'destructive',
        });
      });

      // Verify loading state was cleared (finally block)
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('shows loading state during confirm password reset', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(confirmPasswordReset).mockImplementation(() => promise);

      await fillInitiateForm();

      const otpInput = screen.getByPlaceholderText('Enter OTP');
      const newPasswordInput =
        screen.getByPlaceholderText('Enter new password');
      const confirmPasswordInput = screen.getByPlaceholderText(
        'Confirm new password',
      );

      fireEvent.change(otpInput, { target: { value: '123456' } });
      fireEvent.change(newPasswordInput, { target: { value: 'Password1!' } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: 'Password1!' },
      });

      const submitButton = screen.getByText('Reset Password');
      fireEvent.click(submitButton);

      // Wait for loading state to appear
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      // Check for loading spinner (svg element)
      expect(
        screen.getByText('Reset Password').querySelector('svg'),
      ).toBeInTheDocument();

      // Resolve the promise to clean up
      resolvePromise!({ success: true });

      await waitFor(() => {
        expect(
          screen.getByText('Reset Password').querySelector('svg'),
        ).not.toBeInTheDocument();
      });
    });

    it('allows going back to initiate step', async () => {
      await fillInitiateForm();

      const backButton = screen.getByText('Back');
      fireEvent.click(backButton);

      await waitFor(() => {
        expect(screen.getByText('Send OTP')).toBeInTheDocument();
        expect(screen.queryByText('OTP Code')).not.toBeInTheDocument();
      });
    });
  });

  describe('Password Validation', () => {
    const setupConfirmStep = async () => {
      vi.mocked(initiatePasswordReset).mockResolvedValue({ success: true });
      renderComponent();
      const phoneInput = screen.getByPlaceholderText('Enter your phone number');
      fireEvent.change(phoneInput, { target: { value: '9876543210' } });

      const submitButton = screen.getByText('Send OTP');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('OTP Code')).toBeInTheDocument();
      });
    };

    it('requires uppercase letter in password', async () => {
      await setupConfirmStep();

      const otpInput = screen.getByPlaceholderText('Enter OTP');
      const newPasswordInput =
        screen.getByPlaceholderText('Enter new password');
      const confirmPasswordInput = screen.getByPlaceholderText(
        'Confirm new password',
      );

      fireEvent.change(otpInput, { target: { value: '123456' } });
      fireEvent.change(newPasswordInput, { target: { value: 'password1!' } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: 'password1!' },
      });

      const submitButton = screen.getByText('Reset Password');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            'Password must contain at least one uppercase letter',
          ),
        ).toBeInTheDocument();
      });
    });

    it('requires lowercase letter in password', async () => {
      await setupConfirmStep();

      const otpInput = screen.getByPlaceholderText('Enter OTP');
      const newPasswordInput =
        screen.getByPlaceholderText('Enter new password');
      const confirmPasswordInput = screen.getByPlaceholderText(
        'Confirm new password',
      );

      fireEvent.change(otpInput, { target: { value: '123456' } });
      fireEvent.change(newPasswordInput, { target: { value: 'PASSWORD1!' } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: 'PASSWORD1!' },
      });

      const submitButton = screen.getByText('Reset Password');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            'Password must contain at least one lowercase letter',
          ),
        ).toBeInTheDocument();
      });
    });

    it('requires number in password', async () => {
      await setupConfirmStep();

      const otpInput = screen.getByPlaceholderText('Enter OTP');
      const newPasswordInput =
        screen.getByPlaceholderText('Enter new password');
      const confirmPasswordInput = screen.getByPlaceholderText(
        'Confirm new password',
      );

      fireEvent.change(otpInput, { target: { value: '123456' } });
      fireEvent.change(newPasswordInput, { target: { value: 'Password!' } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: 'Password!' },
      });

      const submitButton = screen.getByText('Reset Password');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Password must contain at least one number'),
        ).toBeInTheDocument();
      });
    });

    it('requires special character in password', async () => {
      await setupConfirmStep();

      const otpInput = screen.getByPlaceholderText('Enter OTP');
      const newPasswordInput =
        screen.getByPlaceholderText('Enter new password');
      const confirmPasswordInput = screen.getByPlaceholderText(
        'Confirm new password',
      );

      fireEvent.change(otpInput, { target: { value: '123456' } });
      fireEvent.change(newPasswordInput, { target: { value: 'Password1' } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: 'Password1' },
      });

      const submitButton = screen.getByText('Reset Password');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            'Password must contain at least one special character',
          ),
        ).toBeInTheDocument();
      });
    });
  });
});

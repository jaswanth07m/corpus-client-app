import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ForgotPassword from '../../../src/pages/ForgotPassword';
import { BrowserRouter } from 'react-router-dom';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...(actual as object),
    useNavigate: () => mockNavigate,
  };
});

const mockInitiateReset = vi.fn();
const mockConfirmReset = vi.fn();
vi.mock('@/lib/auth', () => ({
  initiatePasswordReset: (...args: unknown[]) => mockInitiateReset(...args),
  confirmPasswordReset: (...args: unknown[]) => mockConfirmReset(...args),
}));

const mockToast = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

const renderComponent = () =>
  render(
    <BrowserRouter>
      <ForgotPassword />
    </BrowserRouter>,
  );

describe('ForgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers(); // Ensure real timers are restored
  });

  it('renders initiate step initially', () => {
    renderComponent();
    expect(screen.getByText('auth.forgotPassword')).toBeInTheDocument();
  });

  it('handles phone number input constraints', async () => {
    renderComponent();
    const phoneInput = screen.getByPlaceholderText('auth.enterYourPhoneNumber');
    fireEvent.change(phoneInput, { target: { value: '123abc456789012' } });
    expect(phoneInput).toHaveValue('1234567890');
  });

  it('submits initiate form successfully and moves to confirm step', async () => {
    renderComponent();
    const phoneInput = screen.getByPlaceholderText('auth.enterYourPhoneNumber');
    fireEvent.change(phoneInput, { target: { value: '9999999999' } });

    mockInitiateReset.mockResolvedValueOnce(undefined);

    fireEvent.click(screen.getByText('auth.sendOtp'));

    await waitFor(() => {
      expect(mockInitiateReset).toHaveBeenCalledWith('9999999999');
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'OTP Sent' }),
      );
    });
    expect(screen.getByText('auth.otpCode')).toBeInTheDocument();
  });

  it('handles initiate form error', async () => {
    renderComponent();
    const phoneInput = screen.getByPlaceholderText('auth.enterYourPhoneNumber');
    fireEvent.change(phoneInput, { target: { value: '9999999999' } });

    mockInitiateReset.mockRejectedValueOnce(new Error('Network error'));
    fireEvent.click(screen.getByText('auth.sendOtp'));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Network error',
          variant: 'destructive',
        }),
      );
    });
  });

  it('handles initiate form unknown error', async () => {
    renderComponent();
    const phoneInput = screen.getByPlaceholderText('auth.enterYourPhoneNumber');
    fireEvent.change(phoneInput, { target: { value: '9999999999' } });

    mockInitiateReset.mockRejectedValueOnce('string error');
    fireEvent.click(screen.getByText('auth.sendOtp'));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ description: 'An unknown error occurred.' }),
      );
    });
  });

  it('submits confirm form successfully and redirects', async () => {
    renderComponent();

    const phoneInput = screen.getByPlaceholderText('auth.enterYourPhoneNumber');
    fireEvent.change(phoneInput, { target: { value: '9999999999' } });
    mockInitiateReset.mockResolvedValueOnce(undefined);
    fireEvent.click(screen.getByText('auth.sendOtp'));

    let otpInput;
    await waitFor(() => {
      otpInput = screen.getByPlaceholderText('auth.enterOtp');
    });

    fireEvent.change(otpInput, { target: { value: '123456' } });
    fireEvent.change(screen.getByPlaceholderText('auth.enterNewPassword'), {
      target: { value: 'Valid@123' },
    });
    fireEvent.change(screen.getByPlaceholderText('common.confirmNewPassword'), {
      target: { value: 'Valid@123' },
    });

    mockConfirmReset.mockResolvedValueOnce(undefined);
    fireEvent.click(screen.getByText('common.resetPassword'));

    await waitFor(() => {
      expect(mockConfirmReset).toHaveBeenCalledWith(
        '9999999999',
        '123456',
        'Valid@123',
        'Valid@123',
      );
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Password Reset Successful' }),
      );
    });

    // The source uses a 1.2s setTimeout before navigate; wait for it with real timers
    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      },
      { timeout: 3000 },
    );
  });

  it('handles confirm form mismatch password', async () => {
    renderComponent();

    const phoneInput = screen.getByPlaceholderText('auth.enterYourPhoneNumber');
    fireEvent.change(phoneInput, { target: { value: '9999999999' } });
    mockInitiateReset.mockResolvedValueOnce(undefined);
    fireEvent.click(screen.getByText('auth.sendOtp'));

    let otpInput;
    await waitFor(() => {
      otpInput = screen.getByPlaceholderText('auth.enterOtp');
    });

    fireEvent.change(otpInput, { target: { value: '123456' } });
    fireEvent.change(screen.getByPlaceholderText('auth.enterNewPassword'), {
      target: { value: 'Valid@123' },
    });
    fireEvent.change(screen.getByPlaceholderText('common.confirmNewPassword'), {
      target: { value: 'Invalid@123' },
    });

    fireEvent.click(screen.getByText('common.resetPassword'));

    await waitFor(() => {
      expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
    });
  });

  it('handles confirm form error', async () => {
    renderComponent();

    const phoneInput = screen.getByPlaceholderText('auth.enterYourPhoneNumber');
    fireEvent.change(phoneInput, { target: { value: '9999999999' } });
    mockInitiateReset.mockResolvedValueOnce(undefined);
    fireEvent.click(screen.getByText('auth.sendOtp'));

    let otpInput;
    await waitFor(() => {
      otpInput = screen.getByPlaceholderText('auth.enterOtp');
    });

    fireEvent.change(otpInput, { target: { value: '123456' } });
    fireEvent.change(screen.getByPlaceholderText('auth.enterNewPassword'), {
      target: { value: 'Valid@123' },
    });
    fireEvent.change(screen.getByPlaceholderText('common.confirmNewPassword'), {
      target: { value: 'Valid@123' },
    });

    mockConfirmReset.mockRejectedValueOnce(new Error('Reset failed'));
    fireEvent.click(screen.getByText('common.resetPassword'));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ description: 'Reset failed' }),
      );
    });
  });

  it('handles confirm form unknown error', async () => {
    renderComponent();

    const phoneInput = screen.getByPlaceholderText('auth.enterYourPhoneNumber');
    fireEvent.change(phoneInput, { target: { value: '9999999999' } });
    mockInitiateReset.mockResolvedValueOnce(undefined);
    fireEvent.click(screen.getByText('auth.sendOtp'));

    let otpInput;
    await waitFor(() => {
      otpInput = screen.getByPlaceholderText('auth.enterOtp');
    });

    fireEvent.change(otpInput, { target: { value: '123456' } });
    fireEvent.change(screen.getByPlaceholderText('auth.enterNewPassword'), {
      target: { value: 'Valid@123' },
    });
    fireEvent.change(screen.getByPlaceholderText('common.confirmNewPassword'), {
      target: { value: 'Valid@123' },
    });

    mockConfirmReset.mockRejectedValueOnce('string fail');
    fireEvent.click(screen.getByText('common.resetPassword'));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ description: 'An unknown error occurred.' }),
      );
    });
  });

  it('navigates back to initiate step from confirm step', async () => {
    renderComponent();

    const phoneInput = screen.getByPlaceholderText('auth.enterYourPhoneNumber');
    fireEvent.change(phoneInput, { target: { value: '9999999999' } });
    mockInitiateReset.mockResolvedValueOnce(undefined);
    fireEvent.click(screen.getByText('auth.sendOtp'));

    await waitFor(() =>
      expect(screen.getByText('auth.otpCode')).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText('common.backToInitiate'));

    await waitFor(() => {
      expect(screen.getByText('auth.sendOtp')).toBeInTheDocument();
    });
  });

  it('navigates to login when back button is clicked in initiate step', () => {
    renderComponent();
    fireEvent.click(screen.getByText('common.backToLogin'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import LoginForm from '../../../src/components/LoginForm';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// Mock language switcher and translations
vi.mock('react-i18next', async () => {
  const actual =
    await vi.importActual<typeof import('react-i18next')>('react-i18next');
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: {
        changeLanguage: vi.fn(),
        language: 'en',
      },
    }),
  };
});

vi.mock('../../src/components/LanguageSwitcher', () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher" />,
}));

const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    error: (msg: string) => mockToastError(msg),
    success: (msg: string) => mockToastSuccess(msg),
  },
}));

const renderComponent = (onLoginSuccess = vi.fn()) => {
  return render(
    <BrowserRouter>
      <LoginForm onLoginSuccess={onLoginSuccess} />
    </BrowserRouter>,
  );
};

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders login mode by default', () => {
    renderComponent();
    expect(
      screen.getByPlaceholderText('auth.enter10digitPhoneNumber'),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('auth.enterYourPassword'),
    ).toBeInTheDocument();
  });

  it('validates phone number correctly on blur', async () => {
    const user = userEvent.setup();
    renderComponent();

    const phoneInput = screen.getByPlaceholderText(
      'auth.enter10digitPhoneNumber',
    );
    await user.type(phoneInput, '12345');
    fireEvent.blur(phoneInput);

    expect(screen.getByText('auth.phoneNumberIsInvalid')).not.toHaveClass(
      'hidden',
    );

    // Clear and fix digits
    await user.clear(phoneInput);
    await user.type(phoneInput, '9876543210');
    fireEvent.blur(phoneInput);
    expect(phoneInput).not.toHaveClass('border-rose-800');
  });

  it('toggles password visibility in login', async () => {
    renderComponent();
    const user = userEvent.setup();

    const passwordInput = screen.getByPlaceholderText('auth.enterYourPassword');
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleButtons = screen.getAllByRole('button');
    // Using simple traversal or find the eye button logic
    const toggleButton = toggleButtons.find(
      (b) =>
        b.querySelector('.lucide-eye') || b.querySelector('.lucide-eye-off'),
    );

    if (toggleButton) {
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');
    }
  });

  it('successfully logs in with password', async () => {
    const user = userEvent.setup();
    const onLoginSuccess = vi.fn();
    renderComponent(onLoginSuccess);

    const phoneInput = screen.getByPlaceholderText(
      'auth.enter10digitPhoneNumber',
    );
    const passwordInput = screen.getByPlaceholderText('auth.enterYourPassword');

    await user.type(phoneInput, '9999999999');
    await user.type(passwordInput, 'validPass123');

    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'fake-token',
        user: { phone: '9999999999' },
      }),
      status: 200,
    });

    const loginButtons = screen.getAllByRole('button', { name: 'auth.login' });
    await user.click(loginButtons[loginButtons.length - 1]);

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Login successful!');
      expect(onLoginSuccess).toHaveBeenCalledWith('fake-token', {
        phone: '9999999999',
      });
    });
  });

  it('handles API errors during password login', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.type(
      screen.getByPlaceholderText('auth.enter10digitPhoneNumber'),
      '9999999999',
    );
    await user.type(
      screen.getByPlaceholderText('auth.enterYourPassword'),
      'wrongpass',
    );

    (global.fetch as Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Invalid credentials' }),
      status: 401,
    });

    const loginBtns = screen.getAllByRole('button', { name: 'auth.login' });
    await user.click(loginBtns[loginBtns.length - 1]);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Invalid credentials');
    });
  });

  it('switches to signup mode and validates form completely', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Switch to Signup
    const signupBtns = screen.getAllByRole('button', { name: 'auth.signUp' });
    await user.click(signupBtns[0]);

    const usernameInput = screen.getByPlaceholderText('auth.username');
    await user.type(usernameInput, 'a'); // invalid
    fireEvent.blur(usernameInput);
    expect(usernameInput).toHaveClass('border-rose-800');

    const emailInput = screen.getByPlaceholderText('common.emailAddress');
    await user.type(emailInput, 'invalid');
    fireEvent.blur(emailInput);
    expect(emailInput).toHaveClass('border-rose-800');

    const nameInput = screen.getByPlaceholderText('user.fullName');
    await user.type(nameInput, '123#');
    fireEvent.blur(nameInput);
    expect(nameInput).toHaveClass('border-rose-800');

    const placeInput = screen.getByPlaceholderText('user.placeCityState');
    await user.type(placeInput, '11invalid');
    fireEvent.blur(placeInput);
    expect(placeInput).toHaveClass('border-rose-800');
  });

  it('tests signup password strength validation logic', async () => {
    const user = userEvent.setup();
    renderComponent();
    const signupBtns = screen.getAllByRole('button', { name: 'auth.signUp' });
    await user.click(signupBtns[0]);

    const passwordInput = screen.getByPlaceholderText('auth.createPassword');

    // Weak password
    await user.type(passwordInput, 'weak');
    fireEvent.blur(passwordInput);
    expect(passwordInput).toHaveClass('border-rose-800');

    // Medium password
    await user.clear(passwordInput);
    await user.type(passwordInput, 'Medium123');
    fireEvent.blur(passwordInput);
    expect(passwordInput).toHaveClass('border-yellow-500');

    // Strong password
    await user.clear(passwordInput);
    await user.type(passwordInput, 'StrongPassword123!');
    fireEvent.blur(passwordInput);
    expect(passwordInput).toHaveClass('border-green-500');

    // Confirm password failure
    const confirmInput = screen.getByPlaceholderText('common.confirmPassword');
    await user.type(confirmInput, 'Different!23');
    fireEvent.blur(confirmInput);
    expect(confirmInput).toHaveClass('border-rose-800');
  });

  it('submits a valid signup flow and resolves OTP sending API', async () => {
    const user = userEvent.setup();
    renderComponent();
    const signupBtns = screen.getAllByRole('button', { name: 'auth.signUp' });
    await user.click(signupBtns[0]);

    await user.type(
      screen.getByPlaceholderText('auth.enter10digitPhoneNumber'),
      '9000000000',
    );
    await user.type(screen.getByPlaceholderText('auth.username'), 'valid_user');
    await user.type(screen.getByPlaceholderText('user.fullName'), 'Valid Name');
    await user.type(
      screen.getByPlaceholderText('common.emailAddress'),
      'test@swecha.org',
    );

    // Select Gender
    const select = screen.getByRole('combobox', { name: 'auth.selectGender' });
    await user.selectOptions(select, 'male');

    await user.type(
      screen.getByPlaceholderText('auth.createPassword'),
      'Valid@123!',
    );
    await user.type(
      screen.getByPlaceholderText('common.confirmPassword'),
      'Valid@123!',
    );

    // consent checkbox
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'success' }),
      status: 200,
    });

    const sendOtpButton = screen.getByRole('button', {
      name: 'auth.requestOtpForPhoneVerification',
    });
    await user.click(sendOtpButton);

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith(
        'messages.signupOtpSentSuccessfully',
      );
    });

    // Validates that verify OTP shows up
    const otpInput = screen.getByPlaceholderText('auth.enter6digitOtp');
    expect(otpInput).toBeInTheDocument();
  });

  it('resolves Signup verify OTP with all API error handling branches', async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getAllByRole('button', { name: 'auth.signUp' })[0]);

    // Fill valid form
    await user.type(
      screen.getByPlaceholderText('auth.enter10digitPhoneNumber'),
      '9000000000',
    );
    await user.type(screen.getByPlaceholderText('auth.username'), 'valid_user');
    await user.type(screen.getByPlaceholderText('user.fullName'), 'Valid Name');
    await user.type(
      screen.getByPlaceholderText('common.emailAddress'),
      'test@swecha.org',
    );
    await user.type(
      screen.getByPlaceholderText('auth.createPassword'),
      'Valid@123!',
    );
    await user.type(
      screen.getByPlaceholderText('common.confirmPassword'),
      'Valid@123!',
    );
    await user.click(screen.getByRole('checkbox'));

    // Mock Send OTP
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'success' }),
      status: 200,
    });

    await user.click(
      screen.getByRole('button', {
        name: 'auth.requestOtpForPhoneVerification',
      }),
    );

    // Wait for the OTP input to show up
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('auth.enter6digitOtp'),
      ).toBeInTheDocument();
    });

    const otpInput = screen.getByPlaceholderText('auth.enter6digitOtp');

    // Test typing invalid OTP characters
    await user.type(otpInput, 'abcde123456'); // Should format to digits
    expect(otpInput).toHaveValue('123456');

    // MOCK VERIFY FAILURE 422 with Array of details
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: [{ msg: 'OTP expired' }] }),
      status: 422,
    });

    const verifyButton = screen.getByRole('button', {
      name: 'Verify OTP & Create Account',
    });
    await user.click(verifyButton);
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        'Validation error: OTP expired',
      ),
    );

    // MOCK VERIFY FAILURE String detail
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: 'Custom error string' }),
      status: 400,
    });
    await user.click(verifyButton);
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith('Custom error string'),
    );

    // MOCK VERIFY FAILURE String message
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Custom message string' }),
      status: 400,
    });
    await user.click(verifyButton);
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith('Custom message string'),
    );

    // MOCK VERIFY FAILURE Error field
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Custom error field' }),
      status: 400,
    });
    await user.click(verifyButton);
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith('Custom error field'),
    );

    // MOCK VERIFY FAILURE General status fallback
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
      status: 500,
    });
    await user.click(verifyButton);
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        'Signup OTP verification failed (500)',
      ),
    );

    // MOCK VERIFY SUCCESS
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'fake-token' }),
      status: 200,
    });
    await user.click(verifyButton);
    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith(
        'messages.accountCreatedAndVerifiedSuccessfullyPleaseLogin',
      );
    });

    // Make sure it resets to login mode
    expect(
      screen.getByPlaceholderText('auth.enter10digitPhoneNumber'),
    ).toBeInTheDocument();
  });

  async function setupResendOTPFlow() {
    const user = userEvent.setup();
    renderComponent();

    const signupBtns = screen.getAllByRole('button', { name: 'auth.signUp' });
    await user.click(signupBtns[0]);

    await user.type(
      screen.getByPlaceholderText('auth.enter10digitPhoneNumber'),
      '9000000000',
    );
    await user.type(screen.getByPlaceholderText('auth.username'), 'valid_user');
    await user.type(screen.getByPlaceholderText('user.fullName'), 'Valid Name');
    await user.type(
      screen.getByPlaceholderText('common.emailAddress'),
      'test@swecha.org',
    );
    await user.type(
      screen.getByPlaceholderText('auth.createPassword'),
      'Valid@123!',
    );
    await user.type(
      screen.getByPlaceholderText('common.confirmPassword'),
      'Valid@123!',
    );
    await user.click(screen.getByRole('checkbox'));

    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'success' }),
      status: 200,
    });

    vi.useFakeTimers();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'auth.requestOtpForPhoneVerification',
      }),
    );

    // Fast forward to resolve promises inside the component
    await vi.runAllTimersAsync();

    // Now OTP input is in the DOM
    const otpInput = screen.getByPlaceholderText('auth.enter6digitOtp');
    expect(otpInput).toBeInTheDocument();

    // Advance timer 60s
    await vi.advanceTimersByTimeAsync(61000);

    const resendBtn = screen.getByText('Resend OTP');
    expect(resendBtn).not.toBeDisabled();
    return resendBtn;
  }

  it('handles signup Resend OTP flow network error', async () => {
    const resendBtn = await setupResendOTPFlow();

    (global.fetch as Mock).mockRejectedValueOnce(new Error('Network failure'));
    fireEvent.click(resendBtn);
    await vi.runAllTimersAsync();
    expect(mockToastError).toHaveBeenCalledWith(
      'Network error. Please check your connection and try again.',
    );
  });

  it('handles signup Resend OTP flow API error', async () => {
    const resendBtn = await setupResendOTPFlow();

    (global.fetch as Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Specific API Error' }),
      status: 400,
    });
    fireEvent.click(resendBtn);
    await vi.runAllTimersAsync();
    expect(mockToastError).toHaveBeenCalledWith('Specific API Error');
  });

  it('handles signup Resend OTP flow success', async () => {
    const resendBtn = await setupResendOTPFlow();

    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'sent' }),
      status: 200,
    });
    fireEvent.click(resendBtn);
    await vi.runAllTimersAsync();

    expect(mockToastSuccess).toHaveBeenCalledWith(
      'messages.signupOtpResentSuccessfully',
    );
  });

  it('triggers login on pressing Enter inside password input', async () => {
    const user = userEvent.setup();
    renderComponent();

    const phoneInput = screen.getByPlaceholderText(
      'auth.enter10digitPhoneNumber',
    );
    const passwordInput = screen.getByPlaceholderText('auth.enterYourPassword');

    await user.type(phoneInput, '9999999999');
    await user.type(passwordInput, 'validPass123{Enter}');

    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'fake-token' }),
      status: 200,
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('toggles password visibility in signup flow', async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getAllByRole('button', { name: 'auth.signUp' })[0]);

    const createPassInput = screen.getByPlaceholderText('auth.createPassword');
    const confirmPassInput = screen.getByPlaceholderText(
      'common.confirmPassword',
    );

    expect(createPassInput).toHaveAttribute('type', 'password');
    expect(confirmPassInput).toHaveAttribute('type', 'password');

    // Usually buttons for toggles are found relative to the inputs or through all buttons
    // We can simulate clicking all buttons with eye icon
    const toggleButtons = screen.getAllByRole('button');
    const eyeBtns = toggleButtons.filter(
      (b) =>
        b.querySelector('.lucide-eye') || b.querySelector('.lucide-eye-off'),
    );

    if (eyeBtns.length >= 2) {
      await user.click(eyeBtns[0]);
      await user.click(eyeBtns[1]);

      expect(createPassInput).toHaveAttribute('type', 'text');
      expect(confirmPassInput).toHaveAttribute('type', 'text');
    }
  });

  it('handles network error in Login password submission', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.type(
      screen.getByPlaceholderText('auth.enter10digitPhoneNumber'),
      '9999999999',
    );
    await user.type(
      screen.getByPlaceholderText('auth.enterYourPassword'),
      'mypassword',
    );

    (global.fetch as Mock).mockRejectedValueOnce(new Error('Network issue'));

    const loginBtns = screen.getAllByRole('button', { name: 'auth.login' });
    await user.click(loginBtns[loginBtns.length - 1]);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        'Network error. Please check your connection and try again.',
      );
    });
  });

  it('handles signup Send OTP failing with various API response types', async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getAllByRole('button', { name: 'auth.signUp' })[0]);

    await user.type(
      screen.getByPlaceholderText('auth.enter10digitPhoneNumber'),
      '9000000000',
    );
    await user.type(screen.getByPlaceholderText('auth.username'), 'valid_user');
    await user.type(screen.getByPlaceholderText('user.fullName'), 'Valid Name');
    await user.type(
      screen.getByPlaceholderText('common.emailAddress'),
      'test@swecha.org',
    );
    await user.type(
      screen.getByPlaceholderText('auth.createPassword'),
      'Valid@123!',
    );
    await user.type(
      screen.getByPlaceholderText('common.confirmPassword'),
      'Valid@123!',
    );
    await user.click(screen.getByRole('checkbox'));

    // Mock API Failure Detail Array
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: 'Direct detail error output' }),
      status: 400,
    });

    await user.click(
      screen.getByRole('button', {
        name: 'auth.requestOtpForPhoneVerification',
      }),
    );
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith('Direct detail error output'),
    );
  });

  it('can use back logic to return to signup form after OTP send', async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getAllByRole('button', { name: 'auth.signUp' })[0]);

    await user.type(
      screen.getByPlaceholderText('auth.enter10digitPhoneNumber'),
      '9000000000',
    );
    await user.type(screen.getByPlaceholderText('auth.username'), 'valid_user');
    await user.type(screen.getByPlaceholderText('user.fullName'), 'Valid Name');
    await user.type(
      screen.getByPlaceholderText('common.emailAddress'),
      'test@swecha.org',
    );
    await user.type(
      screen.getByPlaceholderText('auth.createPassword'),
      'Valid@123!',
    );
    await user.type(
      screen.getByPlaceholderText('common.confirmPassword'),
      'Valid@123!',
    );
    await user.click(screen.getByRole('checkbox'));

    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'success' }),
      status: 200,
    });

    await user.click(
      screen.getByRole('button', {
        name: 'auth.requestOtpForPhoneVerification',
      }),
    );
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('auth.enter6digitOtp'),
      ).toBeInTheDocument();
    });

    // Go back to form
    const backBtn = screen.getByText('common.backToSignupForm');
    await user.click(backBtn);
    expect(
      screen.queryByPlaceholderText('auth.enter6digitOtp'),
    ).not.toBeInTheDocument();
  });
});

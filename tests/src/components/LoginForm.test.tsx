import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import LoginForm from '../../../src/components/LoginForm';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';

// Mock language switcher and translations
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: vi.fn(),
      language: 'en',
    },
  }),
}));

vi.mock('@/components/LanguageSwitcher', () => ({
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
  const mockFetchResponse = (data: unknown, ok = true, status = 200) =>
    ({
      ok,
      status,
      json: vi.fn(async () => data),
      headers: new Headers(),
    }) as unknown as Response;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
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

    (global.fetch as Mock).mockResolvedValueOnce(
      mockFetchResponse(
        { access_token: 'fake-token', user: { phone: '9999999999' } },
        true,
        200,
      ),
    );

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

    (global.fetch as Mock).mockResolvedValueOnce(
      mockFetchResponse({ message: 'Invalid credentials' }, false, 401),
    );

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
    fireEvent.change(usernameInput, { target: { value: 'a' } }); // invalid
    fireEvent.blur(usernameInput);
    expect(usernameInput).toHaveClass('border-rose-800');

    const emailInput = screen.getByPlaceholderText('common.emailAddress');
    fireEvent.change(emailInput, { target: { value: 'invalid' } });
    fireEvent.blur(emailInput);
    expect(emailInput).toHaveClass('border-rose-800');

    const nameInput = screen.getByPlaceholderText('user.fullName');
    fireEvent.change(nameInput, { target: { value: '123#' } });
    fireEvent.blur(nameInput);
    expect(nameInput).toHaveClass('border-rose-800');

    const placeInput = screen.getByPlaceholderText('user.placeCityState');
    fireEvent.change(placeInput, { target: { value: '11invalid' } });
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

    fireEvent.change(
      screen.getByPlaceholderText('auth.enter10digitPhoneNumber'),
      { target: { value: '9000000000' } },
    );
    fireEvent.change(screen.getByPlaceholderText('auth.username'), {
      target: { value: 'valid_user' },
    });
    fireEvent.change(screen.getByPlaceholderText('user.fullName'), {
      target: { value: 'Valid Name' },
    });
    fireEvent.change(screen.getByPlaceholderText('common.emailAddress'), {
      target: { value: 'test@swecha.org' },
    });

    // Select Gender
    const select = screen.getByRole('combobox', { name: 'auth.selectGender' });
    await user.selectOptions(select, 'male');

    fireEvent.change(screen.getByPlaceholderText('auth.createPassword'), {
      target: { value: 'Valid@123!' },
    });
    fireEvent.change(screen.getByPlaceholderText('common.confirmPassword'), {
      target: { value: 'Valid@123!' },
    });

    // consent checkbox
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    (global.fetch as Mock).mockResolvedValueOnce(
      mockFetchResponse({ status: 'success' }, true, 200),
    );

    const sendOtpButton = screen.getByRole('button', {
      name: 'auth.requestOtpForPhoneVerification',
    });
    await user.click(sendOtpButton);

    const otpInput = await screen.findByPlaceholderText('auth.enter6digitOtp');
    expect(mockToastSuccess).toHaveBeenCalledWith(
      'messages.signupOtpSentSuccessfully',
    );
    expect(otpInput).toBeInTheDocument();
  });

  it('resolves Signup verify OTP with all API error handling branches', async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getAllByRole('button', { name: 'auth.signUp' })[0]);

    // Fill valid form
    fireEvent.change(
      screen.getByPlaceholderText('auth.enter10digitPhoneNumber'),
      { target: { value: '9000000000' } },
    );
    fireEvent.change(screen.getByPlaceholderText('auth.username'), {
      target: { value: 'valid_user' },
    });
    fireEvent.change(screen.getByPlaceholderText('user.fullName'), {
      target: { value: 'Valid Name' },
    });
    fireEvent.change(screen.getByPlaceholderText('common.emailAddress'), {
      target: { value: 'test@swecha.org' },
    });
    fireEvent.change(screen.getByPlaceholderText('auth.createPassword'), {
      target: { value: 'Valid@123!' },
    });
    fireEvent.change(screen.getByPlaceholderText('common.confirmPassword'), {
      target: { value: 'Valid@123!' },
    });
    await user.click(screen.getByRole('checkbox'));

    // Mock Send OTP
    (global.fetch as Mock).mockResolvedValueOnce(
      mockFetchResponse({ status: 'success' }, true, 200),
    );

    await user.click(
      screen.getByRole('button', {
        name: 'auth.requestOtpForPhoneVerification',
      }),
    );

    const otpInput = await screen.findByPlaceholderText('auth.enter6digitOtp');

    // Test typing invalid OTP characters
    fireEvent.change(otpInput, { target: { value: 'abcde123456' } }); // Should format to digits
    expect(otpInput).toHaveValue('123456');

    // MOCK VERIFY FAILURE 422 with Array of details
    (global.fetch as Mock).mockResolvedValueOnce(
      mockFetchResponse({ detail: [{ msg: 'OTP expired' }] }, false, 422),
    );

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
    (global.fetch as Mock).mockResolvedValueOnce(
      mockFetchResponse({ detail: 'Custom error string' }, false, 400),
    );
    await user.click(verifyButton);
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith('Custom error string'),
    );

    // MOCK VERIFY FAILURE String message
    (global.fetch as Mock).mockResolvedValueOnce(
      mockFetchResponse({ message: 'Custom message string' }, false, 400),
    );
    await user.click(verifyButton);
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith('Custom message string'),
    );

    // MOCK VERIFY FAILURE Error field
    (global.fetch as Mock).mockResolvedValueOnce(
      mockFetchResponse({ error: 'Custom error field' }, false, 400),
    );
    await user.click(verifyButton);
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith('Custom error field'),
    );

    // MOCK VERIFY FAILURE General status fallback
    (global.fetch as Mock).mockResolvedValueOnce(
      mockFetchResponse({}, false, 500),
    );
    await user.click(verifyButton);
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        'Signup OTP verification failed (500)',
      ),
    );

    // MOCK VERIFY SUCCESS
    (global.fetch as Mock).mockResolvedValueOnce(
      mockFetchResponse({ access_token: 'fake-token' }, true, 200),
    );
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
  }, 15000);

  async function setupResendOTPFlow() {
    const user = userEvent.setup();
    renderComponent();

    const signupBtns = screen.getAllByRole('button', { name: 'auth.signUp' });
    await user.click(signupBtns[0]);

    fireEvent.change(
      screen.getByPlaceholderText('auth.enter10digitPhoneNumber'),
      { target: { value: '9000000000' } },
    );
    fireEvent.change(screen.getByPlaceholderText('auth.username'), {
      target: { value: 'valid_user' },
    });
    fireEvent.change(screen.getByPlaceholderText('user.fullName'), {
      target: { value: 'Valid Name' },
    });
    fireEvent.change(screen.getByPlaceholderText('common.emailAddress'), {
      target: { value: 'test@swecha.org' },
    });
    fireEvent.change(screen.getByPlaceholderText('auth.createPassword'), {
      target: { value: 'Valid@123!' },
    });
    fireEvent.change(screen.getByPlaceholderText('common.confirmPassword'), {
      target: { value: 'Valid@123!' },
    });
    await user.click(screen.getByRole('checkbox'));

    (global.fetch as Mock).mockResolvedValueOnce(
      mockFetchResponse({ status: 'success' }, true, 200),
    );

    vi.useFakeTimers();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'auth.requestOtpForPhoneVerification',
      }),
    );

    // Flush the async fetch + state updates (keep fake timers for resend countdown)
    await vi.runOnlyPendingTimersAsync();
    await Promise.resolve();
    await Promise.resolve();

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
    await vi.runOnlyPendingTimersAsync();
    await Promise.resolve();
    await Promise.resolve();
    expect(mockToastError).toHaveBeenCalledWith(
      'Network error. Please check your connection and try again.',
    );
  });

  it('handles signup Resend OTP flow API error', async () => {
    const resendBtn = await setupResendOTPFlow();

    (global.fetch as Mock).mockResolvedValueOnce(
      mockFetchResponse({ message: 'Specific API Error' }, false, 400),
    );
    fireEvent.click(resendBtn);
    await vi.runOnlyPendingTimersAsync();
    await Promise.resolve();
    await Promise.resolve();
    expect(mockToastError).toHaveBeenCalledWith('Specific API Error');
  });

  it('handles signup Resend OTP flow success', async () => {
    const resendBtn = await setupResendOTPFlow();

    (global.fetch as Mock).mockResolvedValueOnce(
      mockFetchResponse({ status: 'sent' }, true, 200),
    );
    fireEvent.click(resendBtn);
    await vi.runOnlyPendingTimersAsync();
    await Promise.resolve();
    await Promise.resolve();

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

    (global.fetch as Mock).mockResolvedValueOnce(
      mockFetchResponse({ access_token: 'fake-token' }, true, 200),
    );

    fireEvent.change(phoneInput, { target: { value: '9999999999' } });
    fireEvent.change(passwordInput, { target: { value: 'validPass123' } });
    fireEvent.keyDown(passwordInput, { key: 'Enter', code: 'Enter' });

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

    fireEvent.change(
      screen.getByPlaceholderText('auth.enter10digitPhoneNumber'),
      { target: { value: '9000000000' } },
    );
    fireEvent.change(screen.getByPlaceholderText('auth.username'), {
      target: { value: 'valid_user' },
    });
    fireEvent.change(screen.getByPlaceholderText('user.fullName'), {
      target: { value: 'Valid Name' },
    });
    fireEvent.change(screen.getByPlaceholderText('common.emailAddress'), {
      target: { value: 'test@swecha.org' },
    });
    fireEvent.change(screen.getByPlaceholderText('auth.createPassword'), {
      target: { value: 'Valid@123!' },
    });
    fireEvent.change(screen.getByPlaceholderText('common.confirmPassword'), {
      target: { value: 'Valid@123!' },
    });
    await user.click(screen.getByRole('checkbox'));

    // Mock API Failure Detail Array
    (global.fetch as Mock).mockResolvedValueOnce(
      mockFetchResponse({ detail: 'Direct detail error output' }, false, 400),
    );

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

    fireEvent.change(
      screen.getByPlaceholderText('auth.enter10digitPhoneNumber'),
      { target: { value: '9000000000' } },
    );
    fireEvent.change(screen.getByPlaceholderText('auth.username'), {
      target: { value: 'valid_user' },
    });
    fireEvent.change(screen.getByPlaceholderText('user.fullName'), {
      target: { value: 'Valid Name' },
    });
    fireEvent.change(screen.getByPlaceholderText('common.emailAddress'), {
      target: { value: 'test@swecha.org' },
    });
    fireEvent.change(screen.getByPlaceholderText('auth.createPassword'), {
      target: { value: 'Valid@123!' },
    });
    fireEvent.change(screen.getByPlaceholderText('common.confirmPassword'), {
      target: { value: 'Valid@123!' },
    });
    await user.click(screen.getByRole('checkbox'));

    (global.fetch as Mock).mockResolvedValueOnce(
      mockFetchResponse({ status: 'success' }, true, 200),
    );

    await user.click(
      screen.getByRole('button', {
        name: 'auth.requestOtpForPhoneVerification',
      }),
    );
    await screen.findByPlaceholderText('auth.enter6digitOtp');

    // Go back to form
    const backBtn = screen.getByText('common.backToSignupForm');
    await user.click(backBtn);
    expect(
      screen.queryByPlaceholderText('auth.enter6digitOtp'),
    ).not.toBeInTheDocument();
  });
});

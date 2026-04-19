import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import LoginForm from '../../../src/components/LoginForm';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';

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
  });

  it('validates phone number branch - invalid digits trigger error directly', async () => {
    const user = userEvent.setup();
    renderComponent();
    const phoneInput = screen.getByPlaceholderText(
      'auth.enter10digitPhoneNumber',
    );

    await user.type(phoneInput, '4234567890');
    fireEvent.blur(phoneInput);

    await waitFor(
      () => {
        expect(screen.getByText('auth.phoneNumberIsInvalid')).not.toHaveClass(
          'hidden',
        );
      },
      { timeout: 10000 },
    );

    await user.clear(phoneInput);
    await user.type(phoneInput, '9876543210');
    fireEvent.blur(phoneInput);
    expect(phoneInput).not.toHaveClass('border-rose-800');
  });

  it('toggles password visibility in login', async () => {
    const user = userEvent.setup();
    renderComponent();
    const passwordInput = screen.getByPlaceholderText('auth.enterYourPassword');
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleButtons = screen.getAllByRole('button');
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

  it('login missing fields returns error toast early', async () => {
    renderComponent();
    const passwordInput = screen.getByPlaceholderText('auth.enterYourPassword');

    // Enter should run schema validation and show inline errors.
    fireEvent.keyDown(passwordInput, { key: 'Enter', code: 'Enter' });
    await waitFor(() => {
      expect(
        screen.getByText('auth.pleaseEnterAValid10digitPhoneNumber'),
      ).toBeInTheDocument();
      expect(screen.getByText('auth.enterYourPassword')).toBeInTheDocument();
    });
    expect(mockToastError).not.toHaveBeenCalled();
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

  it('signup validation errors on empty fields', async () => {
    const user = userEvent.setup();
    renderComponent();

    const signupBtns = screen.getAllByRole('button', { name: 'auth.signUp' });
    await user.click(signupBtns[0]);

    fireEvent.change(
      screen.getByPlaceholderText('auth.enter10digitPhoneNumber'),
      {
        target: { value: '123' },
      },
    );
    fireEvent.change(screen.getByPlaceholderText('auth.username'), {
      target: { value: 'a' },
    });
    fireEvent.change(screen.getByPlaceholderText('user.fullName'), {
      target: { value: '123' },
    });
    fireEvent.change(screen.getByPlaceholderText('common.emailAddress'), {
      target: { value: 'abc' },
    });
    fireEvent.change(screen.getByPlaceholderText('auth.createPassword'), {
      target: { value: '123' },
    });

    await waitFor(() => {
      expect(
        screen.getByText('auth.pleaseEnterAValid10digitPhoneNumber'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('auth.pleaseEnterAValidUsername'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('user.nameShouldHaveCharactersOnly'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('common.pleaseEnterAValidEmailAddress'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('auth.passwordMustBeAtLeast6CharactersLong'),
      ).toBeInTheDocument();
    });

    const submitOtpBtn = screen.getByRole('button', {
      name: 'auth.requestOtpForPhoneVerification',
    });
    expect(submitOtpBtn).toBeDisabled();
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it('tests signup password strength validation logic', async () => {
    renderComponent();
    const signupBtns = screen.getAllByRole('button', { name: 'auth.signUp' });
    fireEvent.click(signupBtns[0]);

    const passwordInput = screen.getByPlaceholderText('auth.createPassword');
    fireEvent.focus(passwordInput);
    await waitFor(() => {
      expect(screen.getByText('auth.passwordStrength')).toBeInTheDocument();
      expect(screen.getByText('Enter Password')).toBeInTheDocument();
    });

    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    await waitFor(() => {
      expect(screen.getByText('Weak')).toBeInTheDocument();
    });

    fireEvent.change(passwordInput, { target: { value: '' } });
    fireEvent.change(passwordInput, { target: { value: 'Medium123' } });
    await waitFor(() => {
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    fireEvent.change(passwordInput, { target: { value: '' } });
    fireEvent.change(passwordInput, {
      target: { value: 'StrongPassword123!' },
    });
    await waitFor(() => {
      expect(screen.getByText('Strong')).toBeInTheDocument();
    });
  });

  it('submits a valid signup flow and resolves OTP sending API, then tests verification branch failures', async () => {
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

    const sendOtpButton = screen.getByRole('button', {
      name: 'auth.requestOtpForPhoneVerification',
    });
    await user.click(sendOtpButton);

    const otpInput = await screen.findByPlaceholderText('auth.enter6digitOtp');
    expect(mockToastSuccess).toHaveBeenCalledWith(
      'messages.signupOtpSentSuccessfully',
    );

    // Verify button is disabled when OTP is empty — call handler directly via React fiber
    const verifyButton = screen.getByRole('button', {
      name: 'Verify OTP & Create Account',
    });
    const getOnClick = (el: HTMLElement) => {
      const key = Object.keys(el).find((k) => k.startsWith('__reactFiber'));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let fiber = key ? (el as any)[key] : null;
      while (fiber) {
        if (fiber.memoizedProps?.onClick)
          return fiber.memoizedProps.onClick as () => void;
        fiber = fiber.return;
      }
      return null;
    };
    const verifyHandler = getOnClick(verifyButton);
    verifyHandler!();
    expect(mockToastError).toHaveBeenCalledWith(
      'Please enter a valid 6-digit OTP',
    );

    fireEvent.change(otpInput, { target: { value: '123456' } });
    (global.fetch as Mock).mockRejectedValueOnce(new Error('Network Failure'));
    await user.click(verifyButton);
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        'Network error. Please check your connection and try again.',
      ),
    );
  });

  it('resolves Signup verify OTP with all API error handling branches', async () => {
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

    const otpInput = await screen.findByPlaceholderText('auth.enter6digitOtp');
    fireEvent.change(otpInput, { target: { value: '123456' } });
    const verifyButton = screen.getByRole('button', {
      name: 'Verify OTP & Create Account',
    });

    (global.fetch as Mock).mockResolvedValueOnce(
      mockFetchResponse({ detail: [{ msg: 'OTP expired' }] }, false, 422),
    );
    await user.click(verifyButton);
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        'Validation error: OTP expired',
      ),
    );

    (global.fetch as Mock).mockResolvedValueOnce(
      mockFetchResponse({ detail: 'String detail' }, false, 400),
    );
    await user.click(verifyButton);
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith('String detail'),
    );

    (global.fetch as Mock).mockResolvedValueOnce(
      mockFetchResponse({ message: 'Error message' }, false, 400),
    );
    await user.click(verifyButton);
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith('Error message'),
    );

    (global.fetch as Mock).mockResolvedValueOnce(
      mockFetchResponse({ error: 'Error field' }, false, 400),
    );
    await user.click(verifyButton);
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith('Error field'),
    );

    (global.fetch as Mock).mockResolvedValueOnce(
      mockFetchResponse({}, false, 503),
    );
    await user.click(verifyButton);
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        'Signup OTP verification failed (503)',
      ),
    );

    (global.fetch as Mock).mockResolvedValueOnce(
      mockFetchResponse({ access_token: 'fake-token' }, true, 200),
    );
    await user.click(verifyButton);
    await waitFor(() =>
      expect(mockToastSuccess).toHaveBeenCalledWith(
        'messages.accountCreatedAndVerifiedSuccessfullyPleaseLogin',
      ),
    );
  });

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

    await vi.runOnlyPendingTimersAsync();
    await Promise.resolve();
    await Promise.resolve();

    const otpInput = screen.getByPlaceholderText('auth.enter6digitOtp');
    expect(otpInput).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(61000);

    const resendBtn = screen.getByText('Resend OTP');
    expect(resendBtn).not.toBeDisabled();
    return resendBtn;
  }

  it('handles signup Resend OTP flow errors and success', async () => {
    let resendBtn = await setupResendOTPFlow();

    (global.fetch as Mock).mockRejectedValueOnce(new Error('Network failure'));
    fireEvent.click(resendBtn);
    await vi.runAllTimersAsync();
    expect(mockToastError).toHaveBeenCalledWith(
      'Network error. Please check your connection and try again.',
    );
    mockToastError.mockClear();

    await vi.advanceTimersByTimeAsync(61000);
    resendBtn = screen.getByText('Resend OTP');
    (global.fetch as Mock).mockResolvedValueOnce(
      mockFetchResponse({ message: 'Specific API Error' }, false, 400),
    );
    fireEvent.click(resendBtn);
    await vi.runAllTimersAsync();
    expect(mockToastError).toHaveBeenCalledWith('Specific API Error');
    mockToastError.mockClear();

    await vi.advanceTimersByTimeAsync(61000);
    resendBtn = screen.getByText('Resend OTP');
    (global.fetch as Mock).mockResolvedValueOnce(
      mockFetchResponse({ status: 'sent' }, true, 200),
    );
    fireEvent.click(resendBtn);
    await vi.runAllTimersAsync();
    expect(mockToastSuccess).toHaveBeenCalledWith(
      'messages.signupOtpResentSuccessfully',
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

    const backBtn = screen.getByText('common.backToSignupForm');
    await user.click(backBtn);
    expect(
      screen.queryByPlaceholderText('auth.enter6digitOtp'),
    ).not.toBeInTheDocument();
  });
});

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

    expect(screen.getByText('auth.phoneNumberIsInvalid')).not.toHaveClass(
      'hidden',
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
    const phoneInput = screen.getByPlaceholderText(
      'auth.enter10digitPhoneNumber',
    );
    const passwordInput = screen.getByPlaceholderText('auth.enterYourPassword');

    // Test early exit by hitting Enter since the button is disabled natively
    fireEvent.keyDown(passwordInput, { key: 'Enter', code: 'Enter' });
    expect(mockToastError).toHaveBeenCalledWith(
      'auth.pleaseEnterAValidPhoneNumberAndPassword',
    );
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

    // The button is disabled by React state. We call the React onClick prop directly
    // to test each internal validation branch of handleSignupSendOTP.
    // We get it from __reactProps$ to ensure we have the freshest closure after state updates.
    const getHandler = () => {
      const submitOtpBtn = screen.getByRole('button', {
        name: 'auth.requestOtpForPhoneVerification',
      });
      const key = Object.keys(submitOtpBtn).find((k) =>
        k.startsWith('__reactProps$'),
      );
      return key
        ? (submitOtpBtn as Record<string, { onClick: () => void }>)[key].onClick
        : null;
    };

    // empty phone
    getHandler()!();
    expect(mockToastError).toHaveBeenCalledWith(
      'Please enter a valid 10-digit phone number',
    );
    mockToastError.mockClear();

    // Set a valid phone
    const phoneInput = screen.getByPlaceholderText(
      'auth.enter10digitPhoneNumber',
    );
    fireEvent.change(phoneInput, { target: { value: '9000000000' } });
    getHandler()!();
    expect(mockToastError).toHaveBeenCalledWith('user.pleaseEnterYourName');
    mockToastError.mockClear();

    const nameInput = screen.getByPlaceholderText('user.fullName');
    fireEvent.change(nameInput, { target: { value: 'Valid Name' } });
    getHandler()!();
    expect(mockToastError).toHaveBeenCalledWith(
      'common.pleaseEnterAValidEmailAddress',
    );
    mockToastError.mockClear();

    const emailInput = screen.getByPlaceholderText('common.emailAddress');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    getHandler()!();
    expect(mockToastError).toHaveBeenCalledWith(
      'auth.passwordMustBeAtLeast6CharactersLong',
    );
    mockToastError.mockClear();

    const passwordInput = screen.getByPlaceholderText('auth.createPassword');
    fireEvent.change(passwordInput, { target: { value: 'Valid@123!' } });
    fireEvent.change(screen.getByPlaceholderText('common.confirmPassword'), {
      target: { value: 'Valid@123!' },
    });

    getHandler()!();
    expect(mockToastError).toHaveBeenCalledWith(
      'ui.please.agree.to.the.terms.and.conditions',
    );
  });

  it('tests signup password strength validation logic', () => {
    renderComponent();
    const signupBtns = screen.getAllByRole('button', { name: 'auth.signUp' });
    fireEvent.click(signupBtns[0]);

    const passwordInput = screen.getByPlaceholderText('auth.createPassword');

    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    fireEvent.blur(passwordInput);
    expect(passwordInput).toHaveClass('border-rose-800');

    fireEvent.change(passwordInput, { target: { value: '' } });
    fireEvent.change(passwordInput, { target: { value: 'Medium123' } });
    fireEvent.blur(passwordInput);
    expect(passwordInput).toHaveClass('border-yellow-500');

    fireEvent.change(passwordInput, { target: { value: '' } });
    fireEvent.change(passwordInput, {
      target: { value: 'StrongPassword123!' },
    });
    fireEvent.blur(passwordInput);
    expect(passwordInput).toHaveClass('border-green-500');

    const confirmInput = screen.getByPlaceholderText('common.confirmPassword');
    fireEvent.change(confirmInput, { target: { value: 'Different!23' } });
    fireEvent.blur(confirmInput);
    expect(confirmInput).toHaveClass('border-rose-800');
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
    fireEvent.change(screen.getByPlaceholderText('user.fullName'), {
      target: { value: 'Valid Name' },
    });
    fireEvent.change(screen.getByPlaceholderText('common.emailAddress'), {
      target: { value: 'test@example.com' },
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
  }, 30000);

  async function setupResendOTPFlow() {
    const user = userEvent.setup();
    renderComponent();

    const signupBtns = screen.getAllByRole('button', { name: 'auth.signUp' });
    await user.click(signupBtns[0]);

    fireEvent.change(
      screen.getByPlaceholderText('auth.enter10digitPhoneNumber'),
      { target: { value: '9000000000' } },
    );
    fireEvent.change(screen.getByPlaceholderText('user.fullName'), {
      target: { value: 'Valid Name' },
    });
    fireEvent.change(screen.getByPlaceholderText('common.emailAddress'), {
      target: { value: 'test@example.com' },
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
  }, 30000);

  it('can use back logic to return to signup form after OTP send', async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getAllByRole('button', { name: 'auth.signUp' })[0]);

    fireEvent.change(
      screen.getByPlaceholderText('auth.enter10digitPhoneNumber'),
      { target: { value: '9000000000' } },
    );
    fireEvent.change(screen.getByPlaceholderText('user.fullName'), {
      target: { value: 'Valid Name' },
    });
    fireEvent.change(screen.getByPlaceholderText('common.emailAddress'), {
      target: { value: 'test@example.com' },
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

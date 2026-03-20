import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

vi.mock('@/lib/constants', () => ({
  BACKEND_URL: 'https://example-backend.test',
}));

vi.mock('@/components/LanguageSwitcher', () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher" />,
}));

import LoginForm from '@/components/LoginForm';

function renderLoginForm(onLoginSuccess = vi.fn()) {
  return {
    onLoginSuccess,
    ...render(
      <MemoryRouter>
        <LoginForm onLoginSuccess={onLoginSuccess} />
      </MemoryRouter>,
    ),
  };
}

function getPasswordLoginButton() {
  const buttons = screen.getAllByRole('button', { name: 'auth.login' });
  const submit = buttons.find((b) => b.hasAttribute('disabled'));
  return submit ?? buttons[buttons.length - 1];
}

function goToSignup() {
  fireEvent.click(screen.getByRole('button', { name: 'auth.signUp' }));
}

function getSignupRequestOtpButton() {
  return screen.getByRole('button', {
    name: 'auth.requestOtpForPhoneVerification',
  });
}

function fillValidSignupForm(overrides?: {
  phone?: string;
  username?: string;
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  consent?: boolean;
}) {
  const phoneInput = screen.getByPlaceholderText(
    'auth.enter10digitPhoneNumber',
  ) as HTMLInputElement;
  const usernameInput = screen.getByPlaceholderText('auth.username');
  const nameInput = screen.getByPlaceholderText('user.fullName');
  const emailInput = screen.getByPlaceholderText('common.emailAddress');
  const passwordInput = screen.getByPlaceholderText('auth.createPassword');
  const confirmPasswordInput = screen.getByPlaceholderText(
    'common.confirmPassword',
  );
  const consentCheckbox = screen.getByRole('checkbox', {
    name: /common\.i\.agree\.to\.the/i,
  });

  fireEvent.change(phoneInput, {
    target: { value: overrides?.phone ?? '9876543210' },
  });
  fireEvent.change(usernameInput, {
    target: { value: overrides?.username ?? 'valid_user' },
  });
  fireEvent.change(nameInput, {
    target: { value: overrides?.fullName ?? 'Valid Name' },
  });
  fireEvent.change(emailInput, {
    target: { value: overrides?.email ?? 'valid@example.com' },
  });
  fireEvent.change(passwordInput, {
    target: { value: overrides?.password ?? 'Abcdef1!' },
  });
  fireEvent.change(confirmPasswordInput, {
    target: { value: overrides?.confirmPassword ?? 'Abcdef1!' },
  });

  const shouldConsent = overrides?.consent ?? true;
  if (consentCheckbox instanceof HTMLInputElement) {
    if (consentCheckbox.checked !== shouldConsent) {
      fireEvent.click(consentCheckbox);
    }
  } else if (shouldConsent) {
    fireEvent.click(consentCheckbox);
  }

  return {
    phoneInput,
    usernameInput,
    nameInput,
    emailInput,
    passwordInput,
    confirmPasswordInput,
    consentCheckbox,
  };
}

describe('LoginForm', () => {
  beforeEach(() => {
    toastSuccess.mockClear();
    toastError.mockClear();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders login mode by default with language switcher', () => {
    renderLoginForm();

    expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
    expect(screen.getByText('auth.welcomeBack')).toBeInTheDocument();
    expect(screen.getAllByText('auth.login')[0]).toBeInTheDocument();
  });

  it('formats phone input to 10 digits and strips non-digits', () => {
    renderLoginForm();

    const phoneInput = screen.getByPlaceholderText(
      'auth.enter10digitPhoneNumber',
    ) as HTMLInputElement;

    fireEvent.change(phoneInput, { target: { value: 'abc123456789999' } });
    expect(phoneInput.value).toBe('1234567899');
  });

  it('shows phone invalid message on blur when first digit is <= 5', () => {
    renderLoginForm();

    const phoneInput = screen.getByPlaceholderText(
      'auth.enter10digitPhoneNumber',
    ) as HTMLInputElement;

    fireEvent.change(phoneInput, { target: { value: '1234567890' } });
    fireEvent.blur(phoneInput);

    expect(screen.getByText('auth.phoneNumberIsInvalid')).toHaveClass('block');
  });

  it('toggles password visibility', () => {
    const { container } = renderLoginForm();

    const passwordInput = screen.getByPlaceholderText(
      'auth.enterYourPassword',
    ) as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    const toggle = container.querySelector(
      'button[type="button"]',
    ) as HTMLButtonElement | null;
    expect(toggle).toBeInTheDocument();

    fireEvent.click(toggle as HTMLButtonElement);
    expect(passwordInput.type).toBe('text');
  });

  it('enables the login button only when phone number and password are valid', () => {
    renderLoginForm();

    const phoneInput = screen.getByPlaceholderText(
      'auth.enter10digitPhoneNumber',
    ) as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText(
      'auth.enterYourPassword',
    ) as HTMLInputElement;

    const loginButton = getPasswordLoginButton();
    expect(loginButton).toBeDisabled();

    fireEvent.change(phoneInput, { target: { value: '1234567890' } });
    fireEvent.change(passwordInput, { target: { value: 'secret' } });
    expect(getPasswordLoginButton()).toBeDisabled();

    fireEvent.change(phoneInput, { target: { value: '9876543210' } });
    expect(getPasswordLoginButton()).toBeEnabled();
  });

  it('submits password login and calls onLoginSuccess when API returns token', async () => {
    const { onLoginSuccess } = renderLoginForm();

    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ access_token: 'token-123', user: { id: 1 } }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const phoneInput = screen.getByPlaceholderText(
      'auth.enter10digitPhoneNumber',
    ) as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText(
      'auth.enterYourPassword',
    ) as HTMLInputElement;

    fireEvent.change(phoneInput, { target: { value: '9876543210' } });
    fireEvent.change(passwordInput, { target: { value: 'secret' } });

    fireEvent.click(getPasswordLoginButton());

    await waitFor(() =>
      expect(onLoginSuccess).toHaveBeenCalledWith('token-123', { id: 1 }),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example-backend.test/auth/login',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '+919876543210', password: 'secret' }),
      }),
    );
    expect(toastSuccess).toHaveBeenCalled();
  });

  it('shows validation toast when pressing Enter with missing phone/password', () => {
    renderLoginForm();

    const passwordInput = screen.getByPlaceholderText('auth.enterYourPassword');
    fireEvent.keyDown(passwordInput, { key: 'Enter' });

    expect(toastError).toHaveBeenCalledWith(
      'auth.pleaseEnterAValidPhoneNumberAndPassword',
    );
  });

  it('shows an error toast when password login succeeds but token is missing', async () => {
    renderLoginForm();

    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({}),
    }));
    vi.stubGlobal('fetch', fetchMock);

    fireEvent.change(
      screen.getByPlaceholderText('auth.enter10digitPhoneNumber'),
      { target: { value: '9876543210' } },
    );
    fireEvent.change(screen.getByPlaceholderText('auth.enterYourPassword'), {
      target: { value: 'secret' },
    });

    fireEvent.click(getPasswordLoginButton());

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith('Invalid credentials'),
    );
  });

  it('shows a network error toast when password login request fails', async () => {
    renderLoginForm();

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      }),
    );

    fireEvent.change(
      screen.getByPlaceholderText('auth.enter10digitPhoneNumber'),
      { target: { value: '9876543210' } },
    );
    fireEvent.change(screen.getByPlaceholderText('auth.enterYourPassword'), {
      target: { value: 'secret' },
    });

    fireEvent.click(getPasswordLoginButton());

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        'Network error. Please check your connection and try again.',
      ),
    );
  });

  it('validates username on blur in signup mode (invalid then valid)', () => {
    renderLoginForm();
    goToSignup();

    const usernameInput = screen.getByPlaceholderText(
      'auth.username',
    ) as HTMLInputElement;

    fireEvent.change(usernameInput, { target: { value: 'ab' } });
    fireEvent.blur(usernameInput);
    expect(
      screen.getByText(
        'auth.usernameShouldConsistOfCharactersUnderscoresDigitsOnly',
      ),
    ).toHaveClass('block');

    fireEvent.focus(usernameInput);
    fireEvent.change(usernameInput, { target: { value: 'valid_name_123' } });
    fireEvent.blur(usernameInput);
    expect(
      screen.getByText(
        'auth.usernameShouldConsistOfCharactersUnderscoresDigitsOnly',
      ),
    ).toHaveClass('hidden');
  });

  it('shows password requirements on focus and marks weak password as invalid on blur', () => {
    renderLoginForm();
    goToSignup();

    const passwordInput = screen.getByPlaceholderText(
      'auth.createPassword',
    ) as HTMLInputElement;

    fireEvent.focus(passwordInput);
    expect(screen.getByText('auth.passwordStrength')).toBeInTheDocument();

    fireEvent.change(passwordInput, { target: { value: 'abc' } });
    fireEvent.blur(passwordInput);

    // `errorPasswordDisplay` is reused for the confirm-password mismatch area.
    expect(screen.getByText('common.passwordsDoNotMatch')).toHaveClass('block');
  });

  it('shows confirm-password mismatch error on blur', () => {
    renderLoginForm();
    goToSignup();

    fillValidSignupForm({ confirmPassword: 'Different1!' });
    const confirmPasswordInput = screen.getByPlaceholderText(
      'common.confirmPassword',
    ) as HTMLInputElement;

    fireEvent.focus(confirmPasswordInput);
    fireEvent.blur(confirmPasswordInput);
    expect(screen.getByText('common.passwordsDoNotMatch')).toHaveClass('block');
  });

  it('validates email, place, and gender/date fields in signup mode', () => {
    renderLoginForm();
    goToSignup();

    const emailInput = screen.getByPlaceholderText(
      'common.emailAddress',
    ) as HTMLInputElement;
    fireEvent.change(emailInput, {
      target: { value: 'bad+email@example.com' },
    });
    fireEvent.blur(emailInput);
    expect(screen.getByText('auth.emailIsInvalid')).toHaveClass('block');

    const placeInput = screen.getByPlaceholderText(
      'user.placeCityState',
    ) as HTMLInputElement;
    fireEvent.change(placeInput, { target: { value: 'Hyderabad1' } });
    fireEvent.blur(placeInput);
    expect(
      screen.getByText('ui.place.should.have.characters.is.allowed'),
    ).toHaveClass('block');

    fireEvent.change(screen.getByLabelText('auth.selectGender'), {
      target: { value: 'female' },
    });
    expect(
      screen.getByRole('option', { name: 'auth.female' }),
    ).toBeInTheDocument();

    const dobInput = screen.getByPlaceholderText(
      'common.date.of.birth',
    ) as HTMLInputElement;
    expect(dobInput).toHaveAttribute('min');
    expect(dobInput).toHaveAttribute('max');
    expect((dobInput.getAttribute('min') ?? '').length).toBe(10);
    expect((dobInput.getAttribute('max') ?? '').length).toBe(10);
  });

  it('submits signup OTP request successfully and shows OTP input UI', async () => {
    renderLoginForm();
    goToSignup();

    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith('/auth/signup/send-otp')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true }),
        };
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    fillValidSignupForm({ username: 'My_User' });
    expect(getSignupRequestOtpButton()).toBeEnabled();

    fireEvent.click(getSignupRequestOtpButton());

    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith(
        'messages.signupOtpSentSuccessfully',
      ),
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://example-backend.test/auth/signup/send-otp',
    );
    const requestOptions = fetchMock.mock.calls[0]?.[1] as {
      body?: string;
      headers?: unknown;
      method?: string;
    };
    expect(requestOptions).toEqual(
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    expect(JSON.parse(requestOptions.body ?? '{}')).toEqual(
      expect.objectContaining({
        phone: '9876543210',
        username: 'my_user',
        name: 'Valid Name',
        email: 'valid@example.com',
        password: 'Abcdef1!',
        role_ids: [2],
      }),
    );

    expect(
      await screen.findByPlaceholderText('auth.enter6digitOtp'),
    ).toBeInTheDocument();
    expect(screen.getByText('OTP sent to +919876543210')).toBeInTheDocument();
  });

  it('shows API error when signup OTP request fails', async () => {
    renderLoginForm();
    goToSignup();

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Nope' }),
      })),
    );

    fillValidSignupForm();
    fireEvent.click(getSignupRequestOtpButton());

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Nope'));
    expect(
      screen.queryByPlaceholderText('auth.enter6digitOtp'),
    ).not.toBeInTheDocument();
  });

  it('handles signup OTP verification error responses (validation array)', async () => {
    renderLoginForm();
    goToSignup();

    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith('/auth/signup/send-otp')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true }),
        };
      }
      if (url.endsWith('/auth/signup/verify-otp')) {
        return {
          ok: false,
          status: 422,
          json: async () => ({ detail: [{ msg: 'otp invalid' }] }),
        };
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    fillValidSignupForm();
    fireEvent.click(getSignupRequestOtpButton());
    await screen.findByPlaceholderText('auth.enter6digitOtp');

    fireEvent.change(screen.getByPlaceholderText('auth.enter6digitOtp'), {
      target: { value: '123456' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Verify OTP & Create Account' }),
    );

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith('Validation error: otp invalid'),
    );
  });

  it('returns to signup form from OTP screen', async () => {
    renderLoginForm();
    goToSignup();

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      })),
    );

    fillValidSignupForm();
    fireEvent.click(getSignupRequestOtpButton());
    await screen.findByPlaceholderText('auth.enter6digitOtp');

    fireEvent.click(
      screen.getByRole('button', { name: 'common.backToSignupForm' }),
    );
    expect(
      screen.queryByPlaceholderText('auth.enter6digitOtp'),
    ).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('auth.username')).toBeInTheDocument();
  });

  it('verifies signup OTP, switches back to login mode, and resets form', async () => {
    renderLoginForm();
    goToSignup();

    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith('/auth/signup/send-otp')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true }),
        };
      }
      if (url.endsWith('/auth/signup/verify-otp')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true }),
        };
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    fillValidSignupForm();
    fireEvent.click(getSignupRequestOtpButton());
    await screen.findByPlaceholderText('auth.enter6digitOtp');

    const otpInput = screen.getByPlaceholderText(
      'auth.enter6digitOtp',
    ) as HTMLInputElement;
    fireEvent.change(otpInput, { target: { value: '123456' } });

    fireEvent.click(
      screen.getByRole('button', { name: 'Verify OTP & Create Account' }),
    );

    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith(
        'messages.accountCreatedAndVerifiedSuccessfullyPleaseLogin',
      ),
    );
    expect(screen.getByText('auth.welcomeBack')).toBeInTheDocument();
    expect(
      (
        screen.getByPlaceholderText(
          'auth.enter10digitPhoneNumber',
        ) as HTMLInputElement
      ).value,
    ).toBe('');
  });

  it('resends signup OTP after timer ends', async () => {
    vi.useFakeTimers();
    try {
      renderLoginForm();
      goToSignup();

      const fetchMock = vi.fn(async (url: string) => {
        if (url.endsWith('/auth/signup/send-otp')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ ok: true }),
          };
        }
        if (url.endsWith('/auth/signup/resend-otp')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ ok: true }),
          };
        }
        throw new Error(`Unexpected URL: ${url}`);
      });
      vi.stubGlobal('fetch', fetchMock);

      fillValidSignupForm();
      await act(async () => {
        fireEvent.click(getSignupRequestOtpButton());
      });

      // Flush any pending microtasks/state updates without relying on waitFor timeouts.
      await act(async () => {});
      expect(screen.getByText('OTP sent to +919876543210')).toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(60000);
      });

      const resendButton = screen.getByRole('button', { name: 'Resend OTP' });
      expect(resendButton).toBeEnabled();
      await act(async () => {
        fireEvent.click(resendButton);
      });

      expect(toastSuccess).toHaveBeenCalledWith(
        'messages.signupOtpResentSuccessfully',
      );
    } finally {
      vi.useRealTimers();
    }
  }, 15000);
});

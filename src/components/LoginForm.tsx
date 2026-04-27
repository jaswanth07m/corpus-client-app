import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Phone,
  MessageSquare,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
  User,
  Mail,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { toast } from 'sonner';
import { BACKEND_URL } from '@/lib/constants';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

interface LoginFormProps {
  onLoginSuccess: (token: string, user: unknown) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const { t } = useTranslation();
  //validation states
  const [validatePhone, setValidatePhone] = useState('border-gray-200');
  const [errorPhoneDisplay, setErrorPhoneDisplay] = useState('hidden');
  const [validateUserName, setValidateUserName] = useState('border-gray-200');
  const [errorUserNameDisplay, setErrorUserNameDisplay] = useState('hidden');
  const [validateName, setValidateName] = useState('border-gray-200');
  const [errorNameDisplay, setErrorNameDisplay] = useState('hidden');
  const [validateEmail, setValidateEmail] = useState('border-gray-200');
  const [errorEmailDisplay, setErrorEmailDisplay] = useState('hidden');
  const [maxDate, setMaxDate] = useState(() => {
    const today = new Date();
    const thirteenYearsAgo = new Date(
      today.getFullYear() - 13,
      today.getMonth(),
      today.getDate(),
    );
    return thirteenYearsAgo.toISOString().split('T')[0];
  });
  const [minDate, setMinDate] = useState(() => {
    const today = new Date();
    const hundredYearsAgo = new Date(
      today.getFullYear() - 100,
      today.getMonth(),
      today.getDate(),
    );
    return hundredYearsAgo.toISOString().split('T')[0];
  });
  const [validatePlace, setValidatePlace] = useState('border-gray-200');
  const [errorPlaceDisplay, setErrorPlaceDisplay] = useState('hidden');
  const [validatePassword, setValidatePassword] = useState('border-gray-200');
  const [errorPasswordDisplay, setErrorPasswordDisplay] = useState('hidden');
  const [
    errorPasswordRequirementsDisplay,
    setErrorPasswordRequirementsDisplay,
  ] = useState('hidden');
  const [formValidationErrors, setFormValidationErrors] = useState(false);

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loginMethod, setLoginMethod] = useState<'otp' | 'password'>(
    'password',
  );
  const [phoneDigits, setPhoneDigits] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);

  // Signup form fields (step 1 only)
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    has_given_consent: false,
    is_intern: false,
  });
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSignupOtpInput, setShowSignupOtpInput] = useState(false);
  const [signupOtp, setSignupOtp] = useState('');

  // Timer for resend OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Keep only the first 10 digits
    return digits.slice(0, 10);
  };

  const getFullPhoneNumber = () => {
    return phoneDigits;
  };

  const isValidPhoneNumber = () => {
    return phoneDigits.length === 10 && parseInt(phoneDigits[0]) > 5;
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidUserName = (name: string) => {
    const newNameRegex = /^[A-Za-z0-9_]{3,50}$/;
    return newNameRegex.test(name.trim());
  };

  const handleSendOTP = async () => {
    if (!isValidPhoneNumber()) {
      toast.error(t('auth.pleaseEnterAValid10digitPhoneNumber'));
      return;
    }

    setLoading(true);
    try {
      console.log('Sending OTP to:', getFullPhoneNumber());

      const response = await fetch(`${BACKEND_URL}/auth/login/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: getFullPhoneNumber(),
        }),
      });

      const data = await response.json();
      console.log('OTP Response:', data);
      console.log('Response Status:', response.status);
      console.log('Response Headers:', response.headers);

      if (response.ok) {
        setShowOtpInput(true);
        setResendTimer(60); // 60 second timer
        setCanResend(false);
        toast.success(t('messages.otpSentSuccessfully'));
      } else {
        console.error('OTP Send Error:', data);
        toast.error(
          data.message || data.detail || data.error || 'Failed to send OTP',
        );
      }
    } catch (error) {
      console.error('Network Error:', error);
      toast.error(
        t('messages.networkErrorPleaseCheckYourConnectionAndTryAgain'),
      );
    }
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error(t('auth.pleaseEnterAValid6digitOtp'));
      return;
    }

    setLoading(true);
    try {
      console.log('Verifying OTP:', otp, 'for phone:', getFullPhoneNumber());

      const response = await fetch(`${BACKEND_URL}/auth/login/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: getFullPhoneNumber(),
          otp_code: otp.trim(),
          has_given_consent: true,
        }),
      });

      const data = await response.json();
      console.log('OTP Verify Response:', data);
      console.log('Response Status:', response.status);
      console.log('Response Headers:', response.headers);

      if (response.ok) {
        // Check if we have access_token in the response
        if (data.access_token) {
          toast.success(t('messages.loginSuccessful'));
          // Create user object from response data
          const user = {
            user_id: data.user_id,
            phone: data.phone || getFullPhoneNumber(),
            roles: data.roles || [],
          };
          onLoginSuccess(data.access_token, user);
        } else {
          console.error('No access token in response:', data);
          toast.error(t('common.loginFailedNoAccessTokenReceived'));
        }
      } else {
        console.error('OTP Verify Error:', data);

        // Handle specific error cases based on response
        if (data.detail && Array.isArray(data.detail)) {
          // Handle validation errors (422)
          const errorMessages = data.detail
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((err: any) => err.msg)
            .join(', ');
          toast.error(`Validation error: ${errorMessages}`);
        } else if (data.detail && typeof data.detail === 'string') {
          // Handle string detail messages
          toast.error(data.detail);
        } else if (data.message) {
          // Handle general message errors
          toast.error(data.message);
        } else if (data.error) {
          // Handle general error messages
          toast.error(data.error);
        } else {
          // Handle HTTP status codes
          switch (response.status) {
            case 400:
              toast.error(t('auth.invalidOtpPleaseCheckAndTryAgain'));
              break;
            case 401:
              toast.error(t('auth.otpVerificationFailedPleaseTryAgain'));
              break;
            case 422:
              toast.error(
                t('auth.otpHasExpiredOrIsInvalidPleaseRequestANewOne'),
              );
              break;
            case 429:
              toast.error(
                t('ui.too.many.attempts.please.wait.before.trying.again'),
              );
              break;
            default:
              toast.error(`OTP verification failed (${response.status})`);
          }
        }
      }
    } catch (error) {
      console.error('Network Error:', error);
      toast.error('Network error. Please check your connection and try again.');
    }
    setLoading(false);
  };

  const handleResendOTP = async () => {
    if (!canResend || loading) return;

    setCanResend(false);
    setOtp(''); // Clear current OTP
    await handleSendOTP();
  };

  const handlePasswordLogin = async () => {
    if (!isValidPhoneNumber() || !password) {
      toast.error(t('auth.pleaseEnterAValidPhoneNumberAndPassword'));
      return;
    }

    setLoading(true);
    try {
      console.log('Password login for:', getFullPhoneNumber());

      const response = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: `+91${getFullPhoneNumber()}`,
          password: password,
        }),
      });

      const data = await response.json();
      console.log('Login Response:', data);
      console.log('Response Status:', response.status);

      if (response.ok && data.access_token) {
        toast.success('Login successful!');
        onLoginSuccess(
          data.access_token,
          data.user || { phone: getFullPhoneNumber() },
        );
      } else {
        console.error('Login Error:', data);
        toast.error(
          data.message || data.detail || data.error || 'Invalid credentials',
        );
      }
    } catch (error) {
      console.error('Network Error:', error);
      toast.error('Network error. Please check your connection and try again.');
    }
    setLoading(false);
  };

  const handleSignupSendOTP = async () => {
    // Validation

    if (!isValidPhoneNumber()) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    if (!signupData.name.trim()) {
      toast.error(t('user.pleaseEnterYourName'));
      return;
    }

    if (!signupData.email.trim() || !isValidEmail(signupData.email)) {
      toast.error(t('common.pleaseEnterAValidEmailAddress'));
      return;
    }

    if (!signupData.password || signupData.password.length < 6) {
      toast.error(t('auth.passwordMustBeAtLeast6CharactersLong'));
      return;
    }

    if (!signupData.has_given_consent) {
      toast.error(t('ui.please.agree.to.the.terms.and.conditions'));
      return;
    }

    setLoading(true);
    try {
      console.log('Creating account for:', getFullPhoneNumber());

      const requestBody = {
        phone: getFullPhoneNumber(),
        name: signupData.name.trim(),
        email: signupData.email.trim(),
        password: signupData.password,
        is_intern: signupData.is_intern,
      };

      const response = await fetch(`${BACKEND_URL}/auth/signup/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('Signup Send OTP Response:', data);

      if (response.ok) {
        setShowSignupOtpInput(true);
        setResendTimer(60);
        setCanResend(false);
        toast.success(t('messages.signupOtpSentSuccessfully'));
      } else {
        console.error('Signup Send OTP Error:', data);
        toast.error(
          data.message ||
            data.detail ||
            data.error ||
            'Failed to send signup OTP',
        );
      }
    } catch (error) {
      console.error('Network Error:', error);
      toast.error('Network error. Please check your connection and try again.');
    }
    setLoading(false);
  };

  const handleSignupVerifyOTP = async () => {
    if (!signupOtp || signupOtp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      console.log(
        'Verifying Signup OTP:',
        signupOtp,
        'for phone:',
        getFullPhoneNumber(),
      );

      const requestBody = {
        phone: getFullPhoneNumber(),
        otp_code: signupOtp.trim(),
        name: signupData.name.trim(),
        email: signupData.email.trim(),
        password: signupData.password,
        confirm_password: signupData.confirmPassword,
        has_given_consent: signupData.has_given_consent,
        is_intern: signupData.is_intern,
      };

      const response = await fetch(`${BACKEND_URL}/auth/signup/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('Signup Verify OTP Response:', data);

      if (response.ok) {
        toast.success(
          t('messages.accountCreatedAndVerifiedSuccessfullyPleaseLogin'),
        );
        onLoginSuccess(data.access_token, data);
      } else {
        console.error('Signup Verify OTP Error:', data);
        if (data.detail && Array.isArray(data.detail)) {
          const errorMessages = data.detail
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((err: any) => err.msg)
            .join(', ');
          toast.error(`Validation error: ${errorMessages}`);
        } else if (data.detail && typeof data.detail === 'string') {
          toast.error(data.detail);
        } else if (data.message) {
          toast.error(data.message);
        } else if (data.error) {
          toast.error(data.error);
        } else {
          toast.error(`Signup OTP verification failed (${response.status})`);
        }
      }
    } catch (error) {
      console.error('Network Error:', error);
      toast.error('Network error. Please check your connection and try again.');
    }
    setLoading(false);
  };

  const handleSignupResendOTP = async () => {
    if (!canResend || loading) return;

    setCanResend(false);
    setSignupOtp(''); // Clear current OTP
    setLoading(true);
    try {
      console.log('Resending Signup OTP to:', getFullPhoneNumber());

      const response = await fetch(`${BACKEND_URL}/auth/signup/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: getFullPhoneNumber(),
        }),
      });

      const data = await response.json();
      console.log('Signup Resend OTP Response:', data);

      if (response.ok) {
        setResendTimer(60);
        setCanResend(false);
        toast.success(t('messages.signupOtpResentSuccessfully'));
      } else {
        console.error('Signup Resend OTP Error:', data);
        toast.error(
          data.message ||
            data.detail ||
            data.error ||
            'Failed to resend signup OTP',
        );
        setCanResend(true);
      }
    } catch (error) {
      console.error('Network Error:', error);
      toast.error('Network error. Please check your connection and try again.');
      setCanResend(true);
    }
    setLoading(false);
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
  };

  const handleSignupOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setSignupOtp(value);
  };

  const handleSignupInputChange = (field: string, value: string | boolean) => {
    setSignupData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setPhoneDigits('');
    setPassword('');
    setOtp('');
    setShowOtpInput(false);
    setResendTimer(0);
    setCanResend(false);
    setSignupData({
      username: '',
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      has_given_consent: false,
      is_intern: false,
    });
    setShowSignupOtpInput(false);
    setSignupOtp('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-white to-blue-50 relative overflow-hidden">
      {/* Animated Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-20 right-20 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '1s' }}
          ></div>
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '2s' }}
          ></div>
        </div>
      </div>

      <Card className="w-full max-w-md animate-scale-in relative z-10 shadow-2xl border border-slate-200/50 bg-white/90 backdrop-blur-xl">
        {/* Language Switcher */}
        <div className="absolute top-4 right-4 z-50">
          <LanguageSwitcher />
        </div>

        <CardHeader className="text-center pb-6 pt-10 px-8">
          <div className="mb-8">
            <img
              src="/Swecha_Logo_English.png"
              alt={t('common.swechaTechnologyForSociety')}
              className="h-28 mx-auto drop-shadow-lg hover:scale-105 transition-transform duration-300"
            />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-3">
            {mode === 'login' ? t('auth.welcomeBack') : t('auth.createAccount')}
          </h1>
          <p className="text-slate-600 text-base">
            {mode === 'login'
              ? t('auth.signInToContinueYourJourney')
              : t('auth.joinOurCommunityToday')}
          </p>
        </CardHeader>

        <CardContent className="space-y-6 px-8 pb-10">
          {/* Mode Toggle - Enhanced Design */}
          <div className="flex gap-3 p-1.5 bg-gradient-to-r from-slate-100 to-slate-50 rounded-2xl shadow-inner">
            <Button
              variant={mode === 'login' ? 'default' : 'ghost'}
              className={`flex-1 rounded-xl transition-all duration-300 font-semibold ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg shadow-emerald-500/30 scale-105'
                  : 'hover:bg-white/80 text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => {
                setMode('login');
                resetForm();
              }}
            >
              <LogIn className="h-4 w-4 mr-2" />
              {t('auth.login')}
            </Button>
            <Button
              variant={mode === 'signup' ? 'default' : 'ghost'}
              className={`flex-1 rounded-xl transition-all duration-300 font-semibold ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30 scale-105'
                  : 'hover:bg-white/80 text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => {
                setMode('signup');
                resetForm();
              }}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {t('auth.signUp')}
            </Button>
          </div>

          {/* LOGIN MODE */}
          {mode === 'login' && (
            <>
              {/* OTP Login Flow */}
              {loginMethod === 'otp' && !showOtpInput && (
                <div className="space-y-5 animate-fade-in-up">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <p className="text-sm text-blue-700 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {t('auth.enterYourRegisteredPhoneNumberToReceiveOtp')}
                    </p>
                  </div>

                  <div className="relative">
                    <Phone className="absolute left-4 top-4 h-5 w-5 text-emerald-600" />
                    <div className="absolute left-12 top-4 text-gray-500 font-medium">
                      {t('common.91')}
                    </div>
                    <Input
                      type="tel"
                      placeholder={t('auth.enter10digitPhoneNumber')}
                      value={phoneDigits}
                      onChange={(e) =>
                        setPhoneDigits(formatPhoneNumber(e.target.value))
                      }
                      onFocus={() => {
                        setValidatePhone('border-gray-500');
                        setErrorPhoneDisplay('hidden');
                      }}
                      onBlur={(e) => {
                        if (parseInt(phoneDigits[0]) <= 5) {
                          setValidatePhone('border-rose-800');
                          setErrorPhoneDisplay('block');
                        }
                      }}
                      className="pl-20 h-14 border-2 border-gray-200 focus:border-emerald-500 rounded-xl text-lg bg-gray-50 focus:bg-white transition-all duration-300"
                    />
                    <div className="text-xs text-gray-500 mt-1 ml-1">
                      {phoneDigits.length}
                      {t('common.10.digits')}
                    </div>
                    <div
                      className={`text-xs text-red-500 mt-1 ml-1 font-medium ${errorPhoneDisplay}`}
                    >
                      {t('auth.phoneNumberIsInvalid')}
                    </div>
                  </div>

                  {/* Login with Password */}
                  <div className="font-medium text-gray-800">
                    {t('nav.preferPasswordLogin')}{' '}
                    <button
                      className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors duration-200"
                      onClick={() => {
                        setLoginMethod('password');
                      }}
                    >
                      {t('nav.loginWithPassword')}
                    </button>
                  </div>

                  <Button
                    onClick={handleSendOTP}
                    disabled={loading || !isValidPhoneNumber()}
                    className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-300 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        {t('common.sending')}
                      </div>
                    ) : (
                      'Send OTP'
                    )}
                  </Button>
                </div>
              )}

              {/* OTP Verification */}
              {loginMethod === 'otp' && showOtpInput && (
                <div className="space-y-5 animate-fade-in-up">
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                    <p className="text-sm text-green-700 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      {t('auth.otpSentTo91')}
                      {phoneDigits}
                    </p>
                  </div>

                  <div className="relative">
                    <Input
                      type="text"
                      placeholder={t('auth.enter6digitOtp')}
                      value={otp}
                      onChange={handleOtpChange}
                      className="h-14 border-2 border-gray-200 focus:border-emerald-500 rounded-xl text-center text-2xl tracking-widest bg-gray-50 focus:bg-white transition-all duration-300"
                      maxLength={6}
                    />
                    <div className="text-xs text-gray-500 mt-1 text-center">
                      {otp.length}
                      {t('common.6.digits')}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={handleVerifyOTP}
                      disabled={loading || otp.length !== 6}
                      className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-300 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          {t('common.verifying')}
                        </div>
                      ) : (
                        'Verify OTP'
                      )}
                    </Button>

                    {/* Resend OTP */}
                    <div className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        onClick={handleResendOTP}
                        disabled={!canResend || loading}
                        className="flex items-center gap-2 text-emerald-600 hover:bg-emerald-50 rounded-xl h-12 transition-all duration-300"
                      >
                        <RefreshCw className="h-4 w-4" />
                        {resendTimer > 0
                          ? `Resend in ${resendTimer}s`
                          : 'Resend OTP'}
                      </Button>

                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowOtpInput(false);
                          setOtp('');
                          setResendTimer(0);
                          setCanResend(false);
                        }}
                        className="text-gray-600 hover:bg-gray-50 rounded-xl h-12 transition-all duration-300"
                      >
                        Back
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Password Login */}
              {loginMethod === 'password' && (
                <div
                  onKeyDown={(e) => {
                    if (e.key == 'Enter') handlePasswordLogin();
                  }}
                  className="space-y-5 animate-fade-in-up"
                >
                  <div className="relative">
                    <Phone className="absolute left-4 top-4 h-5 w-5 text-purple-500 z-10" />
                    <div className="absolute left-12 top-4 text-gray-500 font-medium">
                      +91
                    </div>
                    <Input
                      type="tel"
                      placeholder={t('auth.enter10digitPhoneNumber')}
                      value={phoneDigits}
                      onChange={(e) =>
                        setPhoneDigits(formatPhoneNumber(e.target.value))
                      }
                      onFocus={() => {
                        setValidatePhone('border-gray-500');
                        setErrorPhoneDisplay('hidden');
                      }}
                      onBlur={(e) => {
                        if (parseInt(phoneDigits[0]) <= 5) {
                          setValidatePhone('border-rose-800');
                          setErrorPhoneDisplay('block');
                        }
                      }}
                      className="pl-20 h-14 border-2 border-gray-200 focus:border-purple-500 rounded-xl text-lg bg-gray-50 focus:bg-white transition-all duration-300"
                    />
                    <div className="text-xs text-gray-500 mt-1 ml-1">
                      {phoneDigits.length}
                      {t('common.10.digits')}
                    </div>
                    <div
                      className={`text-xs text-red-500 mt-1 ml-1 font-medium ${errorPhoneDisplay}`}
                    >
                      {t('auth.phoneNumberIsInvalid')}
                    </div>
                  </div>

                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('auth.enterYourPassword')}
                      value={password}
                      // onKeyDown={(e) => {
                      //   if(e.key == 'Enter'){
                      //     handlePasswordLogin();
                      //   }
                      // }}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-12 h-14 border-2 border-gray-200 focus:border-purple-500 rounded-xl text-lg bg-gray-50 focus:bg-white transition-all duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-4 h-6 w-6 text-purple-500 hover:text-purple-700 transition-colors duration-200"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  {/* forgot password ? Login with OTP */}
                  <div className="font-medium text-gray-800">
                    {t('auth.forgotPassword')}{' '}
                    <Link
                      to="/forgot-password"
                      className="font-bold text-purple-500 hover:text-purple-700 transition-colors duration-200"
                    >
                      {t('common.resetHere')}
                    </Link>
                  </div>
                  {/* <div className="font-medium text-gray-800">
                    Prefer OTP Login?{' '}
                    <button
                      className="font-bold text-purple-500 hover:text-purple-700 transition-colors duration-200"
                      onClick={() => {
                        setLoginMethod('otp');
                        setShowOtpInput(false);
                        setOtp('');
                        setResendTimer(0);
                        setCanResend(false);
                      }}
                    >
                      Login with OTP
                    </button>
                  </div> */}

                  <Button
                    onClick={handlePasswordLogin}
                    disabled={loading || !isValidPhoneNumber() || !password}
                    className="w-full h-14 gradient-purple text-white hover:opacity-90 transition-all duration-300 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        {t('common.logging.in')}
                      </div>
                    ) : (
                      t('auth.login')
                    )}
                  </Button>
                </div>
              )}
            </>
          )}

          {/* SIGNUP MODE */}
          {mode === 'signup' && (
            <>
              {!showSignupOtpInput ? (
                <div className="space-y-5 animate-fade-in-up">
                  {/* User Type Selection */}
                  <div className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="userType"
                        checked={!signupData.is_intern}
                        onChange={() =>
                          handleSignupInputChange('is_intern', false)
                        }
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                      />
                      <span
                        className={`text-sm font-medium ${!signupData.is_intern ? 'text-purple-700' : 'text-gray-600'}`}
                      >
                        {t('common.normalUser')}
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="userType"
                        checked={signupData.is_intern}
                        onChange={() =>
                          handleSignupInputChange('is_intern', true)
                        }
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                      />
                      <span
                        className={`text-sm font-medium ${signupData.is_intern ? 'text-purple-700' : 'text-gray-600'}`}
                      >
                        Intern
                      </span>
                    </label>
                  </div>
                  {/* Phone Number */}
                  <div className="relative">
                    <Phone className="absolute left-4 top-4 h-5 w-5 text-purple-500" />
                    <div className="absolute left-12 top-4 text-gray-500 font-medium">
                      +91
                    </div>
                    <Input
                      type="tel"
                      placeholder={t('auth.enter10digitPhoneNumber')}
                      value={phoneDigits}
                      onChange={(e) =>
                        setPhoneDigits(formatPhoneNumber(e.target.value))
                      }
                      onFocus={() => {
                        setValidatePhone('border-gray-500');
                        setErrorPhoneDisplay('hidden');
                      }}
                      onBlur={(e) => {
                        if (parseInt(phoneDigits[0]) <= 5) {
                          setValidatePhone('border-rose-800');
                          setErrorPhoneDisplay('block');
                          setFormValidationErrors(true);
                        } else {
                          setFormValidationErrors(false);
                        }
                      }}
                      className={`pl-20 h-14 border-2 ${validatePhone} focus:border-purple-500 rounded-xl text-lg bg-gray-50 focus:bg-white transition-all duration-300`}
                    />
                    <div className="text-xs text-gray-500 mt-1 ml-1">
                      {phoneDigits.length}
                      {t('common.10.digits')}
                    </div>
                    <div
                      className={`text-xs text-red-500 mt-1 ml-1 font-medium ${errorPhoneDisplay}`}
                    >
                      {t('auth.phoneNumberIsInvalid')}
                    </div>
                  </div>
                  {/* Name */}
                  <div className="relative">
                    <User className="absolute left-4 top-4 h-5 w-5 text-purple-500" />
                    <Input
                      type="text"
                      placeholder={t('user.fullName')}
                      value={signupData.name}
                      onChange={(e) =>
                        handleSignupInputChange('name', e.target.value)
                      }
                      onFocus={() => {
                        setValidateName('border-gray-500');
                        setErrorNameDisplay('hidden');
                      }}
                      onBlur={(e) => {
                        const nameRegex = /^[A-Za-z\s]+$/;
                        if (!nameRegex.test(signupData.name.trim())) {
                          setValidateName('border-rose-800');
                          setErrorNameDisplay('block');
                          setFormValidationErrors(true);
                        } else {
                          setFormValidationErrors(false);
                        }
                      }}
                      className={`pl-12 h-14 border-2 ${validateName} focus:border-purple-500 rounded-xl text-lg bg-gray-50 focus:bg-white transition-all duration-300`}
                    />
                    <div
                      className={`text-xs text-red-500 mt-1 ml-1 font-medium ${errorNameDisplay}`}
                    >
                      {t('user.nameShouldHaveCharactersOnly')}
                    </div>
                  </div>
                  {/* Email */}
                  <div className="relative">
                    <Mail className="absolute left-4 top-4 h-5 w-5 text-purple-500" />
                    <Input
                      type="email"
                      placeholder={t('common.emailAddress')}
                      value={signupData.email}
                      onChange={(e) =>
                        handleSignupInputChange('email', e.target.value)
                      }
                      onFocus={() => {
                        setValidateEmail('border-gray-500');
                        setErrorEmailDisplay('hidden');
                      }}
                      onBlur={(e) => {
                        if (!isValidEmail(signupData.email.trim())) {
                          setValidateEmail('border-rose-800');
                          setErrorEmailDisplay('block');
                          setFormValidationErrors(true);
                        } else {
                          setFormValidationErrors(false);
                        }
                      }}
                      className={`pl-12 h-14 border-2 ${validateEmail} focus:border-purple-500 rounded-xl text-lg bg-gray-50 focus:bg-white transition-all duration-300`}
                    />
                    <div
                      className={`text-xs text-red-500 mt-1 ml-1 font-medium ${errorEmailDisplay}`}
                    >
                      {t('common.pleaseEnterAValidEmailAddress')}
                    </div>
                  </div>
                  {/* Password */}{' '}
                  <div className="relative">
                    <Input
                      type={showSignupPassword ? 'text' : 'password'}
                      placeholder={t('auth.createPassword')}
                      value={signupData.password}
                      onChange={(e) =>
                        handleSignupInputChange('password', e.target.value)
                      }
                      onFocus={() => {
                        setErrorPasswordRequirementsDisplay('block');
                      }}
                      onBlur={(e) => {
                        const isPasswordValid =
                          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(
                            signupData.password,
                          );
                        const isPasswordMedium =
                          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(
                            signupData.password,
                          );

                        if (
                          signupData.password.length >= 8 &&
                          isPasswordValid
                        ) {
                          setValidatePassword('border-green-500');
                          setFormValidationErrors(false);
                        } else if (
                          signupData.password.length >= 6 &&
                          isPasswordMedium
                        ) {
                          setValidatePassword('border-yellow-500');
                          setFormValidationErrors(false);
                        } else {
                          setValidatePassword('border-rose-800');
                          setErrorPasswordDisplay('block');
                          setFormValidationErrors(true);
                        }
                        setErrorPasswordRequirementsDisplay('hidden');
                      }}
                      className={`pr-12 h-14 border-2 ${validatePassword} focus:border-purple-500 rounded-xl text-lg bg-gray-50 focus:bg-white transition-all duration-300`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-4 top-4 h-6 w-6 text-purple-500 hover:text-purple-700 transition-colors duration-200"
                    >
                      {showSignupPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                    <div className={`mt-3 ${errorPasswordRequirementsDisplay}`}>
                      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            !signupData.password
                              ? 'w-0'
                              : /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(
                                    signupData.password,
                                  )
                                ? 'w-full bg-green-500'
                                : /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(
                                      signupData.password,
                                    )
                                  ? 'w-2/3 bg-yellow-500'
                                  : 'w-1/3 bg-red-500'
                          }`}
                        />
                      </div>
                      <div className="text-xs text-gray-500">
                        {t('auth.passwordStrength')}{' '}
                        <span
                          className={
                            !signupData.password
                              ? 'text-gray-500'
                              : /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(
                                    signupData.password,
                                  )
                                ? 'text-green-500'
                                : /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(
                                      signupData.password,
                                    )
                                  ? 'text-yellow-500'
                                  : 'text-red-500'
                          }
                        >
                          {!signupData.password
                            ? 'Enter Password'
                            : /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(
                                  signupData.password,
                                )
                              ? 'Strong'
                              : /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(
                                    signupData.password,
                                  )
                                ? 'Medium'
                                : 'Weak'}
                        </span>
                        <div className={'font-medium text-xs text-gray-800'}>
                          {' '}
                          {t('auth.passwordShouldContain')}
                          <ul className="mb-2 text-xs">
                            <li
                              className={`flex items-center ${/[A-Z]/.test(signupData.password) ? 'text-green-500' : 'text-gray-500'}`}
                            >
                              <span className="mr-2">
                                {/[A-Z]/.test(signupData.password) ? '✓' : '○'}
                              </span>
                              {t('common.one.uppercase.letter')}
                            </li>
                            <li
                              className={`flex items-center ${/[a-z]/.test(signupData.password) ? 'text-green-500' : 'text-gray-500'}`}
                            >
                              <span className="mr-2">
                                {/[a-z]/.test(signupData.password) ? '✓' : '○'}
                              </span>
                              {t('common.one.lowercase.letter')}
                            </li>
                            <li
                              className={`flex items-center ${/\d/.test(signupData.password) ? 'text-green-500' : 'text-gray-500'}`}
                            >
                              <span className="mr-2">
                                {/\d/.test(signupData.password) ? '✓' : '○'}
                              </span>
                              {t('common.one.number')}
                            </li>
                            <li
                              className={`flex items-center ${/[!@#$%^&*(),.?":{}|<>]/.test(signupData.password) ? 'text-green-500' : 'text-gray-500'}`}
                            >
                              <span className="mr-2">
                                {/[!@#$%^&*(),.?":{}|<>]/.test(
                                  signupData.password,
                                )
                                  ? '✓'
                                  : '○'}
                              </span>
                              {t('ui.one.special.character')}
                            </li>
                            <li
                              className={`flex items-center ${signupData.password.length >= 8 ? 'text-green-500' : 'text-gray-500'}`}
                            >
                              <span className="mr-2">
                                {signupData.password.length >= 8 ? '✓' : '○'}
                              </span>
                              {t('common.minimum.8.characters')}
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Confirm Password */}
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder={t('common.confirmPassword')}
                      value={signupData.confirmPassword}
                      onChange={(e) =>
                        handleSignupInputChange(
                          'confirmPassword',
                          e.target.value,
                        )
                      }
                      onFocus={() => {
                        setValidatePassword('border-gray-500');
                        setErrorPasswordDisplay('hidden');
                      }}
                      onBlur={(e) => {
                        if (
                          signupData.password !== signupData.confirmPassword
                        ) {
                          setValidatePassword('border-rose-800');
                          setErrorPasswordDisplay('block');
                          setFormValidationErrors(true);
                        } else {
                          setFormValidationErrors(false);
                        }
                      }}
                      className={`pr-12 h-14 border-2 ${validatePassword} focus:border-purple-500 rounded-xl text-lg bg-gray-50 focus:bg-white transition-all duration-300`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-4 top-4 h-6 w-6 text-purple-500 hover:text-purple-700 transition-colors duration-200"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                    <div
                      className={`text-xs text-red-500 mt-1 ml-1 font-medium ${errorPasswordDisplay}`}
                    >
                      {t('common.passwordsDoNotMatch')}
                    </div>
                  </div>
                  {/* Consent Checkbox */}
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <input
                      type="checkbox"
                      id="consent"
                      checked={signupData.has_given_consent}
                      onChange={(e) =>
                        handleSignupInputChange(
                          'has_given_consent',
                          e.target.checked,
                        )
                      }
                      className="mt-1 w-5 h-5 text-purple-600 border-2 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                    />
                    <label
                      htmlFor="consent"
                      className="text-sm text-gray-700 leading-relaxed"
                    >
                      {t('common.i.agree.to.the')}{' '}
                      <a
                        href="https://swecha.org/terms-and-conditions"
                        className="text-purple-600 hover:text-purple-700 cursor-pointer underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t('common.terms.of.service')}
                      </a>{' '}
                      and{' '}
                      <a
                        href="https://swecha.org/privacy-policy"
                        className="text-purple-600 hover:text-purple-700 cursor-pointer underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t('common.privacy.policy')}
                      </a>
                    </label>
                  </div>
                  {/* Sign Up Button */}
                  <Button
                    onClick={handleSignupSendOTP}
                    disabled={
                      loading ||
                      !isValidPhoneNumber() ||
                      !signupData.name.trim() ||
                      !signupData.password ||
                      signupData.password !== signupData.confirmPassword ||
                      !signupData.has_given_consent ||
                      formValidationErrors
                    }
                    className="w-full h-14 gradient-purple text-white hover:opacity-90 transition-all duration-300 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        {t('auth.sendingOtp')}
                      </div>
                    ) : (
                      <>
                        <UserPlus className="h-5 w-5 mr-2" />
                        {t('auth.requestOtpForPhoneVerification')}
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-5 animate-fade-in-up">
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                    <p className="text-sm text-green-700 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      OTP sent to +91{phoneDigits}
                    </p>
                  </div>

                  <div className="relative">
                    <Input
                      type="text"
                      placeholder={t('auth.enter6digitOtp')}
                      value={signupOtp}
                      onChange={handleSignupOtpChange}
                      className="h-14 border-2 border-gray-200 focus:border-purple-500 rounded-xl text-center text-2xl tracking-widest bg-gray-50 focus:bg-white transition-all duration-300"
                      maxLength={6}
                    />
                    <div className="text-xs text-gray-500 mt-1 text-center">
                      {signupOtp.length}
                      {t('common.6.digits')}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={handleSignupVerifyOTP}
                      disabled={loading || signupOtp.length !== 6}
                      className="w-full h-14 gradient-purple text-white hover:opacity-90 transition-all duration-300 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Verifying...
                        </div>
                      ) : (
                        'Verify OTP & Create Account'
                      )}
                    </Button>

                    {/* Resend OTP */}
                    <div className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        onClick={handleSignupResendOTP}
                        disabled={!canResend || loading}
                        className="flex items-center gap-2 text-purple-600 hover:bg-purple-50 rounded-xl h-12 transition-all duration-300"
                      >
                        <RefreshCw className="h-4 w-4" />
                        {resendTimer > 0
                          ? `Resend in ${resendTimer}s`
                          : 'Resend OTP'}
                      </Button>

                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowSignupOtpInput(false);
                          setSignupOtp('');
                          setResendTimer(0);
                          setCanResend(false);
                        }}
                        className="text-gray-600 hover:bg-gray-50 rounded-xl h-12 transition-all duration-300"
                      >
                        {t('common.backToSignupForm')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Footer */}
          <div className="text-center pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              {t('auth.securedBy')}{' '}
              <span className="text-purple-600 font-semibold">Swecha</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Custom Styles */}
      <style>{`
        .gradient-purple {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out;
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Custom scrollbar for better UX */
        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
};

export default LoginForm;

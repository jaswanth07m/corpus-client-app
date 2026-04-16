import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Phone,
  MessageSquare,
  Eye,
  EyeOff,
  RefreshCw,
  User,
  Mail,
  Calendar,
  MapPin,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { toast } from 'sonner';
import { BACKEND_URL } from '@/lib/constants';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import {
  createOtpLoginSchema,
  createPasswordLoginSchema,
  createSignupSchema,
  getSignupPasswordStrength,
  type OtpLoginFormValues,
  type PasswordLoginFormValues,
  type SignupFormValues,
} from '@/schemas/loginForm';

interface LoginFormProps {
  onLoginSuccess: (token: string, user: unknown) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const { t } = useTranslation();
  const otpLoginSchema = useMemo(() => createOtpLoginSchema(t), [t]);
  const passwordLoginSchema = useMemo(() => createPasswordLoginSchema(t), [t]);
  const signupSchema = useMemo(() => createSignupSchema(t), [t]);
  const [maxDate] = useState(() => {
    const today = new Date();
    const thirteenYearsAgo = new Date(
      today.getFullYear() - 13,
      today.getMonth(),
      today.getDate(),
    );
    return thirteenYearsAgo.toISOString().split('T')[0];
  });
  const [minDate] = useState(() => {
    const today = new Date();
    const hundredYearsAgo = new Date(
      today.getFullYear() - 100,
      today.getMonth(),
      today.getDate(),
    );
    return hundredYearsAgo.toISOString().split('T')[0];
  });
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loginMethod, setLoginMethod] = useState<'otp' | 'password'>(
    'password',
  );
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSignupOtpInput, setShowSignupOtpInput] = useState(false);
  const [signupOtp, setSignupOtp] = useState('');
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);

  const otpLoginForm = useForm<OtpLoginFormValues>({
    resolver: zodResolver(otpLoginSchema),
    mode: 'onChange',
    defaultValues: {
      phone: '',
    },
  });

  const passwordLoginForm = useForm<PasswordLoginFormValues>({
    resolver: zodResolver(passwordLoginSchema),
    mode: 'onChange',
    defaultValues: {
      phone: '',
      password: '',
    },
  });

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
    defaultValues: {
      phone: '',
      username: '',
      name: '',
      email: '',
      gender: '',
      date_of_birth: '',
      current_place: '',
      password: '',
      confirmPassword: '',
      has_given_consent: false,
    },
  });

  // Timer for resend OTP
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
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
    const digits = value.replace(/\D/g, '');
    return digits.slice(0, 10);
  };

  const handleSendOTP = async (values: OtpLoginFormValues) => {
    setLoading(true);
    try {
      console.log('Sending OTP to:', values.phone);

      const response = await fetch(`${BACKEND_URL}/auth/login/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: values.phone,
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
      const phone = otpLoginForm.getValues('phone');
      console.log('Verifying OTP:', otp, 'for phone:', phone);

      const response = await fetch(`${BACKEND_URL}/auth/login/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
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
          const user = {
            user_id: data.user_id,
            phone: data.phone || phone,
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
          const errorMessages = data.detail
            .map((err: { msg: string }) => err.msg)
            .join(', ');
          toast.error(`Validation error: ${errorMessages}`);
        } else if (data.detail && typeof data.detail === 'string') {
          toast.error(data.detail);
        } else if (data.message) {
          toast.error(data.message);
        } else if (data.error) {
          toast.error(data.error);
        } else {
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
    setOtp('');
    await handleSendOTP(otpLoginForm.getValues());
  };

  const handlePasswordLogin = async (values: PasswordLoginFormValues) => {
    setLoading(true);
    try {
      console.log('Password login for:', values.phone);

      const response = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: `+91${values.phone}`,
          password: values.password,
        }),
      });

      const data = await response.json();
      console.log('Login Response:', data);
      console.log('Response Status:', response.status);

      if (response.ok && data.access_token) {
        toast.success('Login successful!');
        onLoginSuccess(data.access_token, data.user || { phone: values.phone });
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

  const handleSignupSendOTP = async (values: SignupFormValues) => {
    setLoading(true);
    try {
      console.log('Creating account for:', values.phone);

      const requestBody = {
        phone: values.phone,
        username: values.username.trim().toLowerCase(),
        name: values.name.trim(),
        email: values.email.trim(),
        gender: values.gender || undefined,
        date_of_birth: values.date_of_birth || undefined,
        current_place: values.current_place?.trim() || undefined,
        password: values.password,
        role_ids: [2],
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
        signupForm.getValues('phone'),
      );

      const signupValues = signupForm.getValues();
      const requestBody = {
        phone: signupValues.phone,
        otp_code: signupOtp.trim(),
        username: signupValues.username.trim().toLowerCase(),
        name: signupValues.name.trim(),
        email: signupValues.email.trim(),
        gender: signupValues.gender || undefined,
        date_of_birth: signupValues.date_of_birth || undefined,
        current_place: signupValues.current_place?.trim() || undefined,
        password: signupValues.password,
        confirm_password: signupValues.confirmPassword,
        role_ids: [2],
        has_given_consent: signupValues.has_given_consent,
      };

      (Object.keys(requestBody) as Array<keyof typeof requestBody>).forEach(
        (key) => {
          if (requestBody[key] === undefined) {
            delete requestBody[key];
          }
        },
      );

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
        setMode('login');
        resetForm();
      } else {
        console.error('Signup Verify OTP Error:', data);
        if (data.detail && Array.isArray(data.detail)) {
          const errorMessages = data.detail
            .map((err: { msg: string }) => err.msg)
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
      const phone = signupForm.getValues('phone');
      console.log('Resending Signup OTP to:', phone);

      const response = await fetch(`${BACKEND_URL}/auth/signup/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
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

  const resetForm = () => {
    otpLoginForm.reset();
    passwordLoginForm.reset();
    signupForm.reset();
    setOtp('');
    setShowOtpInput(false);
    setResendTimer(0);
    setCanResend(false);
    setShowSignupOtpInput(false);
    setSignupOtp('');
    setShowPasswordRequirements(false);
  };

  const signupPassword = signupForm.watch('password');
  const signupPhone = signupForm.watch('phone');
  const otpLoginPhone = otpLoginForm.watch('phone');
  const passwordStrength = getSignupPasswordStrength(signupPassword);

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
              type="button"
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
              type="button"
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
                      value={otpLoginPhone}
                      onChange={(e) =>
                        otpLoginForm.setValue(
                          'phone',
                          formatPhoneNumber(e.target.value),
                          {
                            shouldDirty: true,
                            shouldValidate: true,
                          },
                        )
                      }
                      className="pl-20 h-14 border-2 border-gray-200 focus:border-emerald-500 rounded-xl text-lg bg-gray-50 focus:bg-white transition-all duration-300"
                    />
                    <div className="text-xs text-gray-500 mt-1 ml-1">
                      {otpLoginPhone.length}
                      {t('common.10.digits')}
                    </div>
                    {otpLoginForm.formState.errors.phone && (
                      <div className="text-xs text-red-500 mt-1 ml-1 font-medium">
                        {otpLoginForm.formState.errors.phone.message}
                      </div>
                    )}
                  </div>

                  {/* Login with Password */}
                  <div className="font-medium text-gray-800">
                    {t('nav.preferPasswordLogin')}{' '}
                    <button
                      className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors duration-200"
                      onClick={() => {
                        passwordLoginForm.setValue('phone', otpLoginPhone, {
                          shouldDirty: true,
                        });
                        setLoginMethod('password');
                      }}
                      type="button"
                    >
                      {t('nav.loginWithPassword')}
                    </button>
                  </div>

                  <Button
                    onClick={() =>
                      void otpLoginForm.handleSubmit(handleSendOTP)()
                    }
                    disabled={loading || !otpLoginForm.formState.isValid}
                    type="button"
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
                      {otpLoginPhone}
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
                        type="button"
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
                        type="button"
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
                    if (e.key === 'Enter') {
                      void passwordLoginForm.handleSubmit(
                        handlePasswordLogin,
                      )();
                    }
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
                      value={passwordLoginForm.watch('phone')}
                      onChange={(e) =>
                        passwordLoginForm.setValue(
                          'phone',
                          formatPhoneNumber(e.target.value),
                          {
                            shouldDirty: true,
                            shouldValidate: true,
                          },
                        )
                      }
                      className="pl-20 h-14 border-2 border-gray-200 focus:border-purple-500 rounded-xl text-lg bg-gray-50 focus:bg-white transition-all duration-300"
                    />
                    <div className="text-xs text-gray-500 mt-1 ml-1">
                      {passwordLoginForm.watch('phone').length}
                      {t('common.10.digits')}
                    </div>
                    {passwordLoginForm.formState.errors.phone && (
                      <div className="text-xs text-red-500 mt-1 ml-1 font-medium">
                        {passwordLoginForm.formState.errors.phone.message}
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('auth.enterYourPassword')}
                      value={passwordLoginForm.watch('password')}
                      onChange={(e) =>
                        passwordLoginForm.setValue('password', e.target.value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      className="pr-12 h-14 border-2 border-gray-200 focus:border-purple-500 rounded-xl text-lg bg-gray-50 focus:bg-white transition-all duration-300"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      type="button"
                      className="absolute right-4 top-4 h-6 w-6 text-purple-500 hover:text-purple-700 transition-colors duration-200"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {passwordLoginForm.formState.errors.password && (
                    <div className="text-xs text-red-500 -mt-3 ml-1 font-medium">
                      {passwordLoginForm.formState.errors.password.message}
                    </div>
                  )}

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
                        otpLoginForm.setValue(
                          'phone',
                          passwordLoginForm.getValues('phone'),
                          {
                            shouldDirty: true,
                          },
                        );
                        setLoginMethod('otp');
                        setShowOtpInput(false);
                        setOtp('');
                        setResendTimer(0);
                        setCanResend(false);
                      }}
                      type="button"
                    >
                      Login with OTP
                    </button>
                  </div> */}

                  <Button
                    onClick={() =>
                      void passwordLoginForm.handleSubmit(handlePasswordLogin)()
                    }
                    disabled={loading || !passwordLoginForm.formState.isValid}
                    type="button"
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
                  {/* Phone Number */}
                  <div className="relative">
                    <Phone className="absolute left-4 top-4 h-5 w-5 text-purple-500" />
                    <div className="absolute left-12 top-4 text-gray-500 font-medium">
                      +91
                    </div>
                    <Input
                      type="tel"
                      placeholder={t('auth.enter10digitPhoneNumber')}
                      value={signupPhone}
                      onChange={(e) =>
                        signupForm.setValue(
                          'phone',
                          formatPhoneNumber(e.target.value),
                          {
                            shouldDirty: true,
                            shouldValidate: true,
                          },
                        )
                      }
                      className="pl-20 h-14 border-2 border-gray-200 focus:border-purple-500 rounded-xl text-lg bg-gray-50 focus:bg-white transition-all duration-300"
                    />
                    <div className="text-xs text-gray-500 mt-1 ml-1">
                      {signupPhone.length}
                      {t('common.10.digits')}
                    </div>
                    {signupForm.formState.errors.phone && (
                      <div className="text-xs text-red-500 mt-1 ml-1 font-medium">
                        {signupForm.formState.errors.phone.message}
                      </div>
                    )}
                  </div>

                  {/*UserName*/}
                  <div className="relative">
                    <User className="absolute left-4 top-4 h-5 w-5 text-purple-500" />
                    <Input
                      type="text"
                      placeholder={t('auth.username')}
                      value={signupForm.watch('username')}
                      onChange={(e) =>
                        signupForm.setValue('username', e.target.value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      className="pl-12 h-14 border-2 border-gray-200 focus:border-purple-500 rounded-xl text-lg bg-gray-50 focus:bg-white transition-all duration-300"
                    />
                    {signupForm.formState.errors.username && (
                      <div className="text-xs text-red-500 mt-1 ml-1 font-medium">
                        {signupForm.formState.errors.username.message}
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <div className="relative">
                    <User className="absolute left-4 top-4 h-5 w-5 text-purple-500" />
                    <Input
                      type="text"
                      placeholder={t('user.fullName')}
                      value={signupForm.watch('name')}
                      onChange={(e) =>
                        signupForm.setValue('name', e.target.value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      className="pl-12 h-14 border-2 border-gray-200 focus:border-purple-500 rounded-xl text-lg bg-gray-50 focus:bg-white transition-all duration-300"
                    />
                    {signupForm.formState.errors.name && (
                      <div className="text-xs text-red-500 mt-1 ml-1 font-medium">
                        {signupForm.formState.errors.name.message}
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="relative">
                    <Mail className="absolute left-4 top-4 h-5 w-5 text-purple-500" />
                    <Input
                      type="email"
                      placeholder={t('common.emailAddress')}
                      value={signupForm.watch('email')}
                      onChange={(e) =>
                        signupForm.setValue('email', e.target.value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      className="pl-12 h-14 border-2 border-gray-200 focus:border-purple-500 rounded-xl text-lg bg-gray-50 focus:bg-white transition-all duration-300"
                    />
                    {signupForm.formState.errors.email && (
                      <div className="text-xs text-red-500 mt-1 ml-1 font-medium">
                        {signupForm.formState.errors.email.message}
                      </div>
                    )}
                  </div>

                  {/* Gender */}
                  <div className="relative">
                    <select
                      value={signupForm.watch('gender')}
                      onChange={(e) =>
                        signupForm.setValue('gender', e.target.value, {
                          shouldDirty: true,
                        })
                      }
                      className="w-full h-14 border-2 border-gray-200 focus:border-purple-500 rounded-xl text-lg bg-gray-50 focus:bg-white transition-all duration-300 pl-4 pr-4"
                      aria-label={t('auth.selectGender')}
                    >
                      <option value="">{t('auth.selectGender')}</option>
                      <option value="male">{t('auth.male')}</option>
                      <option value="female">{t('auth.female')}</option>
                      <option value="other">{t('auth.other')}</option>
                    </select>
                  </div>

                  {/* Date of Birth */}
                  <div className="relative">
                    <label className="text-sm text-gray-700 mb-1 block">
                      {t('auth.dateOfBirth')}
                    </label>
                    <Calendar className="absolute left-4 top-10 h-5 w-5 text-purple-500" />
                    <Input
                      type="date"
                      placeholder={t('common.date.of.birth')}
                      min={minDate}
                      max={maxDate}
                      value={signupForm.watch('date_of_birth')}
                      onChange={(e) =>
                        signupForm.setValue('date_of_birth', e.target.value, {
                          shouldDirty: true,
                        })
                      }
                      className="pl-12 h-14 border-2 border-gray-200 focus:border-purple-500 rounded-xl text-lg bg-gray-50 focus:bg-white transition-all duration-300 mt-1"
                    />
                  </div>

                  {/* Place */}
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 h-5 w-5 text-purple-500" />
                    <Input
                      type="text"
                      placeholder={t('user.placeCityState')}
                      value={signupForm.watch('current_place') ?? ''}
                      onChange={(e) =>
                        signupForm.setValue('current_place', e.target.value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      className="pl-12 h-14 border-2 border-gray-200 focus:border-purple-500 rounded-xl text-lg bg-gray-50 focus:bg-white transition-all duration-300"
                    />
                    {signupForm.formState.errors.current_place && (
                      <div className="text-xs text-red-500 mt-1 ml-1 font-medium">
                        {signupForm.formState.errors.current_place.message}
                      </div>
                    )}
                  </div>

                  {/* Password */}
                  <div className="relative">
                    <Input
                      type={showSignupPassword ? 'text' : 'password'}
                      placeholder={t('auth.createPassword')}
                      value={signupPassword}
                      onChange={(e) =>
                        signupForm.setValue('password', e.target.value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      onFocus={() => {
                        setShowPasswordRequirements(true);
                      }}
                      onBlur={() => setShowPasswordRequirements(false)}
                      className="pr-12 h-14 border-2 border-gray-200 focus:border-purple-500 rounded-xl text-lg bg-gray-50 focus:bg-white transition-all duration-300"
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
                    {signupForm.formState.errors.password && (
                      <div className="text-xs text-red-500 mt-1 ml-1 font-medium">
                        {signupForm.formState.errors.password.message}
                      </div>
                    )}
                    <div
                      className={`mt-3 ${showPasswordRequirements ? 'block' : 'hidden'}`}
                    >
                      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${passwordStrength.barClass}`}
                        />
                      </div>
                      <div className="text-xs text-gray-500">
                        {t('auth.passwordStrength')}{' '}
                        <span className={passwordStrength.colorClass}>
                          {passwordStrength.label === 'empty'
                            ? 'Enter Password'
                            : passwordStrength.label === 'strong'
                              ? 'Strong'
                              : passwordStrength.label === 'medium'
                                ? 'Medium'
                                : 'Weak'}
                        </span>
                        <div className={'font-medium text-xs text-gray-800'}>
                          {' '}
                          {t('auth.passwordShouldContain')}
                          <ul className="mb-2 text-xs">
                            <li
                              className={`flex items-center ${/[A-Z]/.test(signupPassword) ? 'text-green-500' : 'text-gray-500'}`}
                            >
                              <span className="mr-2">
                                {/[A-Z]/.test(signupPassword) ? '✓' : '○'}
                              </span>
                              {t('common.one.uppercase.letter')}
                            </li>
                            <li
                              className={`flex items-center ${/[a-z]/.test(signupPassword) ? 'text-green-500' : 'text-gray-500'}`}
                            >
                              <span className="mr-2">
                                {/[a-z]/.test(signupPassword) ? '✓' : '○'}
                              </span>
                              {t('common.one.lowercase.letter')}
                            </li>
                            <li
                              className={`flex items-center ${/\d/.test(signupPassword) ? 'text-green-500' : 'text-gray-500'}`}
                            >
                              <span className="mr-2">
                                {/\d/.test(signupPassword) ? '✓' : '○'}
                              </span>
                              {t('common.one.number')}
                            </li>
                            <li
                              className={`flex items-center ${/[!@#$%^&*(),.?":{}|<>]/.test(signupPassword) ? 'text-green-500' : 'text-gray-500'}`}
                            >
                              <span className="mr-2">
                                {/[!@#$%^&*(),.?":{}|<>]/.test(signupPassword)
                                  ? '✓'
                                  : '○'}
                              </span>
                              {t('ui.one.special.character')}
                            </li>
                            <li
                              className={`flex items-center ${signupPassword.length >= 8 ? 'text-green-500' : 'text-gray-500'}`}
                            >
                              <span className="mr-2">
                                {signupPassword.length >= 8 ? '✓' : '○'}
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
                      value={signupForm.watch('confirmPassword')}
                      onChange={(e) =>
                        signupForm.setValue('confirmPassword', e.target.value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      className="pr-12 h-14 border-2 border-gray-200 focus:border-purple-500 rounded-xl text-lg bg-gray-50 focus:bg-white transition-all duration-300"
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
                    {signupForm.formState.errors.confirmPassword && (
                      <div className="text-xs text-red-500 mt-1 ml-1 font-medium">
                        {signupForm.formState.errors.confirmPassword.message}
                      </div>
                    )}
                  </div>

                  {/* Consent Checkbox */}
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <input
                      type="checkbox"
                      id="consent"
                      checked={signupForm.watch('has_given_consent')}
                      onChange={(e) =>
                        signupForm.setValue(
                          'has_given_consent',
                          e.target.checked as true,
                          {
                            shouldDirty: true,
                            shouldValidate: true,
                          },
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
                  {signupForm.formState.errors.has_given_consent && (
                    <div className="text-xs text-red-500 -mt-3 ml-1 font-medium">
                      {signupForm.formState.errors.has_given_consent.message}
                    </div>
                  )}

                  {/* Sign Up Button */}
                  <Button
                    onClick={() =>
                      void signupForm.handleSubmit(handleSignupSendOTP)()
                    }
                    disabled={loading || !signupForm.formState.isValid}
                    type="button"
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
                      OTP sent to +91{signupPhone}
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
                        type="button"
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
                        type="button"
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

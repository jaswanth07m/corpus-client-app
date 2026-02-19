import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { initiatePasswordReset, confirmPasswordReset } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const initiateSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
});

const confirmSchema = z
  .object({
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    otp_code: z.string().min(6, 'OTP must be 6 digits'),
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(
        /[^a-zA-Z0-9]/,
        'Password must contain at least one special character',
      ),
    confirm_password: z
      .string()
      .min(8, 'Confirm password must be at least 8 characters'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  });

const ForgotPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<'initiate' | 'confirm'>('initiate');
  const [isLoading, setIsLoading] = useState(false);

  const initiateForm = useForm<z.infer<typeof initiateSchema>>({
    resolver: zodResolver(initiateSchema),
    defaultValues: {
      phone: '',
    },
  });

  const confirmForm = useForm<z.infer<typeof confirmSchema>>({
    resolver: zodResolver(confirmSchema),
    defaultValues: {
      phone: '',
      otp_code: '',
      new_password: '',
      confirm_password: '',
    },
  });

  const onSubmitInitiate = async (values: z.infer<typeof initiateSchema>) => {
    setIsLoading(true);
    try {
      await initiatePasswordReset(values.phone);
      toast({
        title: 'OTP Sent',
        description: 'A one-time password has been sent to your phone.',
      });
      confirmForm.setValue('phone', values.phone);
      setStep('confirm');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        title: 'Error',
        description: errorMessage || 'Failed to send OTP.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitConfirm = async (values: z.infer<typeof confirmSchema>) => {
    setIsLoading(true);
    try {
      await confirmPasswordReset(
        values.phone,
        values.otp_code,
        values.new_password,
        values.confirm_password,
      );
      toast({
        title: 'Password Reset Successful',
        description: 'Your password has been reset successfully.',
      });
      // Redirect to login page after successful reset
      setTimeout(() => {
        navigate('/');
      }, 1200); // 1.2s delay for user to see toast
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        title: 'Error',
        description: errorMessage || 'Failed to reset password.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handler to allow only numbers and max 10 digits
  const handlePhoneInput = (e: React.FormEvent<HTMLInputElement>) => {
    let value = e.currentTarget.value.replace(/\D/g, '');
    if (value.length > 10) value = value.slice(0, 10);
    initiateForm.setValue('phone', value);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {t('auth.forgotPassword')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === 'initiate' ? (
            <Form {...initiateForm}>
              <form
                onSubmit={initiateForm.handleSubmit(onSubmitInitiate)}
                className="space-y-4"
              >
                <FormField
                  control={initiateForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth.phoneNumber')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium select-none">
                            {t('common.91')}
                          </span>
                          <Input
                            type="tel"
                            pattern="[0-9]*"
                            inputMode="numeric"
                            placeholder={t('auth.enterYourPhoneNumber')}
                            value={field.value}
                            maxLength={10}
                            onChange={(e) => {
                              let value = e.target.value.replace(/\D/g, '');
                              if (value.length > 10) value = value.slice(0, 10);
                              field.onChange(value);
                            }}
                            className="pl-14"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t('auth.sendOtp')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/')}
                >
                  {t('common.backToLogin')}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...confirmForm}>
              <form
                onSubmit={confirmForm.handleSubmit(onSubmitConfirm)}
                className="space-y-4"
              >
                <FormField
                  control={confirmForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your phone number"
                          {...field}
                          disabled
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={confirmForm.control}
                  name="otp_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth.otpCode')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('auth.enterOtp')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={confirmForm.control}
                  name="new_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth.newPassword')}</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder={t('auth.enterNewPassword')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                      <div className="text-xs text-gray-500 mt-1">
                        {t('auth.passwordMustBeAtLeast8CharactersAndContain')}
                        <ul className="list-disc list-inside ml-2">
                          <li>{t('common.one.uppercase.letter')}</li>
                          <li>{t('common.one.lowercase.letter')}</li>
                          <li>{t('common.one.number')}</li>
                          <li>{t('ui.one.special.character')}</li>
                        </ul>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={confirmForm.control}
                  name="confirm_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder={t('common.confirmNewPassword')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t('common.resetPassword')}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="w-full"
                  onClick={() => setStep('initiate')}
                  disabled={isLoading}
                >
                  {t('common.backToInitiate')}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;

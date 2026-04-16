import type { TFunction } from 'i18next';
import { z } from 'zod';

const phoneSchema = (t: TFunction) =>
  z
    .string()
    .length(10, t('auth.pleaseEnterAValid10digitPhoneNumber'))
    .refine((value) => /^[6-9]\d{9}$/.test(value), {
      message: t('auth.phoneNumberIsInvalid'),
    });

const usernameSchema = (t: TFunction) =>
  z
    .string()
    .trim()
    .min(3, t('auth.pleaseEnterAValidUsername'))
    .max(50, t('auth.pleaseEnterAValidUsername'))
    .regex(/^[A-Za-z0-9_]+$/, {
      message: t('auth.usernameShouldConsistOfCharactersUnderscoresDigitsOnly'),
    });

const nameSchema = (t: TFunction) =>
  z
    .string()
    .trim()
    .min(1, t('user.pleaseEnterYourName'))
    .regex(/^[A-Za-z\s]+$/, {
      message: t('user.nameShouldHaveCharactersOnly'),
    });

const emailSchema = (t: TFunction) =>
  z
    .string()
    .trim()
    .min(1, t('common.pleaseEnterAValidEmailAddress'))
    .email(t('common.pleaseEnterAValidEmailAddress'));

const placeSchema = (t: TFunction) =>
  z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^[A-Za-z\s,]+$/.test(value), {
      message: t('ui.place.should.have.characters.is.allowed'),
    });

const signupPasswordSchema = (t: TFunction) =>
  z.string().min(6, t('auth.passwordMustBeAtLeast6CharactersLong'));

export const createOtpLoginSchema = (t: TFunction) =>
  z.object({
    phone: phoneSchema(t),
  });

export const createPasswordLoginSchema = (t: TFunction) =>
  z.object({
    phone: phoneSchema(t),
    password: z.string().min(1, t('auth.enterYourPassword')),
  });

export const createSignupSchema = (t: TFunction) =>
  z
    .object({
      phone: phoneSchema(t),
      username: usernameSchema(t),
      name: nameSchema(t),
      email: emailSchema(t),
      gender: z.string().optional(),
      date_of_birth: z.string().optional(),
      current_place: placeSchema(t),
      password: signupPasswordSchema(t),
      confirmPassword: z.string().min(1, t('common.confirmPassword')),
      has_given_consent: z.literal(true, {
        errorMap: () => ({
          message: t('ui.please.agree.to.the.terms.and.conditions'),
        }),
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      path: ['confirmPassword'],
      message: t('common.passwordsDoNotMatch'),
    });

export const getSignupPasswordStrength = (password: string) => {
  if (!password) {
    return { label: 'empty', barClass: 'w-0', colorClass: 'text-gray-500' };
  }

  const isStrong =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(
      password,
    );
  if (isStrong) {
    return {
      label: 'strong',
      barClass: 'w-full bg-green-500',
      colorClass: 'text-green-500',
    };
  }

  const isMedium = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(password);
  if (isMedium) {
    return {
      label: 'medium',
      barClass: 'w-2/3 bg-yellow-500',
      colorClass: 'text-yellow-500',
    };
  }

  return {
    label: 'weak',
    barClass: 'w-1/3 bg-red-500',
    colorClass: 'text-red-500',
  };
};

export type OtpLoginFormValues = z.infer<
  ReturnType<typeof createOtpLoginSchema>
>;
export type PasswordLoginFormValues = z.infer<
  ReturnType<typeof createPasswordLoginSchema>
>;
export type SignupFormValues = z.infer<ReturnType<typeof createSignupSchema>>;

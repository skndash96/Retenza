'use client';

import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useRef } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import type { ConfirmationResult } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { toast } from 'react-toastify';

const phoneNumberSchema = z.string().regex(/^(\+?\d{1,3})?[-.\s]?(\(?\d{1,4}\)?)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/, "Invalid phone number format.");
const customerSignupSchema = z.object({
  phone_number: phoneNumberSchema,
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  confirmPassword: z.string().min(8, 'Please confirm your password.'),
  otp: z.string().min(6, 'OTP must be 6 digits.'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof customerSignupSchema>;

export default function CustomerSignup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const recaptchaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (recaptchaRef.current && !recaptchaVerifier) {
      const verifier = new RecaptchaVerifier(auth, recaptchaRef.current, { size: 'invisible' });
      setRecaptchaVerifier(verifier);
    }
  }, [recaptchaRef, recaptchaVerifier]);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(customerSignupSchema),
    defaultValues: {
      phone_number: '',
      password: '',
      confirmPassword: '',
      otp: '',
    },
  });

  const phoneNumber = watch('phone_number');

  const handleSendOtp = async () => {
    setLoading(true);
    setServerError(null);

    if (!recaptchaVerifier) {
      toast.error('reCAPTCHA is not initialized. Please refresh the page.');
      setServerError("reCAPTCHA is not initialized. Please refresh the page.");
      setLoading(false);
      return;
    }
    
    const parsedPhoneNumber = parsePhoneNumberFromString(phoneNumber, 'IN');
    if (!parsedPhoneNumber?.isValid()) {
      toast.error('Invalid phone number. Please enter a valid Indian number.');
      setServerError('Invalid phone number. Please enter a valid Indian number.');
      setLoading(false);
      return;
    }

    const formattedPhoneNumber = parsedPhoneNumber.number as string;

try {
  const result = await signInWithPhoneNumber(auth, formattedPhoneNumber, recaptchaVerifier);
  setConfirmationResult(result);
  setOtpSent(true);
  setServerError(null);
  toast.success('OTP has been sent to your phone number!');
} catch (error: unknown) {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const firebaseError = error as { code: string };

    if (firebaseError.code === 'auth/invalid-phone-number') {
      toast.error('Invalid phone number format. Please ensure it is a valid 10-digit number.');
      setServerError('Invalid phone number format. Please ensure it is a valid 10-digit number.');
    } else {
      toast.error('Failed to send OTP. Please try again.');
      setServerError('Failed to send OTP. Please check your phone number and try again.');
    }
  } else {
    toast.error('An unexpected error occurred. Please try again.');
    setServerError('An unexpected error occurred. Please try again.');
  }
} finally {
  setLoading(false);
}
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setServerError(null);

    if (!confirmationResult) {
      toast.error('Please send and verify the OTP first.');
      setServerError('Please send and verify the OTP first.');
      setLoading(false);
      return;
    }

    try {
      await confirmationResult.confirm(data.otp);
      
      const firebaseUser = auth.currentUser;
      const firebaseIdToken = await firebaseUser!.getIdToken();

      const res = await fetch('/api/signup/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, firebaseIdToken }),
      });

      if (!res.ok) {
        const errorData = await res.json() as { error?: string; details?: string };
        toast.error(errorData.error ?? errorData.details ?? 'An unknown error occurred. Please try again.');
        setServerError(errorData.error ?? errorData.details ?? 'An unknown error occurred.');
      } else {
        toast.success('Signup successful! Redirecting to login...');
        router.push('/login/customer');
      }
    } catch {
      toast.error('Invalid OTP or an unexpected error occurred.');
      setServerError('Invalid OTP or an unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center bg-gradient-to-b from-white via-slate-50 to-amber-50 px-4 font-sans">
      <div className="max-w-5xl bg-white/80 backdrop-blur-md shadow-xl rounded-2xl overflow-hidden border border-amber-200 ">
        
        <div className="p-8 sm:p-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-amber-700">Welcome to Retenza</h2>
          </div>

          <p className="text-sm sm:text-base text-amber-600 mb-6">Sign up for your customer account</p>
          {serverError && <p className="mb-4 text-sm text-red-600">{serverError}</p>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {!otpSent ? (
              <>
                <div>
                  <label htmlFor="phone_number" className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                  <input id="phone_number" type="tel" {...register('phone_number')} className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  {errors.phone_number && <p className="mt-1 text-sm text-red-600">{errors.phone_number.message}</p>}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input id="password" type="password" {...register('password')} className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                  <input id="confirmPassword" type="password" {...register('confirmPassword')} className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
                </div>

                <button type="button" onClick={handleSendOtp} disabled={loading} className="w-full px-4 py-2 bg-amber-600 text-white font-semibold rounded-md hover:bg-amber-700 disabled:opacity-50">
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
                <div className="flex flex-col items-center">
                  <p className="text-lg font-semibold text-amber-700">Already have an account?</p>
                  <p className="text-sm mt-2 text-slate-600">
                    <a href="/login/customer" className="text-amber-600 font-medium hover:underline">Log in here</a> and start earning rewards.
                  </p>
                </div>
              </>
            ) : (
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-slate-700 mb-1">OTP</label>
                <input id="otp" type="text" {...register('otp')} className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400" />
                {errors.otp && <p className="mt-1 text-sm text-red-600">{errors.otp.message}</p>}

                <button type="submit" disabled={loading} className="w-full px-4 py-2 bg-amber-600 text-white font-semibold rounded-md hover:bg-amber-700 disabled:opacity-50 mt-4">
                  {loading ? 'Verifying...' : 'Verify OTP & Sign Up'}
                </button>
              </div>
            )}
            <div ref={recaptchaRef} id="recaptcha-container"></div>
          </form>
        </div>

      </div>
    </div>
  );
}

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
import { motion } from 'framer-motion';
import { User, Phone, Lock, Shield, CheckCircle } from 'lucide-react';

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

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

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

  const { register, handleSubmit, formState: { errors }, watch, getValues } = useForm<FormData>({
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

    // Get current form values
    const currentValues = getValues();

    // Validate password fields before sending OTP
    if (!currentValues.password || !currentValues.confirmPassword) {
      toast.error('Please fill in both password fields.');
      setServerError('Please fill in both password fields.');
      setLoading(false);
      return;
    }

    if (currentValues.password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      setServerError('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    if (currentValues.password !== currentValues.confirmPassword) {
      toast.error('Passwords do not match. Please check and try again.');
      setServerError('Passwords do not match. Please check and try again.');
      setLoading(false);
      return;
    }

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
      console.error('Error during signInWithPhoneNumber:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                <img
                  src="/icon-512.png"
                  alt="Retenza Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xl font-bold text-gray-900">RETENZA</span>
            </div>
            <button
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </motion.header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        <motion.div
          initial="hidden"
          animate="show"
          variants={container}
          className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12"
        >
          <motion.div variants={fadeUp} className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Retenza</h1>
              <p className="text-gray-600">Start earning rewards and unlocking exclusive benefits</p>
            </div>

            {serverError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
              >
                {serverError}
              </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {!otpSent ? (
                <>
                  <motion.div variants={fadeUp}>
                    <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Phone Number
                    </label>
                    <input
                      id="phone_number"
                      type="tel"
                      {...register('phone_number')}
                      placeholder="Enter your phone number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                    {errors.phone_number && (
                      <p className="mt-2 text-sm text-red-600">{errors.phone_number.message}</p>
                    )}
                  </motion.div>

                  <motion.div variants={fadeUp}>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      <Lock className="w-4 h-4 inline mr-2" />
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      {...register('password')}
                      placeholder="Create a strong password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                    {errors.password && (
                      <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
                    )}
                  </motion.div>

                  <motion.div variants={fadeUp}>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      <Shield className="w-4 h-4 inline mr-2" />
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      {...register('confirmPassword')}
                      placeholder="Confirm your password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                    {errors.confirmPassword && (
                      <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p>
                    )}
                  </motion.div>

                  <motion.button
                    variants={fadeUp}
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {loading ? 'Sending OTP...' : 'Send OTP'}
                  </motion.button>
                </>
              ) : (
                <motion.div variants={fadeUp}>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                    Enter OTP
                  </label>
                  <input
                    id="otp"
                    type="text"
                    {...register('otp')}
                    placeholder="Enter 6-digit OTP"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-center text-lg tracking-widest"
                  />
                  {errors.otp && (
                    <p className="mt-2 text-sm text-red-600">{errors.otp.message}</p>
                  )}

                  <motion.button
                    variants={fadeUp}
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] mt-4"
                  >
                    {loading ? 'Verifying...' : 'Verify OTP & Sign Up'}
                  </motion.button>
                </motion.div>
              )}

              <div ref={recaptchaRef} id="recaptcha-container"></div>
            </form>

            <motion.div variants={fadeUp} className="mt-8 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => router.push('/login/customer')}
                  className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
                >
                  Log in here
                </button>
              </p>
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:flex flex-1 bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-12 items-center justify-center"
        >
          <div className="max-w-md">
            <h2 className="text-3xl font-bold mb-6">Why Join Retenza?</h2>
            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Instant Rewards</h3>
                  <p className="text-indigo-100 text-sm">Get welcome bonus and start earning points immediately</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Exclusive Benefits</h3>
                  <p className="text-indigo-100 text-sm">Unlock VIP perks and personalized experiences</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Secure & Private</h3>
                  <p className="text-indigo-100 text-sm">Your data is protected with enterprise-grade security</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useState, useEffect, useRef } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import type { ConfirmationResult } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { BusinessInfoForm } from '@/components/BusinessInfoForm';
import { LoyaltyProgramForm } from '@/components/LoyaltyProgramForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { Star, Building2, CheckCircle, Users, Gift, Target } from 'lucide-react';

const phoneNumberSchema = z.string().regex(/^(\+?\d{1,3})?[-.\s]?(\(?\d{1,4}\)?)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/, "Invalid phone number format.");
const businessInfoSchema = z.object({
  name: z.string().min(2, 'Business name is required.'),
  phone_number: phoneNumberSchema,
  contact_number_2: phoneNumberSchema.optional().or(z.literal('')),
  address: z.string().min(5, 'Address is required.'),
  business_type: z.string().min(1, 'Business type is required.'),
  email: z.string().email('Please enter a valid email address.').optional().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  confirmPassword: z.string().min(8, 'Please confirm your password.'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"],
});

type BusinessInfoData = z.infer<typeof businessInfoSchema>;
type LoyaltyProgramData = Record<string, unknown>;

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function BusinessSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [businessData, setBusinessData] = useState<BusinessInfoData | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const recaptchaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (recaptchaRef.current && !recaptchaVerifier) {
      const verifier = new RecaptchaVerifier(auth, recaptchaRef.current, { size: 'invisible' });
      setRecaptchaVerifier(verifier);
    }
  }, [recaptchaRef, recaptchaVerifier]);

  const handleInfoSubmit = async (data: BusinessInfoData) => {
    setInfoLoading(true);
    setError(null);

    try {
      // Validate password fields before sending OTP
      if (!data.password || !data.confirmPassword) {
        const errorMessage = 'Please fill in both password fields.';
        setError(errorMessage);
        toast.error(errorMessage);
        setInfoLoading(false);
        return;
      }

      if (data.password.length < 8) {
        const errorMessage = 'Password must be at least 8 characters long.';
        setError(errorMessage);
        toast.error(errorMessage);
        setInfoLoading(false);
        return;
      }

      if (data.password !== data.confirmPassword) {
        const errorMessage = 'Passwords do not match. Please check and try again.';
        setError(errorMessage);
        toast.error(errorMessage);
        setInfoLoading(false);
        return;
      }

      const parsedPhoneNumber = parsePhoneNumberFromString(data.phone_number, 'IN');
      if (!parsedPhoneNumber?.isValid()) {
        const errorMessage = 'Invalid phone number. Please enter a valid Indian number.';
        setError(errorMessage);
        toast.error(errorMessage);
        setInfoLoading(false);
        return;
      }
      const formattedPhoneNumber = parsedPhoneNumber.number as string;

      const confirmation = await signInWithPhoneNumber(auth, formattedPhoneNumber, recaptchaVerifier!);
      setConfirmationResult(confirmation);
      setBusinessData(data);
      setStep(1.5);
      toast.success('OTP sent! Please check your phone.');
    } catch (err: unknown) {
      const errorMessage = (err as Error)?.message ?? 'Failed to send OTP. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setInfoLoading(false);
    }
  };

  const handleOtpSubmit = async (otp: string) => {
    setOtpLoading(true);
    setError(null);
    try {
      if (!confirmationResult) throw new Error("OTP verification flow broken.");
      await confirmationResult.confirm(otp);

      const firebaseUser = auth.currentUser;
      const firebaseIdToken = await firebaseUser!.getIdToken();

      if (!businessData) throw new Error("Business data is missing.");

      const res = await fetch('/api/signup/business/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...businessData, firebaseIdToken }),
      });

      const result = await res.json() as { error?: string };
      if (!res.ok) {
        const errorMessage = result.error ?? 'Something went wrong during business info setup.';
        toast.error(errorMessage);
        setError(errorMessage);
      } else {
        toast.success('Phone verified! Proceeding to loyalty setup.');
        setStep(2);
      }
    } catch (err: unknown) {
      const errorMessage = (err as Error)?.message ?? 'Failed to verify OTP.';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleLoyaltySubmit = async (data: LoyaltyProgramData) => {
    setLoyaltyLoading(true);
    setError(null);
    try {
      if (!businessData) throw new Error("Business data is missing.");

      const res = await fetch('/api/signup/business/loyalty-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json() as { error?: string };
      if (!res.ok) {
        const errorMessage = result.error ?? 'Something went wrong during loyalty program setup.';
        toast.error(errorMessage);
        setError(errorMessage);
      } else {
        toast.success('Loyalty program created! Redirecting to dashboard.');
        router.push('/business');
      }
    } catch {
      const errorMessage = 'Failed to complete loyalty setup. Please try again.';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoyaltyLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return 'Business & Login Info';
      case 1.5:
        return 'Verify Phone Number';
      case 2:
        return 'Loyalty Program Setup';
      default:
        return 'Business Setup';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 1:
        return 'Step 1 of 2: Enter your business details and create your account';
      case 1.5:
        return 'Step 1.5 of 2: Verify your phone number with the OTP sent';
      case 2:
        return 'Step 2 of 2: Configure your loyalty program settings';
      default:
        return 'Complete your business setup';
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
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
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
          <motion.div variants={fadeUp} className="w-full max-w-2xl">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Setup</h1>
              <p className="text-gray-600">Create your business account and loyalty program</p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                  1
                </div>
                <div className={`w-16 h-1 ${step >= 1.5 ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}></div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${step >= 1.5 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                  1.5
                </div>
                <div className={`w-16 h-1 ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}></div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                  2
                </div>
              </div>
            </div>

            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl text-gray-900">{getStepTitle()}</CardTitle>
                <CardDescription className="text-gray-600">{getStepDescription()}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {step === 1 ? (
                  <BusinessInfoForm
                    onSubmit={handleInfoSubmit}
                    isLoading={infoLoading}
                    schema={businessInfoSchema}
                  />
                ) : step === 1.5 ? (
                  <OtpVerificationForm
                    onVerify={handleOtpSubmit}
                    isLoading={otpLoading}
                  />
                ) : (
                  <LoyaltyProgramForm
                    onSubmit={handleLoyaltySubmit}
                    onBack={() => setStep(1)}
                    isLoading={loyaltyLoading}
                  />
                )}

                <div ref={recaptchaRef} id="recaptcha-container"></div>
              </CardContent>
            </Card>

            <motion.div variants={fadeUp} className="mt-8 text-center">
              <p className="text-gray-600">
                Already have a business account?{' '}
                <button
                  onClick={() => router.push('/login/business')}
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
            <h2 className="text-3xl font-bold mb-6">Why Choose Retenza?</h2>
            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Customer Retention</h3>
                  <p className="text-indigo-100 text-sm">Turn one-time visitors into loyal, repeat customers</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Smart Rewards</h3>
                  <p className="text-indigo-100 text-sm">Automated loyalty programs that drive engagement</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Data Insights</h3>
                  <p className="text-indigo-100 text-sm">Understand your customers and optimize your business</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

const OtpVerificationForm = ({ onVerify, isLoading }: { onVerify: (otp: string) => void; isLoading: boolean }) => {
  const [otp, setOtp] = useState('');

  return (
    <motion.div variants={fadeUp} className="space-y-6">
      <div>
        <Label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
          <CheckCircle className="w-4 h-4 inline mr-2" />
          Enter OTP
        </Label>
        <Input
          id="otp"
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          disabled={isLoading}
          placeholder="Enter 6-digit OTP"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-center text-lg tracking-widest"
        />
      </div>
      <Button
        type="button"
        onClick={() => onVerify(otp)}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        disabled={isLoading || otp.length !== 6}
      >
        {isLoading ? 'Verifying...' : 'Verify OTP'}
      </Button>
    </motion.div>
  );
};
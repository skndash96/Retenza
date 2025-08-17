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

const phoneNumberSchema = z.string().regex(/^(\+?\d{1,3})?[-.\s]?(\(?\d{1,4}\)?)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/, "Invalid phone number format.");
const businessInfoSchema = z.object({
  name: z.string().min(2, 'Business name is required.'),
  phone_number: phoneNumberSchema,
  contact_number_2: phoneNumberSchema.optional().or(z.literal('')),
  address: z.string().min(5, 'Address is required.'),
  business_type: z.string().min(1, 'Business type is required.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  confirmPassword: z.string().min(8, 'Please confirm your password.'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"],
});

type BusinessInfoData = z.infer<typeof businessInfoSchema>;
type LoyaltyProgramData = any; 

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
         } catch (_err) {
       const errorMessage = 'Failed to complete loyalty setup. Please try again.';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoyaltyLoading(false); 
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <Card className="w-full max-w-lg md:max-w-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">First-Time Business Setup</CardTitle>
          <CardDescription className="text-center">
            {step === 1 ? 'Step 1 of 2: Business & Login Info' : step === 1.5 ? 'Verify Phone Number' : 'Step 2 of 2: Loyalty Program'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
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
    </div>
  );
}

const OtpVerificationForm = ({ onVerify, isLoading }: { onVerify: (otp: string) => void; isLoading: boolean }) => {
  const [otp, setOtp] = useState('');
  return (
    <form onSubmit={(e) => { e.preventDefault(); onVerify(otp); }} className="space-y-4">
      <div>
        <Label htmlFor="otp">OTP</Label>
        <Input id="otp" type="text" value={otp} onChange={(e) => setOtp(e.target.value)} disabled={isLoading} />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Verifying...' : 'Verify OTP'}
      </Button>
    </form>
  );
};
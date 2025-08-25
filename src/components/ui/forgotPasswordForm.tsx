'use client';

import { useState, useRef, useEffect } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { toast } from 'react-toastify';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Phone, Lock, Eye, EyeOff } from 'lucide-react';

interface ForgotPasswordFormProps {
    onBack: () => void;
    userType: 'customer' | 'business';
}

export default function ForgotPasswordForm({ onBack, userType }: ForgotPasswordFormProps) {
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [step, setStep] = useState<'phone' | 'otp' | 'password'>('phone');
    const [loading, setLoading] = useState(false);

    const [countdown, setCountdown] = useState(0);
    const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
    const confirmationRef = useRef<{ confirm: (code: string) => Promise<any> } | null>(null);

    useEffect(() => {
        // Initialize reCAPTCHA
        if (typeof window !== 'undefined' && !recaptchaVerifierRef.current) {
            recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
                size: 'invisible',
                callback: () => {
                    // reCAPTCHA solved, allow sending OTP
                }
            });
        }
    }, []);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleSendOtp = async () => {
        if (!phone.trim()) {
            toast.error('Please enter your phone number');
            return;
        }

        const phoneNumber = parsePhoneNumberFromString(phone, 'IN');
        if (!phoneNumber?.isValid()) {
            toast.error('Please enter a valid phone number');
            return;
        }

        const formattedPhone = phoneNumber.format('E.164');

        try {
            setLoading(true);

            if (!recaptchaVerifierRef.current) {
                throw new Error('reCAPTCHA not initialized');
            }

            const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifierRef.current);

            // Store confirmation in ref and phone/userType in sessionStorage
            confirmationRef.current = confirmation;
            sessionStorage.setItem('passwordResetConfirmation', JSON.stringify({
                phone: formattedPhone,
                userType: userType
            }));


            setStep('otp');
            setCountdown(60); // 60 second countdown
            toast.success('OTP sent successfully!');

            // Reset reCAPTCHA
            if (recaptchaVerifierRef.current) {
                recaptchaVerifierRef.current.clear();
                recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
                    size: 'invisible',
                    callback: () => {
                        // reCAPTCHA callback
                    }
                });
            }
        } catch (error) {
            console.error('Error sending OTP:', error);
            toast.error('Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp.trim() || otp.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP');
            return;
        }

        try {
            setLoading(true);

            // Verify OTP using the stored confirmation
            if (!confirmationRef.current) {
                toast.error('Session expired. Please try again.');
                setStep('phone');
                return;
            }

            // Verify OTP
            if (confirmationRef.current && typeof confirmationRef.current.confirm === 'function') {
                await confirmationRef.current.confirm(otp);
            } else {
                throw new Error('Invalid confirmation object');
            }

            // OTP verified, move to password step
            setStep('password');
            toast.success('OTP verified successfully!');

        } catch (error) {
            console.error('Error verifying OTP:', error);
            toast.error('Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword.trim() || newPassword.length < 8) {
            toast.error('Password must be at least 8 characters long');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        try {
            setLoading(true);

            const storedData = sessionStorage.getItem('passwordResetConfirmation');
            if (!storedData) {
                toast.error('Session expired. Please try again.');
                setStep('phone');
                return;
            }

            const { phone, userType: storedUserType } = JSON.parse(storedData);

            // Call API to reset password
            const response = await fetch(`/api/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone,
                    newPassword,
                    userType: storedUserType
                }),
            });

            if (response.ok) {
                toast.success('Password reset successfully!');
                // Clear session storage
                sessionStorage.removeItem('passwordResetConfirmation');
                // Go back to login
                onBack();
            } else {
                const errorData = await response.json();
                toast.error(errorData.error ?? 'Failed to reset password');
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            toast.error('Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = () => {
        if (countdown > 0) return;
        setStep('phone');
        setOtp('');
    };

    const renderPhoneStep = () => (
        <div className="space-y-4">
            <div>
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Phone Number
                </Label>
                <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter your phone number"
                        className="pl-10"
                        disabled={loading}
                    />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                    We&apos;ll send a verification code to this number
                </p>
            </div>

            <div id="recaptcha-container"></div>

            <Button
                onClick={handleSendOtp}
                disabled={loading || !phone.trim()}
                className="w-full"
            >
                {loading ? 'Sending...' : 'Send OTP'}
            </Button>
        </div>
    );

    const renderOtpStep = () => (
        <div className="space-y-4">
            <div>
                <Label htmlFor="otp" className="text-sm font-medium text-gray-700">
                    Verification Code
                </Label>
                <Input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    className="text-center text-lg tracking-widest"
                    maxLength={6}
                    disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                    Enter the 6-digit code sent to {phone}
                </p>
            </div>

            <Button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 6}
                className="w-full"
            >
                {loading ? 'Verifying...' : 'Verify OTP'}
            </Button>

            <div className="text-center">
                <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={countdown > 0}
                    className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                >
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                </button>
            </div>
        </div>
    );

    const renderPasswordStep = () => (
        <div className="space-y-4">
            <div>
                <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                    New Password
                </Label>
                <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        id="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="pl-10 pr-10"
                        disabled={loading}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                        {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                    Password must be at least 8 characters long
                </p>
            </div>

            <div>
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirm New Password
                </Label>
                <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="pl-10 pr-10"
                        disabled={loading}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                    </button>
                </div>
            </div>

            <Button
                onClick={handleResetPassword}
                disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                className="w-full"
            >
                {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
        </div>
    );

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
                <button
                    onClick={onBack}
                    className="absolute left-4 top-4 text-gray-400 hover:text-gray-600"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <CardTitle className="text-xl font-semibold">
                    {step === 'phone' && 'Forgot Password'}
                    {step === 'otp' && 'Verify OTP'}
                    {step === 'password' && 'Reset Password'}
                </CardTitle>
                <CardDescription>
                    {step === 'phone' && `Reset your ${userType} account password`}
                    {step === 'otp' && 'Enter the verification code sent to your phone'}
                    {step === 'password' && 'Enter your new password'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {step === 'phone' && renderPhoneStep()}
                {step === 'otp' && renderOtpStep()}
                {step === 'password' && renderPasswordStep()}
            </CardContent>
        </Card>
    );
} 
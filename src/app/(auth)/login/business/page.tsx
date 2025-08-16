'use client';
import Link from 'next/link';
import LoginForm from '@/components/ui/loginForm';
import { useRouter } from 'next/navigation';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { toast } from 'react-toastify';

export default function BusinessLogin() {
  const router = useRouter();

  const handleLogin = async (data: { phone: string; password: string }) => {
    const phoneNumber = parsePhoneNumberFromString(data.phone, 'IN');
    let formattedPhone = data.phone;
  
    if (phoneNumber && phoneNumber.isValid()) {
      formattedPhone = phoneNumber.format('E.164');
    } else {
      toast.error('Invalid phone number format.');
      return;
    }

    const res = await fetch('/api/login/business', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: formattedPhone, password: data.password }),
    });

    if (res.ok) {
      toast.success('Login successful! Redirecting...');
      router.push('/business');
    } else {
      const errorData = await res.json();
      toast.error(errorData.error || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center bg-gradient-to-b from-white via-slate-50 to-amber-50 px-4 font-sans">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-md shadow-xl rounded-2xl overflow-hidden border border-amber-200">
        
        <div className="p-8 sm:p-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-amber-700">
              Welcome Back
            </h2>
          </div>

          <p className="text-sm sm:text-base text-amber-600 mb-6">
            Login to your business dashboard
          </p>

          <LoginForm onLogin={handleLogin} />

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Don't have an account ?{' '}
              <Link
                href="/signup/business"
                className="text-amber-600 font-medium hover:underline"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
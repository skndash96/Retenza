'use client';
import Link from 'next/link';
import LoginForm from '@/components/ui/loginForm';
import ForgotPasswordForm from '@/components/ui/forgotPasswordForm';
import { useRouter } from 'next/navigation';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { Building2, BarChart3, Users, Target } from 'lucide-react';
import { useState } from 'react';

export default function BusinessLogin() {
  const router = useRouter();
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleLogin = async (data: { phone: string; password: string }) => {
    const phoneNumber = parsePhoneNumberFromString(data.phone, 'IN');
    let formattedPhone = data.phone;

    if (phoneNumber?.isValid()) {
      formattedPhone = phoneNumber.format('E.164');
    } else {
      toast.error('Invalid phone number format.');
      return;
    }

    try {
      const res = await fetch('/api/login/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone, password: data.password }),
      });

      if (res.ok) {
        toast.success('Login successful! Redirecting...');
        router.push('/business');
      } else {
        const errorData = await res.json() as { error?: string };
        toast.error(errorData.error ?? 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('An unexpected error occurred. Please try again.');
    }
  };

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
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
          {showForgotPassword ? (
            <ForgotPasswordForm
              onBack={() => setShowForgotPassword(false)}
              userType="business"
            />
          ) : (
            <motion.div variants={fadeUp} className="w-full max-w-md">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Dashboard</h1>
                <p className="text-gray-600">Access your business analytics and customer insights</p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-8 border border-gray-100">
                <LoginForm onLogin={handleLogin} onForgotPassword={() => setShowForgotPassword(true)} />

                <motion.div variants={fadeUp} className="mt-8 text-center">
                  <p className="text-gray-600">
                    Don&apos;t have a business account?{' '}
                    <Link
                      href="/signup/business"
                      className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
                    >
                      Sign up here
                    </Link>
                  </p>
                </motion.div>
              </div>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:flex flex-1 bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-12 items-center justify-center"
        >
          <div className="max-w-md">
            <h2 className="text-3xl font-bold mb-6">Welcome Back to Your Business!</h2>
            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Analytics Dashboard</h3>
                  <p className="text-indigo-100 text-sm">View customer insights, sales data, and loyalty program performance</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Customer Management</h3>
                  <p className="text-indigo-100 text-sm">Manage your customer base and loyalty program settings</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Campaign Tools</h3>
                  <p className="text-indigo-100 text-sm">Launch promotions and engage your customers effectively</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
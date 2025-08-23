'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import {
  User,
  Calendar,
  Heart,
  Sparkles,
  CheckCircle,
  Gift,
  Edit3,
  Phone,
  Star,
  Award,
  MapPin
} from 'lucide-react';

interface CustomerProfileFormProps {
  user: {
    id: number;
    phone_number: string;
    name: string | null;
    gender: string | null;
    dob: Date | null;
    anniversary: Date | null;
    is_setup_complete: boolean;
  };
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};



export default function CustomerProfileForm({ user }: CustomerProfileFormProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name ?? '');
  const [gender, setGender] = useState(user.gender ?? '');
  const [dob, setDob] = useState(user.dob ? new Date(user.dob).toISOString().split('T')[0] : '');
  const [anniversary, setAnniversary] = useState(user.anniversary ? new Date(user.anniversary).getTime() : '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/customer/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          gender,
          dob: dob ? new Date(dob).getTime() : null,
          anniversary: anniversary ? new Date(anniversary).getTime() : null,
        }),
      });

      const data = await response.json() as { error?: string };

      if (response.ok) {
        setMessage('Profile updated successfully!');
        setIsEditing(false);
        setTimeout(() => {
          router.push('/customer');
          router.refresh();
        }, 1500);
      } else {
        setMessage(data?.error ?? 'Failed to save profile. Please try again.');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage('Failed to save profile. An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAge = (date: Date | null) => {
    if (!date) return null;
    const today = new Date();
    const birthDate = new Date(date);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6 shadow-xl">
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            My Profile
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Manage your personal information and preferences
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Card */}
          <motion.div variants={fadeUp} transition={{ delay: 0.1 }} className="lg:col-span-2">
            <Card className="border-0 shadow-xl bg-white rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold">Personal Information</CardTitle>
                    <CardDescription className="text-slate-300 mt-1">
                      Your account details and preferences
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="border-white/30 text-white hover:bg-white/20 hover:border-white/50 bg-transparent"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    {isEditing ? 'Cancel' : 'Edit'}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {!isEditing ? (
                  // Display Mode
                  <div className="space-y-6">
                    {/* Name & Phone */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                          <User className="w-4 h-4 text-blue-600" />
                          Full Name
                        </div>
                        <div className="text-lg font-semibold text-slate-900">
                          {user.name ?? 'Not provided'}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                          <Phone className="w-4 h-4 text-green-600" />
                          Phone Number
                        </div>
                        <div className="text-lg font-semibold text-slate-900">
                          {user.phone_number}
                        </div>
                      </div>
                    </div>

                    {/* Gender & Age */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                          <Heart className="w-4 h-4 text-pink-600" />
                          Gender
                        </div>
                        <div className="text-lg font-semibold text-slate-900">
                          {user.gender ?? 'Not specified'}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                          <Calendar className="w-4 h-4 text-purple-600" />
                          Age
                        </div>
                        <div className="text-lg font-semibold text-slate-900">
                          {getAge(user.dob) ? `${getAge(user.dob)} years` : 'Not provided'}
                        </div>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          Date of Birth
                        </div>
                        <div className="text-lg font-semibold text-slate-900">
                          {formatDate(user.dob)}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                          <Heart className="w-4 h-4 text-red-600" />
                          Anniversary
                        </div>
                        <div className="text-lg font-semibold text-slate-900">
                          {formatDate(user.anniversary)}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Edit Mode
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                          Full Name
                        </Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="Enter your full name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          disabled={isSaving}
                          className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender" className="text-sm font-medium text-slate-700">
                          Gender
                        </Label>
                        <Select value={gender} onValueChange={setGender} disabled={isSaving}>
                          <SelectTrigger className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-100">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="dob" className="text-sm font-medium text-slate-700">
                          Date of Birth
                        </Label>
                        <Input
                          id="dob"
                          type="date"
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          disabled={isSaving}
                          className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="anniversary" className="text-sm font-medium text-slate-700">
                          Anniversary Date
                        </Label>
                        <Input
                          id="anniversary"
                          type="date"
                          value={anniversary ? new Date(anniversary).toISOString().split('T')[0] : ''}
                          onChange={(e) => setAnniversary(e.target.value ? new Date(e.target.value).getTime() : '')}
                          disabled={isSaving}
                          className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        disabled={isSaving}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>

                    {message && (
                      <div className={`p-3 rounded-lg border ${message.includes('successfully')
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                        }`}>
                        <div className="flex items-center gap-2">
                          {message.includes('successfully') ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">!</span>
                            </div>
                          )}
                          <span className="text-sm">{message}</span>
                        </div>
                      </div>
                    )}
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar Cards */}
          <motion.div variants={fadeUp} transition={{ delay: 0.2 }} className="space-y-6">
            {/* Account Status */}
            <Card className="border-0 shadow-lg bg-white rounded-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Account Status
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Profile Complete</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.is_setup_complete
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {user.is_setup_complete ? 'Complete' : 'Incomplete'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Member Since</span>
                    <span className="text-sm font-medium text-slate-900">
                      {new Date().getFullYear()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg bg-white rounded-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                    onClick={() => router.push('/customer')}
                  >
                    <Star className="w-4 h-4 mr-2 text-yellow-500" />
                    View Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                    onClick={() => router.push('/customer/missions')}
                  >
                    <Award className="w-4 h-4 mr-2 text-purple-500" />
                    Browse Missions
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                    onClick={() => router.push('/customer/shops')}
                  >
                    <MapPin className="w-4 h-4 mr-2 text-green-500" />
                    Find Shops
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card className="border-0 shadow-lg bg-white rounded-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Your Benefits
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Personalized offers</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Birthday rewards</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Exclusive missions</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Loyalty points</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
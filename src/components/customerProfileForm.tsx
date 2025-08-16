'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

export default function CustomerProfileForm({ user }: CustomerProfileFormProps) {
  const router = useRouter();

  const [name, setName] = useState(user.name || '');
  const [gender, setGender] = useState(user.gender || '');
  const [dob, setDob] = useState(user.dob ? new Date(user.dob).toISOString().split('T')[0] : '');
  const [anniversary, setAnniversary] = useState(user.anniversary ? new Date(user.anniversary).toISOString().split('T')[0] : '');
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

      const data = await response.json();

      if (response.ok) {
        setMessage('Profile updated successfully!');
        router.push('/customer');
        router.refresh(); 
      } else {
        setMessage(data.error || 'Failed to save profile. Please try again.');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage('Failed to save profile. An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full max-w-lg p-6 rounded-xl shadow-lg border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-yellow-50">
    <CardHeader className="text-center">
      <CardTitle className="text-3xl font-bold ">
        Complete Your Profile
      </CardTitle>
      <CardDescription className="text-amber-700/80">
        Please provide the following details to complete your profile setup.
      </CardDescription>
    </CardHeader>
    <CardContent>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSaving}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select value={gender} onValueChange={setGender} disabled={isSaving}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select your gender" />
                </SelectTrigger>
                <SelectContent position="popper" className="z-50 bg-white shadow-lg border border-gray-200 rounded-md">
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                disabled={isSaving}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="anniversary">Anniversary Date (Optional)</Label>
              <Input
                id="anniversary"
                type="date"
                value={anniversary}
                onChange={(e) => setAnniversary(e.target.value)}
                disabled={isSaving}
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 text-white font-semibold hover:opacity-90 transition" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Profile'}
            </Button>
            {message && (
              <p className={`mt-4 text-center ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </p>
            )}
          </form>
    </CardContent>
</Card>

  );
}
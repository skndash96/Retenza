'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useAuthSession } from '@/hooks/useAuthSession';
import { toast } from 'react-toastify';

interface Campaign {
  id: number;
  business_id: number;
  title: string;
  description: string;
  applicable_tiers: string[];
  expires_at: string;
}

export default function MissionsPage() {
  const { user, role, loading } = useAuthSession();
  const router = useRouter();
  const [missions, setMissions] = useState<Campaign[]>([]);
  const [missionsLoading, setMissionsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || role !== 'user')) {
      toast.info('Please log in to view your missions.');
      router.push('/login/customer');
    }
  }, [loading, user, role, router]);

  useEffect(() => {
    if (user && role === 'user') {
      const fetchMissions = async () => {
        setMissionsLoading(true);
        try {
          const response = await fetch('/api/customer/missions');
          if (!response.ok) {
            toast.error('Failed to load missions');
            throw new Error('Failed to fetch missions.');
          }
          const data = await response.json();
          toast.success('Missions loaded successfully');
          setMissions(data);
        } catch (err: any) {
          toast.error(err.message || 'Error loading missions');
          setError(err.message);
        } finally {
          setMissionsLoading(false);
        }
      };

      fetchMissions();
    }
  }, [user, role]);

  if (loading || missionsLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[calc(100vh-64px)]">
        <p className="text-xl text-gray-700">Loading missions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full min-h-[calc(100vh-64px)]">
        <p className="text-xl text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (!user || role !== 'user') {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Your Available Missions</h1>

      {missions.length === 0 ? (
        <div className="flex justify-center items-center h-48">
          <p className="text-lg text-gray-500">No missions available at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {missions.map((mission) => (
            <Card key={mission.id} className="shadow-lg rounded-lg">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl font-semibold text-gray-800">{mission.title}</CardTitle>
                </div>
                <CardDescription className="text-gray-600">{mission.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-gray-500">
                  Expires: {new Date(mission.expires_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
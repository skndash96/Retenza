'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuthSession } from '@/hooks/useAuthSession';
import Link from 'next/link';
import { toast } from 'react-toastify';

interface Shop {
  id: number;
  name: string;
  business_type: string;
  address: string;
}

export default function ShopsPage() {
  const { user, role, loading: authLoading } = useAuthSession();
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopsLoading, setShopsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || role !== 'user')) {
      toast.info('Please log in to view shops.');
      router.push('/login/customer');
    }
  }, [authLoading, user, role, router]);

  useEffect(() => {
    if (!authLoading && user && role === 'user') {
      const fetchShops = async () => {
        setShopsLoading(true);
        try {
          const response = await fetch('/api/customer/shops');
          if (!response.ok) {
            toast.error('Failed to load shops');
            throw new Error('Failed to fetch shops.');
          }
          const data = await response.json();
          setShops(data);
        } catch (err: any) {
          toast.error(err.message || 'Error loading shops');
          setError(err.message);
        } finally {
          setShopsLoading(false);
        }
      };

      fetchShops();
    }
  }, [authLoading, user, role]);

  if (authLoading || shopsLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[calc(100vh-64px)]">
        <p className="text-xl text-gray-700">Loading shops...</p>
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
      <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-gray-700 bg-clip-text text-transparent mb-4">
        Explore Shops
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        Discover new places and their loyalty programs.
      </p>

      {shops.length === 0 ? (
        <div className="flex justify-center items-center h-48">
          <p className="text-lg text-gray-500">No shops available at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => (
            <Card
              key={shop.id}
              className="shadow-sm border border-gray-200 rounded-xl bg-white hover:shadow-md hover:scale-[1.01] transition-transform duration-200"
            >
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-800">
                  {shop.name}
                </CardTitle>
                <CardDescription className="text-gray-500">{shop.business_type}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">Address: {shop.address}</p>
                <Link href={`/customer/shops/${shop.id}`} passHref>
                <Button className="mt-4 w-full border border-amber-300 text-amber-700 font-medium bg-white hover:bg-amber-50 transition-colors">
                    View Details
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

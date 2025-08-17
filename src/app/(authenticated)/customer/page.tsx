'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthSession } from '@/hooks/useAuthSession';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { toast } from 'react-toastify';

interface Shop {
  shopId: number;
  shopName: string;
  shopType: string;
  loyaltyPoints: number;
  currentTier: string;
}

export default function CustomerDashboard() {
  const { user, role, loading: authLoading } = useAuthSession();
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || role !== 'user')) {
      toast.info('Please log in to view your dashboard.');
      router.push('/login/customer');
    }
  }, [authLoading, user, role, router]);

  useEffect(() => {
    if (!authLoading && user && role === 'user') {
      const fetchDashboardData = async () => {
        setPageLoading(true);
        try {
          const response = await fetch('/api/customer/dashboard');
          if (!response.ok){
            toast.error('Failed to load dashboard data');
            throw new Error('Failed to fetch dashboard data.');
          } 
                      const data = await response.json() as { shops: Shop[] };
            setShops(data.shops);
        } catch (err: unknown) {
          const errorMessage = (err as Error)?.message ?? 'Error loading dashboard data';
          toast.error(errorMessage);
          setError(errorMessage);
        } finally {
          setPageLoading(false);
        }
      };
      void fetchDashboardData();
    }
  }, [authLoading, user, role, router]);

  if (authLoading || pageLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <p className="text-lg text-slate-600">Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <p className="text-lg text-red-500">{error}</p>
      </div>
    );
  }

  if (!user || role !== 'user') return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto py-8 px-4">
        
        <Card className="text-center mb-8 border border-slate-200 shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl font-bold text-slate-800">
              Your visits to your favorite local shops are now more rewarding
            </CardTitle>
            <p className="text-base md:text-lg text-slate-600 mt-2">
              At checkout, just tell the cashier your registered phone number to earn points instantly.
            </p>
          </CardHeader>
        </Card>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-semibold text-slate-800">Your Shops</h2>
        </div>

        {shops.length > 0 ? (
          <Carousel className="w-full">
            <CarouselContent className="-ml-1">
              {shops.map((shop, index) => (
                <CarouselItem key={index} className="pl-1 sm:basis-1/2 lg:basis-1/3">
                  <div className="p-1 h-full">
                    <Card 
                      onClick={() => router.push(`/customer/shops/${shop.shopId}`)}
                      className="cursor-pointer border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all h-full"
                    >
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-semibold text-slate-800">{shop.shopName}</CardTitle>
                        <Badge className="bg-amber-100 text-amber-800">{shop.shopType}</Badge>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-600">Your Points: <span className="text-amber-700 font-semibold">{shop.loyaltyPoints}</span></p>
                        <p className="text-slate-600">Current Tier: <span className="text-amber-700 font-semibold">{shop.currentTier}</span></p>                    
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        ) : (
          <p className="text-center text-slate-500 mt-4">
                         You haven&apos;t made a purchase yet. Start earning rewards today!
          </p>
        )}

        <Separator className="my-10" />

        <h2 className="text-xl md:text-2xl font-semibold text-slate-800 mb-6">How to Get More Rewards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <RewardCard
            icon="🛍️"
            title="Shop & Earn"
            content="Shop at your favorite spots to earn points on every purchase."
          />
          <RewardCard
            icon="🏅"
            title="Complete Missions"
            content="Join missions like 'Squad Goals' for bonus rewards."
          />
          <RewardCard
            icon="🏆"
            title="Achieve Milestones"
            content="Level up your loyalty tier for VIP perks."
          />
        </div>

        <footer className="mt-12 text-center text-slate-500 text-sm border-t border-slate-200 pt-4">
          © 2025 Retenza. All rights reserved.
        </footer>
      </div>
    </div>
  );
}

const RewardCard = ({ icon, title, content }: { icon: string; title: string; content: string }) => (
  <Card className="text-center border border-slate-200 shadow-sm bg-white hover:border-amber-400 transition-all">
    <CardHeader className="text-4xl">{icon}</CardHeader>
    <CardContent className="space-y-2">
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      <p className="text-slate-600 text-sm">{content}</p>
    </CardContent>
  </Card>
);

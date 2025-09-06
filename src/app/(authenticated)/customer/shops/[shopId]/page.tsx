'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Star,
  Gift,
  TrendingUp,
  Calendar,
  MapPin,
  Building2,
  Award,
  IndianRupee
} from 'lucide-react';

// Define the reward structure based on actual API response
interface Reward {
  id: string;
  name: string;
  reward: string;
  one_time: boolean;
  percentage?: number;
  reward_text: string;
  reward_type: 'cashback' | 'limited_usage' | 'custom';
  usage_limit: number;
  time_window?: {
    start_date: string;
    end_date: string;
  };
}

interface Tier {
  name: string;
  rewards: Reward[];
  points_to_unlock: number;
}

interface ShopData {
  shop: {
    id: number;
    name: string;
    business_type: string;
    address: string;
    gmap_link?: string;
    logo_url?: string;
  };
  loyaltyProgram: {
    id: number;
    business_id: number;
    points_rate: number;
    description: string;
    tiers: Tier[];
  } | null;
  loyalty: {
    customer_id: number;
    business_id: number;
    points: number;
    current_tier_name: string;
  } | null;
  transactions: {
    id: number;
    customer_id: number;
    business_id: number;
    bill_amount: string;
    points_awarded: number;
    created_at: string;
  }[];
}

export default function ShopDetailsPage() {
  const params = useParams();
  const shopId = params.shopId as string;
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shopId) {
      const fetchShopDetails = async () => {
        setPageLoading(true);
        try {
          const response = await fetch(`/api/customer/shops/${shopId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch shop details.');
          }
          const data = await response.json() as ShopData;
          setShopData(data);
        } catch (err: unknown) {
          setError((err as Error)?.message ?? 'Error loading shop details');
        } finally {
          setPageLoading(false);
        }
      };

      void fetchShopDetails();
    }
  }, [shopId]);

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-700 font-medium">Loading shop details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-xl text-red-600 font-medium">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!shopData) {
    return null;
  }

  const { shop, loyaltyProgram, loyalty, transactions } = shopData;
  const currentPoints = loyalty?.points ?? 0;

  const nextTier = loyaltyProgram?.tiers
    .filter(tier => tier.points_to_unlock > currentPoints)
    .sort((a, b) => a.points_to_unlock - b.points_to_unlock)[0];

  const progress = nextTier
    ? Math.floor((currentPoints / nextTier.points_to_unlock) * 100)
    : 100;

  const currentTier = loyaltyProgram?.tiers.find(tier => tier.name === loyalty?.current_tier_name);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto py-8 px-4">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                {shop.logo_url ? (
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-200">
                    <img
                      src={shop.logo_url}
                      alt={`${shop.name} logo`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{shop.name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                      {shop.business_type}
                    </Badge>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-4 h-4 fill-current" />
                      <Star className="w-4 h-4 fill-current" />
                      <Star className="w-4 h-4 fill-current" />
                      <Star className="w-4 h-4 fill-current" />
                      <Star className="w-4 h-4 fill-current" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{shop.address}</span>
              </div>

              {/* Location Button - Only show if gmap_link exists */}
              {shop.gmap_link && (
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(shop.gmap_link, '_blank')}
                    className="border-green-200 text-green-700 hover:bg-green-50"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Get Directions
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              {/* Auto-subscribed to notifications when transactions occur */}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-sm bg-white rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                  <Award className="w-5 h-5 text-blue-600" />
                  Your Loyalty Status
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Track your progress and unlock amazing rewards
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-medium text-gray-700">Total Points</span>
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {currentPoints.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Earn {loyaltyProgram?.points_rate ?? 1} point per ₹1 spent
                  </p>
                </div>

                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-medium text-gray-700">Current Tier</span>
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200 px-3 py-1">
                      {loyalty?.current_tier_name ?? 'Bronze'}
                    </Badge>
                  </div>
                  {currentTier && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Unlocked at {currentTier.points_to_unlock.toLocaleString()} points
                      </p>
                      {currentTier.rewards && currentTier.rewards.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {currentTier.rewards.map((reward, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              <Gift className="w-3 h-3 mr-1" />
                              {reward.reward_type === 'cashback'
                                ? `${reward.percentage}% cashback`
                                : reward.reward_type === 'limited_usage'
                                  ? reward.reward_text
                                  : reward.reward_text || 'Special offer'}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {nextTier && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-medium text-gray-700">Progress to {nextTier.name}</span>
                      <span className="text-sm text-gray-600">{progress}%</span>
                    </div>
                    <Progress value={progress} className="w-full h-3 [&>div]:bg-gradient-to-r [&>div]:from-green-500 [&>div]:to-emerald-500" />
                    <div className="flex justify-between text-sm text-gray-600 mt-2">
                      <span>{currentPoints.toLocaleString()} points</span>
                      <span>{nextTier.points_to_unlock.toLocaleString()} points</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transaction History */}
            <Card className="border-0 shadow-sm bg-white rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                  <Calendar className="w-5 h-5 text-green-600" />
                  Recent Transactions
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Your activity history with {shop.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No transactions yet</p>
                    <p className="text-sm text-gray-400">Start shopping to see your history here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.slice(0, 5).map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <IndianRupee className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              ₹{Number(tx.bill_amount).toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(tx.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-blue-600">
                            +{tx.points_awarded} pts
                          </p>
                          <p className="text-xs text-gray-500">earned</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {loyaltyProgram && (
              <Card className="border-0 shadow-sm bg-white rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                    <Star className="w-5 h-5 text-amber-600" />
                    Loyalty Program
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {loyaltyProgram.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                      <p className="text-sm text-gray-600 mb-1">Points Rate</p>
                      <p className="text-2xl font-bold text-purple-600">
                        1 ₹ = {loyaltyProgram.points_rate} point
                      </p>
                    </div>

                    <Accordion type="single" collapsible className="w-full">
                      {loyaltyProgram.tiers.map((tier, index) => (
                        <AccordionItem key={index} value={`tier-${index}`} className="border border-gray-200 rounded-lg">
                          <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 rounded-lg data-[state=open]:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">{index + 1}</span>
                              </div>
                              <div className="text-left">
                                <p className="font-semibold text-gray-900">{tier.name}</p>
                                <p className="text-sm text-gray-500">{tier.points_to_unlock.toLocaleString()} points</p>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="space-y-3">
                              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                                <Gift className="w-4 h-4 text-green-600" />
                                Rewards
                              </h4>
                              {tier.rewards && tier.rewards.length > 0 ? (
                                <div className="space-y-2">
                                  {tier.rewards.map((reward, rewardIndex) => (
                                    <div key={rewardIndex} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      <span className="text-sm text-gray-700">
                                        {reward.reward_type === 'cashback'
                                          ? `${reward.percentage}% cashback on purchases`
                                          : reward.reward_type === 'limited_usage'
                                            ? reward.reward_text
                                            : reward.reward_type === 'custom'
                                              ? reward.reward_text
                                              : reward.reward_text || 'Special offer'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-500 text-sm italic">No rewards configured for this tier yet.</p>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-0 shadow-sm bg-white rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-gray-600">Total Spent</span>
                  <span className="font-semibold text-blue-600">
                    ₹{transactions.reduce((sum, tx) => sum + Number(tx.bill_amount), 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm text-gray-600">Total Earned</span>
                  <span className="font-semibold text-green-600">
                    {transactions.reduce((sum, tx) => sum + tx.points_awarded, 0)} pts
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm text-gray-600">Visit Count</span>
                  <span className="font-semibold text-purple-600">{transactions.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
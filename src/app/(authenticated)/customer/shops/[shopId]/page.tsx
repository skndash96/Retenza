'use client';

import { use, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useAuthSession } from '@/hooks/useAuthSession';
import { Separator } from '@/components/ui/separator'; 
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import type { Tier } from '@/server/db/schema';

interface ShopData {
  shop: {
    id: number;
    name: string;
    business_type: string;
    address: string;
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
    bill_amount: number;
    points_awarded: number;
    created_at: string;
  }[];
}

export default function ShopDetailsPage({ params }: { params: Promise<{ shopId: string }> }) {
  const unwrappedParams = use(params);
  const { shopId } = unwrappedParams;
  const { user, role, loading: authLoading } = useAuthSession();
  const router = useRouter();
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || role !== 'user')) {
      router.push('/login');
    }
  }, [authLoading, user, role, router]);

  useEffect(() => {
    if (!authLoading && user && role === 'user' && shopId) {
      const fetchShopDetails = async () => {
        setPageLoading(true);
        try {
          const response = await fetch(`/api/customer/shops/${shopId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch shop details.');
          }
          const data = await response.json();
          setShopData(data);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setPageLoading(false);
        }
      };

      fetchShopDetails();
    }
  }, [authLoading, user, role, shopId]);

  if (authLoading || pageLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[calc(100vh-64px)]">
        <p className="text-xl text-gray-700">Loading shop details...</p>
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

  if (!user || role !== 'user' || !shopData) {
    return null;
  }

  const { shop, loyaltyProgram, loyalty, transactions } = shopData;
  const currentPoints = loyalty?.points || 0;
  
  const nextTier = loyaltyProgram?.tiers
    .filter(tier => tier.points_to_unlock > currentPoints)
    .sort((a, b) => a.points_to_unlock - b.points_to_unlock)[0];

  const progress = nextTier
    ? Math.floor((currentPoints / nextTier.points_to_unlock) * 100)
    : 100;

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-gray-800 bg-clip-text text-transparent">
          {shop.name}
        </h1>
        <Badge
          variant="secondary"
          className="text-lg px-4 py-2 bg-amber-100 text-amber-800 border border-amber-200"
        >
          {shop.business_type}
        </Badge>
      </div>

      <p className="text-lg text-gray-600 mb-8">Address: {shop.address}</p>
      <Separator className="mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Customer Loyalty Card */}
        <Card className="shadow-sm rounded-lg border border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800">
              Your Loyalty Status
            </CardTitle>
            <CardDescription className="text-gray-600">
              Your loyalty program details with this shop.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-md">
              <span className="text-md font-medium text-gray-700">Total Points:</span>
              <span className="text-2xl font-bold text-amber-600">{currentPoints}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-md">
              <span className="text-md font-medium text-gray-700">Current Tier:</span>
              <span className="text-xl font-bold text-gray-800">
                {loyalty?.current_tier_name || 'Bronze'}
              </span>
            </div>
            {nextTier && (
              <div className="space-y-2 p-4 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-700">
                  {`Progress to ${nextTier.name} tier:`}
                </p>
                <Progress
                  value={progress}
                  className="w-full [&>div]:bg-amber-500"
                />
                <p className="text-sm text-gray-500 text-right">
                  {`${currentPoints} / ${nextTier.points_to_unlock} points`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loyalty Program Configuration Card */}
        {loyaltyProgram && (
          <Card className="shadow-sm rounded-lg border border-gray-200">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800">
                Loyalty Program
              </CardTitle>
              <CardDescription className="text-gray-600">
                {loyaltyProgram.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-md font-medium text-gray-700 mb-4">
                1 Rupee ={' '}
                <span className="text-amber-600 font-semibold">
                  {loyaltyProgram.points_rate}
                </span>{' '}
                point{loyaltyProgram.points_rate > 1 ? 's' : ''}
              </p>
              <Accordion type="single" collapsible className="w-full">
                {loyaltyProgram.tiers.map((tier, index) => (
                  <AccordionItem key={tier.id} value={`item-${index}`}>
                    <AccordionTrigger className="text-lg font-semibold">
                      {tier.name} Tier - {tier.points_to_unlock} points to unlock
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      <h4 className="text-md font-medium">Rewards:</h4>
                      {tier.rewards.length > 0 ? (
                        <ul>
                          {tier.rewards.map((reward, rewardIndex) => (
                            <li
                              key={rewardIndex}
                              className="ml-4 list-disc text-gray-600"
                            >
                              {reward.reward_type === 'Free Item'
                                ? `Free Item: ${reward.description}`
                                : reward.reward_type === 'Discount'
                                ? `${reward.value}% discount`
                                : `${reward.value} cashback`}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500">
                          No rewards for this tier yet.
                        </p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}
      </div>

      <Separator className="my-8" />

      {/* Transaction History Card */}
      <Card className="shadow-sm rounded-lg border border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">
            Recent Transactions
          </CardTitle>
          <CardDescription className="text-gray-600">
            Your recent activity with {shop.name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No transactions found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Points Awarded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>₹{tx.bill_amount.toFixed(2)}</TableCell>
                      <TableCell className="text-amber-600">
                        {tx.points_awarded}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

}
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useAuthSession } from '@/hooks/useAuthSession';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import {
  Search,
  Store,
  MapPin,
  Sparkles,
  Grid3X3,
  List
} from 'lucide-react';

interface Shop {
  id: number;
  name: string;
  business_type: string;
  address: string;
  gmap_link?: string;
  loyaltyPoints?: number;
  currentTier?: string;
  logo_url?: string;
}

interface DashboardShop {
  shopId: string;
  shopName: string;
  shopType: string;
  loyaltyPoints: number;
  currentTier: string;
  logoUrl?: string;
  gmapLink?: string;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'type' | 'distance' | 'rating' | 'points';

export default function ShopsPage() {
  const { user, role, loading: authLoading } = useAuthSession();
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [myShops, setMyShops] = useState<Shop[]>([]);
  const [shopsLoading, setShopsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('name');


  // Business type options
  const businessTypes = useMemo(() => {
    const types = new Set(shops.map(shop => shop.business_type));
    return ['all', ...Array.from(types)];
  }, [shops]);

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
          // Fetch all shops
          const allShopsResponse = await fetch('/api/customer/shops');
          if (!allShopsResponse.ok) {
            toast.error('Failed to load shops');
            throw new Error('Failed to fetch shops.');
          }
          const allShopsData = await allShopsResponse.json() as Shop[];
          setShops(allShopsData);

          // Fetch my shops (with loyalty data) from dashboard
          const dashboardResponse = await fetch('/api/customer/dashboard');
          if (dashboardResponse.ok) {
            const dashboardData = await dashboardResponse.json() as { shops: DashboardShop[] };
            // Convert dashboard shop format to regular shop format
            const convertedShops: Shop[] = dashboardData.shops.map(shop => ({
              id: parseInt(shop.shopId),
              name: shop.shopName,
              business_type: shop.shopType,
              address: '', // Dashboard doesn't provide address
              gmap_link: shop.gmapLink,
              loyaltyPoints: shop.loyaltyPoints,
              currentTier: shop.currentTier,
              logo_url: shop.logoUrl
            }));
            setMyShops(convertedShops);
          }
        } catch (err: unknown) {
          const errorMessage = (err as Error)?.message ?? 'Error loading shops';
          toast.error(errorMessage);
          setError(errorMessage);
        } finally {
          setShopsLoading(false);
        }
      };

      void fetchShops();
    }
  }, [authLoading, user, role]);

  // Filter and sort shops
  const filteredAndSortedShops = useMemo(() => {
    const filtered = shops.filter(shop => {
      const matchesSearch = shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.business_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.address.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || shop.business_type === selectedType;
      return matchesSearch && matchesType;
    });

    // Sort shops
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'type':
          return a.business_type.localeCompare(b.business_type);
        case 'points':
          return (b.loyaltyPoints ?? 0) - (a.loyaltyPoints ?? 0);
        case 'rating':
          // Mock rating for now - you can add actual rating field later
          return Math.random() - 0.5;
        case 'distance':
          // Mock distance for now - you can add actual distance calculation later
          return Math.random() - 0.5;
        default:
          return 0;
      }
    });

    return filtered;
  }, [shops, searchQuery, selectedType, sortBy]);

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (authLoading || shopsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Store className="w-8 h-8 text-white" />
          </div>
          <p className="text-lg text-gray-600">Discovering amazing shops...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-lg text-red-500">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!user || role !== 'user') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto py-4 px-4">

        {/* Compact Header Section */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="text-center mb-4"
        >
          <div className="inline-flex items-center bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-2">
            <Sparkles className="w-3 h-3 mr-1.5" />
            Discover Shops
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Discover & Manage Shops
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Track your loyalty progress and explore new opportunities
          </p>
        </motion.div>

        {/* My Shops Section */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Store className="w-6 h-6 text-blue-500" />
              My Shops
            </h2>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm bg-blue-100 text-blue-700 border-blue-200">
                {myShops.length} Active
              </Badge>
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('all');
                  // Show all my shops by replacing the shops list
                  if (myShops.length > 4) {
                    setShops(myShops);
                  }
                }}
                variant="outline"
                size="sm"
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                View All My Shops
              </Button>
            </div>
          </div>

          {myShops.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {myShops
                .sort((a, b) => (b.loyaltyPoints ?? 0) - (a.loyaltyPoints ?? 0))
                .slice(0, 4)
                .map((shop, index) => (
                  <Card
                    key={shop.id}
                    className="border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer group bg-gradient-to-br from-blue-50 to-white"
                    onClick={() => router.push(`/customer/shops/${shop.id}`)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                          #{index + 1}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-blue-500" />
                          <span className="text-xs font-medium text-blue-600">{shop.loyaltyPoints} pts</span>
                        </div>
                      </div>
                      <CardTitle className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {shop.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Badge variant="outline" className="text-xs border-gray-300 text-gray-600">
                        {shop.business_type}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <MapPin className="w-3 h-3" />
                        <span className="line-clamp-1">{shop.address}</span>
                      </div>



                      <div className="pt-2">
                        <Button
                          size="sm"
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
              <CardContent className="p-6 text-center">
                <Store className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">You haven&apos;t visited any shops yet. Start shopping to earn points!</p>
                <p className="text-xs text-gray-400 mt-1">Your visited shops will appear here</p>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Section Divider */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ delay: 0.12 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 border-t border-gray-200"></div>
            <div className="px-4">
              <Badge variant="outline" className="text-xs text-gray-500 border-gray-300">
                {myShops.length === shops.length ? 'My Shops Only' : 'All Available Shops'}
              </Badge>
            </div>
            <div className="flex-1 border-t border-gray-200"></div>
            {myShops.length === shops.length && shops.length > 4 && (
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
                className="ml-4 border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                Show All Shops
              </Button>
            )}
          </div>
        </motion.div>

        {/* Compact Search and Filters Section */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            {/* Search Bar - More Compact */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search shops, types, or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Compact Filters Row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Business Type Filter */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                >
                  {businessTypes.map(type => (
                    <option key={type} value={type}>
                      {type === 'all' ? 'All Types' : type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Options */}
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="name">Name</option>
                  <option value="type">Type</option>
                  <option value="points">Points</option>
                  <option value="rating">Rating</option>
                  <option value="distance">Distance</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex border border-gray-300 rounded-md overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-none px-2 py-1 h-auto text-xs"
                >
                  <Grid3X3 className="w-3 h-3" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-none px-2 py-1 h-auto text-xs"
                >
                  <List className="w-3 h-3" />
                </Button>
              </div>

              {/* Results Count - Inline */}
              <div className="ml-auto">
                <span className="text-xs text-gray-600">
                  {filteredAndSortedShops.length} of {shops.length} shops
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Shops Grid/List */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ delay: 0.2 }}
        >
          {filteredAndSortedShops.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Store className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No shops found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || selectedType !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'No shops available at this time'
                }
              </p>
              {(searchQuery || selectedType !== 'all') && (
                <Button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedType('all');
                  }}
                  variant="outline"
                  className="border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className={viewMode === 'grid'
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
            }>
              {filteredAndSortedShops.map((shop, index) => (
                <motion.div
                  key={shop.id}
                  initial="hidden"
                  animate="show"
                  variants={fadeUp}
                  transition={{ delay: 0.1 * index }}
                >
                  {viewMode === 'grid' ? (
                    // Grid View
                    <Card className="group cursor-pointer border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 bg-white">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <CardTitle className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                              {shop.name}
                            </CardTitle>
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200 mt-1">
                              {shop.business_type}
                            </Badge>
                          </div>
                          {shop.logo_url ? (
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200">
                              <img
                                src={shop.logo_url}
                                alt={`${shop.name} logo`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-lg font-bold">
                              {shop.name.charAt(0)}
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <p className="line-clamp-2">{shop.address}</p>
                        </div>



                        {shop.loyaltyPoints !== undefined && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Loyalty Points:</span>
                            <span className="font-semibold text-blue-600">{shop.loyaltyPoints}</span>
                          </div>
                        )}

                        {shop.currentTier && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Current Tier:</span>
                            <Badge variant="outline" className="text-xs border-amber-200 text-amber-700">
                              {shop.currentTier}
                            </Badge>
                          </div>
                        )}

                        <Button
                          onClick={() => router.push(`/customer/shops/${shop.id}`)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          View Details
                          <Store className="w-4 h-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    // List View
                    <Card className="group cursor-pointer border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white">
                      <div className="p-4">
                        <div className="flex items-center gap-4">
                          {shop.logo_url ? (
                            <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                              <img
                                src={shop.logo_url}
                                alt={`${shop.name} logo`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                              {shop.name.charAt(0)}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                                  {shop.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                                    {shop.business_type}
                                  </Badge>
                                  {shop.currentTier && (
                                    <Badge variant="outline" className="text-xs border-amber-200 text-amber-700">
                                      {shop.currentTier} Tier
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <div className="text-right ml-4">
                                {shop.loyaltyPoints !== undefined && (
                                  <div className="text-sm">
                                    <span className="text-gray-600">Points:</span>
                                    <div className="font-semibold text-blue-600">{shop.loyaltyPoints}</div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="line-clamp-1">{shop.address}</span>
                            </div>



                            <Button
                              onClick={() => router.push(`/customer/shops/${shop.id}`)}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              View Details
                              <Store className="w-4 h-4 ml-2" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

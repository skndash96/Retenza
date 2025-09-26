"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/hooks/useAuthSession";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Store,
  Target,
  Sparkles,
  ArrowRight,
  Flame,
  User,
  Heart,
  Clock,
  MoreVertical,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import MissionExplanation from "@/components/MissionExplaination";

interface Shop {
  shopId: string;
  shopName: string;
  shopType: string;
  loyaltyPoints: number;
  currentTier: string;
  logoUrl?: string;
}

interface Mission {
  id: string;
  title: string;
  description: string;
  offer: string;
  business_name: string;
  business_id: number;
}

interface QuickStats {
  totalPoints: number;
  totalShops: number;
  missionsCompleted: number;
}

function pickTopMissions(allMissions: Mission[], count = 3): Mission[] {
  // Group missions by business_id and pick one random mission per shop
  const missionsByShop = new Map<number, Mission[]>();
  allMissions.forEach((mission) => {
    if (!missionsByShop.has(mission.business_id)) {
      missionsByShop.set(mission.business_id, []);
    }
    missionsByShop.get(mission.business_id)!.push(mission);
  });

  // Pick one random mission per shop
  const uniqueMissions: Mission[] = [];
  missionsByShop.forEach((missions) => {
    const randomIdx = Math.floor(Math.random() * missions.length);
    uniqueMissions.push(missions[randomIdx]);
  });

  // Shuffle and pick up to `count` missions
  const shuffled = uniqueMissions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export default function CustomerDashboard() {
  const { user, role, loading: authLoading } = useAuthSession();
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [topMissions, setTopMissions] = useState<Mission[]>([]);
  const [showAllDesc, setShowAllDesc] = useState<Record<string, boolean>>({});

  const [quickStats, setQuickStats] = useState<QuickStats>({
    totalPoints: 0,
    totalShops: 0,
    missionsCompleted: 0,
  });
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingMission, setStartingMission] = useState<string | null>(null);
  const [ongoingMissions, setOngoingMissions] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    if (!authLoading && (!user || role !== "user")) {
      toast.info("Please log in to view your dashboard.");
      router.push("/login/customer");
    }
  }, [authLoading, user, role, router]);

  const cancelMission = async (mission: Mission) => {
    try {
      const response = await fetch(`/api/customer/mission-registry`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          business_id: mission.business_id,
          mission_id: mission.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error ?? "Failed to cancel mission.");
      }

      toast.success("Mission cancelled successfully.");
      setOngoingMissions((prev) => {
        const updated = new Set(prev);
        updated.delete(mission.id);
        return updated;
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to cancel mission";
      toast.error(errorMessage);
    }
  };

  // Function to start a mission
  const startMission = async (missionId: string, businessId: number) => {
    if (!user) {
      toast.error("Please log in to start missions");
      return;
    }

    setStartingMission(missionId);
    try {
      const response = await fetch("/api/customer/mission-registry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mission_id: missionId,
          business_id: businessId,
          status: "in_progress",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error ?? "Failed to start mission");
      }

      toast.success("Mission started successfully!");

      // Add mission to ongoing missions
      setOngoingMissions((prev) => new Set([...prev, missionId]));

      // Refresh missions to show updated status
      const missionsResponse = await fetch("/api/customer/missions");
      if (missionsResponse.ok) {
        const missionsData = (await missionsResponse.json()) as {
          business_id: number;
          business_name: string;
          business_address: string;
          missions: Mission[];
        }[];
        console.log("Refreshed missions data:", missionsData);
        // Flatten missions from all businesses and take top 3
        const allMissions = missionsData.flatMap((company) =>
          company.missions.map((mission) => ({
            ...mission,
            business_name: company.business_name,
          })),
        );
        console.log("Refreshed flattened missions:", allMissions);
        // setTopMissions(allMissions.slice(0, 3));
        setTopMissions(pickTopMissions(allMissions));
      }

      // Refresh completed missions count
      const missionRegistryResponse = await fetch(
        "/api/customer/mission-registry",
      );
      if (missionRegistryResponse.ok) {
        const missionRegistryData = (await missionRegistryResponse.json()) as {
          success: boolean;
          registries: Array<{ status: string }>;
        };
        const completedMissionsCount = missionRegistryData.registries.filter(
          (mission) => mission.status === "completed",
        ).length;
        setQuickStats((prev) => ({
          ...prev,
          missionsCompleted: completedMissionsCount,
        }));
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to start mission";
      toast.error(errorMessage);
    } finally {
      setStartingMission(null);
    }
  };

  useEffect(() => {
    if (!authLoading && user && role === "user") {
      const fetchDashboardData = async () => {
        setPageLoading(true);
        try {
          // Fetch dashboard data
          const response = await fetch("/api/customer/dashboard");
          if (!response.ok) {
            toast.error("Failed to load dashboard data");
            throw new Error("Failed to fetch dashboard data.");
          }
          const data = (await response.json()) as { shops: Shop[] };
          setShops(data.shops);

          // Fetch top missions
          const missionsResponse = await fetch("/api/customer/missions");
          if (missionsResponse.ok) {
            const missionsData = (await missionsResponse.json()) as {
              business_id: number;
              business_name: string;
              business_address: string;
              missions: Mission[];
            }[];
            console.log("Raw missions data:", missionsData);
            // Flatten missions from all businesses and take top 3
            const allMissions = missionsData.flatMap((company) =>
              company.missions.map((mission) => ({
                ...mission,
                business_name: company.business_name,
              })),
            );
            console.log("Flattened missions:", allMissions);
            // setTopMissions(allMissions.slice(0, 3));
            setTopMissions(pickTopMissions(allMissions));
          }

          // Fetch mission registry data (completed and ongoing)
          let completedMissionsCount = 0;
          const ongoingMissionIds = new Set<string>();
          try {
            const missionRegistryResponse = await fetch(
              "/api/customer/mission-registry",
            );
            if (missionRegistryResponse.ok) {
              const missionRegistryData =
                (await missionRegistryResponse.json()) as {
                  success: boolean;
                  registries: Array<{ mission_id: string; status: string }>;
                };
              completedMissionsCount = missionRegistryData.registries.filter(
                (mission) => mission.status === "completed",
              ).length;
              missionRegistryData.registries
                .filter((mission) => mission.status === "in_progress")
                .forEach((mission) =>
                  ongoingMissionIds.add(mission.mission_id),
                );
            }
          } catch {
            console.log(
              "Could not fetch mission registry, using default count",
            );
            completedMissionsCount = 0;
          }

          // Calculate quick stats
          const totalPoints = data.shops.reduce(
            (sum, shop) => sum + shop.loyaltyPoints,
            0,
          );

          setQuickStats({
            totalPoints,
            totalShops: data.shops.length,
            missionsCompleted: completedMissionsCount,
          });
          setOngoingMissions(ongoingMissionIds);
        } catch (err: unknown) {
          const errorMessage =
            (err as Error)?.message ?? "Error loading dashboard data";
          toast.error(errorMessage);
          setError(errorMessage);
        } finally {
          setPageLoading(false);
        }
      };
      void fetchDashboardData();
    }
  }, [authLoading, user, role, router]);

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  if (authLoading || pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <p className="text-lg text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <Heart className="h-8 w-8 text-red-600" />
          </div>
          <p className="text-lg text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="text-center"
        >
          <div className="mb-3 inline-flex items-center rounded-full bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 text-sm font-semibold text-blue-700">
            <Sparkles className="mr-2 h-4 w-4" />
            Welcome back, {user?.name ?? "Valued Customer"}!
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">
            Rewards &amp; Missions
          </h1>
          <p className="mx-auto max-w-xl text-base text-gray-600">
            Discover 10+ shops, complete challenges, and grab your prizes.
          </p>
        </motion.div>

        <MissionExplanation />

        {/* Compact High-Priority Stats Row */}
        {/* <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{quickStats.totalPoints.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Total Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{quickStats.totalShops}</div>
                <div className="text-xs text-gray-500">Active Shops</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{quickStats.missionsCompleted}</div>
                <div className="text-xs text-gray-500">Missions Done</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                💡 <strong>Note:</strong> Tiers are specific to each shop. Check individual shop pages for your tier status.
              </p>
            </div>
          </div>
        </motion.div> */}

        {/* My Shops Section - Top 4 Shops You've Visited */}
        {/* <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Store className="w-5 h-5 text-blue-500" />
              My Shops
            </h2>
            <Button
              onClick={() => router.push('/customer/shops')}
              variant="outline"
              size="sm"
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {shops.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {shops.slice(0, 4).map((shop, index) => (
                <Card
                  key={shop.shopId}
                  className="border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
                  onClick={() => router.push(`/customer/shops/${shop.shopId}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                        #{index + 1}
                      </Badge>
                      <Store className="w-4 h-4 text-blue-500" />
                    </div>
                    <CardTitle className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {shop.shopName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Badge variant="outline" className="text-xs border-gray-300 text-gray-600">
                      {shop.shopType}
                    </Badge>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{shop.loyaltyPoints} pts</span>
                      <span className="font-medium text-gray-800">{shop.currentTier}</span>
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
                <Button
                  onClick={() => router.push('/customer/shops')}
                  size="sm"
                  className="mt-3 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Browse Shops
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div> */}

        {/* Top Missions Section */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <Flame className="h-5 w-5 text-orange-500" />
              Top Missions
            </h2>
            <Button
              onClick={() => router.push("/customer/missions")}
              variant="outline"
              size="sm"
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {topMissions.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {topMissions.map((mission, index) => (
                <Card
                  key={mission.id}
                  className="group border border-gray-200 transition-all duration-200 hover:border-orange-300 hover:shadow-md"
                >
                  <CardHeader className="pb-3">
                    <div className="mb-2 flex items-center justify-between">
                      <Badge
                        variant="secondary"
                        className="border-orange-200 bg-orange-100 text-xs text-orange-700"
                      >
                        #{index + 1}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-red-200 text-xs text-red-600"
                      >
                        Limited Time
                      </Badge>
                    </div>
                    <CardTitle className="line-clamp-2 text-sm font-semibold text-gray-800 transition-colors group-hover:text-orange-600">
                      {mission.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* <p className="line-clamp-2 text-xs text-gray-600">
                      {mission.description}
                    </p> */}
                    {(() => {
                      const descItems = mission.description
                        .split(",")
                        .map((item) => item.trim());
                      const isExpanded = showAllDesc[mission.id];
                      return (
                        <>
                          <ul className="list-disc pl-5 text-xs text-gray-600">
                            {(isExpanded
                              ? descItems
                              : descItems.slice(0, 2)
                            ).map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                          {descItems.length > 2 && (
                            <button
                              className="mt-1 text-xs text-orange-600 font-semibold hover:underline"
                              onClick={() =>
                                setShowAllDesc((prev) => ({
                                  ...prev,
                                  [mission.id]: !prev[mission.id],
                                }))
                              }
                              type="button"
                            >
                              {isExpanded
                                ? "View less"
                                : `View more (${descItems.length - 2} more)`}
                            </button>
                          )}
                        </>
                      );
                    })()}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-green-600">
                        {mission.offer}
                      </span>
                      <span className="text-xs text-gray-500">
                        {mission.business_name}
                      </span>
                    </div>

                    {ongoingMissions.has(mission.id) ? (
                      <Button
                        asChild
                        className="w-full bg-gray-400 text-xs text-white hover:bg-gray-400"
                      >
                        <div className="flex items-center">
                          <span className="flex grow items-center">
                            <Clock className="mr-2 inline-block h-4 w-4" />
                            Show this screen to redeem
                          </span>

                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <MoreVertical className="ml-4 inline-block h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-white">
                              <DropdownMenuItem
                                onClick={() => cancelMission(mission)}
                              >
                                Quit
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </Button>
                    ) : (
                      <Button
                        onClick={() =>
                          startMission(mission.id, mission.business_id)
                        }
                        disabled={startingMission === mission.id}
                        size="sm"
                        className="w-full bg-orange-600 text-xs text-white hover:bg-orange-700"
                      >
                        {startingMission === mission.id ? (
                          <>
                            <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Starting...
                          </>
                        ) : (
                          <>
                            <Target className="mr-1 h-3 w-3" />
                            Show and claim
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
              <CardContent className="p-6 text-center">
                <Target className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                <p className="text-sm text-gray-500">
                  No missions available yet. Check back soon!
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Tier Progress & New Missions Grid */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className="grid gap-6">
            <div>
              {/* <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-green-500" />
                Discover New Shops
              </h2>

              <Card className="border-2 border-dashed border-green-300 bg-green-50">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">See What&apos;s Trending</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Explore trending shops and discover exclusive missions with bonus rewards!
                  </p>
                  <Button
                    onClick={() => router.push('/customer/shops')}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    Browse Shops
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card> */}

              <div className="mt-4">
                <h3 className="mb-3 text-sm font-semibold text-gray-800">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  <Link
                    href="/customer/missions"
                    className="inline-flex items-center justify-start rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <Target className="mr-2 h-4 w-4" />
                    View All Missions
                  </Link>
                  <Link
                    href="/customer/shops"
                    className="inline-flex items-center justify-start rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <Store className="mr-2 h-4 w-4" />
                    Browse Shops
                  </Link>
                  <Link
                    href="/customer/profile"
                    className="inline-flex items-center justify-start rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Update Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <div className="border-t border-gray-200 pt-8">
            <div className="mb-4 flex items-center justify-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg">
                <img
                  src="/icon-512.png"
                  alt="Retenza Logo"
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="text-lg font-bold text-gray-900">RETENZA</span>
            </div>
            <p className="text-sm text-gray-500">
              © 2025 Retenza. All rights reserved. Your loyalty journey starts
              here.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

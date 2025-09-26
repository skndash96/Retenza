"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/hooks/useAuthSession";
import { toast } from "react-toastify";
import {
  Search,
  Building2,
  Target,
  Clock,
  Gift,
  CheckCircle,
  PlayCircle,
  XCircle,
  TrendingUp,
  Calendar,
  Sparkles,
  Filter,
  Grid3X3,
  List,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MissionExplanation from "@/components/MissionExplaination";

interface Mission {
  id: number;
  business_id: number;
  title: string;
  description: string;
  offer: string;
  applicable_tiers: string[];
  expires_at: string;
  filters: {
    gender?: ("Male" | "Female" | "Other")[];
    age_range?: { min: number; max: number };
    location?: string[];
    customer_type?: string[];
  };
  business_name: string;
  business_address: string;
}

interface MissionRegistry {
  id: number;
  mission_id: number;
  status: "in_progress" | "completed" | "failed";
  started_at: string;
  completed_at?: string;
  discount_amount: string;
  discount_percentage: string;
  notes?: string;
  mission_title: string;
  mission_description: string;
  mission_offer: string;
  business_name: string;
}

interface CompanyMissions {
  business_id: number;
  business_name: string;
  business_address: string;
  missions: Mission[];
}

interface MissionWithProgress extends Mission {
  progress?: MissionRegistry;
  company: CompanyMissions;
}

export default function CustomerMissionsPage() {
  const { user, role, loading } = useAuthSession();
  const router = useRouter();

  const [companyMissions, setCompanyMissions] = useState<CompanyMissions[]>([]);
  const [missionProgress, setMissionProgress] = useState<MissionRegistry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [missionsLoading, setMissionsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    if (!loading && (!user || role !== "user")) {
      toast.info("Please log in to view your missions.");
      router.push("/login/customer");
    }
  }, [loading, user, role, router]);

  useEffect(() => {
    if (user && role === "user") {
      void fetchAvailableMissions();
      void fetchMissionProgress();
    }
  }, [user, role]);

  const fetchAvailableMissions = async () => {
    setMissionsLoading(true);
    try {
      const response = await fetch("/api/customer/missions");
      if (!response.ok) {
        throw new Error("Failed to fetch missions.");
      }
      const data = await response.json();

      setCompanyMissions(data);
    } catch (error) {
      console.error("Error fetching missions:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch missions.",
      );
    } finally {
      setMissionsLoading(false);
    }
  };

  const fetchMissionProgress = async () => {
    try {
      const response = await fetch("/api/customer/mission-registry");
      if (!response.ok) {
        throw new Error("Failed to fetch mission progress.");
      }
      const data = await response.json();
      setMissionProgress(data.registries ?? []);
    } catch (error) {
      console.error("Failed to fetch mission progress:", error);
    }
  };

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
      void fetchMissionProgress();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to cancel mission";
      toast.error(errorMessage);
    }
  };

  const startMission = async (mission: Mission) => {
    try {
      const response = await fetch("/api/customer/mission-registry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mission_id: mission.id,
          business_id: mission.business_id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error ?? "Failed to start mission.");
      }

      toast.success("Mission started successfully!");
      void fetchMissionProgress();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to start mission";
      toast.error(errorMessage);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "in_progress":
        return <Clock className="h-3 w-3" />;
      case "completed":
        return <CheckCircle className="h-3 w-3" />;
      case "failed":
        return <XCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Flatten all missions into a single array with progress info
  const allMissions: MissionWithProgress[] = (companyMissions || []).flatMap(
    (company) =>
      (company.missions || []).map((mission) => {
        const progress = missionProgress.find(
          (p) => p.mission_id === mission.id,
        );
        return {
          ...mission,
          progress,
          company,
        };
      }),
  );

  // Filter missions based on search and company
  const filteredMissions = allMissions.filter((mission) => {
    const matchesSearch =
      (mission.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mission.description || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (mission.business_name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesCompany =
      selectedCompany === "all" || mission.business_name === selectedCompany;
    return matchesSearch && matchesCompany;
  });

  // Group missions by status for better organization
  const availableMissions = filteredMissions.filter((m) => !m.progress);
  const inProgressMissions = filteredMissions.filter(
    (m) => m.progress?.status === "in_progress",
  );
  const completedMissions = filteredMissions.filter(
    (m) => m.progress?.status === "completed",
  );

  if (loading || missionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p className="text-xl text-gray-700">
                Loading your mission dashboard...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <XCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
              <p className="text-xl text-red-600">Error: {error}</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || role !== "user") {
    return null;
  }

  const MissionCard = ({
    mission,
    isProgress = false,
  }: {
    mission: MissionWithProgress;
    isProgress?: boolean;
  }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
      <Card
        className={`border-2 transition-all duration-300 hover:shadow-lg ${
          isProgress
            ? "border-blue-200"
            : "border-gray-200 hover:border-blue-300"
        }`}
      >
        <CardHeader className="pb-3">
          <div className="mb-2 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">
                {mission.business_name}
              </span>
            </div>
            {isProgress && mission.progress && (
              <Badge className={getStatusColor(mission.progress.status)}>
                {getStatusIcon(mission.progress.status)}
                <span className="ml-1 capitalize">
                  {mission.progress.status.replace("_", " ")}
                </span>
              </Badge>
            )}
          </div>

          <CardTitle className="line-clamp-2 text-lg font-semibold text-gray-800">
            {mission.title}
          </CardTitle>

          {/* <CardDescription className="text-gray-600">
            {isExpanded
              ? mission.description
              : mission.description.split(/\s+/).slice(0, 20).join(" ")}
            {isExpanded
              ? null
              : mission.description.split(/\s+/).length > 20
                ? "..."
                : ""}
            {mission.description.split(/\s+/).length > 20 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="ml-1 text-xs text-blue-600 hover:underline focus:outline-none"
              >
                {isExpanded ? "Show Less" : "Show More"}
              </button>
            )}
          </CardDescription> */}
          <CardDescription className="text-gray-600">
            {(() => {
              const descItems = mission.description
                .split(",")
                .map((item) => item.trim());
              return (
                <>
                  <ul className="list-disc pl-5 text-xs text-gray-600">
                    {(isExpanded ? descItems : descItems.slice(0, 2)).map(
                      (item, idx) => (
                        <li key={idx}>{item}</li>
                      ),
                    )}
                  </ul>
                  {descItems.length > 2 && (
                    <button
                      className="mt-1 block text-left text-xs text-blue-600 hover:underline focus:outline-none"
                      onClick={() => setIsExpanded((prev) => !prev)}
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
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-green-600" />
            <Badge className="text-wrap bg-green-100 text-xs font-medium text-green-800">
              {mission.offer}
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>
              Expires: {new Date(mission.expires_at).toLocaleDateString()}
            </span>
          </div>

          {!isProgress && !mission.progress ? (
            <Button
              onClick={() => startMission(mission)}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-2 font-semibold text-white transition-all duration-300 hover:from-blue-700 hover:to-purple-700"
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              Start Mission
            </Button>
          ) : mission.progress?.status === "completed" ? (
            <Button
              disabled
              className="w-full rounded-xl bg-green-100 py-2 font-semibold text-green-800"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Completed
            </Button>
          ) : mission.progress?.status === "in_progress" ? (
            <Button
              asChild
              disabled
              className="w-full rounded-xl bg-blue-100 py-2 font-semibold text-blue-800 hover:bg-blue-100"
            >
              <div className="flex items-center">
                <span className="flex grow items-center">
                  <Clock className="mr-2 inline-block h-4 w-4" />
                  In Progress
                </span>

                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <MoreVertical className="ml-4 inline-block h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white">
                    <DropdownMenuItem onClick={() => cancelMission(mission)}>
                      Quit
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Compact Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-purple-600" />
            <h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent">
              Mission Dashboard
            </h1>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8 w-8 p-0"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <MissionExplanation />

        {/* Smart Search and Filters */}
        <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                placeholder="Search missions, companies, or descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 rounded-lg border border-gray-200 pl-9 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="h-10 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Companies</option>
                {(companyMissions || []).map((company) => (
                  <option
                    key={company.business_id}
                    value={company.business_name}
                  >
                    {company.business_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Mission Stats Overview */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-2xl font-bold text-gray-800">
                  {availableMissions.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-800">
                  {inProgressMissions.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-800">
                  {completedMissions.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Integrated Missions Grid */}
        <div className="space-y-6">
          {/* In Progress Missions */}
          {inProgressMissions.length > 0 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Active Missions ({inProgressMissions.length})
              </h2>
              <div
                className={`grid gap-4 ${
                  viewMode === "grid"
                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    : "grid-cols-1"
                }`}
              >
                {inProgressMissions.map((mission) => (
                  <MissionCard
                    key={mission.id}
                    mission={mission}
                    isProgress={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Available Missions */}
          {availableMissions.length > 0 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
                <Target className="h-5 w-5 text-purple-600" />
                Available Missions ({availableMissions.length})
              </h2>
              <div
                className={`grid gap-4 ${
                  viewMode === "grid"
                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    : "grid-cols-1"
                }`}
              >
                {availableMissions.map((mission) => (
                  <MissionCard key={mission.id} mission={mission} />
                ))}
              </div>
            </div>
          )}

          {/* Completed Missions */}
          {completedMissions.length > 0 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Completed Missions ({completedMissions.length})
              </h2>
              <div
                className={`grid gap-4 ${
                  viewMode === "grid"
                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    : "grid-cols-1"
                }`}
              >
                {completedMissions.map((mission) => (
                  <MissionCard
                    key={mission.id}
                    mission={mission}
                    isProgress={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredMissions.length === 0 && (
            <div className="rounded-2xl bg-white py-16 text-center shadow-sm">
              <Target className="mx-auto mb-4 h-16 w-16 text-gray-300" />
              {missionsLoading ? (
                <p className="text-xl text-gray-500">Loading missions...</p>
              ) : companyMissions.length === 0 ? (
                <>
                  <p className="text-xl text-gray-500">
                    No missions available yet.
                  </p>
                  <p className="text-gray-400">
                    Businesses need to create missions first.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xl text-gray-500">
                    No missions found matching your criteria.
                  </p>
                  <p className="text-gray-400">
                    Try adjusting your search or filters.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

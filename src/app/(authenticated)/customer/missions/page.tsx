"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/hooks/useAuthSession";
import { toast } from "react-toastify";
import {
  Search,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Sparkles,
  Filter,
  Grid3X3,
  List,
} from "lucide-react";
import MissionExplanation from "@/components/MissionExplaination";
import MissionCard from "@/components/missions/MissionCard";

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
  business_region: string;
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
      const data = await response.json() as CompanyMissions[];

      setCompanyMissions(
        data.filter(mission => !mission.business_region.toLowerCase().includes("nit trichy"))
      );
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
                    fetchMissionProgress={fetchMissionProgress}
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
                  <MissionCard
                    fetchMissionProgress={fetchMissionProgress} key={mission.id} mission={mission} />
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
                    fetchMissionProgress={fetchMissionProgress}
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

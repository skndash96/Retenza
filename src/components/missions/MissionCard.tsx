"use client"
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, Building2, Calendar, CheckCircle, Clock, Gift, MoreVertical, PlayCircle, XCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { toast } from 'react-toastify';

interface Mission {
  id: number;
  business_id: number;
  title: string;
  description: string;
  offer: string;
  applicable_tiers: string[];
  expires_at: string;
  filters: {
    gender?: ('Male' | 'Female' | 'Other')[];
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
  status: 'in_progress' | 'completed' | 'failed';
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

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'in_progress':
      return <Clock className="w-3 h-3" />;
    case 'completed':
      return <CheckCircle className="w-3 h-3" />;
    case 'failed':
      return <XCircle className="w-3 h-3" />;
    default:
      return <Clock className="w-3 h-3" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function MissionCard({
  mission,
  isProgress = false,
  fetchMissionProgress
}: {
  mission: MissionWithProgress;
  isProgress?: boolean
  fetchMissionProgress: () => Promise<void>;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const cancelMission = async (mission: Mission) => {
    try {
      const response = await fetch(`/api/customer/mission-registry`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          business_id: mission.business_id,
          mission_id: mission.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error ?? 'Failed to cancel mission.');
      }

      toast.success('Mission cancelled successfully.');
      void fetchMissionProgress();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel mission';
      toast.error(errorMessage);
    }
  }

  const startMission = async (mission: Mission) => {
    try {
      const response = await fetch('/api/customer/mission-registry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mission_id: mission.id,
          business_id: mission.business_id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error ?? 'Failed to start mission.');
      }

      toast.success('Mission started successfully!');
      void fetchMissionProgress();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start mission';
      toast.error(errorMessage);
    }
  };

  return (
    <Card className={`border-2 hover:shadow-lg transition-all duration-300 ${isProgress ? 'border-blue-200' : 'border-gray-200 hover:border-blue-300'
      }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">{mission.business_name}</span>
          </div>
          {isProgress && mission.progress && (
            <Badge className={getStatusColor(mission.progress.status)}>
              {getStatusIcon(mission.progress.status)}
              <span className="ml-1 capitalize">{mission.progress.status.replace('_', ' ')}</span>
            </Badge>
          )}
        </div>

        <CardTitle className="text-lg font-semibold text-gray-800 line-clamp-2">
          {mission.title}
        </CardTitle>

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
          <Gift className="w-4 h-4 text-green-600" />
          <Badge className="bg-green-100 text-green-800 text-xs font-medium text-wrap">
            {mission.offer}
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>Expires: {new Date(mission.expires_at).toLocaleDateString()}</span>
        </div>

        {!isProgress && !mission.progress ? (
          <Button
            onClick={() => startMission(mission)}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 rounded-xl transition-all duration-300"
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            Show and Claim
          </Button>
        ) : mission.progress?.status === 'completed' ? (
          <Button disabled className="w-full bg-green-100 text-green-800 font-semibold py-2 rounded-xl">
            <CheckCircle className="w-4 h-4 mr-2" />
            Completed
          </Button>
        ) : mission.progress?.status === 'in_progress' ? (
          <Button asChild disabled className="w-full bg-blue-100 hover:bg-blue-100 text-blue-800 font-semibold py-2 rounded-xl">
            <div className='flex items-center'>
              <span className='flex grow items-center'>
                <Clock className="w-4 h-4 mr-2 inline-block" />
                In Progress
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger>
                  <MoreVertical className="w-4 h-4 ml-4 inline-block" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className='bg-white'>
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
  )
}
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import BusinessApprovalWrapper from '@/components/BusinessApprovalWrapper';
import { Plus, Trophy, Users, TrendingUp, Settings } from 'lucide-react';
import { TierManager, type Tier } from '@/components/TierManager';
import { NewTierForm } from '@/components/NewTierForm';


type LoyaltyProgram = {
  id: number;
  points_rate: number;
  tiers: Tier[];
};

export default function LoyaltyPage() {
  const { user, role, loading } = useAuthSession();
  const router = useRouter();

  const [program, setProgram] = useState<LoyaltyProgram | null>(null);
  const [loadingProgram, setLoadingProgram] = useState(false);
  const [showNewTierForm, setShowNewTierForm] = useState(false);
  const [saving, setSaving] = useState(false);

  async function loadProgram() {
    try {
      setLoadingProgram(true);
      const res = await fetch('/api/business/loyalty');
      const data = await res.json() as LoyaltyProgram[];
      if (Array.isArray(data) && data.length > 0) setProgram(data[0]);
      else setProgram(null);
    } catch (err) {
      toast.error('Failed to load loyalty program');
      console.error(err);
      setProgram(null);
    } finally {
      setLoadingProgram(false);
    }
  }

  async function handleSaveTier(newTier: Tier) {
    try {
      setSaving(true);
      const payload: { tier: Tier; points_rate?: number } = { tier: newTier };

      if (!program) {
        const points_rate = parseFloat(prompt('Enter points rate for new program (default: 1)') ?? '1');
        if (isNaN(points_rate) || points_rate <= 0) {
          toast.error('Invalid points rate. Using default value 1.');
          payload.points_rate = 1;
        } else {
          payload.points_rate = points_rate;
        }
      }

      const res = await fetch('/api/business/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success('Tier created successfully!');
        await loadProgram();
      } else {
        const data = await res.json();
        toast.error(data.error ?? 'Failed to create tier');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error creating tier');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateTier(updatedTier: Tier, tierIndex: number) {
    if (!program) return;

    try {
      setSaving(true);
      const updatedTiers = [...program.tiers];
      updatedTiers[tierIndex] = updatedTier;

      const res = await fetch('/api/business/loyalty', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tiers: updatedTiers }),
      });

      if (res.ok) {
        toast.success('Tier updated successfully!');
        await loadProgram();
      } else {
        const data = await res.json();
        toast.error(data.error ?? 'Failed to update tier');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating tier');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTier(tierIndex: number) {
    if (!program) return;

    const tier = program.tiers[tierIndex];
    if (!confirm(`Delete tier "${tier.name}"? This action cannot be undone.`)) return;

    try {
      setSaving(true);
      const res = await fetch('/api/business/loyalty', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierName: tier.name }),
      });

      if (res.ok) {
        toast.success('Tier deleted successfully!');
        await loadProgram();
      } else {
        const data = await res.json();
        toast.error(data.error ?? 'Failed to delete tier');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error deleting tier');
    } finally {
      setSaving(false);
    }
  }

  async function handleMoveTier(tierIndex: number, direction: 'up' | 'down') {
    if (!program) return;

    const newIndex = direction === 'up' ? tierIndex - 1 : tierIndex + 1;
    if (newIndex < 0 || newIndex >= program.tiers.length) return;

    try {
      setSaving(true);
      const updatedTiers = [...program.tiers];
      [updatedTiers[tierIndex], updatedTiers[newIndex]] = [updatedTiers[newIndex], updatedTiers[tierIndex]];

      const res = await fetch('/api/business/loyalty', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tiers: updatedTiers }),
      });

      if (res.ok) {
        toast.success('Tier order updated!');
        await loadProgram();
      } else {
        const data = await res.json();
        toast.error(data.error ?? 'Failed to update tier order');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating tier order');
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!loading) {
      if (!user || role !== 'business') router.push('/login/business');
      else void loadProgram();
    }
  }, [loading, user, role, router]);

  if (loading || loadingProgram) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading loyalty program...</p>
        </div>
      </div>
    );
  }

  return (
    <BusinessApprovalWrapper>
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Loyalty Program</h1>
                <p className="text-gray-600">Manage your customer loyalty tiers and rewards</p>
              </div>
              <Button
                onClick={() => setShowNewTierForm(true)}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add New Tier
              </Button>
            </div>
          </div>
        </div>

        {program && (
          <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Trophy className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Tiers</p>
                      <p className="text-2xl font-bold text-gray-900">{program.tiers.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Points Rate</p>
                      <p className="text-2xl font-bold text-gray-900">{program.points_rate}:1</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Rewards</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {program.tiers.reduce((sum, tier) => sum + tier.rewards.length, 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Settings className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Status</p>
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Active
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 pb-8">
          {!program ? (
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="p-4 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Trophy className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Loyalty Program Yet</h3>
                  <p className="text-gray-600 mb-6">
                    Create your first loyalty tier to start rewarding your customers and building long-term relationships.
                  </p>
                  <Button
                    onClick={() => setShowNewTierForm(true)}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Tier
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Loyalty Tiers</h2>
                <p className="text-gray-600">
                  {program.tiers.length} tier{program.tiers.length !== 1 ? 's' : ''} configured
                </p>
              </div>

              {program.tiers.map((tier, index) => (
                <TierManager
                  key={tier.id ?? index}
                  tier={tier}
                  onTierChange={(updatedTier) => handleUpdateTier(updatedTier, index)}
                  onDelete={() => handleDeleteTier(index)}
                  onMoveUp={index > 0 ? () => handleMoveTier(index, 'up') : undefined}
                  onMoveDown={index < program.tiers.length - 1 ? () => handleMoveTier(index, 'down') : undefined}
                  canMoveUp={index > 0}
                  canMoveDown={index < program.tiers.length - 1}
                  disabled={saving}
                />
              ))}
            </div>
          )}
        </div>

        {/* New Tier Form Modal */}
        <NewTierForm
          isOpen={showNewTierForm}
          onClose={() => setShowNewTierForm(false)}
          onSave={handleSaveTier}
          disabled={saving}
        />
      </div>
    </BusinessApprovalWrapper>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

type Reward = {
  reward_type: string;
  description: string;
  value: number;
};

type Tier = {
  name: string;
  points_to_unlock: number;
  rewards: Reward[];
};

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

  const [showTierForm, setShowTierForm] = useState(false);
  const [newTierName, setNewTierName] = useState('');
  const [newTierPoints, setNewTierPoints] = useState('');
  const [newRewards, setNewRewards] = useState<Reward[]>([]);
  const [rewardInput, setRewardInput] = useState({ reward_type: '', description: '', value: '' });

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

  async function handleDeleteTier(tierName: string) {
    if (!confirm(`Delete tier "${tierName}"?`)) return;
    try {
      const res = await fetch('/api/business/loyalty', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierName }),
      });
      const data = await res.json() as { message?: string; error?: string };
      if (res.ok) {
        toast.success(data.message ?? 'Tier deleted');
        void loadProgram();
      } else {
        toast.error(data.error ?? 'Failed to delete tier');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error deleting tier');
    }
  }

  async function handleDeleteReward(tierName: string, reward: Reward) {
    if (!confirm(`Delete reward "${reward.description}" from tier "${tierName}"?`)) return;
    try {
      const res = await fetch('/api/business/loyalty', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierName, reward }),
      });
      const data = await res.json() as { message?: string; error?: string };
      if (res.ok) {
        toast.success(data.message ?? 'Reward deleted');
        void loadProgram();
      } else {
        toast.error(data.error ?? 'Failed to delete reward');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error deleting reward');
    }
  }

  useEffect(() => {
    if (!loading) {
      if (!user || role !== 'business') router.push('/login/business');
      else void loadProgram();
    }
  }, [loading, user, role, router]);

  if (loading || loadingProgram) return <div>Loading loyalty program...</div>;

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Loyalty Program</h1>
        <Button onClick={() => setShowTierForm(true)}>Add Tier</Button>
      </div>

      {showTierForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-96">
            <h2 className="text-xl font-semibold mb-4">Add New Tier</h2>

            <Input
              placeholder="Tier Name"
              value={newTierName}
              onChange={e => setNewTierName(e.target.value)}
              className="mb-2"
            />
            <Input
              type="number"
              placeholder="Points to Unlock"
              value={newTierPoints}
              onChange={e => setNewTierPoints(e.target.value)}
              className="mb-4"
            />

            <div>
              <p className="font-semibold mb-2">Rewards</p>
              {newRewards.map((r, i) => (
                <div key={i} className="flex justify-between items-center mb-1">
                  <span>{r.reward_type} - {r.description} ({r.value})</span>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setNewRewards(prev => prev.filter((_, idx) => idx !== i))}
                  >
                    Delete
                  </Button>
                </div>
              ))}

              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Type"
                  value={rewardInput.reward_type}
                  onChange={e => setRewardInput({ ...rewardInput, reward_type: e.target.value })}
                />
                <Input
                  placeholder="Description"
                  value={rewardInput.description}
                  onChange={e => setRewardInput({ ...rewardInput, description: e.target.value })}
                />
                <Input
                  placeholder="Value"
                  type="number"
                  value={rewardInput.value}
                  onChange={e => setRewardInput({ ...rewardInput, value: e.target.value })}
                />
                <Button
                  onClick={() => {
                    if(rewardInput.reward_type && rewardInput.description && rewardInput.value){
                      setNewRewards([...newRewards, { ...rewardInput, value: Number(rewardInput.value) }]);
                      setRewardInput({ reward_type: '', description: '', value: '' });
                    }
                  }}
                >
                  Add Reward
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowTierForm(false);
                  setNewTierName(''); setNewTierPoints(''); setNewRewards([]);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!newTierName || !newTierPoints) return alert('Please fill all fields');

                  const payload: any = { tier: { name: newTierName, points_to_unlock: Number(newTierPoints), rewards: newRewards } };
                  if(!program){
                    const points_rate = parseFloat(prompt('Enter points_rate for new program') || '0');
                    if(isNaN(points_rate)) return alert('Invalid points rate');
                    payload.points_rate = points_rate;
                  }

                  try {
                    const res = await fetch('/api/business/loyalty', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload),
                    });
                    const data = await res.json();
                    if(res.ok){
                      alert('Tier added!');
                      loadProgram();
                      setShowTierForm(false);
                      setNewTierName(''); setNewTierPoints(''); setNewRewards([]);
                    } else {
                      alert(data.error || 'Error adding tier');
                    }
                  } catch(err){
                    console.error(err);
                    alert('Error adding tier');
                  }
                }}
              >
                Save Tier
              </Button>
            </div>
          </div>
        </div>
      )}

      {!program ? (
        <div>No loyalty program found. Add a tier to create one.</div>
      ) : (
        <div>
          <p>Points Rate: {program.points_rate}</p>
          <div className="grid gap-4 mt-4">
            {program.tiers.map((tier, idx) => (
              <Card key={idx} className="p-4">
                <CardHeader className="flex justify-between">
                  <CardTitle>{tier.name}</CardTitle>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteTier(tier.name)}
                  >
                    Delete Tier
                  </Button>
                </CardHeader>
                <CardContent>
                  <p>Points to Unlock: {tier.points_to_unlock}</p>
                  <div className="mt-2">
                    <p className="font-semibold">Rewards:</p>
                    {tier.rewards.length === 0 ? (
                      <p>None</p>
                    ) : (
                      tier.rewards.map((reward, rIdx) => (
                        <div key={rIdx} className="flex justify-between items-center">
                          <span>
                            {reward.reward_type} - {reward.description} ({reward.value})
                          </span>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteReward(tier.name, reward)}
                          >
                            Delete
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

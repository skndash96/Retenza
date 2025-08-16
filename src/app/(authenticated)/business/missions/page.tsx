'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

export default function BusinessMissionsPage() {
  const { user, role, loading } = useAuthSession();
  const router = useRouter();

  const [missions, setMissions] = useState<any[]>([]);
  const [availableTiers, setAvailableTiers] = useState<string[]>([]);
  const [loadingMissions, setLoadingMissions] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [newExpiry, setNewExpiry] = useState('');

  async function loadMissions() {
    try {
      setLoadingMissions(true);
      const res = await fetch('/api/business/missions');
      const data = await res.json();
      setMissions(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Failed to load missions. Please try again.');
      console.error(err);
      setMissions([]);
    } finally {
      setLoadingMissions(false);
    }
  }

  async function loadTiers() {
    try {
      const res = await fetch('/api/business/missions/tiers');
      const data = await res.json();
      setAvailableTiers(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Failed to load tiers. Please try again.');
      console.error("Error loading tiers:", err);
    }
  }

  async function handleCreateMission() {
    if (!newTitle || !newDescription || !newExpiry) {
      toast.error('Please fill all required fields');
      return;
    }

    const payload = {
      title: newTitle,
      description: newDescription,
      applicable_tiers: selectAll ? ['all', ...availableTiers] : selectedTiers,
      expires_at: newExpiry,
    };

    try {
      const res = await fetch('/api/business/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json();
        toast.error(errData.error || 'Failed to create mission');
        return;
      }
      await res.json();
      toast.success('Mission created successfully!');
      resetForm();
      loadMissions();
    } catch (err) {
      console.error(err);
      toast.error('Error creating mission');
    }
  }

  async function handleDeleteMission(id: number) {
    if (!confirm("Are you sure you want to delete this mission?")) return;

    try {
      const res = await fetch('/api/business/missions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const errData = await res.json();
        toast.error(errData.error || 'Failed to delete mission');
        return;
      }
      loadMissions();
    } catch (err) {
      console.error(err);
      toast.error('Error deleting mission');
    }
  }

  function resetForm() {
    setNewTitle('');
    setNewDescription('');
    setSelectedTiers([]);
    setSelectAll(false);
    setNewExpiry('');
    setShowForm(false);
  }

  useEffect(() => {
    if (!loading) {
      if (!user || role !== 'business') router.push('/login/business');
      else {
        loadMissions();
        loadTiers();
      }
    }
  }, [loading, user, role]);

  if (loading || loadingMissions) return <div className="min-h-screen flex items-center justify-center">Loading missions…</div>;

  return (
    <div className="container mx-auto px-6 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-extrabold text-slate-900">Missions</h1>
        <Button onClick={() => setShowForm(true)}>Add Mission</Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-96">
            <h2 className="text-xl font-semibold mb-4">New Mission</h2>
            <div className="flex flex-col gap-3">
              <Input placeholder="Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
              <Input placeholder="Description" value={newDescription} onChange={e => setNewDescription(e.target.value)} />
              
              <div className="border p-3 rounded">
                <label className="font-medium">Applicable Tiers:</label>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center gap-2">
                    <Checkbox checked={selectAll} onCheckedChange={checked => { setSelectAll(!!checked); setSelectedTiers([]); }} />
                    Select All
                  </label>
                  {!selectAll && availableTiers.map(tier => (
                    <label key={tier} className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedTiers.includes(tier)}
                        onCheckedChange={checked => {
                          setSelectedTiers(prev => checked ? [...prev, tier] : prev.filter(x => x !== tier));
                        }}
                      />
                      {tier}
                    </label>
                  ))}
                </div>
              </div>

              <Input type="date" value={newExpiry} onChange={e => setNewExpiry(e.target.value)} />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleCreateMission}>Create</Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {missions.length ? missions.map(mission => (
          <Card key={mission.id} className="min-h-[200px] rounded-xl hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex justify-between items-center">
              <CardTitle>{mission.title}</CardTitle>
              <Button variant="destructive" size="sm" onClick={() => handleDeleteMission(mission.id)}>Delete</Button>
            </CardHeader>
            <CardContent>
              <p>{mission.description}</p>
              {mission.applicable_tiers.length > 0 && (
                  <p className="text-sm text-gray-500">
                    Tiers: {mission.applicable_tiers
                      .map(t => (typeof t === "object" && t !== null ? t.name : String(t)))
                      .join(', ')}
                  </p>
                )}
              <p className="text-sm text-gray-500">Expires: {new Date(mission.expires_at).toLocaleDateString()}</p>
            </CardContent>
          </Card>
        )) : (
          <div className="text-center text-gray-500 col-span-full">No missions found.</div>
        )}
      </div>
    </div>
  );
}

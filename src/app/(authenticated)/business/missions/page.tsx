'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Sparkles } from 'lucide-react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import BusinessApprovalWrapper from '@/components/BusinessApprovalWrapper';

export default function BusinessMissionsPage() {
  const { user, role, loading } = useAuthSession();
  const router = useRouter();

  const [missions, setMissions] = useState<Array<{
    id: number;
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
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }>>([]);
  const [availableTiers, setAvailableTiers] = useState<string[]>([]);
  const [loadingMissions, setLoadingMissions] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingMission, setEditingMission] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newOffer, setNewOffer] = useState('');
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [newExpiry, setNewExpiry] = useState('');
  const [newFilters, setNewFilters] = useState<{
    gender?: ('Male' | 'Female' | 'Other')[];
    age_range?: { min: number; max: number };
    location?: string[];
    customer_type?: string[];
  }>({});
  const [newIsActive, setNewIsActive] = useState(true);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);



  // Mission templates
  const missionTemplates = [
    {
      title: 'Perfect Pair (2-Shop Collab)',
      description: 'Team up with another shop nearby! Customers who visit both stores during this mission unlock a special reward. Great for cross-promotion.',
      customerMessage: 'Perfect Pair! Shop at [Your Store Name] and our partner [Partner Store Name] this week to unlock a special surprise. Don\'t miss this collab offer!',
      offer: 'Special collaboration reward'
    },
    {
      title: 'Social Spotlight Post',
      description: 'Encourage customers to tag your shop on social media. Boosts visibility and engages your community.',
      customerMessage: 'Social Spotlight! Share a post or story tagging [Your Store Name] and show it at the counter to claim your reward. Spread the love!',
      offer: 'Social media reward'
    },
    {
      title: 'Squad Goals Mission',
      description: 'Reward groups of friends or families who visit together. Encourages social visits and bigger orders.',
      customerMessage: 'Squad Goals! Come with [X] friends and enjoy a special reward on us. The more, the merrier — bring your gang and celebrate!',
      offer: 'Group visit reward'
    },
    {
      title: 'Golden Hour Rush',
      description: 'Create buzz in quieter hours with time-limited deals.',
      customerMessage: 'Golden Hour Alert! Drop by between [Start Time] – [End Time] and grab exclusive offers. Limited time only — hurry in!',
      offer: 'Time-limited exclusive offer'
    },
    {
      title: 'Celebrate Life Mission (Personal Milestones)',
      description: 'Celebrate your customers\' personal milestones like birthdays, job offers, or achievements.',
      customerMessage: 'Got something to celebrate? Whether it\'s your birthday, a new job, or a personal win, celebrate with [Your Store Name] and get a special treat!',
      offer: 'Celebration special treat'
    },
    {
      title: 'Festive Special',
      description: 'Run seasonal or festive offers. Connect with customers during Diwali, Pongal, Christmas, or even a custom festival.',
      customerMessage: 'Festive Special! Celebrate [Festival/Season] with us. Visit [Your Store Name] and enjoy exclusive offers made for the season!',
      offer: 'Festive exclusive offer'
    }
  ];

  async function loadMissions() {
    try {
      setLoadingMissions(true);
      const res = await fetch('/api/business/missions');
      const data = await res.json() as Array<{
        id: number;
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
        is_active: boolean;
        created_at: string;
        updated_at: string;
      }>;
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
      const data = await res.json() as string[];
      setAvailableTiers(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Failed to load tiers. Please try again.');
      console.error("Error loading tiers:", err);
    }
  }



  async function handleCreateMission() {
    if (!newTitle || !newDescription || !newOffer || !newExpiry) {
      toast.error('Please fill all required fields');
      return;
    }

    const payload = {
      title: newTitle,
      description: newDescription,
      offer: newOffer,
      applicable_tiers: selectAll ? ['all', ...availableTiers] : selectedTiers,
      expires_at: newExpiry,
      filters: newFilters,
      is_active: newIsActive,
    };

    try {
      const res = await fetch('/api/business/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json() as { error?: string };
        toast.error(errData.error ?? 'Failed to create mission');
        return;
      }
      await res.json();
      toast.success('Mission created successfully!');
      resetForm();
      void loadMissions();
    } catch (err) {
      console.error(err);
      toast.error('Error creating mission');
    }
  }

  async function handleEditMission() {
    if (!editingMission || !newTitle || !newDescription || !newOffer || !newExpiry) {
      toast.error('Please fill all required fields');
      return;
    }

    const payload = {
      id: editingMission,
      title: newTitle,
      description: newDescription,
      offer: newOffer,
      applicable_tiers: selectAll ? ['all', ...availableTiers] : selectedTiers,
      expires_at: newExpiry,
      filters: newFilters,
      is_active: newIsActive,
    };

    try {
      const res = await fetch('/api/business/missions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json() as { error?: string };
        toast.error(errData.error ?? 'Failed to update mission');
        return;
      }
      await res.json();
      toast.success('Mission updated successfully!');
      resetForm();
      void loadMissions();
    } catch (err) {
      console.error(err);
      toast.error('Error updating mission');
    }
  }

  function startEditMission(mission: {
    id: number;
    title: string;
    description: string;
    offer: string;
    applicable_tiers: string[];
    expires_at: string;
    filters: {
      gender?: string[];
      age_range?: { min: number; max: number };
      location?: string[];
      customer_type?: string[];
    };
    is_active: boolean;
  }) {
    setEditingMission(mission.id);
    setNewTitle(mission.title);
    setNewDescription(mission.description);
    setNewOffer(mission.offer);
    setSelectedTiers(mission.applicable_tiers.filter((t: string) => t !== 'all'));
    setSelectAll(mission.applicable_tiers.includes('all'));
    setNewExpiry(new Date(mission.expires_at).toISOString().split('T')[0]);
    setNewFilters({
      ...(mission.filters ?? {}),
      gender: mission.filters?.gender as ('Male' | 'Female' | 'Other')[] | undefined
    });
    setNewIsActive(mission.is_active);

    // Set active filters based on existing mission filters
    const filters = [];
    if (mission.filters?.gender && mission.filters.gender.length > 0) filters.push('gender');
    if (mission.filters?.age_range) filters.push('age_range');
    if (mission.filters?.location && mission.filters.location.length > 0) filters.push('location');
    if (mission.filters?.customer_type && mission.filters.customer_type.length > 0) filters.push('customer_type');
    setActiveFilters(filters);

    setShowForm(true);
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
        const errData = await res.json() as { error?: string };
        toast.error(errData.error ?? 'Failed to delete mission');
        return;
      }
      void loadMissions();
    } catch (err) {
      console.error(err);
      toast.error('Error deleting mission');
    }
  }

  function resetForm() {
    setNewTitle('');
    setNewDescription('');
    setNewOffer('');
    setSelectedTiers([]);
    setSelectAll(false);
    setNewExpiry('');
    setNewFilters({});
    setNewIsActive(true);
    setEditingMission(null);
    setShowForm(false);
    setShowTemplates(false);
    setActiveFilters([]);
  }

  function applyTemplate(template: typeof missionTemplates[0]) {
    setNewTitle(template.title);
    setNewDescription(template.customerMessage);
    setNewOffer(template.offer);
    setShowTemplates(false);
    setShowForm(true);
  }

  function addFilter(filterType: string) {
    if (!activeFilters.includes(filterType)) {
      setActiveFilters([...activeFilters, filterType]);
    }
  }

  function removeFilter(filterType: string) {
    setActiveFilters(activeFilters.filter(f => f !== filterType));
    // Clear the filter data when removing
    setNewFilters(prev => {
      const updated = { ...prev };
      if (filterType === 'gender') updated.gender = undefined;
      if (filterType === 'age_range') updated.age_range = undefined;
      if (filterType === 'location') updated.location = undefined;
      if (filterType === 'customer_type') updated.customer_type = undefined;
      return updated;
    });
  }

  useEffect(() => {
    if (!loading) {
      if (!user || role !== 'business') router.push('/login/business');
      else {
        void loadMissions();
        void loadTiers();
      }
    }
  }, [loading, user, role, router]);

  if (loading || loadingMissions) return <div className="min-h-screen flex items-center justify-center">Loading missions…</div>;

  return (
    <BusinessApprovalWrapper>
      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-extrabold text-slate-900">Missions</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowTemplates(true)}>
              <Sparkles className="mr-2 h-4 w-4" />
              Use Template
            </Button>
            <Button onClick={() => setShowForm(true)}>Custom Mission</Button>
          </div>
        </div>

        {showTemplates && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Choose a Mission Template</h2>
                <Button variant="outline" onClick={() => setShowTemplates(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {missionTemplates.map((template, index) => (
                  <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => applyTemplate(template)}>
                    <CardHeader>
                      <CardTitle className="text-lg">{template.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-xs text-blue-800 font-medium mb-1">Customer Message Preview:</p>
                        <p className="text-sm text-blue-700">{template.customerMessage}</p>
                      </div>
                      <div className="mt-3">
                        <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          {template.offer}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Custom Mission Option */}
                <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-dashed border-gray-300" onClick={() => { setShowTemplates(false); setShowForm(true); }}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Plus className="mr-2 h-5 w-5" />
                      Custom Mission
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">Create your own mission from scratch. You decide the rules, reward, and timing.</p>
                    <div className="bg-gray-50 p-3 rounded-lg mt-3">
                      <p className="text-xs text-gray-600 font-medium mb-1">Perfect for:</p>
                      <p className="text-sm text-gray-700">Unique business needs, special events, or creative promotional ideas</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-96 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">
                {editingMission ? 'Edit Mission' : 'New Mission'}
              </h2>
              <div className="flex flex-col gap-3">
                <Input placeholder="Title" value={newTitle || ""} onChange={e => setNewTitle(e.target.value)} />
                <Input placeholder="Description" value={newDescription || ""} onChange={e => setNewDescription(e.target.value)} />
                <Input placeholder="Offer (e.g., 10% cashback, Free coffee, etc.)" value={newOffer || ""} onChange={e => setNewOffer(e.target.value)} />

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

                <div className="border p-3 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <label className="font-medium">Filters (Optional):</label>
                    <Select onValueChange={addFilter}>
                      <SelectTrigger className="w-32">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Filter
                      </SelectTrigger>
                      <SelectContent>
                        {!activeFilters.includes('gender') && <SelectItem value="gender">Gender</SelectItem>}
                        {!activeFilters.includes('age_range') && <SelectItem value="age_range">Age Range</SelectItem>}
                        {!activeFilters.includes('location') && <SelectItem value="location">Location</SelectItem>}
                        {!activeFilters.includes('customer_type') && <SelectItem value="customer_type">Customer Type</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>

                  {activeFilters.length === 0 && (
                    <p className="text-sm text-gray-500">No filters applied - mission will be available to all customers</p>
                  )}

                  <div className="space-y-3">
                    {activeFilters.includes('gender') && (
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-medium text-gray-700">Gender Filter:</label>
                          <Button variant="ghost" size="sm" onClick={() => removeFilter('gender')}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Select
                          value={newFilters.gender?.join(',') ?? 'all'}
                          onValueChange={(value) => {
                            if (value === 'all') {
                              setNewFilters(prev => ({ ...prev, gender: undefined }));
                            } else {
                              setNewFilters(prev => ({ ...prev, gender: value.split(',').filter(s => s.trim()) as ('Male' | 'Female' | 'Other')[] }));
                            }
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select gender(s)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All genders</SelectItem>
                            <SelectItem value="Male">Male only</SelectItem>
                            <SelectItem value="Female">Female only</SelectItem>
                            <SelectItem value="Other">Other only</SelectItem>
                            <SelectItem value="Male,Female">Male & Female</SelectItem>
                            <SelectItem value="Male,Other">Male & Other</SelectItem>
                            <SelectItem value="Female,Other">Female & Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {activeFilters.includes('age_range') && (
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-medium text-gray-700">Age Range Filter:</label>
                          <Button variant="ghost" size="sm" onClick={() => removeFilter('age_range')}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Min age"
                            value={newFilters.age_range?.min ?? ''}
                            onChange={e => setNewFilters(prev => ({
                              ...prev,
                              age_range: {
                                min: parseInt(e.target.value) || 0,
                                max: prev.age_range?.max ?? 100
                              }
                            }))}
                          />
                          <Input
                            type="number"
                            placeholder="Max age"
                            value={newFilters.age_range?.max ?? ''}
                            onChange={e => setNewFilters(prev => ({
                              ...prev,
                              age_range: {
                                min: prev.age_range?.min ?? 0,
                                max: parseInt(e.target.value) || 100
                              }
                            }))}
                          />
                        </div>
                      </div>
                    )}

                    {activeFilters.includes('location') && (
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-medium text-gray-700">Location Filter:</label>
                          <Button variant="ghost" size="sm" onClick={() => removeFilter('location')}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input
                          placeholder="e.g., Mumbai, Delhi, Bangalore"
                          value={newFilters.location?.join(',') ?? ''}
                          onChange={e => setNewFilters(prev => ({ ...prev, location: e.target.value.split(',').filter(s => s.trim()) }))}
                        />
                      </div>
                    )}

                    {activeFilters.includes('customer_type') && (
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-medium text-gray-700">Customer Type Filter:</label>
                          <Button variant="ghost" size="sm" onClick={() => removeFilter('customer_type')}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input
                          placeholder="e.g., new, returning, vip"
                          value={newFilters.customer_type?.join(',') ?? ''}
                          onChange={e => setNewFilters(prev => ({ ...prev, customer_type: e.target.value.split(',').filter(s => s.trim()) }))}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={newIsActive}
                    onCheckedChange={checked => setNewIsActive(!!checked)}
                  />
                  <label className="text-sm">Active</label>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Expiry Date:</label>
                  <Input type="date" value={newExpiry} onChange={e => setNewExpiry(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={editingMission ? handleEditMission : handleCreateMission}>
                  {editingMission ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {missions.length ? missions.map(mission => (
            <Card key={mission.id} className={`min-h-[200px] rounded-xl hover:shadow-lg transition-shadow duration-200 ${!mission.is_active ? 'opacity-60' : ''}`}>
              <CardHeader className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CardTitle>{mission.title}</CardTitle>
                  {!mission.is_active && (
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Inactive</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => startEditMission(mission)}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteMission(mission.id)}>Delete</Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-3">{mission.description}</p>

                <div className="mb-3">
                  <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    {mission.offer}
                  </span>
                </div>

                {mission.applicable_tiers.length > 0 && (
                  <p className="text-sm text-gray-500 mb-2">
                    <strong>Tiers:</strong> {mission.applicable_tiers
                      .map((t: unknown) => (typeof t === "object" && t !== null ? (t as { name: string }).name : String(t)))
                      .join(', ')}
                  </p>
                )}

                {mission.filters && Object.keys(mission.filters).length > 0 && (
                  <div className="mb-2">
                    <p className="text-sm text-gray-500"><strong>Filters:</strong></p>
                    {mission.filters?.gender && mission.filters.gender.length > 0 && (
                      <p className="text-xs text-gray-400">Gender: {mission.filters.gender.join(', ')}</p>
                    )}
                    {mission.filters?.age_range && (
                      <p className="text-xs text-gray-400">Age: {mission.filters.age_range.min}-{mission.filters.age_range.max}</p>
                    )}
                    {mission.filters?.location && mission.filters.location.length > 0 && (
                      <p className="text-xs text-gray-400">Location: {mission.filters.location.join(', ')}</p>
                    )}
                  </div>
                )}

                <div className="text-sm text-gray-500 space-y-1">
                  <p><strong>Status:</strong> {mission.is_active ? 'Active' : 'Inactive'}</p>
                  <p><strong>Expires:</strong> {new Date(mission.expires_at).toLocaleDateString()}</p>
                  <p><strong>Created:</strong> {new Date(mission.created_at).toLocaleDateString()}</p>
                  {mission.updated_at !== mission.created_at && (
                    <p><strong>Updated:</strong> {new Date(mission.updated_at).toLocaleDateString()}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )) : (
            <div className="text-center text-gray-500 col-span-full">No missions found.</div>
          )}
        </div>


      </div>
    </BusinessApprovalWrapper>
  );
}

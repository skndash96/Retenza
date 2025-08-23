'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trophy, TrendingUp, Users, RefreshCcw, DollarSign, Target, Activity, Star, BarChart3 } from 'lucide-react';
import { BusinessNotificationPanel } from '@/components/BusinessNotificationPanel';
import BusinessApprovalWrapper from '@/components/BusinessApprovalWrapper';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useRouter } from 'next/navigation';
import { useAuthSession } from '@/hooks/useAuthSession';
import { toast } from 'react-toastify';

type DashboardRow = {
  c: { id: number; name: string | null; phone_number: string | null; created_at: string | null; updated_at: string | null; };
  cl: { customer_id: number; business_id: number; points: number; current_tier_name: string | null; created_at: string | null; updated_at: string | null; } | null;
  last_txn_at: string | null;
};

type DashboardPayload = {
  customers: DashboardRow[];
  transactionsLastWeek: number;
  transactionsLastMonth: number;
  totalRevenue: number;
  totalPoints: number;
  avgBillAmount: number;
  totalMissions: number;
  activeMissions: number;
  activeCustomers: number;
  newThisWeek: number;
  newThisMonth: number;
  newThisQuarter: number;
  topCustomers: Array<{
    customer_id: number;
    points: number;
    tier: string | null;
  }>;
  recentTransactions: Array<{
    id: number;
    customer_id: number;
    bill_amount: string;
    points_awarded: number;
    created_at: string;
  }>;
  businessProfile: {
    name: string;
    description: string;
    logo_url: string;
    business_type: string;
  };
};

export default function BusinessDashboardPage() {
  const router = useRouter();
  const { user, role, loading: sessionLoading } = useAuthSession();
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);


  async function fetchDashboard() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/business/dashboard', { cache: 'no-store' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { error?: string };
        toast.error(j?.error ?? `Failed to load dashboard (${res.status})`);
        throw new Error(j?.error ?? `Failed to load dashboard (${res.status})`);
      }
      const json = (await res.json()) as DashboardPayload;
      setPayload(json);
    } catch (e: unknown) {
      const errorMessage = (e as Error)?.message ?? 'Failed to load dashboard';
      toast.error(errorMessage);
      setError(errorMessage);
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (sessionLoading) return;
    if (!user || role !== 'business') {
      router.push('/login/business');
      return;
    }
    void fetchDashboard();
  }, [sessionLoading, user, role, router]);

  const { totalCustomers, avgPointsPerCustomer, topPoints, recentActivity } = useMemo(() => {
    const empty = { totalCustomers: 0, avgPointsPerCustomer: 0, topPoints: [], recentActivity: [] };
    if (!payload) return empty;

    const rows = payload.customers || [];
    const total = rows.length;
    const pointsArr = rows.map(r => r.cl?.points ?? 0);
    const totalPoints = pointsArr.reduce((a, b) => a + b, 0);
    const avgPoints = total ? Math.round((totalPoints / total) * 10) / 10 : 0;

    const leaderboard = rows.map(r => ({ id: r.c.id, name: r.c.name ?? `Customer #${r.c.id}`, points: r.cl?.points ?? 0 }))
      .sort((a, b) => b.points - a.points).slice(0, 5);

    const recents = rows.map(r => ({ id: r.c.id, name: r.c.name ?? `Customer #${r.c.id}`, last_txn_at: r.last_txn_at }))
      .sort((a, b) => (b.last_txn_at ? new Date(b.last_txn_at).getTime() : 0) - (a.last_txn_at ? new Date(a.last_txn_at).getTime() : 0))
      .slice(0, 8);

    return { totalCustomers: total, avgPointsPerCustomer: avgPoints, topPoints: leaderboard, recentActivity: recents };
  }, [payload]);

  if (sessionLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-white via-slate-50 to-sky-50 text-slate-700">
        <Loader2 className="animate-spin mr-2" /> Loading dashboard…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive bg-white shadow">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-destructive">Dashboard Error</CardTitle>
            <Button variant="outline" onClick={fetchDashboard} className="flex items-center">
              <RefreshCcw className="mr-2 h-4 w-4" /> Retry
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <BusinessApprovalWrapper>
      <main className="p-6 bg-gradient-to-b from-white via-slate-50 to-sky-50 min-h-screen space-y-6">
        {/* Business Header with Logo */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {payload?.businessProfile?.logo_url ? (
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-200 shadow-sm">
                  <img
                    src={payload.businessProfile.logo_url}
                    alt={`${payload.businessProfile.name} logo`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-slate-200 flex items-center justify-center">
                  <span className="text-2xl font-bold text-slate-400">
                    {payload?.businessProfile?.name?.charAt(0)?.toUpperCase() ?? 'B'}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  {payload?.businessProfile?.name ?? 'Business Dashboard'}
                </h1>
              </div>
            </div>
            <Button variant="secondary" onClick={fetchDashboard} className="px-4 py-2">
              <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[{
            title: 'Total Revenue', value: `₹${(payload?.totalRevenue ?? 0).toLocaleString()}`, icon: DollarSign, desc: 'from all transactions'
          }, {
            title: 'Total Points', value: (payload?.totalPoints ?? 0).toLocaleString(), icon: Trophy, desc: 'awarded to customers'
          }, {
            title: 'Avg Bill Amount', value: `₹${(payload?.avgBillAmount ?? 0).toFixed(2)}`, icon: BarChart3, desc: 'per transaction'
          }, {
            title: 'Active Customers', value: payload?.activeCustomers ?? 0, icon: Users, desc: 'in last 30 days'
          }].map((kpi, idx) => (
            <Card key={idx} className="bg-white shadow rounded-xl">
              <CardHeader className="flex items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <kpi.icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {kpi.value}
                </div>
                <p className="text-xs text-muted-foreground">{kpi.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Second Row of KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[{
            title: 'Total Customers', value: totalCustomers, icon: Users, desc: 'with loyalty at your business'
          }, {
            title: 'Avg Points / Customer', value: avgPointsPerCustomer, icon: Trophy, desc: 'current snapshot'
          }, {
            title: 'Total Missions', value: payload?.totalMissions ?? 0, icon: Target, desc: 'created for customers'
          }, {
            title: 'Active Missions', value: payload?.activeMissions ?? 0, icon: Activity, desc: 'currently running'
          }].map((kpi, idx) => (
            <Card key={`row2-${idx}`} className="bg-white shadow rounded-xl">
              <CardHeader className="flex items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <kpi.icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {kpi.value}
                </div>
                <p className="text-xs text-muted-foreground">{kpi.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Third Row - Customer Acquisition Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[{
            title: 'New This Week', value: payload?.newThisWeek ?? 0, icon: TrendingUp, desc: 'customers joined'
          }, {
            title: 'New This Month', value: payload?.newThisMonth ?? 0, icon: TrendingUp, desc: 'customers joined'
          }, {
            title: 'New This Quarter', value: payload?.newThisQuarter ?? 0, icon: TrendingUp, desc: 'customers joined'
          }].map((kpi, idx) => (
            <Card key={`row3-${idx}`} className="bg-white shadow rounded-xl">
              <CardHeader className="flex items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <kpi.icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {kpi.value}
                </div>
                <p className="text-xs text-muted-foreground">{kpi.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="h-[360px] bg-white shadow rounded-xl">
            <CardHeader>
              <CardTitle>Revenue & Points Overview</CardTitle>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Revenue', value: payload?.totalRevenue ?? 0, color: '#10b981' },
                  { name: 'Points', value: (payload?.totalPoints ?? 0) / 100, color: '#f59e0b' }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [
                    name === 'Revenue' ? `₹${Number(value).toLocaleString()}` : `${Number(value).toLocaleString()} pts`,
                    name
                  ]} />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="h-[360px] bg-white shadow rounded-xl">
            <CardHeader>
              <CardTitle>Customer Growth Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { period: 'This Week', new: payload?.newThisWeek ?? 0 },
                  { period: 'This Month', new: payload?.newThisMonth ?? 0 },
                  { period: 'This Quarter', new: payload?.newThisQuarter ?? 0 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="new" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Business Performance Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-white shadow rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Top Customers by Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payload?.topCustomers && payload.topCustomers.length > 0 ? (
                <div className="space-y-3">
                  {payload.topCustomers.slice(0, 5).map((customer, index) => (
                    <div key={customer.customer_id} className="flex items-center justify-between rounded-xl border p-3 hover:bg-blue-50 cursor-pointer" onClick={() => router.push(`/business/customers/${customer.customer_id}`)}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold">#{index + 1}</div>
                        <div className="flex flex-col">
                          <span className="font-medium">Customer #{customer.customer_id}</span>
                          <span className="text-xs text-muted-foreground">{customer.tier ?? 'No tier'}</span>
                        </div>
                      </div>
                      <div className="text-right font-semibold text-blue-600">{customer.points.toLocaleString()} pts</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No customer data available.</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white shadow rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payload?.recentTransactions && payload.recentTransactions.length > 0 ? (
                <div className="space-y-3">
                  {payload.recentTransactions.slice(0, 5).map((txn) => (
                    <div key={txn.id} className="flex items-center justify-between rounded-xl border p-3 hover:bg-green-50 cursor-pointer" onClick={() => router.push(`/business/customers/${txn.customer_id}`)}>
                      <div className="flex flex-col">
                        <span className="font-medium">Customer #{txn.customer_id}</span>
                        <span className="text-xs text-muted-foreground">{formatDateTime(txn.created_at)}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">₹{Number(txn.bill_amount).toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">+{txn.points_awarded} pts</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recent transactions.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Business Performance Summary */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <BarChart3 className="h-6 w-6" />
              Business Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalCustomers}</div>
                <div className="text-sm text-blue-700">Total Customers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">₹{(payload?.totalRevenue ?? 0).toLocaleString()}</div>
                <div className="text-sm text-green-700">Total Revenue</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{(payload?.totalPoints ?? 0).toLocaleString()}</div>
                <div className="text-sm text-purple-700">Total Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{payload?.activeMissions ?? 0}</div>
                <div className="text-sm text-orange-700">Active Missions</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Row */}
        <div className="mb-6">
          <Card className="bg-white shadow rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Customer Engagement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Send notifications to engage your customers and drive loyalty
                </p>
                <BusinessNotificationPanel
                  businessId={user?.id ?? 0}
                  businessName="Your Business"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lists Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Points Leaderboard */}
          <Card className="bg-white shadow rounded-xl">
            <CardHeader><CardTitle>Points Leaderboard</CardTitle></CardHeader>
            <CardContent>
              {topPoints.length ? (
                <div className="space-y-3">
                  {topPoints.map((u, i) => (
                    <div key={u.id} className="flex items-center justify-between rounded-xl border p-3 hover:bg-amber-50 cursor-pointer" onClick={() => router.push(`/business/customers/${u.id}`)}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-semibold">#{i + 1}</div>
                        <div className="flex flex-col">
                          <span className="font-medium">{u.name}</span>
                        </div>
                      </div>
                      <div className="text-right font-semibold">{u.points} pts</div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">No customers yet.</p>}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-white shadow rounded-xl">
            <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
            <CardContent>
              {recentActivity.length ? (
                <div className="space-y-3">
                  {recentActivity.map(r => (
                    <div key={r.id} className="flex items-center justify-between rounded-xl border p-3 hover:bg-amber-50 cursor-pointer" onClick={() => router.push(`/business/customers/${r.id}`)}>
                      <div className="flex flex-col">
                        <span className="font-medium">{r.name}</span>
                        <span className="text-xs text-muted-foreground">{r.last_txn_at ? formatDateTime(r.last_txn_at) : 'No transactions yet'}</span>
                      </div>
                      <Button variant="outline" size="sm">View</Button>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">No recent transactions.</p>}
            </CardContent>
          </Card>
        </div>
      </main>
    </BusinessApprovalWrapper>
  );
}

function formatDateTime(v: string) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleString();
}

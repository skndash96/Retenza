'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trophy, TrendingUp, Users, CalendarClock, RefreshCcw } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
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
        const j = await res.json().catch(() => ({}));
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

  const { totalCustomers, avgPointsPerCustomer, tierData, topPoints, recentActivity, barSeries, weekVsMonthChangePct } = useMemo(() => {
    const empty = { totalCustomers: 0, avgPointsPerCustomer: 0, tierData: [], topPoints: [], recentActivity: [], barSeries: [], weekVsMonthChangePct: 0 };
    if (!payload) return empty;

    const rows = payload.customers || [];
    const total = rows.length;
    const pointsArr = rows.map(r => r.cl?.points ?? 0);
    const totalPoints = pointsArr.reduce((a, b) => a + b, 0);
    const avgPoints = total ? Math.round((totalPoints / total) * 10) / 10 : 0;

    const tierMap = new Map<string, number>();
    rows.forEach(r => { const tier = (r.cl?.current_tier_name ?? 'Unassigned').trim(); tierMap.set(tier, (tierMap.get(tier) ?? 0) + 1); });
    const tiers = Array.from(tierMap.entries()).map(([name, value]) => ({ name, value }));

    const leaderboard = rows.map(r => ({ id: r.c.id, name: r.c.name ?? `Customer #${r.c.id}`, points: r.cl?.points ?? 0 }))
      .sort((a, b) => b.points - a.points).slice(0, 5);

    const recents = rows.map(r => ({ id: r.c.id, name: r.c.name ?? `Customer #${r.c.id}`, last_txn_at: r.last_txn_at }))
      .sort((a, b) => (b.last_txn_at ? new Date(b.last_txn_at).getTime() : 0) - (a.last_txn_at ? new Date(a.last_txn_at).getTime() : 0))
      .slice(0, 8);

    const week = payload.transactionsLastWeek ?? 0;
    const month = payload.transactionsLastMonth ?? 0;
    const bars = [{ label: 'Last Week', value: week }, { label: 'Last Month', value: month }];
    const baseline = month / 4;
    const changePct = baseline ? Math.round(((week - baseline) / baseline) * 100) : 0;

    return { totalCustomers: total, avgPointsPerCustomer: avgPoints, tierData: tiers, topPoints: leaderboard, recentActivity: recents, barSeries: bars, weekVsMonthChangePct: changePct };
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
    <main className="p-6 bg-gradient-to-b from-white via-slate-50 to-sky-50 min-h-screen space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <Button variant="secondary" onClick={fetchDashboard} className="px-4 py-2"> <RefreshCcw className="mr-2 h-4 w-4" /> Refresh </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[{
          title: 'Total Customers', value: totalCustomers, icon: Users, desc: 'with loyalty at your business'
        },{
          title: 'Avg Points / Customer', value: avgPointsPerCustomer, icon: Trophy, desc: 'current snapshot'
        },{
          title: 'Last Week vs Month', value: weekVsMonthChangePct, icon: TrendingUp, desc: 'vs month/4 baseline', highlight: true
        },{
          title: 'Active Lately', value: payload?.transactionsLastWeek ?? 0, icon: CalendarClock, desc: 'transactions last 7 days'
        }].map((kpi, idx) => (
          <Card key={idx} className="bg-white shadow rounded-xl">
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${kpi.highlight ? (kpi.value >= 0 ? 'text-green-600' : 'text-red-600') : ''}`}>
                {kpi.highlight ? (kpi.value > 0 ? '▲' : kpi.value < 0 ? '▼' : '—') + ' ' + Math.abs(kpi.value) + '%' : kpi.value}
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
            <CardTitle>Transactions: Last Week vs Last Month</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="h-[360px] bg-white shadow rounded-xl">
          <CardHeader>
            <CardTitle>Tier Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px] flex items-center justify-center">
            {tierData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={tierData} dataKey="value" nameKey="name" outerRadius={100} label>
                    {tierData.map((_, idx) => <Cell key={idx} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No tiers found</p>
            )}
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
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-semibold">#{i+1}</div>
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
  );
}

function formatDateTime(v: string) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleString();
}

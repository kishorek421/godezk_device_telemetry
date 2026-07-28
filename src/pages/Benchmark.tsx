import React, { useState, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { Activity, Zap, CalendarDays, CalendarRange, Gauge, RefreshCw, Timer, Workflow } from 'lucide-react';
import { getBenchmark, BenchmarkData, BenchmarkBucket } from '../services/api';

const REFRESH_INTERVAL_MS = 30000;

const numberFmt = (n: number) => n.toLocaleString('en-US');

const shortLabel = (bucket: string, mode: 'minute' | 'day' | 'week' | 'month') => {
  if (mode === 'minute') return bucket.slice(11, 16);
  if (mode === 'month') {
    const [y, m] = bucket.split('-');
    return new Date(Number(y), Number(m) - 1).toLocaleString('en-US', { month: 'short', year: '2-digit' });
  }
  const d = new Date(bucket);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric' });
};

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#12172e]/95 px-4 py-3 shadow-2xl backdrop-blur">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-white">
        {numberFmt(payload[0].value)} <span className="text-xs font-medium text-cyan-400">executions</span>
      </p>
    </div>
  );
};

const statusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-emerald-400/15 text-emerald-300';
    case 'partial':   return 'bg-amber-400/15 text-amber-300';
    case 'failed':    return 'bg-red-400/15 text-red-300';
    case 'running':   return 'bg-cyan-400/15 text-cyan-300';
    default:          return 'bg-slate-500/15 text-slate-300';
  }
};

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  gradient: string;
  glow: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, sub, gradient, glow }) => (
  <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur transition-transform duration-300 hover:-translate-y-1">
    <div className={`absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-25 blur-2xl ${glow}`} />
    <div className="flex items-center gap-4">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
        <Icon size={22} strokeWidth={2.2} color="#ffffff" />
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
        <p className="text-2xl font-extrabold text-white">{value}</p>
        <p className="text-[11px] font-medium text-slate-500">{sub}</p>
      </div>
    </div>
  </div>
);

interface ChartCardProps {
  title: string;
  badge: string;
  badgeColor: string;
  children: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, badge, badgeColor, children }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
    <div className="mb-5 flex items-center justify-between">
      <h2 className="text-sm font-bold tracking-wide text-white">{title}</h2>
      <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${badgeColor}`}>
        {badge}
      </span>
    </div>
    <div className="h-64 w-full">{children}</div>
  </div>
);

export const Benchmark: React.FC = () => {
  const [data, setData] = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async (showSpinner: boolean) => {
    if (showSpinner) setRefreshing(true);
    try {
      const res = await getBenchmark();
      setData(res);
      setError(null);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Benchmark fetch failed:', err);
      setError(err?.message ?? 'Failed to load benchmark data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(false);
    const id = setInterval(() => fetchData(false), REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchData]);

  const peakPerMinute = data?.perMinute.length
    ? Math.max(...data.perMinute.map((b) => b.executions))
    : 0;

  const mapChart = (rows: BenchmarkBucket[] | undefined, mode: 'minute' | 'day' | 'week' | 'month') =>
    (rows ?? []).map((r) => ({ label: shortLabel(r.time_bucket, mode), executions: r.executions }));

  const minuteData = mapChart(data?.perMinute, 'minute');
  const dayData = mapChart(data?.perDay, 'day');
  const weekData = mapChart(data?.perWeek, 'week');
  const monthData = mapChart(data?.perMonth, 'month');
  const workflowData = (data?.byWorkflow ?? []).map((w) => ({ name: w.workflow_name, executions: w.executions }));

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0e1f]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-500/20 border-t-cyan-400" />
          <p className="animate-pulse text-sm font-medium text-slate-400">Loading benchmark data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1f] bg-[radial-gradient(ellipse_at_top,rgba(56,89,255,0.15),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(34,211,238,0.08),transparent_50%)] px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 shadow-lg shadow-indigo-500/30">
              <Gauge size={28} strokeWidth={2.2} color="#ffffff" />
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-white via-indigo-200 to-cyan-300 bg-clip-text text-3xl font-black tracking-tight text-transparent">
                Workflow Benchmark
              </h1>
              <p className="text-sm font-medium text-slate-400">
                Workflow executions per minute / day / week / month
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Timer size={14} />
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110 disabled:opacity-60"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm font-medium text-red-300">
            {error} — retrying automatically every 30s.
          </div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Zap}
            label="Peak / Minute"
            value={numberFmt(peakPerMinute)}
            sub="highest minute in last 24h"
            gradient="from-amber-400 to-orange-500"
            glow="bg-amber-400"
          />
          <StatCard
            icon={Activity}
            label="Last 24 Hours"
            value={numberFmt(data?.summary?.executions_24h ?? 0)}
            sub="executions run"
            gradient="from-cyan-400 to-blue-500"
            glow="bg-cyan-400"
          />
          <StatCard
            icon={CalendarDays}
            label="Last 7 Days"
            value={numberFmt(data?.summary?.executions_7d ?? 0)}
            sub="executions run"
            gradient="from-indigo-400 to-purple-500"
            glow="bg-indigo-400"
          />
          <StatCard
            icon={CalendarRange}
            label="Last 30 Days"
            value={numberFmt(data?.summary?.executions_30d ?? 0)}
            sub={`${numberFmt(data?.summary?.executions_total ?? 0)} all-time`}
            gradient="from-emerald-400 to-teal-500"
            glow="bg-emerald-400"
          />
        </div>

        {/* Per minute — full width */}
        <ChartCard title="Executions per Minute" badge="Last 24 hours" badgeColor="bg-cyan-500/15 text-cyan-300">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={minuteData}>
              <defs>
                <linearGradient id="minuteFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="label" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} minTickGap={40} />
              <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} width={40} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(34,211,238,0.3)' }} />
              <Area type="monotone" dataKey="executions" stroke="#22d3ee" strokeWidth={2.5} fill="url(#minuteFill)" dot={false} activeDot={{ r: 4, fill: '#22d3ee' }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Day / Week / Month */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ChartCard title="Executions per Day" badge="30 days" badgeColor="bg-indigo-500/15 text-indigo-300">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayData}>
                <defs>
                  <linearGradient id="dayFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#4f46e5" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="label" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} minTickGap={20} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} width={36} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(129,140,248,0.08)' }} />
                <Bar dataKey="executions" fill="url(#dayFill)" radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Executions per Week" badge="12 weeks" badgeColor="bg-purple-500/15 text-purple-300">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData}>
                <defs>
                  <linearGradient id="weekFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c084fc" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="label" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} minTickGap={20} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} width={36} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(192,132,252,0.08)' }} />
                <Bar dataKey="executions" fill="url(#weekFill)" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Executions per Month" badge="12 months" badgeColor="bg-emerald-500/15 text-emerald-300">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthData}>
                <defs>
                  <linearGradient id="monthFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#0d9488" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="label" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} minTickGap={20} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} width={36} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(52,211,153,0.08)' }} />
                <Bar dataKey="executions" fill="url(#monthFill)" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Bottom: Top Workflows + Recent Executions */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Top Workflows" badge="Last 30 days" badgeColor="bg-pink-500/15 text-pink-300">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workflowData} layout="vertical">
                <defs>
                  <linearGradient id="workflowFill" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f472b6" />
                    <stop offset="100%" stopColor="#db2777" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} width={160} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(244,114,182,0.08)' }} />
                <Bar dataKey="executions" fill="url(#workflowFill)" radius={[0, 6, 6, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold tracking-wide text-white">Recent Executions</h2>
              <span className="rounded-full bg-slate-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                Last 25
              </span>
            </div>
            <div className="max-h-64 overflow-auto pr-2">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-[#0a0e1f]/95 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="pb-2 pt-1">Workflow</th>
                    <th className="pb-2 pt-1">Trigger</th>
                    <th className="pb-2 pt-1">Status</th>
                    <th className="pb-2 pt-1 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(data?.recent ?? []).map((r) => (
                    <tr key={r.execution_id} className="group hover:bg-white/[0.03]">
                      <td className="py-2.5 font-medium text-slate-200">
                        <div className="flex items-center gap-2">
                          <Workflow size={12} className="text-slate-500" />
                          <span className="max-w-[160px] truncate">{r.workflow_name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-slate-400">{r.trigger_event ?? '-'}</td>
                      <td className="py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusColor(r.status)}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-slate-500">
                        {new Date(r.started_at).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <p className="pb-2 text-center text-[11px] font-medium text-slate-600">
          Auto-refreshes every 30 seconds • Counts workflow execution rows in workflow_org_executions
        </p>
      </div>
    </div>
  );
};

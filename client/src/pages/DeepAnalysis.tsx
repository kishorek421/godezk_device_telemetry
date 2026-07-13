import React, { useState, useEffect } from 'react';
import { getDeepAnalysis } from '../services/api';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell
} from 'recharts';

const NODE_COLORS: Record<string, string> = {
  ai_node: '#8B5CF6',
  postgres: '#3B82F6',
  notification: '#F59E0B',
  http_request: '#10B981',
  condition: '#EC4899',
  transform: '#06B6D4',
  minio: '#6366F1',
  default: '#94A3B8'
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(Math.abs(bytes) || 1) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatCpuUs(us: number): string {
  if (us < 1000) return us + ' μs';
  if (us < 1000000) return (us / 1000).toFixed(1) + ' ms';
  return (us / 1000000).toFixed(2) + ' s';
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

export const DeepAnalysis: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDeepAnalysis().then((res) => {
      setData(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-slate-300 text-sm animate-pulse p-8">Loading deep analysis data...</div>;
  }
  if (!data || !data.success) {
    return <div className="text-rose-400 text-sm p-8">Failed to load deep analysis data.</div>;
  }

  const { system, modelProfiles, resourceTimeline, nodeBreakdown, cpuDistribution, memDistribution, heaviestExecutions } = data;

  const timelineData = (resourceTimeline || []).map((r: any) => ({
    time: r.time?.split(' ')[1]?.substring(0, 5) || '',
    cpuMs: Math.round(r.avgCpuUs / 1000),
    peakRssMb: r.avgPeakRssMb,
    executions: r.executions,
    durationMs: r.avgDurationMs,
  }));

  const totalNodeTime = (nodeBreakdown || []).reduce((s: number, n: any) => s + n.totalTimeMs, 0);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Deep Backend Analysis</h1>
        <p className="text-sm text-slate-300 mt-1">Per-model resource consumption and system behavior profiling</p>
      </div>

      {/* System Hardware Banner */}
      <div className="bg-gradient-to-r from-slate-50 via-slate-100 to-indigo-950 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold">System Hardware</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">CPU Model</p>
            <p className="text-sm font-semibold text-cyan-300 truncate" title={system.cpuModel}>{system.cpuModel}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">CPU Cores</p>
            <p className="text-xl font-bold">{system.cpuCores} <span className="text-xs text-slate-400 font-normal">threads</span></p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Total RAM</p>
            <p className="text-xl font-bold">{(system.totalMemBytes / (1024**3)).toFixed(1)} <span className="text-xs text-slate-400 font-normal">GB</span></p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Free RAM</p>
            <p className="text-xl font-bold text-emerald-400">{(system.freeMemBytes / (1024**3)).toFixed(1)} <span className="text-xs text-slate-400 font-normal">GB</span></p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Uptime</p>
            <p className="text-xl font-bold">{formatUptime(system.uptimeSeconds)}</p>
          </div>
        </div>

        {/* Live process stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/10">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Process CPU</p>
            <p className="text-lg font-bold text-amber-300">{system.cpuUsagePercent}%</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Process RSS</p>
            <p className="text-lg font-bold">{system.processRssMb} MB</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Worker Pool</p>
            <p className="text-lg font-bold">{system.workerPoolSize} <span className="text-xs text-slate-400 font-normal">threads</span></p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Queue Depth</p>
            <p className={`text-lg font-bold ${system.queueDepth > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{system.queueDepth}</p>
          </div>
        </div>
      </div>

      {/* Per-Model Resource Profile Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-100">Per-Model Resource Profile</h3>
          <p className="text-xs text-slate-300 mt-1">Average CPU, memory, and efficiency per deployed workflow model</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wider text-slate-300">
                <th className="px-5 py-3">Model</th>
                <th className="px-4 py-3">Runs</th>
                <th className="px-4 py-3">Avg CPU</th>
                <th className="px-4 py-3">Avg Mem Δ</th>
                <th className="px-4 py-3">Avg Peak RSS</th>
                <th className="px-4 py-3">Avg Heap</th>
                <th className="px-4 py-3">Avg Duration</th>
                <th className="px-4 py-3">CPU/ms</th>
                <th className="px-4 py-3">Success</th>
              </tr>
            </thead>
            <tbody>
              {(modelProfiles || []).map((m: any, i: number) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-slate-100">{m.name}</td>
                  <td className="px-4 py-3.5 font-mono text-slate-200">{m.totalRuns}</td>
                  <td className="px-4 py-3.5 font-mono text-violet-600">{formatCpuUs(m.avgCpuUs)}</td>
                  <td className="px-4 py-3.5 font-mono text-blue-600">{formatBytes(m.avgMemDelta)}</td>
                  <td className="px-4 py-3.5 font-mono text-indigo-600">{formatBytes(m.avgPeakRss)}</td>
                  <td className="px-4 py-3.5 font-mono text-cyan-600">{formatBytes(m.avgHeapUsed)}</td>
                  <td className="px-4 py-3.5 font-mono text-slate-200">{m.avgDurationMs} ms</td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      m.cpuEfficiency > 500 ? 'bg-rose-50 text-rose-700' : m.cpuEfficiency > 100 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {m.cpuEfficiency} μs/ms
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-emerald-600 font-semibold">{m.completed}</span>
                    {m.failed > 0 && <span className="text-rose-500 ml-1">/ {m.failed} ✗</span>}
                  </td>
                </tr>
              ))}
              {(modelProfiles || []).length === 0 && (
                <tr><td colSpan={9} className="px-5 py-8 text-center text-slate-350">No model execution data yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resource Timeline Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU Timeline */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-100 mb-1">CPU Usage Trend</h3>
          <p className="text-[10px] text-slate-300 mb-4">Average CPU milliseconds per execution over time</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" unit=" ms" />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                formatter={(v: any) => [`${v} ms`, 'Avg CPU']}
              />
              <Area type="monotone" dataKey="cpuMs" stroke="#8B5CF6" fill="url(#cpuGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Memory Timeline */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-100 mb-1">Peak Memory Trend</h3>
          <p className="text-[10px] text-slate-300 mb-4">Average peak RSS (MB) per execution over time</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" unit=" MB" />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                formatter={(v: any) => [`${v} MB`, 'Peak RSS']}
              />
              <Area type="monotone" dataKey="peakRssMb" stroke="#3B82F6" fill="url(#memGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Node Execution Breakdown + Resource Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Node Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-100 mb-1">Node Type Execution Breakdown</h3>
          <p className="text-[10px] text-slate-300 mb-4">Which workflow node types consume the most total time</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={nodeBreakdown || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" unit=" ms" />
              <YAxis type="category" dataKey="nodeType" tick={{ fontSize: 10 }} stroke="#94a3b8" width={100} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                formatter={(v: any, name: string) => {
                  if (name === 'totalTimeMs') return [`${v} ms`, 'Total Time'];
                  return [v, name];
                }}
              />
              <Bar dataKey="totalTimeMs" radius={[0, 6, 6, 0]}>
                {(nodeBreakdown || []).map((entry: any, idx: number) => (
                  <Cell key={idx} fill={NODE_COLORS[entry.nodeType] || NODE_COLORS.default} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Node stats table */}
          <div className="mt-4 space-y-2">
            {(nodeBreakdown || []).map((n: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: NODE_COLORS[n.nodeType] || NODE_COLORS.default }}></div>
                  <span className="font-medium text-slate-200">{n.nodeType}</span>
                </div>
                <div className="flex gap-4 text-slate-300 font-mono">
                  <span>{n.totalExecutions} runs</span>
                  <span>avg {n.avgDurationMs} ms</span>
                  <span className="text-slate-200 font-semibold">{totalNodeTime > 0 ? Math.round(n.totalTimeMs / totalNodeTime * 100) : 0}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CPU + Memory Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-100 mb-1">Resource Distribution</h3>
          <p className="text-[10px] text-slate-300 mb-4">How CPU and memory usage is distributed across all executions</p>

          {/* CPU Distribution */}
          <p className="text-[10px] uppercase tracking-wider text-slate-300 font-bold mb-2">CPU Time Distribution</p>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={cpuDistribution || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="bucket" tick={{ fontSize: 9 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }} />
              <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Memory Distribution */}
          <p className="text-[10px] uppercase tracking-wider text-slate-305 font-bold mb-2 mt-4">Memory (Peak RSS) Distribution</p>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={memDistribution || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="bucket" tick={{ fontSize: 9 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }} />
              <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 10 Heaviest Executions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-100">Top 10 Heaviest Executions</h3>
          <p className="text-xs text-slate-350 mt-1">Most CPU-intensive workflow runs — click to view lifecycle</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wider text-slate-300">
                <th className="px-5 py-3">Frame ID</th>
                <th className="px-4 py-3">Workflow</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">CPU Used</th>
                <th className="px-4 py-3">Peak RSS</th>
                <th className="px-4 py-3">Heap Used</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Started</th>
              </tr>
            </thead>
            <tbody>
              {(heaviestExecutions || []).map((e: any, i: number) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3">
                    <Link to={`/frame/${e.id}`} className="text-indigo-600 hover:text-indigo-800 font-mono text-xs underline decoration-dotted">
                      {e.id.substring(0, 12)}...
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-100">{e.workflowName}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      e.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {e.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-violet-600 font-semibold">{formatCpuUs(e.cpuUs)}</td>
                  <td className="px-4 py-3 font-mono text-blue-600">{formatBytes(e.peakRss)}</td>
                  <td className="px-4 py-3 font-mono text-cyan-600">{formatBytes(e.heapUsed)}</td>
                  <td className="px-4 py-3 font-mono text-slate-200">{e.durationMs} ms</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-350">{e.startedAt}</td>
                </tr>
              ))}
              {(heaviestExecutions || []).length === 0 && (
                <tr><td colSpan={8} className="px-5 py-8 text-center text-slate-300">No executions with resource data yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

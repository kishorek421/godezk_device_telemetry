import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getDashboardSummary,
  DashboardData,
  Frame
} from '../services/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import {
  Video,
  CheckCircle,
  SkipForward,
  AlertTriangle,
  Clock,
  Cpu,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const SVGSparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  if (data.length < 2) return null;
  const width = 80;
  const height = 24;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
};

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const summary = await getDashboardSummary();
      setData(summary);
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(true);
    const interval = setInterval(() => {
      fetchSummary(false);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-5 h-28 animate-pulse flex flex-col justify-between">
              <div className="h-4 bg-slate-100 rounded w-1/3"></div>
              <div className="h-8 bg-slate-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200/60 rounded-3xl p-6 h-80 animate-pulse"></div>
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 h-80 animate-pulse"></div>
        </div>
      </div>
    );
  }

  const { stats, latencies, failures, journeys, throughput, queueTimeline, aiTrend } = data;

  // Helper to get sparkline data and percentage change
  const getTrendData = (trendArray: number[], currentVal: number) => {
    let spark = [...trendArray];
    if (spark.length === 0) {
      spark = [currentVal, currentVal, currentVal, currentVal, currentVal, currentVal, currentVal];
    } else if (spark.length < 7) {
      const padding = Array(7 - spark.length).fill(spark[0] || 0);
      spark = [...padding, ...spark];
    }
    spark[spark.length - 1] = currentVal;

    let change = '0.0%';
    let isUp = true;
    if (spark.length >= 2) {
      const prevVal = spark[spark.length - 2];
      if (prevVal > 0) {
        const diff = currentVal - prevVal;
        const pct = (diff / prevVal) * 100;
        change = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
        isUp = pct >= 0;
      } else if (currentVal > 0) {
        change = '+100%';
        isUp = true;
      }
    }
    return { spark, change, isUp };
  };

  const totalTrend = (throughput || []).map(t => parseInt(t.total) || 0);
  const completedTrend = (throughput || []).map(t => parseInt(t.completed) || 0);
  const failedTrend = (throughput || []).map(t => parseInt(t.failed) || 0);
  const aiTrendData = (aiTrend || []).map(t => parseInt(t.avg_inference) || 0);
  const queueTrend = (queueTimeline || []).map(t => parseInt(t.length) || 0);
  const journeyTrend = (journeys || []).slice().reverse().map(j => parseInt(j.duration_ms) || 0);

  const tIngested = getTrendData(totalTrend, stats.receivedToday);
  const tCompleted = getTrendData(completedTrend, stats.completed);
  const tSkipped = { spark: [stats.skipped, stats.skipped, stats.skipped, stats.skipped, stats.skipped, stats.skipped, stats.skipped], change: '0.0%', isUp: true };
  const tFailed = getTrendData(failedTrend, stats.failed);
  const tDelay = getTrendData(journeyTrend, stats.avgProcessTime);
  const tAi = getTrendData(aiTrendData, stats.avgAiTime);
  const tWorkers = { spark: [stats.activeWorkers, stats.activeWorkers, stats.activeWorkers, stats.activeWorkers, stats.activeWorkers, stats.activeWorkers, stats.activeWorkers], change: '0.0%', isUp: true };
  const tQueue = getTrendData(queueTrend, stats.queueLength);

  const kpis = [
    { name: 'Frames Ingested', val: stats.receivedToday, change: tIngested.change, isUp: tIngested.isUp, icon: Video, color: '#0D7A73', spark: tIngested.spark },
    { name: 'Completed Runs', val: stats.completed, change: tCompleted.change, isUp: tCompleted.isUp, icon: CheckCircle, color: '#22C55E', spark: tCompleted.spark },
    { name: 'Frames Skipped', val: stats.skipped, change: tSkipped.change, isUp: tSkipped.isUp, icon: SkipForward, color: '#F59E0B', spark: tSkipped.spark },
    { name: 'Engine Failures', val: stats.failed, change: tFailed.change, isUp: tFailed.isUp, icon: AlertTriangle, color: '#EF4444', spark: tFailed.spark },
    { name: 'Avg Frame Delay', val: `${stats.avgProcessTime}ms`, change: tDelay.change, isUp: tDelay.isUp, icon: Clock, color: '#8B5CF6', spark: tDelay.spark },
    { name: 'Avg AI Latency', val: `${stats.avgAiTime}ms`, change: tAi.change, isUp: tAi.isUp, icon: Cpu, color: '#06B6D4', spark: tAi.spark },
    { name: 'Active Workers', val: stats.activeWorkers, change: tWorkers.change, isUp: tWorkers.isUp, icon: Layers, color: '#6366F1', spark: tWorkers.spark },
    { name: 'Queue Length', val: stats.queueLength, change: tQueue.change, isUp: tQueue.isUp, icon: Layers, color: '#64748b', spark: tQueue.spark }
  ];

  const processedData = (throughput || []).map(item => ({
    time: item.time_bucket ? item.time_bucket.split(' ')[1].substring(0, 5) : '',
    completed: parseInt(item.completed) || 0,
    failed: parseInt(item.failed) || 0
  }));

  const latencyBreakdownData = [
    { name: 'Weir', ms: parseFloat(Number(latencies.avg_weir || 0).toFixed(2)), color: '#0D7A73' },
    { name: 'PreScreen', ms: parseFloat(Number(latencies.avg_screener || 0).toFixed(2)), color: '#06B6D4' },
    { name: 'AI Gate', ms: parseFloat(Number(latencies.avg_decision || 0).toFixed(2)), color: '#8B5CF6' },
    { name: 'Engine', ms: parseFloat(Number(latencies.avg_duration || 0).toFixed(2)), color: '#22C55E' }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.name} className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-300 transition-all shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">{kpi.name}</span>
                <span style={{ backgroundColor: `${kpi.color}10`, color: kpi.color }} className="p-1.5 rounded-lg border border-slate-100">
                  <Icon size={14} />
                </span>
              </div>
              <div className="flex items-end justify-between mt-3">
                <div>
                  <h3 className="text-2xl font-bold font-mono tracking-tight text-slate-100">{kpi.val}</h3>
                  <div className="flex items-center gap-1 mt-1 text-[10px] font-semibold">
                    {kpi.isUp ? (
                      <span className="text-emerald-600 flex items-center"><ArrowUpRight size={10} /> {kpi.change}</span>
                    ) : (
                      <span className="text-amber-600 flex items-center"><ArrowDownRight size={10} /> {kpi.change}</span>
                    )
                    }
                    <span className="text-slate-500">vs hour ago</span>
                  </div>
                </div>
                <div className="pb-1" title="Hourly trend">
                  <SVGSparkline data={kpi.spark} color={kpi.color} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Throughput Chart (Line) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold text-slate-200">Execution Throughput (Frames / Min)</h2>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Completed
              </span>
              <span className="flex items-center gap-1.5 text-rose-600">
                <span className="h-2 w-2 rounded-full bg-rose-500"></span> Failed
              </span>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={processedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: 12, color: '#1e293b' }} />
                <Line type="monotone" dataKey="completed" stroke="#22C55E" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="failed" stroke="#EF4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Latency Breakdown Chart (Bar) */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold text-slate-200">Processing Time Breakdown</h2>
            <span className="text-[10px] text-[#0D7A73] font-semibold uppercase tracking-wider">Layer Averages</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latencyBreakdownData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={9} tickLine={false} title="ms" />
                <Tooltip formatter={(value) => [`${value} ms`]} contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: 12, color: '#1e293b' }} />
                <Bar dataKey="ms" radius={[6, 6, 0, 0]}>
                  {latencyBreakdownData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Failure Logs and Recent Journeys */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Failure Logs */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-md flex flex-col h-96">
          <div className="flex items-center gap-2 mb-4">
            <span className="h-2 w-2 rounded-full bg-rose-500"></span>
            <h3 className="text-sm font-semibold text-slate-200">Where It Breaks (Latest Failure Logs)</h3>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-mono">
                  <th className="py-2 font-medium">Time</th>
                  <th className="py-2 font-medium">Workflow</th>
                  <th className="py-2 font-medium">Error Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {failures.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-slate-400">No failures recorded in database</td>
                  </tr>
                ) : (
                  failures.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 text-slate-500 font-mono">{f.failed_time}</td>
                      <td className="py-3 font-semibold text-slate-100">{f.workflow_name}</td>
                      <td className="py-3 text-rose-600 truncate max-w-xs font-semibold" title={f.error_message}>{f.error_message}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Frame Journeys */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-md flex flex-col h-96">
          <div className="flex items-center gap-2 mb-4">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <h3 className="text-sm font-semibold text-slate-200">Frame Lifecycle Journey Tracker</h3>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-mono">
                  <th className="py-2 font-medium">Time</th>
                  <th className="py-2 font-medium">Workflow</th>
                  <th className="py-2 font-medium text-center">Weir</th>
                  <th className="py-2 font-medium text-center">PreScreen</th>
                  <th className="py-2 font-medium text-center">AI Gate</th>
                  <th className="py-2 font-medium text-center">Engine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {journeys.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-slate-400">No active journeys tracked</td>
                  </tr>
                ) : (
                  journeys.map((j) => (
                    <tr key={j.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 text-slate-500">{j.start_time}</td>
                      <td className="py-3 font-semibold text-slate-100 truncate max-w-[120px]"><Link to={`/frame/${j.id}`} className="hover:underline hover:text-[#0D7A73]">{j.workflow_name}</Link></td>
                      <td className="py-3 text-center text-indigo-600 font-medium">{Number(j.weir_cpu || 0).toFixed(2)} ms</td>
                      <td className="py-3 text-center text-cyan-600 font-medium">{Number(j.screener_cpu || 0).toFixed(2)} ms</td>
                      <td className="py-3 text-center text-purple-600 font-medium">{Number(j.decision_cpu || 0).toFixed(2)} ms</td>
                      <td className="py-3 text-center text-emerald-600 font-medium">{j.duration_ms || '—'} ms</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

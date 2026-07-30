import React, { useEffect, useState } from 'react';
import { getBenchmark, BenchmarkData, BenchmarkBucket } from '../services/api';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { RefreshCw, BarChart2 } from 'lucide-react';

export const Benchmark: React.FC = () => {
  const [data, setData] = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getBenchmark();
      setData(res);
    } catch (err) {
      console.error('Benchmark fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalFrames = (buckets: BenchmarkBucket[]) =>
    buckets.reduce((sum, b) => sum + (b.frames || 0), 0);

  if (loading || !data) {
    return (
      <div className="text-slate-400 text-sm animate-pulse flex items-center gap-2">
        <RefreshCw size={16} className="animate-spin" />
        Loading benchmark metrics from backdoor...
      </div>
    );
  }

  const perMinute = data.perMinute.map((b) => ({
    label: b.time_bucket ? b.time_bucket.slice(11, 16) : '',
    frames: b.frames || 0,
  }));

  const perDay = data.perDay.map((b) => ({
    label: b.time_bucket ? b.time_bucket.slice(5, 10) : '',
    frames: b.frames || 0,
  }));

  const perWeek = data.perWeek.map((b) => ({
    label: b.time_bucket ? b.time_bucket.slice(5, 10) : '',
    frames: b.frames || 0,
  }));

  const perMonth = data.perMonth.map((b) => ({
    label: b.time_bucket || '',
    frames: b.frames || 0,
  }));

  const kpis = [
    { label: 'Last 24h Frames', value: totalFrames(data.perMinute).toLocaleString() },
    { label: 'Last 30 Days', value: totalFrames(data.perDay).toLocaleString() },
    { label: 'Last 12 Weeks', value: totalFrames(data.perWeek).toLocaleString() },
    { label: 'Last 12 Months', value: totalFrames(data.perMonth).toLocaleString() },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BarChart2 size={24} className="text-[#0D7A73]" />
            Workflow Benchmark
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Frames executed per minute, day, week, and month pulled from the backdoor execution log.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm"
          >
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {kpi.label}
            </p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">
            Frames Per Minute (Last 24h)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={perMinute}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={9} minTickGap={30} />
                <YAxis stroke="#64748b" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: 10, color: '#1e293b' }} />
                <Line
                  type="monotone"
                  dataKey="frames"
                  stroke="#0D7A73"
                  strokeWidth={2}
                  dot={false}
                  name="Frames"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">
            Frames Per Day (Last 30 Days)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={9} minTickGap={20} />
                <YAxis stroke="#64748b" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: 10, color: '#1e293b' }} />
                <Bar dataKey="frames" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Frames" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">
            Frames Per Week (Last 12 Weeks)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perWeek}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={9} />
                <YAxis stroke="#64748b" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: 10, color: '#1e293b' }} />
                <Bar dataKey="frames" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Frames" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">
            Frames Per Month (Last 12 Months)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={9} />
                <YAxis stroke="#64748b" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: 10, color: '#1e293b' }} />
                <Bar dataKey="frames" fill="#10B981" radius={[4, 4, 0, 0]} name="Frames" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

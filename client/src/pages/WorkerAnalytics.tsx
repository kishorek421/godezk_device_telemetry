import React, { useState, useEffect } from 'react';
import { getDashboardSummary, DashboardData } from '../services/api';
import { Cpu, Server } from 'lucide-react';

export const WorkerAnalytics: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await getDashboardSummary();
      setData(res);
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
    return <div className="text-slate-400 text-sm animate-pulse">Loading worker health tables...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Server size={22} className="text-purple-500" />
          Worker Node Capacity Control
        </h2>
        <p className="text-xs text-slate-400 mt-1">Resource consumption and task distributions for each backend runner thread.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.workers.map((w) => (
          <div key={w.name} className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Cpu size={16} className="text-purple-500" />
                {w.name}
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                HEALTHY
              </span>
            </div>

            {/* Thread Resource Metrics */}
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100/80">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-sans">Thread Jobs Run</p>
                <p className="text-sm font-bold text-slate-100">{w.jobs}</p>
              </div>
              <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100/80">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-sans">Active Queue Size</p>
                <p className="text-sm font-bold text-slate-100">{w.queue}</p>
              </div>
              <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100/80">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-sans">Worker CPU load</p>
                <p className="text-sm font-bold text-purple-600">{w.cpu}%</p>
              </div>
              <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100/80">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-sans">Memory usage</p>
                <p className="text-sm font-bold text-cyan-600">{w.memory}%</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-400 font-sans">Average Node Latency:</span>
              <span className="font-semibold text-slate-100 font-mono">{w.time} ms</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { getDashboardSummary, DashboardData } from '../services/api';
import { Zap } from 'lucide-react';

export const AIAnalytics: React.FC = () => {
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
    return <div className="text-slate-400 text-sm animate-pulse">Loading AI model reports...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Zap size={22} className="text-cyan-500" />
          AI Model Registry & Telemetry
        </h2>
        <p className="text-xs text-slate-400 mt-1">Accuracy scores, average inference latency, and request failures per deployed model.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.models.map((m) => (
          <div key={m.name} className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Zap size={16} className="text-cyan-500" />
                {m.name}
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                ACTIVE
              </span>
            </div>

            {/* Model KPIs */}
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100/80">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-sans">Total Requests</p>
                <p className="text-sm font-bold text-slate-100">{m.total}</p>
              </div>
              <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100/80">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-sans">Inference Latency</p>
                <p className="text-sm font-bold text-slate-100">{m.avgTime} ms</p>
              </div>
              <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100/80">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-sans">Avg Confidence</p>
                <p className="text-sm font-bold text-indigo-600">{(m.conf * 100).toFixed(0)}%</p>
              </div>
              <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100/80">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-sans">Inference Fails</p>
                <p className="text-sm font-bold text-rose-600">{m.failed}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

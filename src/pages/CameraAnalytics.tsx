import React, { useState, useEffect } from 'react';
import { getDashboardSummary, DashboardData } from '../services/api';
import { Video, SkipForward, CheckCircle2, AlertOctagon } from 'lucide-react';

export const CameraAnalytics: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await getDashboardSummary();
      setData(res);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to load data');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(true);
    const interval = setInterval(() => {
      fetchSummary(false);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="text-slate-400 text-sm animate-pulse">Loading camera health tables...</div>;
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[40vh] gap-3">
        <p className="text-slate-500">{error}</p>
        <button onClick={() => fetchSummary(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Retry</button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Camera Source Registry</h2>
        <p className="text-xs text-slate-400 mt-1">Real-time status check and load distribution per camera channel.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.cameras.map((c) => (
          <div key={c.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Video size={16} className="text-[#0D7A73]" />
                {c.id}
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Ingested</p>
                <p className="text-sm font-bold text-slate-100">{c.received}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Skipped</p>
                <p className="text-sm font-bold text-slate-100">{c.skipped}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Completed</p>
                <p className="text-sm font-bold text-slate-100">{c.completed}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Fail Rate</p>
                <p className="text-sm font-bold text-rose-600">{c.failureRate}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-400">Avg Ingress Delay:</span>
              <span className="font-semibold text-slate-100 font-mono">{c.avgTime} ms</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

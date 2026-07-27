import React, { useState, useEffect } from 'react';
import { getRecentFrames, Frame } from '../services/api';
import { Video, Clock } from 'lucide-react';

export const LiveFrames: React.FC = () => {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLive = async () => {
    try {
      const list = await getRecentFrames();
      setFrames(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Live Frame Pipeline Stream</h2>
          <p className="text-xs text-slate-400 mt-1">Real-time developer visualization. Refreshes automatically every 2 seconds.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          LIVE STREAM ACTIVE
        </span>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 text-xs py-8">Connecting to frame streams...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {frames.map((f) => {
            const statusLower = f.status?.toLowerCase();
            const statusCls = statusLower === 'completed' 
              ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
              : statusLower === 'skipped' 
                ? 'text-amber-700 bg-amber-50 border-amber-200' 
                : 'text-rose-700 bg-rose-50 border-rose-200';

            return (
              <div key={f.frameId} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-300 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">{f.frameId.substring(0, 8)}...</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${statusCls}`}>
                    {f.status.toUpperCase()}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Video size={12} className="text-[#0D7A73]" />
                    {f.cameraId === 'unknown' ? 'Camera N/A' : f.cameraId.substring(0, 18)}
                  </h4>
                  <p className="text-sm font-bold text-slate-100 mt-1 truncate" title={f.detection || 'Running inference...'}>
                    {f.detection || 'Evaluating motion...'}
                  </p>
                </div>

                {/* Timing & Confidence bar */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1"><Clock size={10} /> {f.totalTime} ms</span>
                    <span>Conf: {(f.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        statusLower === 'completed' ? 'bg-emerald-500' : statusLower === 'skipped' ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.max(2, f.confidence * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Current Stage pulse */}
                <div className="flex items-center justify-between text-[10px] bg-slate-50 p-2.5 rounded-xl border border-slate-200/50">
                  <span className="text-slate-500">Pipeline Stage:</span>
                  <span className="font-semibold text-indigo-600 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                    {statusLower === 'completed' ? 'Notification Out' : statusLower === 'skipped' ? 'Perception Skip' : 'Execution Queue'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

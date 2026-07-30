import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFrameDetails, Frame } from '../services/api';
import { ArrowLeft, Clock, Server, Video, Cpu, ShieldAlert } from 'lucide-react';

export const FrameDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [frame, setFrame] = useState<Frame | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getFrameDetails(id).then((res) => {
        setFrame(res);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading || !frame) {
    return <div className="text-slate-300 text-sm animate-pulse p-8">Loading frame journey details...</div>;
  }

  // Define colored class names for status badges
  const statusColors = frame.status.toLowerCase() === 'completed' 
    ? 'border-emerald-500/30 text-emerald-600 bg-emerald-50' 
    : frame.status.toLowerCase() === 'skipped' 
      ? 'border-amber-500/30 text-amber-600 bg-amber-50' 
      : 'border-rose-500/30 text-rose-600 bg-rose-50';

  return (
    <div className="space-y-6">
      {/* Back Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/recent')}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-200 transition-all shadow-sm"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100">Frame Lifecycle Journey</h2>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${statusColors}`}>
              {frame.status}
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">Frame ID: <span className="font-mono text-slate-200">{frame.frameId}</span></p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900/50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm bg-white">
          <div className="p-2 rounded-lg bg-indigo-50 text-[#0D7A73] border border-indigo-100"><Video size={16} /></div>
          <div>
            <p className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">Camera Source</p>
            <p className="text-sm font-bold text-slate-100">{frame.cameraId === 'unknown' ? 'Camera N/A' : frame.cameraId}</p>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm bg-white">
          <div className="p-2 rounded-lg bg-cyan-50 text-[#0D7A73] border border-cyan-100"><Cpu size={16} /></div>
          <div>
            <p className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">AI Detection Pipeline</p>
            <p className="text-sm font-bold text-slate-100">{frame.pipeline}</p>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm bg-white">
          <div className="p-2 rounded-lg bg-purple-50 text-[#0D7A73] border border-purple-100"><Server size={16} /></div>
          <div>
            <p className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">Worker Node</p>
            <p className="text-sm font-bold text-slate-100">{frame.workerId}</p>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm bg-white">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100"><Clock size={16} /></div>
          <div>
            <p className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">Total Delay</p>
            <p className="text-sm font-bold text-slate-100 font-mono">{frame.totalTime} ms</p>
          </div>
        </div>
      </div>

      {/* Visual Flow Diagram */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        <h3 className="text-sm font-bold text-slate-100 mb-8">Detailed Ingestion & Gating Pipeline Flow</h3>
        
        <div className="flex flex-col md:flex-row md:flex-wrap items-center justify-center gap-6 relative">
          {frame.events?.map((ev, index) => {
            const isLast = index === frame.events!.length - 1;
            return (
              <React.Fragment key={ev.stage}>
                <div className="flex flex-col items-center z-10 relative bg-slate-950 border border-slate-200 p-4 rounded-2xl w-40 text-center shadow-sm h-48 justify-between">
                  <div className="flex flex-col items-center w-full">
                    <div className="h-8 w-8 rounded-full bg-slate-50 border border-slate-200 text-[#0D7A73] flex items-center justify-center font-bold text-xs mb-2">
                      {index + 1}
                    </div>
                    <h4 className="text-xs font-bold text-slate-100">{ev.stage}</h4>
                  </div>
                  
                  <div className="flex flex-col items-center w-full mt-2">
                    {ev.duration > 0 ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-[#0D7A73] border border-indigo-100 font-mono">
                        +{ev.duration} ms
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-350 font-mono">Started</span>
                    )}

                    {(ev.cpu !== undefined || ev.memory !== undefined) && (
                      <div className="mt-3 pt-2 border-t border-slate-200 w-full flex flex-col gap-1 text-[9px] font-mono text-slate-300">
                        {ev.cpu && (
                          <div className="flex justify-between items-center">
                            <span>CPU:</span>
                            <span className="font-bold text-amber-600">{ev.cpu}</span>
                          </div>
                        )}
                        {ev.memory && (
                          <div className="flex justify-between items-center">
                            <span>RAM:</span>
                            <span className="font-bold text-indigo-600">{ev.memory}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {!isLast && (
                  <div className="text-slate-200 font-bold rotate-90 md:rotate-0 z-10 self-center">➜</div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Developer Execution Logs */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <ShieldAlert size={16} className="text-amber-500" />
          <h3 className="text-sm font-bold text-slate-100">Raw Telemetry Event Streams (Pino Log Output)</h3>
        </div>

        <div className="bg-slate-950 border border-slate-200 rounded-xl p-4 font-mono text-[11px] text-slate-200 space-y-2 overflow-x-auto max-h-60">
          <p className="text-slate-300">[{frame.receivedAt}] Frame Ingestion Gating initiated: frame_id={frame.frameId} camera_id={frame.cameraId}</p>
          {frame.events?.map((ev) => {
            if (ev.duration === 0) return null;
            return (
              <p key={ev.stage} className="text-slate-200">
                [{frame.receivedAt}] stage="{ev.stage}" duration_ms={ev.duration} cpu="{ev.cpu || '0%'}" memory="{ev.memory || '0 B'}" state="SUCCESS"
              </p>
            );
          })}
          {frame.status.toLowerCase() === 'failed' && (
            <p className="text-rose-600 font-semibold">
              [{frame.receivedAt}] stage="Workflow Run" state="CRASH" error="{frame.error}"
            </p>
          )}
          <p className="text-[#0D7A73] font-semibold">[{frame.receivedAt}] Frame pipeline completed journey in {frame.totalTime} ms. final_status="{frame.status}"</p>
        </div>
      </div>
    </div>
  );
};

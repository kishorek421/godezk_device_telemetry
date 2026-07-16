import React, { useState, useEffect } from 'react';
import { Shield, Database, Bell, Loader2 } from 'lucide-react';
import { getTelemetrySettings, saveTelemetrySettings } from '../services/api';

export const Settings: React.FC = () => {
  const [logLevel, setLogLevel] = useState('INFO');
  const [retention, setRetention] = useState('30');
  const [alerts, setAlerts] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getTelemetrySettings();
        if (data) {
          setLogLevel(data.logLevel || 'INFO');
          setRetention(data.retention || '30');
          setAlerts(data.alerts !== false);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (updatedLogLevel: string, updatedRetention: string, updatedAlerts: boolean) => {
    setSaving(true);
    setStatusMessage('Saving to database...');
    try {
      await saveTelemetrySettings({
        logLevel: updatedLogLevel,
        retention: updatedRetention,
        alerts: updatedAlerts
      });
      setStatusMessage('Settings saved successfully!');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setStatusMessage('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogLevelChange = (val: string) => {
    setLogLevel(val);
    handleSave(val, retention, alerts);
  };

  const handleRetentionChange = (val: string) => {
    setRetention(val);
    handleSave(logLevel, val, alerts);
  };

  const handleAlertsChange = () => {
    const val = !alerts;
    setAlerts(val);
    handleSave(logLevel, retention, val);
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center text-slate-400 gap-2">
        <Loader2 className="animate-spin text-indigo-400" size={20} />
        <span>Loading telemetry configurations from database...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Telemetry & Debug Configurations</h2>
          <p className="text-xs text-slate-400 mt-1">Configure retention thresholds and telemetry logging details for developers.</p>
        </div>
        {statusMessage && (
          <span className={`text-xs px-3 py-1.5 rounded-lg border ${
            statusMessage.includes('Failed') 
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
          } transition-all duration-300 font-medium`}>
            {statusMessage}
          </span>
        )}
      </div>

      <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-6 space-y-6 shadow-sm">
        {/* Logging */}
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"><Shield size={18} /></div>
          <div className="flex-1 space-y-2">
            <h4 className="text-sm font-semibold text-slate-100">Execution Log Level</h4>
            <p className="text-xs text-slate-400">Control detail output printed in stdout for the pipeline containers.</p>
            <select 
              value={logLevel} 
              onChange={(e) => handleLogLevelChange(e.target.value)}
              disabled={saving}
              className="bg-slate-950 border border-slate-850 rounded-lg py-1.5 px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 w-48 disabled:opacity-50"
            >
              <option value="DEBUG">DEBUG (Verbose)</option>
              <option value="INFO">INFO (Standard)</option>
              <option value="WARN">WARN (Warnings Only)</option>
              <option value="ERROR">ERROR (Crashes Only)</option>
            </select>
          </div>
        </div>

        <hr className="border-slate-800/50" />

        {/* Retention */}
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"><Database size={18} /></div>
          <div className="flex-1 space-y-2">
            <h4 className="text-sm font-semibold text-slate-100">Database Frame Retention</h4>
            <p className="text-xs text-slate-400">Number of days to preserve frame history in postgres before auto-purging.</p>
            <select 
              value={retention} 
              onChange={(e) => handleRetentionChange(e.target.value)}
              disabled={saving}
              className="bg-slate-950 border border-slate-850 rounded-lg py-1.5 px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 w-48 disabled:opacity-50"
            >
              <option value="7">7 Days</option>
              <option value="14">14 Days</option>
              <option value="30">30 Days (Recommended)</option>
              <option value="90">90 Days</option>
            </select>
          </div>
        </div>

        <hr className="border-slate-800/50" />

        {/* Alerts */}
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20"><Bell size={18} /></div>
          <div className="flex-1 space-y-2">
            <h4 className="text-sm font-semibold text-slate-100">Developer Alerts & Prompts</h4>
            <p className="text-xs text-slate-400">Trigger alerts on queue backlog spikes or worker offline states.</p>
            <label className="relative inline-flex items-center cursor-pointer pt-1">
              <input 
                type="checkbox" 
                checked={alerts} 
                onChange={handleAlertsChange} 
                disabled={saving}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-slate-950 after:content-[''] after:absolute after:top-[6px] after:left-[2px] after:bg-slate-650 after:border-slate-650 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-slate-950 disabled:opacity-50"></div>
              <span className="ml-3 text-xs text-slate-400">Enable Slack/Discord Webhooks</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

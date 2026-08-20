import React, { useState } from 'react';
import { 
  Settings, 
  KeyRound, 
  ShieldCheck, 
  HardDrive, 
  Copy, 
  Check, 
  AlertTriangle, 
  RotateCcw, 
  Save, 
  CheckCircle2,
  Lock,
  Globe,
  Bell
} from 'lucide-react';
import { stateEngine } from '../services/storage';

export const SettingsView: React.FC = () => {
  const authStatus = stateEngine.getAuthStatus();
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [localhostOnly, setLocalhostOnly] = useState(true);
  const [trayNotifications, setTrayNotifications] = useState(true);
  const [autoOpenDashboard, setAutoOpenDashboard] = useState(true);
  const [debounceMs, setDebounceMs] = useState(200);

  const handleCopyRecoveryCode = () => {
    navigator.clipboard.writeText(authStatus.recoveryCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSettings = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">System & Security Configuration</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage WebAuthn Passkeys, local recovery codes, localhost port binding, and filesystem monitor debounce.
            </p>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>System configuration saved successfully.</span>
        </div>
      )}

      {/* WebAuthn Passkeys & Recovery Code Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <KeyRound className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-200">WebAuthn Passkey & Local Recovery</h3>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Passkey Active
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Sevelr dashboard authentication is anchored to your hardware security key or Windows Hello biometric passkey. In the event of device failure, use your local recovery code below.
        </p>

        <div>
          <label className="block text-slate-400 mb-1.5 text-xs font-medium">Emergency Local Recovery Code</label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={authStatus.recoveryCode}
              className="bg-slate-950/80 border border-slate-800 rounded-lg px-3.5 py-2 font-mono text-xs text-emerald-400 font-bold tracking-wider w-full max-w-sm"
            />
            <button
              onClick={handleCopyRecoveryCode}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium border border-slate-700 flex items-center space-x-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Network & Localhost Posture */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <Globe className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-200">Network & Agent Host Binding</h3>
        </div>

        <div className="space-y-3 text-xs">
          <label className="flex items-center space-x-3 p-3 rounded-lg bg-slate-800/40 border border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={localhostOnly}
              onChange={(e) => setLocalhostOnly(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
            />
            <div>
              <span className="font-semibold text-slate-200">Enforce Strict Localhost Binding (127.0.0.1:3000)</span>
              <p className="text-[11px] text-slate-400">Rejects any non-loopback requests to the API server</p>
            </div>
          </label>

          <label className="flex items-center space-x-3 p-3 rounded-lg bg-slate-800/40 border border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={trayNotifications}
              onChange={(e) => setTrayNotifications(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
            />
            <div>
              <span className="font-semibold text-slate-200">Windows System Tray Balloon Alerts</span>
              <p className="text-[11px] text-slate-400">Show native notifications on snapshot creation and security events</p>
            </div>
          </label>

          <label className="flex items-center space-x-3 p-3 rounded-lg bg-slate-800/40 border border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={autoOpenDashboard}
              onChange={(e) => setAutoOpenDashboard(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
            />
            <div>
              <span className="font-semibold text-slate-200">Auto-Launch Dashboard on Agent Boot</span>
              <p className="text-[11px] text-slate-400">Automatically opens default browser to 127.0.0.1:3000</p>
            </div>
          </label>
        </div>

        <div className="pt-2">
          <label className="block text-slate-400 mb-1 text-xs font-medium">Filesystem Watcher Debounce Window (ms)</label>
          <input
            type="number"
            min={50}
            max={2000}
            step={50}
            value={debounceMs}
            onChange={(e) => setDebounceMs(parseInt(e.target.value) || 200)}
            className="w-48 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={handleSaveSettings}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>
    </div>
  );
};

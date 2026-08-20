import React, { useState } from 'react';
import { 
  Sliders, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Terminal, 
  Lock, 
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import { WindowsSettingAbstraction } from '../types';

interface WindowsSettingsViewProps {
  settings: WindowsSettingAbstraction[];
  onUpdateSetting: (id: string, status: 'Active' | 'Enforcing' | 'Disabled', value?: string) => void;
}

export const WindowsSettingsView: React.FC<WindowsSettingsViewProps> = ({
  settings,
  onUpdateSetting
}) => {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleToggle = (item: WindowsSettingAbstraction) => {
    const nextStatus = item.status === 'Active' ? 'Disabled' : 'Active';
    onUpdateSetting(item.id, nextStatus);
    setSuccessMessage(`Successfully updated '${item.name}' policy to ${nextStatus}.`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleResetAll = () => {
    settings.forEach(s => onUpdateSetting(s.id, 'Active', s.defaultValue));
    setSuccessMessage('Reset all Windows policy abstractions to baseline defaults.');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Windows System Settings Abstraction GUI</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage low-level Windows Defender Firewall, NTFS ACLs, Registry Policies, and Job Objects without manual regedit or PowerShell.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleResetAll}
          className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center space-x-1.5 transition self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All Defaults</span>
        </button>
      </div>

      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {settings.map((item) => {
          const isActive = item.status === 'Active';
          return (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between transition"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-xs text-slate-100">{item.name}</h3>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Category: {item.category}</span>
                  </div>

                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                    item.riskLevel === 'Low'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {item.riskLevel} Risk
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                  {item.description}
                </p>

                {item.registryKey && (
                  <div className="mt-3 bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 text-[10px] font-mono text-slate-400 truncate">
                    HKLM\{item.registryKey}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="text-xs">
                  <span className="text-slate-500">Value: </span>
                  <span className="font-semibold text-slate-200">{item.currentValue}</span>
                </div>

                <button
                  onClick={() => handleToggle(item)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {isActive ? '● Enforcing' : '○ Disabled'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

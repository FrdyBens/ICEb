import React, { useState } from 'react';
import { 
  Radio, 
  Play, 
  Square, 
  ExternalLink, 
  Plus, 
  Globe, 
  ShieldCheck, 
  AppWindow, 
  Terminal,
  Settings,
  Sparkles
} from 'lucide-react';
import { ProjectConfig } from '../types';

interface ShortcutsViewProps {
  projects: ProjectConfig[];
  onLaunchToggle: (id: string) => void;
  onOpenProjectDetail: (project: ProjectConfig) => void;
  onOpenNewProject: () => void;
}

export const ShortcutsView: React.FC<ShortcutsViewProps> = ({
  projects,
  onLaunchToggle,
  onOpenProjectDetail,
  onOpenNewProject
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>Configured Shortcuts & Desktop Launchers</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Quick-launch pre-isolated browser containers and specialized sandboxes directly from the Windows system tray or dashboard.
          </p>
        </div>

        <button
          onClick={onOpenNewProject}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Launcher Shortcut</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((p) => (
          <div
            key={p.project.id}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-sm flex flex-col justify-between transition group"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                    p.isRunning ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {p.application.provider === 'brave' ? '🦁' : p.application.provider === 'chrome' ? '🌐' : '⚡'}
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-100 group-hover:text-emerald-400 transition">
                      {p.project.displayName}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {p.isRunning ? `PID ${p.pid} (Running)` : 'Offline'}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {p.project.template}
                </span>
              </div>

              <div className="mt-4 space-y-2 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-[11px]">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Target URL:</span>
                  <span className="font-mono text-slate-200 truncate max-w-[180px]">
                    {p.application.initialUrl || 'about:blank'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Network Policy:</span>
                  <span className="text-emerald-400 font-semibold">{p.network.mode.toUpperCase()}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>DevTools Lock:</span>
                  <span className={p.security.preventDevTools ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                    {p.security.preventDevTools ? 'Enforced' : 'Enabled'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => onOpenProjectDetail(p)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium border border-slate-700 transition"
              >
                Configure
              </button>

              <button
                onClick={() => onLaunchToggle(p.project.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                  p.isRunning
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                }`}
              >
                {p.isRunning ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{p.isRunning ? 'Stop Running' : 'Launch Shortcut'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

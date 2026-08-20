import React from 'react';
import { 
  ShieldCheck, 
  Play, 
  Square, 
  FolderOpen, 
  Activity, 
  HardDriveDownload, 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Lock, 
  Radio, 
  ExternalLink,
  ChevronRight,
  Stethoscope,
  Terminal
} from 'lucide-react';
import { ProjectConfig, AuditEvent, DiagnosticCheck, WindowsSettingAbstraction } from '../types';
import { NavTab } from './Header';

interface OverviewViewProps {
  projects: ProjectConfig[];
  events: AuditEvent[];
  diagnostics: DiagnosticCheck[];
  windowsSettings: WindowsSettingAbstraction[];
  onLaunchProject: (id: string) => void;
  onOpenProjectDetail: (project: ProjectConfig) => void;
  onNavigate: (tab: NavTab) => void;
  onOpenNewProject: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  projects,
  events,
  diagnostics,
  windowsSettings,
  onLaunchProject,
  onOpenProjectDetail,
  onNavigate,
  onOpenNewProject
}) => {
  const runningProjects = projects.filter(p => p.isRunning);
  const passCount = diagnostics.filter(d => d.status === 'PASS').length;

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Agent Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Agent Status</span>
            <div className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-xl font-bold text-slate-100">Running</span>
            <span className="text-xs text-emerald-400 font-medium">● Active</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Port 3000 • Single Instance Locked
          </div>
        </div>

        {/* Projects Card */}
        <div 
          onClick={() => onNavigate('projects')}
          className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 shadow-sm hover:border-slate-700 cursor-pointer transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Managed Environments</span>
            <div className="w-6 h-6 rounded bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Cpu className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-xl font-bold text-slate-100">{projects.length}</span>
            <span className="text-xs text-blue-400 font-medium">
              {runningProjects.length} Active
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Isolated browser & app profiles
          </div>
        </div>

        {/* Filesystem Monitor Card */}
        <div 
          onClick={() => onNavigate('files')}
          className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 shadow-sm hover:border-slate-700 cursor-pointer transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Filesystem Monitor</span>
            <div className="w-6 h-6 rounded bg-amber-500/10 flex items-center justify-center text-amber-400">
              <FolderOpen className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-xl font-bold text-slate-100">Synchronized</span>
            <span className="text-xs text-amber-400 font-medium">● 200ms</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Real-time Windows event coalescing
          </div>
        </div>

        {/* Health Diagnostics Card */}
        <div 
          onClick={() => onNavigate('diagnostics')}
          className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 shadow-sm hover:border-slate-700 cursor-pointer transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">System Doctor</span>
            <div className="w-6 h-6 rounded bg-teal-500/10 flex items-center justify-center text-teal-400">
              <Stethoscope className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-xl font-bold text-slate-100">{passCount}/{diagnostics.length} Passed</span>
            <span className="text-xs text-teal-400 font-medium">● 100%</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            0 Warnings • 0 Policy Errors
          </div>
        </div>
      </div>

      {/* Quick Launch Shortcuts Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-200">Application Shortcuts & Launchers</h3>
          </div>
          <button
            onClick={() => onNavigate('shortcuts')}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1 transition"
          >
            <span>View All Shortcuts</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((p) => (
            <div
              key={p.project.id}
              className="bg-slate-800/60 border border-slate-750 hover:border-slate-700 rounded-lg p-3.5 flex items-center justify-between transition group"
            >
              <div 
                className="cursor-pointer min-w-0 pr-2"
                onClick={() => onOpenProjectDetail(p)}
              >
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-xs text-slate-200 truncate group-hover:text-emerald-300">
                    {p.project.displayName}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-700/60 text-slate-300">
                    {p.application.provider}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                  {p.application.initialUrl || 'about:blank'}
                </div>
              </div>

              <button
                onClick={() => onLaunchProject(p.project.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 shrink-0 transition ${
                  p.isRunning
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                }`}
              >
                {p.isRunning ? (
                  <>
                    <Square className="w-3.5 h-3.5" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Launch</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main 2-Column Section: Defense-in-Depth Matrix + Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Defense-in-Depth Matrix (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-200">Defense-in-Depth Enforcement</h3>
            </div>
            <button
              onClick={() => onNavigate('windows-settings')}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1 transition"
            >
              <span>Configure GUI</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {windowsSettings.map((setting) => (
              <div 
                key={setting.id}
                className="bg-slate-800/40 border border-slate-800 rounded-lg p-3 flex items-start justify-between"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-slate-200">{setting.name}</span>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {setting.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
                    {setting.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <div className="bg-slate-950/80 rounded-lg p-3 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Security Posture: <strong>Fail-Closed Zero Trust</strong></span>
              </span>
              <span className="text-emerald-400 font-mono">100% Enforced</span>
            </div>
          </div>
        </div>

        {/* Right Column: Real-Time Activity Timeline (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-200">Real-Time Activity Stream</h3>
            </div>
            <button
              onClick={() => onNavigate('activity')}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1 transition"
            >
              <span>View Full Log</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {events.slice(0, 6).map((evt) => {
              const timeStr = new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              return (
                <div 
                  key={evt.id}
                  className="flex items-start space-x-3 text-xs bg-slate-800/30 p-2.5 rounded-lg border border-slate-800/80"
                >
                  <div className="mt-0.5 shrink-0">
                    {evt.severity === 'Warning' ? (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    ) : evt.severity === 'Alert' ? (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-300">
                        {evt.component} <span className="text-slate-500 font-normal">({evt.action})</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{timeStr}</span>
                    </div>
                    <p className="text-slate-400 mt-0.5 leading-relaxed text-[11px]">
                      {evt.details}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

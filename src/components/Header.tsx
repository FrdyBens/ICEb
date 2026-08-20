import React from 'react';
import { 
  ShieldCheck, 
  Search, 
  Plus, 
  Camera, 
  Activity, 
  Settings, 
  Layers, 
  FolderOpen, 
  AppWindow, 
  Sliders, 
  HardDriveDownload, 
  Stethoscope,
  Radio
} from 'lucide-react';

export type NavTab = 
  | 'overview' 
  | 'projects' 
  | 'files' 
  | 'shortcuts' 
  | 'security' 
  | 'windows-settings' 
  | 'activity' 
  | 'snapshots' 
  | 'diagnostics' 
  | 'settings';

interface HeaderProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenNewProject: () => void;
  onOpenCommandPalette: () => void;
  runningCount: number;
  totalProjects: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  onOpenNewProject,
  onOpenCommandPalette,
  runningCount,
  totalProjects
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'projects', label: 'Projects', icon: AppWindow },
    { id: 'files', label: 'File Explorer', icon: FolderOpen },
    { id: 'shortcuts', label: 'Shortcuts', icon: Radio },
    { id: 'security', label: 'Security & Isolation', icon: ShieldCheck },
    { id: 'windows-settings', label: 'Windows Settings', icon: Sliders },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'snapshots', label: 'Snapshots & Safety', icon: HardDriveDownload },
    { id: 'diagnostics', label: 'Diagnostics', icon: Stethoscope },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
      {/* Top Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Agent Status */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold tracking-wider text-slate-100 text-lg">SEVELR</span>
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    v2.0.0
                  </span>
                </div>
                <div className="text-xs text-slate-400 hidden sm:block">
                  Universal Windows Isolation & Environment Controller
                </div>
              </div>
            </div>

            {/* Agent Live Pill */}
            <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-300 font-medium">Agent Active</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">127.0.0.1:3000</span>
              <span className="text-slate-500">|</span>
              <span className="text-emerald-400 font-semibold">{runningCount} Running</span>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center space-x-3">
            {/* Quick Command Palette Button */}
            <button
              onClick={onOpenCommandPalette}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs border border-slate-700 transition"
              title="Press Ctrl+K to search"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline text-slate-400">Search commands...</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-400 font-mono">
                Ctrl K
              </kbd>
            </button>

            {/* New Project Button */}
            <button
              onClick={onOpenNewProject}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition shadow-emerald-900/20"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 overflow-x-auto py-1 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap transition ${
                  isActive
                    ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

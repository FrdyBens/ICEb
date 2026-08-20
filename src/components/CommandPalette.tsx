import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Play, 
  Square, 
  FolderOpen, 
  Camera, 
  Stethoscope, 
  ShieldCheck, 
  Sliders, 
  Plus, 
  Settings, 
  X,
  ExternalLink
} from 'lucide-react';
import { ProjectConfig } from '../types';
import { NavTab } from './Header';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectConfig[];
  onNavigate: (tab: NavTab) => void;
  onLaunchProject: (id: string) => void;
  onOpenProjectDetail: (project: ProjectConfig) => void;
  onOpenNewProject: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  projects,
  onNavigate,
  onLaunchProject,
  onOpenProjectDetail,
  onOpenNewProject
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredProjects = projects.filter(p => 
    p.project.displayName.toLowerCase().includes(query.toLowerCase()) ||
    p.project.id.toLowerCase().includes(query.toLowerCase()) ||
    p.project.template.toLowerCase().includes(query.toLowerCase())
  );

  const actions = [
    {
      id: 'create_proj',
      label: 'Create New Project',
      icon: Plus,
      category: 'Projects',
      action: () => { onOpenNewProject(); onClose(); }
    },
    {
      id: 'nav_files',
      label: 'Open Project File Explorer',
      icon: FolderOpen,
      category: 'Navigation',
      action: () => { onNavigate('files'); onClose(); }
    },
    {
      id: 'run_doctor',
      label: 'Run 10-Point Diagnostics Doctor',
      icon: Stethoscope,
      category: 'Diagnostics',
      action: () => { onNavigate('diagnostics'); onClose(); }
    },
    {
      id: 'nav_snapshots',
      label: 'Open Snapshots & Safety Vault',
      icon: Camera,
      category: 'Snapshots',
      action: () => { onNavigate('snapshots'); onClose(); }
    },
    {
      id: 'nav_security',
      label: 'Security & Policy Enforcer Matrix',
      icon: ShieldCheck,
      category: 'Security',
      action: () => { onNavigate('security'); onClose(); }
    },
    {
      id: 'nav_windows',
      label: 'Windows Settings Abstraction GUI',
      icon: Sliders,
      category: 'Windows',
      action: () => { onNavigate('windows-settings'); onClose(); }
    },
    {
      id: 'nav_settings',
      label: 'System & Passkey Settings',
      icon: Settings,
      category: 'Settings',
      action: () => { onNavigate('settings'); onClose(); }
    }
  ].filter(a => a.label.toLowerCase().includes(query.toLowerCase()) || a.category.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Input header */}
        <div className="flex items-center px-4 py-3 border-b border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Type a project name, command, or navigation action..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none"
          />
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 p-1 rounded-md transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-800/40">
          {/* Projects Section */}
          {filteredProjects.length > 0 && (
            <div className="pb-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-1.5">
                Projects ({filteredProjects.length})
              </div>
              {filteredProjects.map((p) => (
                <div
                  key={p.project.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800/80 cursor-pointer group transition text-xs"
                >
                  <div 
                    className="flex items-center space-x-2.5 flex-1 min-w-0"
                    onClick={() => { onOpenProjectDetail(p); onClose(); }}
                  >
                    <div className={`w-2 h-2 rounded-full ${p.isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                    <span className="font-medium text-slate-200 truncate">{p.project.displayName}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {p.project.template}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLaunchProject(p.project.id);
                        onClose();
                      }}
                      className={`px-2 py-1 rounded text-[11px] font-medium flex items-center space-x-1 ${
                        p.isRunning
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                      }`}
                    >
                      {p.isRunning ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      <span>{p.isRunning ? 'Stop' : 'Launch'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Commands Section */}
          {actions.length > 0 && (
            <div className="pt-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-1.5">
                Actions & Tools
              </div>
              {actions.map((act) => {
                const Icon = act.icon;
                return (
                  <div
                    key={act.id}
                    onClick={act.action}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800/80 cursor-pointer group transition text-xs"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-emerald-400">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-medium text-slate-300 group-hover:text-slate-100">{act.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{act.category}</span>
                  </div>
                );
              })}
            </div>
          )}

          {filteredProjects.length === 0 && actions.length === 0 && (
            <div className="py-8 text-center text-slate-500 text-xs">
              No matching projects or commands found for "{query}".
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-slate-950/60 px-4 py-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Navigate with mouse or keyboard</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Play, 
  Square, 
  FolderOpen, 
  Camera, 
  MoreVertical, 
  ShieldCheck, 
  Globe, 
  Cpu, 
  Lock, 
  ExternalLink,
  Layers,
  Filter
} from 'lucide-react';
import { ProjectConfig } from '../types';
import { TEMPLATES } from '../data/templates';

interface ProjectsViewProps {
  projects: ProjectConfig[];
  onOpenProjectDetail: (project: ProjectConfig) => void;
  onLaunchToggle: (id: string) => void;
  onCreateSnapshot: (id: string) => void;
  onOpenNewProject: () => void;
  onNavigateToFiles: (projectId: string) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  onOpenProjectDetail,
  onLaunchToggle,
  onCreateSnapshot,
  onOpenNewProject,
  onNavigateToFiles
}) => {
  const [search, setSearch] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('all');

  const filteredProjects = projects.filter(p => {
    const matchesSearch = 
      p.project.displayName.toLowerCase().includes(search.toLowerCase()) ||
      p.project.id.toLowerCase().includes(search.toLowerCase()) ||
      p.project.description.toLowerCase().includes(search.toLowerCase());
    const matchesTemplate = selectedTemplate === 'all' || p.project.template === selectedTemplate;
    return matchesSearch && matchesTemplate;
  });

  return (
    <div className="space-y-6">
      {/* Top Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center space-x-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search projects by name, id, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Archetypes</option>
              <option value="strict">Strict Isolation</option>
              <option value="balanced">Balanced Everyday</option>
              <option value="development">Dev Sandbox</option>
              <option value="research">OSINT Research</option>
              <option value="private">Private Vault</option>
            </select>
          </div>
        </div>

        <button
          onClick={onOpenNewProject}
          className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Project Environment</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.map((p) => {
          const templateDef = TEMPLATES[p.project.template] || TEMPLATES['strict'];
          return (
            <div
              key={p.project.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-sm flex flex-col justify-between transition group"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${p.isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                    <div>
                      <h3 
                        onClick={() => onOpenProjectDetail(p)}
                        className="font-bold text-sm text-slate-100 group-hover:text-emerald-400 cursor-pointer transition line-clamp-1"
                      >
                        {p.project.displayName}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-500">ID: {p.project.id}</span>
                    </div>
                  </div>

                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {templateDef.name}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                  {p.project.description || 'No description provided.'}
                </p>

                {/* Feature Tags */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <div className="flex items-center space-x-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{p.network.allowedDomains.length} Domains</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                    <span>{p.security.mode.toUpperCase()} Mode</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Cpu className="w-3.5 h-3.5 text-slate-500" />
                    <span>{p.process.maxMemoryMb} MB Limit</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{p.filesystem.encrypted ? 'EFS Encrypted' : 'Standard'}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => onNavigateToFiles(p.project.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs border border-slate-700 transition"
                    title="Open Project Files"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onCreateSnapshot(p.project.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs border border-slate-700 transition"
                    title="Take Snapshot"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onOpenProjectDetail(p)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium border border-slate-700 transition"
                  >
                    Configure
                  </button>
                </div>

                <button
                  onClick={() => onLaunchToggle(p.project.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                    p.isRunning
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                  }`}
                >
                  {p.isRunning ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{p.isRunning ? 'Stop' : 'Launch'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <Layers className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-300">No matching projects found</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or create a new isolated project archetype.
          </p>
          <button
            onClick={onOpenNewProject}
            className="mt-4 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
          >
            Create New Project
          </button>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  Clock, 
  Download,
  Trash2
} from 'lucide-react';
import { AuditEvent, ProjectConfig } from '../types';

interface ActivityViewProps {
  events: AuditEvent[];
  projects: ProjectConfig[];
}

export const ActivityView: React.FC<ActivityViewProps> = ({
  events,
  projects
}) => {
  const [search, setSearch] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  const filteredEvents = events.filter(e => {
    const matchesSearch = 
      e.component.toLowerCase().includes(search.toLowerCase()) ||
      e.action.toLowerCase().includes(search.toLowerCase()) ||
      e.details.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity = selectedSeverity === 'all' || e.severity === selectedSeverity;
    const matchesProject = selectedProjectId === 'all' || e.projectId === selectedProjectId;
    return matchesSearch && matchesSeverity && matchesProject;
  });

  const handleExportCsv = () => {
    const rows = [
      ['Timestamp', 'Severity', 'Component', 'Project ID', 'Action', 'Details'],
      ...filteredEvents.map(e => [
        e.timestamp,
        e.severity,
        e.component,
        e.projectId || 'N/A',
        e.action,
        `"${e.details.replace(/"/g, '""')}"`
      ])
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sevelr_audit_log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Audit Log & Real-Time Event Stream</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Full cryptographic and operational event stream: filesystem mutations, process lifecycle, firewall enforcement.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center space-x-1.5 transition self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV Audit Log</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search event details, components, actions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Severities</option>
            <option value="Info">Info</option>
            <option value="Warning">Warning</option>
            <option value="Alert">Security Alert</option>
            <option value="Error">Error</option>
          </select>

          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Projects</option>
            {projects.map(p => (
              <option key={p.project.id} value={p.project.id}>{p.project.displayName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Events Stream List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800/80 overflow-hidden shadow-sm">
        {filteredEvents.map((evt) => {
          const timeStr = new Date(evt.timestamp).toLocaleString();
          return (
            <div key={evt.id} className="p-4 hover:bg-slate-800/30 transition flex items-start space-x-3 text-xs">
              <div className="mt-0.5 shrink-0">
                {evt.severity === 'Warning' ? (
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                ) : evt.severity === 'Alert' ? (
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-200">{evt.component}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono border border-slate-700">
                      {evt.action}
                    </span>
                    {evt.projectId && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 font-mono border border-blue-500/20">
                        {evt.projectId}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">{timeStr}</span>
                </div>

                <p className="text-slate-300 mt-1 leading-relaxed text-xs">
                  {evt.details}
                </p>
              </div>
            </div>
          );
        })}

        {filteredEvents.length === 0 && (
          <div className="py-12 text-center text-slate-500 text-xs">
            No audit events found matching the selected filters.
          </div>
        )}
      </div>
    </div>
  );
};

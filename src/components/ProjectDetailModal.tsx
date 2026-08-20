import React, { useState } from 'react';
import { 
  X, 
  Play, 
  Square, 
  Save, 
  Camera, 
  Copy, 
  Trash2, 
  ShieldCheck, 
  Globe, 
  FolderLock, 
  Cpu, 
  Lock, 
  Plus, 
  Tag,
  AlertTriangle
} from 'lucide-react';
import { ProjectConfig } from '../types';

interface ProjectDetailModalProps {
  project: ProjectConfig | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: ProjectConfig) => void;
  onLaunchToggle: (id: string) => void;
  onCreateSnapshot: (id: string) => void;
  onDuplicate: (project: ProjectConfig) => void;
  onDelete: (id: string) => void;
}

type TabKey = 'general' | 'browser' | 'network' | 'filesystem' | 'security';

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  isOpen,
  onClose,
  onSave,
  onLaunchToggle,
  onCreateSnapshot,
  onDuplicate,
  onDelete
}) => {
  if (!isOpen || !project) return null;

  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [formData, setFormData] = useState<ProjectConfig>({ ...project });
  const [newDomain, setNewDomain] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const handleAddDomain = () => {
    if (!newDomain.trim()) return;
    const clean = newDomain.trim().toLowerCase();
    if (!formData.network.allowedDomains.includes(clean)) {
      setFormData({
        ...formData,
        network: {
          ...formData.network,
          allowedDomains: [...formData.network.allowedDomains, clean]
        }
      });
      setNewDomain('');
    }
  };

  const handleRemoveDomain = (domain: string) => {
    setFormData({
      ...formData,
      network: {
        ...formData.network,
        allowedDomains: formData.network.allowedDomains.filter(d => d !== domain)
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${formData.isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <span>{formData.project.displayName}</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {formData.project.template}
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {formData.project.id}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onLaunchToggle(formData.project.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                formData.isRunning
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {formData.isRunning ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{formData.isRunning ? 'Stop Running' : 'Launch'}</span>
            </button>

            <button
              onClick={() => onCreateSnapshot(formData.project.id)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium border border-slate-700 flex items-center space-x-1.5 transition"
              title="Create Safety Snapshot"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Snapshot</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 space-x-2 text-xs">
          {[
            { id: 'general', label: 'General Identity', icon: Tag },
            { id: 'browser', label: 'Application & Browser', icon: Globe },
            { id: 'network', label: 'Network & Firewall', icon: ShieldCheck },
            { id: 'filesystem', label: 'Filesystem & EFS', icon: FolderLock },
            { id: 'security', label: 'Security & Limits', icon: Cpu },
          ].map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as TabKey)}
                className={`flex items-center space-x-2 py-3 px-3 border-b-2 font-medium transition ${
                  isActive
                    ? 'border-emerald-400 text-emerald-400 bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Display Name</label>
                <input
                  type="text"
                  value={formData.project.displayName}
                  onChange={(e) => setFormData({
                    ...formData,
                    project: { ...formData.project, displayName: e.target.value }
                  })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Description</label>
                <textarea
                  rows={3}
                  value={formData.project.description}
                  onChange={(e) => setFormData({
                    ...formData,
                    project: { ...formData.project, description: e.target.value }
                  })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Template Archetype</label>
                  <input
                    type="text"
                    disabled
                    value={formData.project.template.toUpperCase()}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-400 text-xs cursor-not-allowed font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Schema Version</label>
                  <input
                    type="text"
                    disabled
                    value={`v${formData.schemaVersion} (Latest)`}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-400 text-xs cursor-not-allowed font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'browser' && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Application Provider</label>
                <select
                  value={formData.application.provider}
                  onChange={(e) => setFormData({
                    ...formData,
                    application: { ...formData.application, provider: e.target.value }
                  })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
                >
                  <option value="brave">Brave Browser (Shields Active)</option>
                  <option value="chrome">Google Chrome (Enterprise Enforced)</option>
                  <option value="edge">Microsoft Edge (Restricted Profile)</option>
                  <option value="custom">Custom Win32 Executable / Script</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Initial URL or Target</label>
                <input
                  type="text"
                  value={formData.application.initialUrl}
                  onChange={(e) => setFormData({
                    ...formData,
                    application: { ...formData.application, initialUrl: e.target.value }
                  })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Custom Executable Path (Optional Override)</label>
                <input
                  type="text"
                  placeholder="C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"
                  value={formData.application.executable || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    application: { ...formData.application, executable: e.target.value || null }
                  })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {activeTab === 'network' && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Network Enforcement Mode</label>
                <select
                  value={formData.network.mode}
                  onChange={(e) => setFormData({
                    ...formData,
                    network: { ...formData.network, mode: e.target.value as any }
                  })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
                >
                  <option value="allowlist">Strict Allowlist (Only listed domains allowed)</option>
                  <option value="denylist">Denylist (Block listed domains)</option>
                  <option value="isolated">Air-Gapped (Block ALL network connections)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Allowed Domains & Hostnames</label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. *.pinterest.com or github.com"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    onClick={handleAddDomain}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-950/60 rounded-lg border border-slate-800">
                  {formData.network.allowedDomains.map(d => (
                    <span 
                      key={d}
                      className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono text-[11px]"
                    >
                      <span>{d}</span>
                      <button 
                        onClick={() => handleRemoveDomain(d)}
                        className="text-slate-500 hover:text-rose-400 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <label className="flex items-center space-x-2.5 p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.network.allowHttps}
                    onChange={(e) => setFormData({
                      ...formData,
                      network: { ...formData.network, allowHttps: e.target.checked }
                    })}
                    className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                  />
                  <span>Enforce HTTPS (Port 443)</span>
                </label>

                <label className="flex items-center space-x-2.5 p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.network.allowLocalhost}
                    onChange={(e) => setFormData({
                      ...formData,
                      network: { ...formData.network, allowLocalhost: e.target.checked }
                    })}
                    className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                  />
                  <span>Allow Localhost & Loopback</span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'filesystem' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center space-x-2.5 p-3 rounded-lg bg-slate-800/40 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.filesystem.encrypted}
                    onChange={(e) => setFormData({
                      ...formData,
                      filesystem: { ...formData.filesystem, encrypted: e.target.checked }
                    })}
                    className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-slate-200">Windows EFS Encryption</span>
                    <p className="text-[11px] text-slate-400">Transparent DPAPI encryption on storage</p>
                  </div>
                </label>

                <label className="flex items-center space-x-2.5 p-3 rounded-lg bg-slate-800/40 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.privacy.clearOnExit}
                    onChange={(e) => setFormData({
                      ...formData,
                      privacy: { ...formData.privacy, clearOnExit: e.target.checked }
                    })}
                    className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-slate-200">Ephemeral Wipe on Exit</span>
                    <p className="text-[11px] text-slate-400">Purge cache and temp files when closed</p>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Downloads Directory Isolation</label>
                <select
                  value={formData.filesystem.downloads}
                  onChange={(e) => setFormData({
                    ...formData,
                    filesystem: { ...formData.filesystem, downloads: e.target.value as any }
                  })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
                >
                  <option value="isolated">Isolated (Strictly kept inside project sandbox)</option>
                  <option value="shared">Shared (Standard Windows Downloads folder)</option>
                  <option value="ephemeral">Ephemeral (RAM-backed / deleted on exit)</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center space-x-2.5 p-3 rounded-lg bg-slate-800/40 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.security.preventDevTools}
                    onChange={(e) => setFormData({
                      ...formData,
                      security: { ...formData.security, preventDevTools: e.target.checked }
                    })}
                    className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-slate-200">Block DevTools Inspection</span>
                    <p className="text-[11px] text-slate-400">Prevents memory & DOM inspection</p>
                  </div>
                </label>

                <label className="flex items-center space-x-2.5 p-3 rounded-lg bg-slate-800/40 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.security.failClosed}
                    onChange={(e) => setFormData({
                      ...formData,
                      security: { ...formData.security, failClosed: e.target.checked }
                    })}
                    className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-slate-200">Fail-Closed Zero Trust</span>
                    <p className="text-[11px] text-slate-400">Abort launch if any policy check fails</p>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Windows Job Object RAM Cap (MB)</label>
                <input
                  type="number"
                  min={512}
                  max={32768}
                  step={512}
                  value={formData.process.maxMemoryMb}
                  onChange={(e) => setFormData({
                    ...formData,
                    process: { ...formData.process, maxMemoryMb: parseInt(e.target.value) || 4096 }
                  })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-rose-400 hover:text-rose-300 text-xs flex items-center space-x-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Project...</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-rose-400 font-semibold">Confirm Delete?</span>
                <button
                  onClick={() => {
                    onDelete(formData.project.id);
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 py-1 rounded bg-slate-800 text-slate-400 text-[11px]"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                onDuplicate(formData);
                onClose();
              }}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium border border-slate-700 flex items-center space-x-1.5 transition"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Duplicate</span>
            </button>

            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

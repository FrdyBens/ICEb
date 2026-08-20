import React, { useState } from 'react';
import { X, Plus, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { TEMPLATES } from '../data/templates';
import { ProjectConfig } from '../types';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (displayName: string, templateKey: string) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreate
}) => {
  if (!isOpen) return null;

  const [displayName, setDisplayName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('balanced');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    onCreate(displayName.trim(), selectedTemplate);
    setDisplayName('');
    setSelectedTemplate('balanced');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Create New Project Environment</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs text-slate-300">
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Project Display Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Pinterest Browser, OSINT Lab, Trading Sandbox"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoFocus
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-2">
              Select Isolation Archetype Preset
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
              {Object.values(TEMPLATES).map((tmpl) => {
                const isSelected = selectedTemplate === tmpl.id;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => setSelectedTemplate(tmpl.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 text-slate-100'
                        : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-200">{tmpl.name}</span>
                        {isSelected ? (
                          <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {tmpl.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {tmpl.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/60 text-[10px] font-mono text-slate-500 truncate">
                      Default: {tmpl.defaultDomains.join(', ') || 'Zero Network'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium border border-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!displayName.trim()}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition"
            >
              Create Environment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

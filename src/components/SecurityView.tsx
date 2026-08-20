import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Cpu, 
  Globe, 
  FolderLock, 
  FileCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Sliders,
  Terminal,
  Layers
} from 'lucide-react';
import { ProjectConfig, WindowsSettingAbstraction } from '../types';

interface SecurityViewProps {
  projects: ProjectConfig[];
  windowsSettings: WindowsSettingAbstraction[];
  onOpenWindowsSettings: () => void;
}

export const SecurityView: React.FC<SecurityViewProps> = ({
  projects,
  windowsSettings,
  onOpenWindowsSettings
}) => {
  const securityLayers = [
    {
      title: 'Layer 1: Windows Firewall Network Sandbox',
      status: 'Active',
      icon: Globe,
      description: 'Isolates browser outbound sockets. Disallows cross-project network access and strictly whitelists only designated domain hostnames.',
      enforcedOn: `${projects.length} Environments`
    },
    {
      title: 'Layer 2: Chromium Enterprise Policy Injection',
      status: 'Active',
      icon: ShieldCheck,
      description: 'Injects registry machine policies disabling developer tools, blocking unauthorized extension side-loading, and enforcing secure DNS (DoH).',
      enforcedOn: 'All Chromium Profiles'
    },
    {
      title: 'Layer 3: NTFS User-Only Discretionary ACLs',
      status: 'Active',
      icon: FolderLock,
      description: 'Strips inherited permissions from LocalAppData folders. Grants exclusive Read/Write control strictly to current authenticated Windows user SID.',
      enforcedOn: 'AppData/Local/Sevelr'
    },
    {
      title: 'Layer 4: Windows Encrypting File System (EFS)',
      status: 'Active',
      icon: Lock,
      description: 'Enables hardware/DPAPI-backed filesystem encryption preventing offline disk inspection of user credentials and isolated downloads.',
      enforcedOn: 'Project Storage Trees'
    },
    {
      title: 'Layer 5: Win32 Job Object Process Memory Limits',
      status: 'Active',
      icon: Cpu,
      description: 'Constrains spawned browser process trees inside dedicated Windows Job Objects with hard memory caps (4GB) and kill-on-close guarantees.',
      enforcedOn: 'Active Runtimes'
    },
    {
      title: 'Layer 6: Real-Time Policy Tamper Monitor',
      status: 'Active',
      icon: FileCheck,
      description: 'Cryptographic SHA-256 baseline hashing on all configuration files. Auto-detects outside file tampering and alerts immediately.',
      enforcedOn: 'Background Agent Service'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Defense-in-Depth Isolation Matrix</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                6-Tier Zero-Trust Security Architecture for Windows Process & Data Isolation
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenWindowsSettings}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center space-x-1.5 transition self-start sm:self-auto"
        >
          <Sliders className="w-3.5 h-3.5 text-emerald-400" />
          <span>Manage Windows Policies GUI</span>
        </button>
      </div>

      {/* 6-Layer Architecture Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {securityLayers.map((layer, idx) => {
          const Icon = layer.icon;
          return (
            <div
              key={idx}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {layer.status}
                  </span>
                </div>

                <h3 className="font-bold text-xs text-slate-200 mt-3">{layer.title}</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {layer.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>Scope:</span>
                <span className="font-medium text-slate-300 font-mono">{layer.enforcedOn}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Per-Project Security Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-slate-200">Active Environment Security Policies</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="p-3">Environment</th>
                <th className="p-3">Mode</th>
                <th className="p-3">Network Policy</th>
                <th className="p-3">DevTools Lock</th>
                <th className="p-3">EFS Encryption</th>
                <th className="p-3">Job Object RAM Limit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {projects.map((p) => (
                <tr key={p.project.id} className="hover:bg-slate-800/30 transition">
                  <td className="p-3 font-semibold text-slate-200">{p.project.displayName}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                      {p.project.template.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 text-emerald-400 font-medium">
                    {p.network.mode === 'allowlist' ? `${p.network.allowedDomains.length} Domains Allowed` : p.network.mode.toUpperCase()}
                  </td>
                  <td className="p-3">
                    {p.security.preventDevTools ? (
                      <span className="text-emerald-400 font-semibold">Locked</span>
                    ) : (
                      <span className="text-slate-500">Unlocked</span>
                    )}
                  </td>
                  <td className="p-3">
                    {p.filesystem.encrypted ? (
                      <span className="text-emerald-400">Enabled (DPAPI)</span>
                    ) : (
                      <span className="text-slate-500">Disabled</span>
                    )}
                  </td>
                  <td className="p-3 font-mono text-slate-300">
                    {p.process.maxMemoryMb} MB
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

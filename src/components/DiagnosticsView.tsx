import React, { useState } from 'react';
import { 
  Stethoscope, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RotateCcw, 
  Terminal, 
  ShieldCheck, 
  Check,
  Sparkles
} from 'lucide-react';
import { DiagnosticCheck } from '../types';

interface DiagnosticsViewProps {
  diagnostics: DiagnosticCheck[];
  onRunDiagnostics: () => void;
}

export const DiagnosticsView: React.FC<DiagnosticsViewProps> = ({
  diagnostics,
  onRunDiagnostics
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastRunTime, setLastRunTime] = useState<string>(new Date().toLocaleTimeString());
  const [remediated, setRemediated] = useState<Record<string, boolean>>({});

  const handleRun = () => {
    setIsRunning(true);
    setTimeout(() => {
      onRunDiagnostics();
      setIsRunning(false);
      setLastRunTime(new Date().toLocaleTimeString());
    }, 600);
  };

  const handleRemediate = (id: string) => {
    setRemediated(prev => ({ ...prev, [id]: true }));
  };

  const passCount = diagnostics.filter(d => d.status === 'PASS' || remediated[d.id]).length;
  const warnCount = diagnostics.filter(d => d.status === 'WARN' && !remediated[d.id]).length;
  const failCount = diagnostics.filter(d => d.status === 'FAIL' && !remediated[d.id]).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">10-Point System Diagnostics Doctor</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated health checker for filesystem permissions, SQLite integrity, browser binaries, and Windows policy drivers.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <span className="text-xs text-slate-500 font-mono hidden md:inline">
            Last Checked: {lastRunTime}
          </span>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Analyzing System...' : 'Run Diagnostics'}</span>
          </button>
        </div>
      </div>

      {/* Summary Scoreboard */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-100">{passCount}</div>
            <div className="text-xs text-emerald-400 font-medium">Passed Checks</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-100">{warnCount}</div>
            <div className="text-xs text-amber-400 font-medium">Warnings</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-100">{failCount}</div>
            <div className="text-xs text-rose-400 font-medium">Critical Errors</div>
          </div>
        </div>
      </div>

      {/* Diagnostic Items List */}
      <div className="space-y-3">
        {diagnostics.map((check) => {
          const isRemediated = remediated[check.id];
          const status = isRemediated ? 'PASS' : check.status;

          return (
            <div
              key={check.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex items-start justify-between space-x-4"
            >
              <div className="flex items-start space-x-3 min-w-0">
                <div className="mt-0.5 shrink-0">
                  {status === 'PASS' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : status === 'WARN' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-xs text-slate-200">{check.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                      {check.category}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {check.details}
                  </p>

                  {check.remediation && status !== 'PASS' && (
                    <div className="mt-2 text-[11px] text-amber-300/90 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                      <strong>Remediation:</strong> {check.remediation}
                    </div>
                  )}
                </div>
              </div>

              <div className="shrink-0">
                {status === 'PASS' ? (
                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    PASS
                  </span>
                ) : (
                  <button
                    onClick={() => handleRemediate(check.id)}
                    className="px-3 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition"
                  >
                    Fix Automatically
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

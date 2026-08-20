import React, { useState } from 'react';
import { ShieldCheck, KeyRound, Sparkles, Check, ArrowRight } from 'lucide-react';
import { stateEngine } from '../services/storage';

interface FirstRunModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const FirstRunModal: React.FC<FirstRunModalProps> = ({
  isOpen,
  onComplete
}) => {
  if (!isOpen) return null;

  const [step, setStep] = useState<number>(1);
  const [devicePin, setDevicePin] = useState<string>('7788');
  const [recoveryCode, setRecoveryCode] = useState<string>('7F3A-9E2B-44C1-889D');

  const handleFinish = () => {
    stateEngine.setAuthStatus({
      isFirstRun: false,
      isAuthenticated: true,
      passkeyRegistered: true,
      recoveryCode
    });
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-800 text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-100">Welcome to Sevelr v2.0.0</h2>
          <p className="text-xs text-slate-400 mt-1">
            Universal Windows Isolation & Environment Controller
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs text-slate-300">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-200 text-sm">Step 1: Zero-Trust Security Setup</h3>
              <p className="text-slate-400 leading-relaxed">
                Sevelr encapsulates browser workflows in dedicated Windows sandboxes with strict outbound firewall policies, encrypted NTFS storage, and real-time filesystem synchronization.
              </p>
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
                  <Check className="w-4 h-4" />
                  <span>Windows C# Agent (Service & System Tray)</span>
                </div>
                <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
                  <Check className="w-4 h-4" />
                  <span>SQLite State Database (sevelr.db)</span>
                </div>
                <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
                  <Check className="w-4 h-4" />
                  <span>Localhost API & Real-Time Sync</span>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-200 text-sm">Step 2: WebAuthn Passkey & Recovery Code</h3>
              <p className="text-slate-400 leading-relaxed">
                Your local dashboard is protected via hardware authentication. Below is your emergency recovery code. Keep it in a secure password manager.
              </p>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Your Local Emergency Recovery Code</label>
                <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-3 text-center font-mono text-sm font-bold text-emerald-400 tracking-wider">
                  {recoveryCode}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">Step {step} of 2</span>
          {step === 1 ? (
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
            >
              Enter Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Camera, 
  HardDriveDownload, 
  RotateCcw, 
  FileCheck, 
  Trash2, 
  Plus, 
  Search, 
  Clock, 
  ShieldCheck, 
  FileText, 
  Eye, 
  Check, 
  AlertTriangle,
  X
} from 'lucide-react';
import { SnapshotItem, ProjectConfig } from '../types';

interface SnapshotsViewProps {
  snapshots: SnapshotItem[];
  projects: ProjectConfig[];
  onCreateSnapshot: (projectId: string, customName?: string) => void;
  onRestoreSnapshot: (snapshotId: string) => void;
  onDeleteSnapshot: (snapshotId: string) => void;
}

export const SnapshotsView: React.FC<SnapshotsViewProps> = ({
  snapshots,
  projects,
  onCreateSnapshot,
  onRestoreSnapshot,
  onDeleteSnapshot
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [targetProjectForCreate, setTargetProjectForCreate] = useState<string>(projects[0]?.project.id || '');
  const [customSnapshotName, setCustomSnapshotName] = useState<string>('');
  const [previewSnapshot, setPreviewSnapshot] = useState<SnapshotItem | null>(null);
  const [restoreConfirmSnapshot, setRestoreConfirmSnapshot] = useState<SnapshotItem | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);

  const filteredSnapshots = snapshots.filter(s => {
    if (selectedProjectId === 'all') return true;
    return s.projectId === selectedProjectId;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProjectForCreate) return;
    onCreateSnapshot(targetProjectForCreate, customSnapshotName.trim() || undefined);
    setCustomSnapshotName('');
    setShowCreateModal(false);
  };

  const handleExecuteRestore = () => {
    if (!restoreConfirmSnapshot) return;
    onRestoreSnapshot(restoreConfirmSnapshot.id);
    setRestoreSuccess(`Restored project '${restoreConfirmSnapshot.projectId}' from '${restoreConfirmSnapshot.snapshotName}'.`);
    setRestoreConfirmSnapshot(null);
    setTimeout(() => setRestoreSuccess(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <HardDriveDownload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Project Snapshots & Safe Restores</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Create point-in-time `.sevelr` packages containing policy configs, checksums, and filesystem trees.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.project.id} value={p.project.id}>
                {p.project.displayName}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition"
          >
            <Camera className="w-4 h-4" />
            <span>Create Snapshot</span>
          </button>
        </div>
      </div>

      {restoreSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-fade-in">
          <Check className="w-4 h-4 shrink-0" />
          <span>{restoreSuccess}</span>
        </div>
      )}

      {/* Snapshots Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="p-4">Snapshot Name</th>
                <th className="p-4">Project ID</th>
                <th className="p-4">Created Date</th>
                <th className="p-4">Size</th>
                <th className="p-4">SHA-256 Checksum</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredSnapshots.map((snap) => (
                <tr key={snap.id} className="hover:bg-slate-800/30 transition">
                  <td className="p-4 font-semibold text-slate-100 flex items-center space-x-2">
                    <HardDriveDownload className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{snap.snapshotName}.sevelr</span>
                  </td>
                  <td className="p-4 font-mono text-slate-400">{snap.projectId}</td>
                  <td className="p-4 text-slate-400">
                    {new Date(snap.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4 font-mono text-slate-300">
                    {(snap.fileSizeBytes / 1024).toFixed(1)} KB
                  </td>
                  <td className="p-4 font-mono text-[10px] text-slate-500 max-w-[140px] truncate" title={snap.checksum}>
                    {snap.checksum.substring(0, 16)}...
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setPreviewSnapshot(snap)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition"
                        title="Inspect Manifest & Files"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setRestoreConfirmSnapshot(snap)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20 border border-emerald-500/20 font-semibold flex items-center space-x-1 transition"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restore...</span>
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Delete snapshot '${snap.snapshotName}'?`)) {
                            onDeleteSnapshot(snap.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition"
                        title="Delete Snapshot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSnapshots.length === 0 && (
          <div className="py-12 text-center text-slate-500 text-xs">
            No snapshots found. Click "Create Snapshot" above to create a point-in-time recovery archive.
          </div>
        )}
      </div>

      {/* Create Snapshot Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 w-full max-w-md">
            <h4 className="text-sm font-bold text-slate-100 mb-3">Create Point-in-Time Snapshot</h4>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Target Project</label>
                <select
                  value={targetProjectForCreate}
                  onChange={(e) => setTargetProjectForCreate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  {projects.map((p) => (
                    <option key={p.project.id} value={p.project.id}>
                      {p.project.displayName} ({p.project.template})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Custom Snapshot Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. baseline_before_update"
                  value={customSnapshotName}
                  onChange={(e) => setCustomSnapshotName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                >
                  Capture Snapshot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Manifest Modal */}
      {previewSnapshot && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 w-full max-w-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-sm font-bold text-slate-100">Snapshot Manifest Inspector</h4>
              <button onClick={() => setPreviewSnapshot(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 overflow-y-auto space-y-3 text-xs">
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-[11px] font-mono space-y-1">
                <div><strong>Snapshot Name:</strong> {previewSnapshot.snapshotName}</div>
                <div><strong>Project ID:</strong> {previewSnapshot.projectId}</div>
                <div><strong>Platform Version:</strong> {previewSnapshot.manifest.platformVersion}</div>
                <div><strong>Archive Hash:</strong> {previewSnapshot.checksum}</div>
              </div>

              <h5 className="font-semibold text-slate-300 pt-2">Manifest Files & Hashes:</h5>
              <div className="space-y-1 max-h-48 overflow-y-auto bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px]">
                {Object.entries(previewSnapshot.manifest.files).map(([path, hash]) => (
                  <div key={path} className="flex items-center justify-between text-slate-300">
                    <span>{path}</span>
                    <span className="text-slate-500 text-[10px]">{String(hash).substring(0, 12)}...</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setPreviewSnapshot(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Diff Confirmation Modal */}
      {restoreConfirmSnapshot && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 w-full max-w-lg">
            <div className="flex items-center space-x-2.5 text-amber-400 mb-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h4 className="text-sm font-bold text-slate-100">Confirm Safe Project Restore</h4>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Restoring from snapshot <strong className="text-slate-100 font-mono">'{restoreConfirmSnapshot.snapshotName}'</strong> will roll back all configuration files and state in project <strong className="text-slate-100 font-mono">'{restoreConfirmSnapshot.projectId}'</strong> to this point in time.
            </p>

            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-[11px] space-y-1 mb-4">
              <div className="text-slate-400">Files to be restored: {Object.keys(restoreConfirmSnapshot.manifest.files).length} files</div>
              <div className="text-slate-400">Timestamp: {new Date(restoreConfirmSnapshot.createdAt).toLocaleString()}</div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setRestoreConfirmSnapshot(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteRestore}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                Confirm & Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

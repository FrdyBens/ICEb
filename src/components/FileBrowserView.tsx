import React, { useState } from 'react';
import { 
  FolderOpen, 
  FileText, 
  FileCode, 
  FileJson, 
  Plus, 
  Trash2, 
  Save, 
  Download, 
  Search, 
  ChevronRight, 
  FolderPlus, 
  ArrowLeft, 
  ShieldCheck, 
  AlertTriangle,
  X,
  File
} from 'lucide-react';
import { ProjectConfig, FileItem } from '../types';

interface FileBrowserViewProps {
  projects: ProjectConfig[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  files: FileItem[];
  onSaveFile: (projectId: string, path: string, content: string) => void;
  onDeleteFile: (projectId: string, path: string) => void;
  onCreateFolder: (projectId: string, path: string) => void;
}

export const FileBrowserView: React.FC<FileBrowserViewProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
  files,
  onSaveFile,
  onDeleteFile,
  onCreateFolder
}) => {
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [activeFile, setActiveFile] = useState<FileItem | null>(null);
  const [editorContent, setEditorContent] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [showNewFolderModal, setShowNewFolderModal] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [showNewFileModal, setShowNewFileModal] = useState<boolean>(false);
  const [newFileName, setNewFileName] = useState<string>('');

  const currentProject = projects.find(p => p.project.id === selectedProjectId) || projects[0];

  // Filter files in currentFolder
  const visibleFiles = files.filter(f => {
    if (search.trim()) {
      return f.name.toLowerCase().includes(search.toLowerCase()) || f.path.toLowerCase().includes(search.toLowerCase());
    }
    if (!currentFolder) {
      // Top-level files (no slash or single segment)
      return !f.path.includes('/') || (f.isDirectory && f.path.split('/').length === 1);
    }
    // Sub-folder items
    const prefix = `${currentFolder}/`;
    return f.path.startsWith(prefix) && f.path !== currentFolder;
  });

  const handleOpenFile = (f: FileItem) => {
    if (f.isDirectory) {
      setCurrentFolder(f.path);
      setActiveFile(null);
    } else {
      setActiveFile(f);
      setEditorContent(f.content || '');
      setSaveStatus(null);
    }
  };

  const handleSave = () => {
    if (!activeFile || !currentProject) return;
    try {
      onSaveFile(currentProject.project.id, activeFile.path, editorContent);
      setActiveFile({ ...activeFile, content: editorContent, size: editorContent.length });
      setSaveStatus('Saved successfully');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !currentProject) return;
    const targetPath = currentFolder ? `${currentFolder}/${newFolderName.trim()}` : newFolderName.trim();
    onCreateFolder(currentProject.project.id, targetPath);
    setNewFolderName('');
    setShowNewFolderModal(false);
  };

  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim() || !currentProject) return;
    const targetPath = currentFolder ? `${currentFolder}/${newFileName.trim()}` : newFileName.trim();
    const initialContent = targetPath.endsWith('.json') ? '{\n  "version": 1\n}' : '';
    onSaveFile(currentProject.project.id, targetPath, initialContent);
    setNewFileName('');
    setShowNewFileModal(false);
  };

  const breadcrumbs = currentFolder ? currentFolder.split('/') : [];

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center space-x-3">
          <label className="text-xs font-semibold text-slate-400">Environment:</label>
          <select
            value={currentProject?.project.id || ''}
            onChange={(e) => {
              onSelectProject(e.target.value);
              setCurrentFolder('');
              setActiveFile(null);
            }}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-emerald-500"
          >
            {projects.map((p) => (
              <option key={p.project.id} value={p.project.id}>
                {p.project.displayName} ({p.project.template})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={() => setShowNewFolderModal(true)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs flex items-center space-x-1.5 transition"
            title="Create New Folder"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Folder</span>
          </button>

          <button
            onClick={() => setShowNewFileModal(true)}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New File</span>
          </button>
        </div>
      </div>

      {/* Main Filesystem Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Explorer Directory Listing (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
          {/* Breadcrumbs */}
          <div className="flex items-center space-x-1 text-xs text-slate-400 pb-2 border-b border-slate-800 overflow-x-auto">
            <button
              onClick={() => { setCurrentFolder(''); setActiveFile(null); }}
              className={`hover:text-slate-200 font-medium ${!currentFolder ? 'text-emerald-400 font-semibold' : ''}`}
            >
              Root
            </button>
            {breadcrumbs.map((crumb, idx) => {
              const fullPath = breadcrumbs.slice(0, idx + 1).join('/');
              return (
                <React.Fragment key={fullPath}>
                  <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                  <button
                    onClick={() => { setCurrentFolder(fullPath); setActiveFile(null); }}
                    className={`hover:text-slate-200 font-medium ${idx === breadcrumbs.length - 1 ? 'text-emerald-400 font-semibold' : ''}`}
                  >
                    {crumb}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          {/* Files List */}
          <div className="space-y-1 max-h-[500px] overflow-y-auto">
            {currentFolder && (
              <div
                onClick={() => {
                  const parent = breadcrumbs.slice(0, -1).join('/');
                  setCurrentFolder(parent);
                  setActiveFile(null);
                }}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-slate-800/60 cursor-pointer text-xs text-slate-400 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                <span>.. (Up one level)</span>
              </div>
            )}

            {visibleFiles.map((f) => {
              const isSelected = activeFile?.path === f.path;
              return (
                <div
                  key={f.path}
                  onClick={() => handleOpenFile(f)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition group ${
                    isSelected
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'hover:bg-slate-800 text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                    {f.isDirectory ? (
                      <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : f.name.endsWith('.json') ? (
                      <FileJson className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className="truncate font-medium">{f.name}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {f.isDirectory ? 'dir' : `${f.size} B`}
                    </span>
                    {!f.isDirectory && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete '${f.name}'?`)) {
                            onDeleteFile(currentProject.project.id, f.path);
                            if (activeFile?.path === f.path) setActiveFile(null);
                          }
                        }}
                        className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {visibleFiles.length === 0 && (
              <div className="py-8 text-center text-slate-500 text-xs">
                Folder is currently empty.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Code & File Editor (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          {activeFile ? (
            <div className="space-y-3 flex-1 flex flex-col">
              {/* Editor Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono text-xs font-semibold text-slate-200">{activeFile.path}</span>
                  <span className="text-[10px] font-mono text-slate-500">({editorContent.length} bytes)</span>
                </div>

                <div className="flex items-center space-x-2">
                  {saveStatus && (
                    <span className="text-[11px] text-emerald-400 font-semibold animate-fade-in">
                      {saveStatus}
                    </span>
                  )}
                  <button
                    onClick={handleSave}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1 shadow-sm transition"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save File</span>
                  </button>
                </div>
              </div>

              {/* Editor Area */}
              <textarea
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                rows={18}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500 leading-relaxed resize-none flex-1"
                spellCheck={false}
              />
            </div>
          ) : (
            <div className="py-24 text-center text-slate-500 text-xs space-y-2">
              <FolderOpen className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="font-medium text-slate-400">Select a file from the explorer to preview or edit</p>
              <p className="text-[11px] text-slate-600">Strict path traversal checks are enforced on all file operations</p>
            </div>
          )}
        </div>
      </div>

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 w-full max-w-sm">
            <h4 className="text-sm font-bold text-slate-100 mb-3">Create New Folder</h4>
            <form onSubmit={handleCreateFolder} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Folder name (e.g. data, logs)"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                autoFocus
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New File Modal */}
      {showNewFileModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 w-full max-w-sm">
            <h4 className="text-sm font-bold text-slate-100 mb-3">Create New File</h4>
            <form onSubmit={handleCreateFile} className="space-y-3">
              <input
                type="text"
                required
                placeholder="File name (e.g. settings.json, notes.md)"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                autoFocus
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewFileModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                >
                  Create File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

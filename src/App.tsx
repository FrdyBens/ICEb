/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header, NavTab } from './components/Header';
import { CommandPalette } from './components/CommandPalette';
import { OverviewView } from './components/OverviewView';
import { ProjectsView } from './components/ProjectsView';
import { ProjectDetailModal } from './components/ProjectDetailModal';
import { NewProjectModal } from './components/NewProjectModal';
import { FileBrowserView } from './components/FileBrowserView';
import { ShortcutsView } from './components/ShortcutsView';
import { SecurityView } from './components/SecurityView';
import { WindowsSettingsView } from './components/WindowsSettingsView';
import { SnapshotsView } from './components/SnapshotsView';
import { DiagnosticsView } from './components/DiagnosticsView';
import { ActivityView } from './components/ActivityView';
import { SettingsView } from './components/SettingsView';
import { FirstRunModal } from './components/FirstRunModal';
import { stateEngine } from './services/storage';
import { ProjectConfig, AuditEvent, SnapshotItem, DiagnosticCheck, WindowsSettingAbstraction } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [projects, setProjects] = useState<ProjectConfig[]>([]);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([]);
  const [diagnostics, setDiagnostics] = useState<DiagnosticCheck[]>([]);
  const [windowsSettings, setWindowsSettings] = useState<WindowsSettingAbstraction[]>([]);
  
  // Active selected project for modals / file explorer
  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState<ProjectConfig | null>(null);
  const [selectedProjectIdForFiles, setSelectedProjectIdForFiles] = useState<string>('');
  
  // Modals
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isFirstRunOpen, setIsFirstRunOpen] = useState(false);

  // Load initial state
  useEffect(() => {
    refreshState();
    const unsubscribe = stateEngine.subscribeToEvents((newEvent) => {
      setEvents(prev => [newEvent, ...prev].slice(0, 200));
    });

    const auth = stateEngine.getAuthStatus();
    if (auth.isFirstRun) {
      setIsFirstRunOpen(true);
    }

    return () => unsubscribe();
  }, []);

  const refreshState = () => {
    const p = stateEngine.getProjects();
    setProjects(p);
    setEvents(stateEngine.getEvents());
    setSnapshots(stateEngine.getSnapshots());
    setDiagnostics(stateEngine.getDiagnostics());
    setWindowsSettings(stateEngine.getWindowsSettings());
    if (p.length > 0 && !selectedProjectIdForFiles) {
      setSelectedProjectIdForFiles(p[0].project.id);
    }
  };

  const handleLaunchToggle = (id: string) => {
    stateEngine.toggleProjectLaunch(id);
    refreshState();
    if (selectedProjectForDetail?.project.id === id) {
      setSelectedProjectForDetail(stateEngine.getProject(id) || null);
    }
  };

  const handleCreateProject = (displayName: string, templateKey: string) => {
    const created = stateEngine.createProject(displayName, templateKey);
    refreshState();
    setSelectedProjectForDetail(created);
  };

  const handleSaveProject = (updated: ProjectConfig) => {
    stateEngine.updateProject(updated.project.id, updated);
    refreshState();
  };

  const handleDuplicateProject = (original: ProjectConfig) => {
    const copy = stateEngine.createProject(`${original.project.displayName} (Copy)`, original.project.template, original);
    refreshState();
    setSelectedProjectForDetail(copy);
  };

  const handleDeleteProject = (id: string) => {
    stateEngine.deleteProject(id);
    refreshState();
    if (selectedProjectForDetail?.project.id === id) {
      setSelectedProjectForDetail(null);
    }
  };

  const handleCreateSnapshot = (projectId: string, customName?: string) => {
    stateEngine.createSnapshot(projectId, customName);
    refreshState();
  };

  const handleRestoreSnapshot = (snapshotId: string) => {
    stateEngine.restoreSnapshot(snapshotId);
    refreshState();
  };

  const handleDeleteSnapshot = (snapshotId: string) => {
    stateEngine.deleteSnapshot(snapshotId);
    refreshState();
  };

  const handleSaveFile = (projectId: string, path: string, content: string) => {
    stateEngine.saveFile(projectId, path, content);
    refreshState();
  };

  const handleDeleteFile = (projectId: string, path: string) => {
    stateEngine.deleteFile(projectId, path);
    refreshState();
  };

  const handleCreateFolder = (projectId: string, path: string) => {
    stateEngine.createDirectory(projectId, path);
    refreshState();
  };

  const handleUpdateWindowsSetting = (id: string, status: 'Active' | 'Enforcing' | 'Disabled', value?: string) => {
    stateEngine.updateWindowsSetting(id, status, value);
    refreshState();
  };

  const handleRunDiagnostics = () => {
    const res = stateEngine.runDiagnostics();
    setDiagnostics(res);
    refreshState();
  };

  const runningCount = projects.filter(p => p.isRunning).length;
  const projectFiles = stateEngine.getProjectFiles(selectedProjectIdForFiles);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenNewProject={() => setIsNewProjectOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        runningCount={runningCount}
        totalProjects={projects.length}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'overview' && (
          <OverviewView
            projects={projects}
            events={events}
            diagnostics={diagnostics}
            windowsSettings={windowsSettings}
            onLaunchProject={handleLaunchToggle}
            onOpenProjectDetail={setSelectedProjectForDetail}
            onNavigate={setCurrentTab}
            onOpenNewProject={() => setIsNewProjectOpen(true)}
          />
        )}

        {currentTab === 'projects' && (
          <ProjectsView
            projects={projects}
            onOpenProjectDetail={setSelectedProjectForDetail}
            onLaunchToggle={handleLaunchToggle}
            onCreateSnapshot={(id) => handleCreateSnapshot(id)}
            onOpenNewProject={() => setIsNewProjectOpen(true)}
            onNavigateToFiles={(projectId) => {
              setSelectedProjectIdForFiles(projectId);
              setCurrentTab('files');
            }}
          />
        )}

        {currentTab === 'files' && (
          <FileBrowserView
            projects={projects}
            selectedProjectId={selectedProjectIdForFiles || projects[0]?.project.id || ''}
            onSelectProject={setSelectedProjectIdForFiles}
            files={projectFiles}
            onSaveFile={handleSaveFile}
            onDeleteFile={handleDeleteFile}
            onCreateFolder={handleCreateFolder}
          />
        )}

        {currentTab === 'shortcuts' && (
          <ShortcutsView
            projects={projects}
            onLaunchToggle={handleLaunchToggle}
            onOpenProjectDetail={setSelectedProjectForDetail}
            onOpenNewProject={() => setIsNewProjectOpen(true)}
          />
        )}

        {currentTab === 'security' && (
          <SecurityView
            projects={projects}
            windowsSettings={windowsSettings}
            onOpenWindowsSettings={() => setCurrentTab('windows-settings')}
          />
        )}

        {currentTab === 'windows-settings' && (
          <WindowsSettingsView
            settings={windowsSettings}
            onUpdateSetting={handleUpdateWindowsSetting}
          />
        )}

        {currentTab === 'activity' && (
          <ActivityView
            events={events}
            projects={projects}
          />
        )}

        {currentTab === 'snapshots' && (
          <SnapshotsView
            snapshots={snapshots}
            projects={projects}
            onCreateSnapshot={handleCreateSnapshot}
            onRestoreSnapshot={handleRestoreSnapshot}
            onDeleteSnapshot={handleDeleteSnapshot}
          />
        )}

        {currentTab === 'diagnostics' && (
          <DiagnosticsView
            diagnostics={diagnostics}
            onRunDiagnostics={handleRunDiagnostics}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView />
        )}
      </main>

      {/* Global Modals */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        projects={projects}
        onNavigate={setCurrentTab}
        onLaunchProject={handleLaunchToggle}
        onOpenProjectDetail={setSelectedProjectForDetail}
        onOpenNewProject={() => setIsNewProjectOpen(true)}
      />

      <ProjectDetailModal
        project={selectedProjectForDetail}
        isOpen={!!selectedProjectForDetail}
        onClose={() => setSelectedProjectForDetail(null)}
        onSave={handleSaveProject}
        onLaunchToggle={handleLaunchToggle}
        onCreateSnapshot={handleCreateSnapshot}
        onDuplicate={handleDuplicateProject}
        onDelete={handleDeleteProject}
      />

      <NewProjectModal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onCreate={handleCreateProject}
      />

      <FirstRunModal
        isOpen={isFirstRunOpen}
        onComplete={() => setIsFirstRunOpen(false)}
      />
    </div>
  );
}

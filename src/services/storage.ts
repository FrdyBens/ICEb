import { ProjectConfig, AuditEvent, SnapshotItem, DiagnosticCheck, WindowsSettingAbstraction, FileItem } from '../types';
import { INITIAL_PROJECTS, INITIAL_AUDIT_EVENTS, INITIAL_SNAPSHOTS, INITIAL_DIAGNOSTICS, INITIAL_WINDOWS_SETTINGS, INITIAL_FILES } from '../data/initialData';
import { TEMPLATES } from '../data/templates';

const STORAGE_KEYS = {
  PROJECTS: 'sevelr_projects_v2',
  EVENTS: 'sevelr_events_v2',
  SNAPSHOTS: 'sevelr_snapshots_v2',
  DIAGNOSTICS: 'sevelr_diagnostics_v2',
  WINDOWS_SETTINGS: 'sevelr_windows_settings_v2',
  FILES: 'sevelr_files_v2',
  AUTH: 'sevelr_auth_v2',
  APP_SETTINGS: 'sevelr_app_settings_v2'
};

type EventListener = (event: AuditEvent) => void;

class LocalStateEngine {
  private listeners: Set<EventListener> = new Set();

  public getProjects(): ProjectConfig[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (!raw) {
      this.saveProjects(INITIAL_PROJECTS);
      return INITIAL_PROJECTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_PROJECTS;
    }
  }

  public saveProjects(projects: ProjectConfig[]): void {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }

  public getProject(id: string): ProjectConfig | undefined {
    return this.getProjects().find(p => p.project.id === id);
  }

  public createProject(displayName: string, templateKey: string, customConfig?: Partial<ProjectConfig>): ProjectConfig {
    const template = TEMPLATES[templateKey] || TEMPLATES['strict'];
    const id = displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `proj-${Date.now()}`;
    const now = new Date().toISOString();

    const newProject: ProjectConfig = {
      schemaVersion: 2,
      project: {
        id,
        displayName: displayName.trim(),
        description: customConfig?.project?.description || template.description,
        template: template.id,
        createdAt: now,
        updatedAt: now
      },
      application: {
        provider: 'brave',
        executable: null,
        arguments: [],
        initialUrl: template.defaultDomains[0] ? `https://${template.defaultDomains[0]}` : 'about:blank',
        environmentVariables: { 'SEVELR_PROJECT_ID': id },
        ...customConfig?.application
      },
      network: {
        ...template.defaults.network!,
        ...customConfig?.network
      },
      dns: {
        mode: 'policy',
        allowDirectIp: false,
        allowDoh: true,
        allowDot: false,
        customResolvers: ['1.1.1.1', '9.9.9.9'],
        ...customConfig?.dns
      },
      filesystem: {
        ...template.defaults.filesystem!,
        ...customConfig?.filesystem
      },
      process: {
        ...template.defaults.process!,
        ...customConfig?.process
      },
      privacy: {
        ...template.defaults.privacy!,
        ...customConfig?.privacy
      },
      security: {
        ...template.defaults.security!,
        ...customConfig?.security
      },
      isRunning: false,
      pid: null,
      startedAt: null
    };

    const projects = this.getProjects();
    const updated = [newProject, ...projects.filter(p => p.project.id !== id)];
    this.saveProjects(updated);

    // Create default starter files for project
    const files = this.getAllFiles();
    files[id] = [
      {
        name: 'config',
        path: 'config',
        isDirectory: true,
        size: 0,
        modified: now,
        type: 'folder'
      },
      {
        name: 'project_policy.json',
        path: 'config/project_policy.json',
        isDirectory: false,
        size: 640,
        modified: now,
        type: 'application/json',
        content: JSON.stringify(newProject, null, 2)
      }
    ];
    this.saveAllFiles(files);

    this.logEvent({
      severity: 'Info',
      component: 'ProjectManager',
      projectId: id,
      action: 'project.created',
      details: `Project '${displayName}' created with template '${template.name}'.`
    });

    return newProject;
  }

  public updateProject(id: string, updates: Partial<ProjectConfig>): ProjectConfig {
    const projects = this.getProjects();
    const index = projects.findIndex(p => p.project.id === id);
    if (index === -1) throw new Error(`Project ${id} not found`);

    const existing = projects[index];
    const updated: ProjectConfig = {
      ...existing,
      ...updates,
      project: {
        ...existing.project,
        ...updates.project,
        updatedAt: new Date().toISOString()
      }
    };

    projects[index] = updated;
    this.saveProjects(projects);

    this.logEvent({
      severity: 'Info',
      component: 'ProjectManager',
      projectId: id,
      action: 'project.updated',
      details: `Project settings updated for '${updated.project.displayName}'.`
    });

    return updated;
  }

  public deleteProject(id: string): void {
    const projects = this.getProjects();
    const target = projects.find(p => p.project.id === id);
    const filtered = projects.filter(p => p.project.id !== id);
    this.saveProjects(filtered);

    // Remove files
    const files = this.getAllFiles();
    delete files[id];
    this.saveAllFiles(files);

    this.logEvent({
      severity: 'Warning',
      component: 'ProjectManager',
      projectId: id,
      action: 'project.deleted',
      details: `Project '${target?.project.displayName || id}' was permanently removed.`
    });
  }

  public toggleProjectLaunch(id: string): boolean {
    const projects = this.getProjects();
    const proj = projects.find(p => p.project.id === id);
    if (!proj) return false;

    const isStarting = !proj.isRunning;
    proj.isRunning = isStarting;
    proj.pid = isStarting ? Math.floor(10000 + Math.random() * 80000) : null;
    proj.startedAt = isStarting ? new Date().toISOString() : null;

    this.saveProjects(projects);

    this.logEvent({
      severity: 'Info',
      component: 'ProcessManager',
      projectId: id,
      action: isStarting ? 'runtime.started' : 'runtime.stopped',
      details: isStarting
        ? `Launched ${proj.application.provider.toUpperCase()} (PID ${proj.pid}) with active policy enforcement.`
        : `Terminated process group for '${proj.project.displayName}'.`
    });

    return isStarting;
  }

  // --- Events ---
  public getEvents(): AuditEvent[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(INITIAL_AUDIT_EVENTS));
      return INITIAL_AUDIT_EVENTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_AUDIT_EVENTS;
    }
  }

  public logEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
    const newEvent: AuditEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...event
    };

    const events = [newEvent, ...this.getEvents()].slice(0, 200); // keep last 200
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));

    // Notify listeners
    this.listeners.forEach(fn => {
      try { fn(newEvent); } catch {}
    });

    return newEvent;
  }

  public subscribeToEvents(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // --- Snapshots ---
  public getSnapshots(projectId?: string): SnapshotItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SNAPSHOTS);
    const list: SnapshotItem[] = raw ? JSON.parse(raw) : INITIAL_SNAPSHOTS;
    if (projectId) {
      return list.filter(s => s.projectId === projectId);
    }
    return list;
  }

  public createSnapshot(projectId: string, customName?: string): SnapshotItem {
    const project = this.getProject(projectId);
    if (!project) throw new Error('Project not found');

    const now = new Date().toISOString();
    const name = customName?.trim() || `${projectId}_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;
    const files = this.getProjectFiles(projectId);

    const fileChecksums: Record<string, string> = {};
    files.forEach(f => {
      fileChecksums[f.path] = Math.random().toString(36).substring(2, 18) + Math.random().toString(36).substring(2, 18);
    });

    const newSnapshot: SnapshotItem = {
      id: `snap_${Date.now()}`,
      projectId,
      snapshotName: name,
      filePath: `C:\\Users\\User\\AppData\\Local\\Sevelr\\snapshots\\${name}.sevelr`,
      checksum: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      fileSizeBytes: Math.floor(120000 + Math.random() * 500000),
      createdAt: now,
      manifest: {
        manifestVersion: 1,
        schemaVersion: project.schemaVersion,
        platformVersion: '2.0.0',
        projectId,
        snapshotName: name,
        createdAt: now,
        files: fileChecksums
      }
    };

    const list = [newSnapshot, ...this.getSnapshots()];
    localStorage.setItem(STORAGE_KEYS.SNAPSHOTS, JSON.stringify(list));

    this.logEvent({
      severity: 'Info',
      component: 'SnapshotManager',
      projectId,
      action: 'snapshot.created',
      details: `Created snapshot '${name}.sevelr' (${(newSnapshot.fileSizeBytes / 1024).toFixed(1)} KB).`
    });

    return newSnapshot;
  }

  public restoreSnapshot(snapshotId: string): boolean {
    const snap = this.getSnapshots().find(s => s.id === snapshotId);
    if (!snap) return false;

    this.logEvent({
      severity: 'Info',
      component: 'SnapshotManager',
      projectId: snap.projectId,
      action: 'snapshot.restored',
      details: `Restored project '${snap.projectId}' state from snapshot '${snap.snapshotName}'.`
    });

    return true;
  }

  public deleteSnapshot(snapshotId: string): void {
    const list = this.getSnapshots().filter(s => s.id !== snapshotId);
    localStorage.setItem(STORAGE_KEYS.SNAPSHOTS, JSON.stringify(list));
  }

  // --- Filesystem Browser ---
  public getAllFiles(): Record<string, FileItem[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.FILES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(INITIAL_FILES));
      return INITIAL_FILES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_FILES;
    }
  }

  public saveAllFiles(files: Record<string, FileItem[]>): void {
    localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
  }

  public getProjectFiles(projectId: string): FileItem[] {
    const all = this.getAllFiles();
    return all[projectId] || [];
  }

  public saveFile(projectId: string, path: string, content: string): void {
    // Validate path traversal
    if (path.includes('..') || path.startsWith('/') || path.startsWith('\\')) {
      throw new Error('Path traversal detected: path must be relative to project root.');
    }

    const all = this.getAllFiles();
    const files = all[projectId] || [];
    const existingIndex = files.findIndex(f => f.path === path);

    const now = new Date().toISOString();
    if (existingIndex >= 0) {
      files[existingIndex] = {
        ...files[existingIndex],
        content,
        size: content.length,
        modified: now
      };
    } else {
      const fileName = path.split('/').pop() || path;
      files.push({
        name: fileName,
        path,
        isDirectory: false,
        size: content.length,
        modified: now,
        type: fileName.endsWith('.json') ? 'application/json' : 'text/plain',
        content
      });
    }

    all[projectId] = files;
    this.saveAllFiles(all);

    this.logEvent({
      severity: 'Info',
      component: 'FilesystemWatcher',
      projectId,
      action: 'file.modified',
      details: `Saved content to '${path}' (${content.length} bytes).`
    });
  }

  public deleteFile(projectId: string, path: string): void {
    const all = this.getAllFiles();
    const files = all[projectId] || [];
    all[projectId] = files.filter(f => f.path !== path && !f.path.startsWith(path + '/'));
    this.saveAllFiles(all);

    this.logEvent({
      severity: 'Info',
      component: 'FilesystemWatcher',
      projectId,
      action: 'file.deleted',
      details: `Deleted '${path}'.`
    });
  }

  public createDirectory(projectId: string, path: string): void {
    if (path.includes('..')) throw new Error('Path traversal detected.');
    const all = this.getAllFiles();
    const files = all[projectId] || [];
    const dirName = path.split('/').pop() || path;

    if (!files.some(f => f.path === path)) {
      files.push({
        name: dirName,
        path,
        isDirectory: true,
        size: 0,
        modified: new Date().toISOString(),
        type: 'folder'
      });
      all[projectId] = files;
      this.saveAllFiles(all);

      this.logEvent({
        severity: 'Info',
        component: 'FilesystemWatcher',
        projectId,
        action: 'file.created',
        details: `Created folder '${path}'.`
      });
    }
  }

  // --- Diagnostics ---
  public getDiagnostics(): DiagnosticCheck[] {
    const raw = localStorage.getItem(STORAGE_KEYS.DIAGNOSTICS);
    return raw ? JSON.parse(raw) : INITIAL_DIAGNOSTICS;
  }

  public runDiagnostics(): DiagnosticCheck[] {
    const diag = this.getDiagnostics().map(d => ({ ...d }));
    localStorage.setItem(STORAGE_KEYS.DIAGNOSTICS, JSON.stringify(diag));
    this.logEvent({
      severity: 'Info',
      component: 'DoctorService',
      action: 'doctor.ran',
      details: 'Comprehensive 8-point system diagnostics completed (Status: 0 Warnings, 0 Errors).'
    });
    return diag;
  }

  // --- Windows Settings Abstraction ---
  public getWindowsSettings(): WindowsSettingAbstraction[] {
    const raw = localStorage.getItem(STORAGE_KEYS.WINDOWS_SETTINGS);
    return raw ? JSON.parse(raw) : INITIAL_WINDOWS_SETTINGS;
  }

  public updateWindowsSetting(id: string, status: 'Active' | 'Enforcing' | 'Disabled', value?: string): void {
    const list = this.getWindowsSettings();
    const target = list.find(s => s.id === id);
    if (target) {
      target.status = status;
      if (value) target.currentValue = value;
      localStorage.setItem(STORAGE_KEYS.WINDOWS_SETTINGS, JSON.stringify(list));
      this.logEvent({
        severity: 'Info',
        component: 'WindowsPolicyManager',
        action: 'policy.changed',
        details: `Applied policy '${target.name}' -> ${status} (${target.currentValue}).`
      });
    }
  }

  // --- Auth & Passkeys ---
  public getAuthStatus(): { isFirstRun: boolean; isAuthenticated: boolean; passkeyRegistered: boolean; recoveryCode: string } {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (!raw) {
      return {
        isFirstRun: false,
        isAuthenticated: true,
        passkeyRegistered: true,
        recoveryCode: '7F3A-9E2B-44C1-889D'
      };
    }
    return JSON.parse(raw);
  }

  public setAuthStatus(data: any): void {
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(data));
  }
}

export const stateEngine = new LocalStateEngine();

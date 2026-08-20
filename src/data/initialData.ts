import { ProjectConfig, AuditEvent, SnapshotItem, DiagnosticCheck, WindowsSettingAbstraction, FileItem } from '../types';

export const INITIAL_PROJECTS: ProjectConfig[] = [
  {
    schemaVersion: 2,
    project: {
      id: 'pinterest-browser',
      displayName: 'Pinterest Browser',
      description: 'Controlled image curation and pinboard browsing environment with strict tracker blocking and isolated download storage.',
      template: 'balanced',
      createdAt: '2026-08-15T10:00:00Z',
      updatedAt: '2026-08-20T08:30:00Z'
    },
    application: {
      provider: 'brave',
      executable: null,
      arguments: ['--disable-reading-from-canvas', '--disable-breakpad'],
      initialUrl: 'https://www.pinterest.com',
      environmentVariables: {
        'SEVELR_PROJECT_ID': 'pinterest-browser'
      }
    },
    network: {
      mode: 'allowlist',
      allowedDomains: ['pinterest.com', '*.pinterest.com', '*.pinimg.com', 'pinimg.com'],
      deniedDomains: ['adservice.google.com', 'analytics.yahoo.com'],
      allowedPorts: [80, 443],
      allowHttp: false,
      allowHttps: true,
      allowWebSocket: true,
      allowQuic: false,
      allowIpv6: true,
      allowLocalhost: false,
      allowPrivateNetworks: false
    },
    dns: {
      mode: 'policy',
      allowDirectIp: false,
      allowDoh: true,
      allowDot: false,
      customResolvers: ['1.1.1.1', '9.9.9.9']
    },
    filesystem: {
      encrypted: true,
      downloads: 'isolated',
      temporaryFiles: 'isolated',
      allowSharedDirectories: false,
      customStoragePath: null
    },
    process: {
      monitor: true,
      allowChildProcesses: true,
      allowedExecutables: ['brave.exe'],
      maxMemoryMb: 4096,
      singleInstancePerProject: true
    },
    privacy: {
      sync: false,
      telemetry: false,
      passwordSaving: false,
      autofill: false,
      clearOnExit: false
    },
    security: {
      mode: 'balanced',
      failClosed: true,
      tamperDetection: true,
      integrityVerification: true,
      preventDevTools: true,
      preventExtensionsModification: true
    },
    isRunning: true,
    pid: 14820,
    startedAt: '2026-08-20T09:15:22Z'
  },
  {
    schemaVersion: 2,
    project: {
      id: 'secure-dev-sandbox',
      displayName: 'Dev Sandbox (Localhost)',
      description: 'Local development and API proxy testing sandbox with DevTools enabled and full localhost port forwarding.',
      template: 'development',
      createdAt: '2026-08-18T14:20:00Z',
      updatedAt: '2026-08-20T07:45:00Z'
    },
    application: {
      provider: 'brave',
      executable: null,
      arguments: ['--auto-open-devtools-for-tabs'],
      initialUrl: 'http://localhost:3000',
      environmentVariables: {
        'NODE_ENV': 'development'
      }
    },
    network: {
      mode: 'allowlist',
      allowedDomains: ['localhost', '127.0.0.1', 'github.com', 'api.github.com'],
      deniedDomains: [],
      allowedPorts: [80, 443, 3000, 5173, 8080],
      allowHttp: true,
      allowHttps: true,
      allowWebSocket: true,
      allowQuic: true,
      allowIpv6: true,
      allowLocalhost: true,
      allowPrivateNetworks: true
    },
    dns: {
      mode: 'policy',
      allowDirectIp: true,
      allowDoh: false,
      allowDot: false,
      customResolvers: []
    },
    filesystem: {
      encrypted: false,
      downloads: 'shared',
      temporaryFiles: 'isolated',
      allowSharedDirectories: true
    },
    process: {
      monitor: true,
      allowChildProcesses: true,
      allowedExecutables: ['node.exe', 'git.exe'],
      maxMemoryMb: 8192,
      singleInstancePerProject: false
    },
    privacy: {
      sync: false,
      telemetry: false,
      passwordSaving: false,
      autofill: false,
      clearOnExit: false
    },
    security: {
      mode: 'development',
      failClosed: false,
      tamperDetection: true,
      integrityVerification: false,
      preventDevTools: false,
      preventExtensionsModification: false
    },
    isRunning: false,
    pid: null,
    startedAt: null
  },
  {
    schemaVersion: 2,
    project: {
      id: 'osint-research',
      displayName: 'Forensics & OSINT Vault',
      description: 'Hardened research workspace with ephemeral cache, WebRTC leak protection, and zero local metadata retention.',
      template: 'research',
      createdAt: '2026-08-19T11:10:00Z',
      updatedAt: '2026-08-20T06:00:00Z'
    },
    application: {
      provider: 'brave',
      executable: null,
      arguments: ['--incognito', '--disable-webrtc-hw-decoding'],
      initialUrl: 'https://archive.org',
      environmentVariables: {}
    },
    network: {
      mode: 'allowlist',
      allowedDomains: ['archive.org', '*.archive.org', 'scholar.google.com', 'arxiv.org'],
      deniedDomains: [],
      allowedPorts: [443],
      allowHttp: false,
      allowHttps: true,
      allowWebSocket: false,
      allowQuic: false,
      allowIpv6: false,
      allowLocalhost: false,
      allowPrivateNetworks: false
    },
    dns: {
      mode: 'policy',
      allowDirectIp: false,
      allowDoh: true,
      allowDot: true,
      customResolvers: ['9.9.9.9']
    },
    filesystem: {
      encrypted: true,
      downloads: 'ephemeral',
      temporaryFiles: 'ephemeral',
      allowSharedDirectories: false
    },
    process: {
      monitor: true,
      allowChildProcesses: false,
      allowedExecutables: ['brave.exe'],
      maxMemoryMb: 3072,
      singleInstancePerProject: true
    },
    privacy: {
      sync: false,
      telemetry: false,
      passwordSaving: false,
      autofill: false,
      clearOnExit: true
    },
    security: {
      mode: 'strict',
      failClosed: true,
      tamperDetection: true,
      integrityVerification: true,
      preventDevTools: true,
      preventExtensionsModification: true
    },
    isRunning: false,
    pid: null,
    startedAt: null
  }
];

export const INITIAL_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: 'evt_1',
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    severity: 'Info',
    component: 'FilesystemWatcher',
    projectId: 'pinterest-browser',
    action: 'file.modified',
    details: "Detected change in 'config/user_settings.json' -> synchronized with dashboard."
  },
  {
    id: 'evt_2',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    severity: 'Info',
    component: 'ProcessManager',
    projectId: 'pinterest-browser',
    action: 'runtime.started',
    details: 'Launched Brave Browser (PID 14820) bound to Job Object Sevelr_Job_pinterest-browser.'
  },
  {
    id: 'evt_3',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    severity: 'Info',
    component: 'SnapshotManager',
    projectId: 'pinterest-browser',
    action: 'snapshot.created',
    details: "Created local snapshot 'pinterest_baseline_20260820' (SHA-256: 4a9f8e...)."
  },
  {
    id: 'evt_4',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    severity: 'Info',
    component: 'WindowsFirewallEnforcer',
    projectId: 'pinterest-browser',
    action: 'policy.applied',
    details: 'Enforced strict outbound rules (Allowed: 4 domains, Ports: 443).'
  },
  {
    id: 'evt_5',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    severity: 'Info',
    component: 'Agent',
    action: 'agent.online',
    details: 'Sevelr Agent v2.0.0 started in Windows System Tray (Port 3000).'
  }
];

export const INITIAL_SNAPSHOTS: SnapshotItem[] = [
  {
    id: 'snap_1',
    projectId: 'pinterest-browser',
    snapshotName: 'pinterest_baseline_20260820',
    filePath: 'C:\\Users\\User\\AppData\\Local\\Sevelr\\snapshots\\pinterest_baseline_20260820.sevelr',
    checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    fileSizeBytes: 248912,
    createdAt: '2026-08-20T08:00:00Z',
    manifest: {
      manifestVersion: 1,
      schemaVersion: 2,
      platformVersion: '2.0.0',
      projectId: 'pinterest-browser',
      snapshotName: 'pinterest_baseline_20260820',
      createdAt: '2026-08-20T08:00:00Z',
      files: {
        'config/user_settings.json': 'a1b2c3d4e5f6...',
        'browser/Default/Preferences': '887766554433...',
        'files/saved_pins.json': 'fedcba098765...'
      }
    }
  }
];

export const INITIAL_DIAGNOSTICS: DiagnosticCheck[] = [
  {
    id: 'storage_root',
    category: 'Storage',
    name: 'AppData Directory Root',
    status: 'PASS',
    details: 'Path %LOCALAPPDATA%\\Sevelr is accessible, isolated, and writable.',
    remediation: 'Ensure folder permissions allow current Windows user write access.'
  },
  {
    id: 'sqlite_db',
    category: 'Database',
    name: 'SQLite Application State Store',
    status: 'PASS',
    details: 'Database sevelr.db integrity: ok. WAL journal mode enabled.',
    remediation: 'Re-initialize database or restore from recent snapshot if corrupt.'
  },
  {
    id: 'browser_discovery',
    category: 'Browser',
    name: 'Supported Chromium Browser',
    status: 'PASS',
    details: 'Brave Browser located at C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    remediation: 'Install Brave Browser or configure custom executable path.'
  },
  {
    id: 'fs_monitor',
    category: 'Filesystem',
    name: 'Real-time Filesystem Watcher',
    status: 'PASS',
    details: 'Monitoring active on all project directories with 200ms debouncing window.',
    remediation: 'Ensure background agent service is running.'
  },
  {
    id: 'firewall_enforcer',
    category: 'Network',
    name: 'Windows Firewall Policy Driver',
    status: 'PASS',
    details: 'Outbound isolation rules registered and active.',
    remediation: 'Run agent with standard administrator elevation if rule modification is required.'
  },
  {
    id: 'acl_manager',
    category: 'Security',
    name: 'User-Only NTFS Storage ACL',
    status: 'PASS',
    details: 'Project storage paths have inherited permissions stripped and user SID locked.',
    remediation: 'Apply NTFS ACL fix from Security tab.'
  },
  {
    id: 'tamper_detector',
    category: 'Security',
    name: 'Policy Tamper Detection',
    status: 'PASS',
    details: 'Active integrity monitor checking registry and profile checksums every 30s.',
    remediation: 'Review security alert logs.'
  },
  {
    id: 'snapshots_store',
    category: 'Data Safety',
    name: 'Local Snapshots Archive',
    status: 'PASS',
    details: '1 verified point-in-time snapshot available in local vault.',
    remediation: 'Create project baseline snapshot.'
  }
];

export const INITIAL_WINDOWS_SETTINGS: WindowsSettingAbstraction[] = [
  {
    id: 'win_firewall_block_all',
    name: 'Windows Firewall Outbound Isolation',
    category: 'Network',
    description: 'Enforces Windows Defender Firewall outbound rules restricting launched browser processes strictly to allowlisted destination IP and hostnames.',
    currentValue: 'Enforced',
    defaultValue: 'Enforced',
    riskLevel: 'Low',
    requiresElevation: true,
    status: 'Active',
    registryKey: 'SYSTEM\\CurrentControlSet\\Services\\SharedAccess\\Parameters\\FirewallPolicy'
  },
  {
    id: 'chromium_devtools_block',
    name: 'Chromium Enterprise DevTools Lock',
    category: 'Browser Policy',
    description: 'Sets DeveloperToolsAvailability policy in Windows Registry to prevent DOM inspection, network debugging, or memory dumping in production projects.',
    currentValue: 'Disabled (Locked)',
    defaultValue: 'Disabled (Locked)',
    riskLevel: 'Low',
    requiresElevation: false,
    status: 'Active',
    registryKey: 'SOFTWARE\\Policies\\BraveSoftware\\Brave\\DeveloperToolsAvailability'
  },
  {
    id: 'windows_ntfs_acl',
    name: 'Exclusive NTFS Owner ACL',
    category: 'Filesystem',
    description: 'Removes inherited Everyone/Users group access from project folders and grants exclusive Read/Write control strictly to the authenticated user SID.',
    currentValue: 'User-Only (Strict)',
    defaultValue: 'User-Only (Strict)',
    riskLevel: 'Low',
    requiresElevation: false,
    status: 'Active'
  },
  {
    id: 'windows_efs_encryption',
    name: 'Windows EFS DPAPI Encryption',
    category: 'Cryptography',
    description: 'Applies transparent Windows Encrypting File System (EFS) backed by your Windows DPAPI keys to prevent offline disk read attempts.',
    currentValue: 'Enabled',
    defaultValue: 'Enabled',
    riskLevel: 'Moderate',
    requiresElevation: false,
    status: 'Active'
  },
  {
    id: 'windows_job_object_limits',
    name: 'Job Object Hard Memory Limit',
    category: 'Process Isolation',
    description: 'Binds browser processes to a Win32 Job Object with a strict RAM ceiling (e.g. 4096MB) and JOBOBJECT_LIMIT_KILL_ON_JOB_CLOSE guarantees.',
    currentValue: '4096 MB Cap',
    defaultValue: '4096 MB Cap',
    riskLevel: 'Low',
    requiresElevation: false,
    status: 'Active'
  }
];

export const INITIAL_FILES: Record<string, FileItem[]> = {
  'pinterest-browser': [
    {
      name: 'config',
      path: 'config',
      isDirectory: true,
      size: 0,
      modified: '2026-08-20T08:30:00Z',
      type: 'folder'
    },
    {
      name: 'user_settings.json',
      path: 'config/user_settings.json',
      isDirectory: false,
      size: 1420,
      modified: '2026-08-20T09:14:00Z',
      type: 'application/json',
      content: `{\n  "theme": "dark",\n  "imageQuality": "high",\n  "autoSaveBoard": true,\n  "downloadFormat": "webp",\n  "blockedAdDomains": [\n    "adservice.google.com",\n    "analytics.yahoo.com"\n  ]\n}`
    },
    {
      name: 'downloads',
      path: 'downloads',
      isDirectory: true,
      size: 0,
      modified: '2026-08-20T08:00:00Z',
      type: 'folder'
    },
    {
      name: 'saved_pins.json',
      path: 'files/saved_pins.json',
      isDirectory: false,
      size: 3840,
      modified: '2026-08-20T08:45:00Z',
      type: 'application/json',
      content: `[\n  {\n    "id": "pin_98231",\n    "title": "Minimalist Architecture Concept",\n    "board": "Design Inspo",\n    "url": "https://pinterest.com/pin/98231",\n    "savedAt": "2026-08-20T08:45:00Z"\n  },\n  {\n    "id": "pin_98232",\n    "title": "Nordic Typography Poster",\n    "board": "Typography",\n    "url": "https://pinterest.com/pin/98232",\n    "savedAt": "2026-08-20T08:44:12Z"\n  }\n]`
    },
    {
      name: 'security-policy.json',
      path: 'security-policy.json',
      isDirectory: false,
      size: 890,
      modified: '2026-08-20T08:00:00Z',
      type: 'application/json',
      content: `{\n  "mode": "balanced",\n  "enforcedAt": "2026-08-20T08:00:00Z",\n  "firewallOutbound": "ALLOW_RESTRICTED",\n  "ntfsAcl": "SID_LOCKED",\n  "devtools": "DISABLED"\n}`
    }
  ],
  'secure-dev-sandbox': [
    {
      name: 'proxy_config.json',
      path: 'proxy_config.json',
      isDirectory: false,
      size: 512,
      modified: '2026-08-20T07:45:00Z',
      type: 'application/json',
      content: `{\n  "targetHost": "127.0.0.1",\n  "targetPort": 3000,\n  "allowWebSockets": true,\n  "debugHeaders": true\n}`
    },
    {
      name: 'notes.md',
      path: 'notes.md',
      isDirectory: false,
      size: 680,
      modified: '2026-08-20T07:30:00Z',
      type: 'text/markdown',
      content: `# Dev Sandbox Notes\n\n- Port 3000 bound to Vite development dashboard\n- DevTools enabled by default\n- Child processes permitted for build scripts\n`
    }
  ],
  'osint-research': [
    {
      name: 'doh_resolvers.json',
      path: 'doh_resolvers.json',
      isDirectory: false,
      size: 320,
      modified: '2026-08-20T06:00:00Z',
      type: 'application/json',
      content: `{\n  "primary": "https://dns.quad9.net/dns-query",\n  "fallback": "https://cloudflare-dns.com/dns-query",\n  "webrtcPolicy": "DisableNonProxiedUdp"\n}`
    }
  ]
};

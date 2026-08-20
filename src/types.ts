export interface ProjectIdentity {
  id: string;
  displayName: string;
  description: string;
  template: 'strict' | 'balanced' | 'development' | 'research' | 'private' | 'webapp' | 'custom';
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationConfig {
  provider: string; // 'brave' | 'chrome' | 'edge' | 'custom'
  executable: string | null;
  arguments: string[];
  initialUrl: string;
  environmentVariables: Record<string, string>;
}

export interface NetworkConfig {
  mode: 'allowlist' | 'denylist' | 'isolated' | 'open';
  allowedDomains: string[];
  deniedDomains: string[];
  allowedIps?: string[];
  allowedCidrs?: string[];
  allowedPorts: number[];
  allowHttp: boolean;
  allowHttps: boolean;
  allowWebSocket: boolean;
  allowQuic: boolean;
  allowIpv6: boolean;
  allowLocalhost: boolean;
  allowPrivateNetworks: boolean;
}

export interface DnsConfig {
  mode: string;
  allowDirectIp: boolean;
  allowDoh: boolean;
  allowDot: boolean;
  customResolvers: string[];
}

export interface FilesystemConfig {
  encrypted: boolean;
  downloads: 'isolated' | 'shared' | 'ephemeral';
  temporaryFiles: 'isolated' | 'ephemeral';
  allowSharedDirectories: boolean;
  customStoragePath?: string | null;
}

export interface ProcessConfig {
  monitor: boolean;
  allowChildProcesses: boolean;
  allowedExecutables: string[];
  maxMemoryMb: number;
  singleInstancePerProject: boolean;
}

export interface PrivacyConfig {
  sync: boolean;
  telemetry: boolean;
  passwordSaving: boolean;
  autofill: boolean;
  clearOnExit: boolean;
}

export interface SecurityConfig {
  mode: string;
  failClosed: boolean;
  tamperDetection: boolean;
  integrityVerification: boolean;
  requireSignedPolicy?: boolean;
  preventDevTools: boolean;
  preventExtensionsModification: boolean;
}

export interface ProjectConfig {
  schemaVersion: number;
  project: ProjectIdentity;
  application: ApplicationConfig;
  network: NetworkConfig;
  dns: DnsConfig;
  filesystem: FilesystemConfig;
  process: ProcessConfig;
  privacy: PrivacyConfig;
  security: SecurityConfig;
  isRunning?: boolean;
  pid?: number | null;
  startedAt?: string | null;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  severity: 'Info' | 'Warning' | 'Alert' | 'Error';
  component: string;
  projectId?: string;
  action: string;
  details: string;
  metadata?: Record<string, any>;
}

export interface SnapshotItem {
  id: string;
  projectId: string;
  snapshotName: string;
  filePath: string;
  checksum: string;
  fileSizeBytes: number;
  createdAt: string;
  manifest: {
    manifestVersion: number;
    schemaVersion: number;
    platformVersion: string;
    projectId: string;
    snapshotName: string;
    createdAt: string;
    files: Record<string, string>;
  };
}

export interface DiagnosticCheck {
  id: string;
  category: string;
  name: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  details: string;
  remediation?: string;
}

export interface WindowsSettingAbstraction {
  id: string;
  name: string;
  category: string;
  description: string;
  currentValue: string;
  defaultValue: string;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  requiresElevation: boolean;
  status: 'Active' | 'Enforcing' | 'Disabled';
  registryKey?: string;
}

export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modified: string;
  type: string;
  content?: string;
}

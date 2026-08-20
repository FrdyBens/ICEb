import { ProjectConfig } from '../types';

export interface TemplateDefinition {
  id: 'strict' | 'balanced' | 'development' | 'research' | 'private' | 'webapp' | 'custom';
  name: string;
  badge: string;
  description: string;
  color: string;
  defaultDomains: string[];
  defaults: Partial<ProjectConfig>;
}

export const TEMPLATES: Record<string, TemplateDefinition> = {
  strict: {
    id: 'strict',
    name: 'Strict Isolation',
    badge: 'High Security',
    description: 'Zero trust default. Strictly allowlisted domains, encrypted storage, DevTools blocked, telemetry blocked, memory capped.',
    color: 'emerald',
    defaultDomains: ['brave.com', 'duckduckgo.com'],
    defaults: {
      network: {
        mode: 'allowlist',
        allowedDomains: ['brave.com', 'duckduckgo.com'],
        deniedDomains: [],
        allowedPorts: [443],
        allowHttp: false,
        allowHttps: true,
        allowWebSocket: false,
        allowQuic: false,
        allowIpv6: true,
        allowLocalhost: false,
        allowPrivateNetworks: false
      },
      filesystem: {
        encrypted: true,
        downloads: 'isolated',
        temporaryFiles: 'isolated',
        allowSharedDirectories: false
      },
      process: {
        monitor: true,
        allowChildProcesses: false,
        allowedExecutables: [],
        maxMemoryMb: 2048,
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
      }
    }
  },
  balanced: {
    id: 'balanced',
    name: 'Balanced Everyday',
    badge: 'Recommended',
    description: 'Standard security with web browsing flexibility. Isolated downloads and cookies, blocked trackers, allows common HTTPS ports.',
    color: 'blue',
    defaultDomains: ['pinterest.com', '*.pinimg.com', 'google.com', 'wikipedia.org'],
    defaults: {
      network: {
        mode: 'allowlist',
        allowedDomains: ['pinterest.com', '*.pinimg.com', 'google.com', 'wikipedia.org'],
        deniedDomains: [],
        allowedPorts: [80, 443],
        allowHttp: true,
        allowHttps: true,
        allowWebSocket: true,
        allowQuic: false,
        allowIpv6: true,
        allowLocalhost: false,
        allowPrivateNetworks: false
      },
      filesystem: {
        encrypted: true,
        downloads: 'isolated',
        temporaryFiles: 'isolated',
        allowSharedDirectories: false
      },
      process: {
        monitor: true,
        allowChildProcesses: true,
        allowedExecutables: [],
        maxMemoryMb: 4096,
        singleInstancePerProject: true
      },
      privacy: {
        sync: false,
        telemetry: false,
        passwordSaving: true,
        autofill: true,
        clearOnExit: false
      },
      security: {
        mode: 'balanced',
        failClosed: true,
        tamperDetection: true,
        integrityVerification: true,
        preventDevTools: false,
        preventExtensionsModification: true
      }
    }
  },
  development: {
    id: 'development',
    name: 'Development Sandbox',
    badge: 'Developer',
    description: 'Full localhost and dev port access (3000, 5173, 8080), DevTools enabled, local API proxy debugging permitted.',
    color: 'purple',
    defaultDomains: ['localhost', '127.0.0.1', 'github.com', 'npmjs.com'],
    defaults: {
      network: {
        mode: 'allowlist',
        allowedDomains: ['localhost', '127.0.0.1', 'github.com', 'npmjs.com'],
        deniedDomains: [],
        allowedPorts: [80, 443, 3000, 5173, 8000, 8080],
        allowHttp: true,
        allowHttps: true,
        allowWebSocket: true,
        allowQuic: true,
        allowIpv6: true,
        allowLocalhost: true,
        allowPrivateNetworks: true
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
        allowedExecutables: ['node.exe', 'python.exe', 'git.exe'],
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
      }
    }
  },
  research: {
    id: 'research',
    name: 'Research & OSINT',
    badge: 'Forensics',
    description: 'Hardened research sandbox with ephemeral cache, WebRTC leaks blocked, spoofed user-agent headers, and strict DNS isolation.',
    color: 'amber',
    defaultDomains: ['archive.org', 'scholar.google.com', 'arxiv.org'],
    defaults: {
      network: {
        mode: 'allowlist',
        allowedDomains: ['archive.org', 'scholar.google.com', 'arxiv.org'],
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
      filesystem: {
        encrypted: true,
        downloads: 'ephemeral',
        temporaryFiles: 'ephemeral',
        allowSharedDirectories: false
      },
      process: {
        monitor: true,
        allowChildProcesses: false,
        allowedExecutables: [],
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
        mode: 'research',
        failClosed: true,
        tamperDetection: true,
        integrityVerification: true,
        preventDevTools: true,
        preventExtensionsModification: true
      }
    }
  },
  private: {
    id: 'private',
    name: 'Private Vault',
    badge: 'Maximum Isolation',
    description: 'Air-gapped filesystem encryption with zero network connectivity by default (or single explicit banking host).',
    color: 'red',
    defaultDomains: [],
    defaults: {
      network: {
        mode: 'isolated',
        allowedDomains: [],
        deniedDomains: ['*'],
        allowedPorts: [],
        allowHttp: false,
        allowHttps: false,
        allowWebSocket: false,
        allowQuic: false,
        allowIpv6: false,
        allowLocalhost: false,
        allowPrivateNetworks: false
      },
      filesystem: {
        encrypted: true,
        downloads: 'isolated',
        temporaryFiles: 'ephemeral',
        allowSharedDirectories: false
      },
      process: {
        monitor: true,
        allowChildProcesses: false,
        allowedExecutables: [],
        maxMemoryMb: 2048,
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
      }
    }
  },
  webapp: {
    id: 'webapp',
    name: 'Single App Kiosk',
    badge: 'Kiosk',
    description: 'Locks browser window directly to one target SaaS application with navigation restrictions and no external popup escape.',
    color: 'teal',
    defaultDomains: ['app.slack.com', 'slack-edge.com'],
    defaults: {
      network: {
        mode: 'allowlist',
        allowedDomains: ['app.slack.com', 'slack-edge.com'],
        deniedDomains: [],
        allowedPorts: [443],
        allowHttp: false,
        allowHttps: true,
        allowWebSocket: true,
        allowQuic: false,
        allowIpv6: true,
        allowLocalhost: false,
        allowPrivateNetworks: false
      },
      filesystem: {
        encrypted: true,
        downloads: 'isolated',
        temporaryFiles: 'isolated',
        allowSharedDirectories: false
      },
      process: {
        monitor: true,
        allowChildProcesses: true,
        allowedExecutables: [],
        maxMemoryMb: 4096,
        singleInstancePerProject: true
      },
      privacy: {
        sync: false,
        telemetry: false,
        passwordSaving: true,
        autofill: true,
        clearOnExit: false
      },
      security: {
        mode: 'balanced',
        failClosed: true,
        tamperDetection: true,
        integrityVerification: true,
        preventDevTools: true,
        preventExtensionsModification: true
      }
    }
  }
};

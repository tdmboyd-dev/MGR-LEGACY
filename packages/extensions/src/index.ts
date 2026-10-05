export interface ExtensionPermission {
  resource: string;
  actions: string[];
}

export interface WorkflowNodeManifest {
  type: string;
  displayName: string;
  configSchemaVersion: number;
}

export interface LegacyExtensionManifest {
  id: string;
  version: string;
  displayName: string;
  description?: string;
  permissions: ExtensionPermission[];
  eventsConsumed: string[];
  eventsEmitted: string[];
  workflowNodes: WorkflowNodeManifest[];
  capabilities: string[];
}

export class ExtensionRegistry {
  private readonly manifests = new Map<string, LegacyExtensionManifest>();

  register(manifest: LegacyExtensionManifest): void {
    const key = `${manifest.id}@${manifest.version}`;
    if (this.manifests.has(key)) throw new Error(`Extension already registered: ${key}`);
    if (!manifest.id.match(/^[a-z0-9][a-z0-9-_.]+$/)) throw new Error("Invalid extension id");
    this.manifests.set(key, structuredClone(manifest));
  }

  list(): LegacyExtensionManifest[] {
    return structuredClone([...this.manifests.values()]);
  }

  latest(id: string): LegacyExtensionManifest | null {
    const candidates = [...this.manifests.values()].filter((manifest) => manifest.id === id);
    return structuredClone(candidates.at(-1) ?? null);
  }
}

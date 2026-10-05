export type ObjectFieldType = "string" | "number" | "boolean" | "date" | "datetime" | "enum" | "json" | "reference";

export interface ObjectFieldDefinition {
  key: string;
  label: string;
  type: ObjectFieldType;
  required?: boolean;
  indexed?: boolean;
  options?: string[];
  referenceObject?: string;
}

export interface ObjectDefinition {
  key: string;
  version: number;
  label: string;
  pluralLabel: string;
  fields: ObjectFieldDefinition[];
  lifecycleStates?: string[];
}

export class ObjectForgeRegistry {
  private readonly definitions = new Map<string, ObjectDefinition>();

  register(definition: ObjectDefinition): void {
    if (!/^[a-z][a-z0-9_]*$/.test(definition.key)) throw new Error("Object key must be snake_case");
    const unique = new Set(definition.fields.map((field) => field.key));
    if (unique.size !== definition.fields.length) throw new Error("Duplicate object field key");
    const current = this.definitions.get(definition.key);
    if (current && definition.version <= current.version) {
      throw new Error("Object definition version must increase");
    }
    this.definitions.set(definition.key, structuredClone(definition));
  }

  get(key: string): ObjectDefinition | null {
    return structuredClone(this.definitions.get(key) ?? null);
  }
}

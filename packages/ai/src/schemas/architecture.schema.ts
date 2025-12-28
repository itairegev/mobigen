import { z } from 'zod';

/**
 * Schema for TechStackDecision
 */
export const TechStackDecisionSchema = z.object({
  category: z.string(),
  choice: z.string(),
  reason: z.string(),
  alternatives: z.array(z.string()).optional(),
});

export type TechStackDecision = z.infer<typeof TechStackDecisionSchema>;

/**
 * Schema for DataModel
 */
export const DataModelSchema = z.object({
  name: z.string(),
  description: z.string(),
  fields: z.array(z.object({
    name: z.string(),
    type: z.string(),
    required: z.boolean().optional(),
    description: z.string().optional(),
  })),
  relationships: z.array(z.object({
    type: z.enum(['one-to-one', 'one-to-many', 'many-to-many']),
    target: z.string(),
    description: z.string().optional(),
  })).optional(),
});

export type DataModel = z.infer<typeof DataModelSchema>;

/**
 * Schema for APIEndpoint
 */
export const APIEndpointSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  path: z.string(),
  description: z.string(),
  request: z.object({
    params: z.record(z.string()).optional(),
    query: z.record(z.string()).optional(),
    body: z.record(z.unknown()).optional(),
  }).optional(),
  response: z.object({
    success: z.record(z.unknown()).optional(),
    error: z.record(z.unknown()).optional(),
  }).optional(),
});

export type APIEndpoint = z.infer<typeof APIEndpointSchema>;

/**
 * Schema for FileStructureNode (recursive)
 */
export const FileStructureNodeSchema: z.ZodType<{
  name: string;
  type: 'file' | 'directory';
  description?: string;
  children?: FileStructureNode[];
}> = z.lazy(() => z.object({
  name: z.string(),
  type: z.enum(['file', 'directory']),
  description: z.string().optional(),
  children: z.array(FileStructureNodeSchema).optional(),
}));

export type FileStructureNode = z.infer<typeof FileStructureNodeSchema>;

/**
 * Schema for DependencyDecision
 */
export const DependencyDecisionSchema = z.object({
  name: z.string(),
  version: z.string(),
  reason: z.string(),
  dev: z.boolean().optional(),
});

export type DependencyDecision = z.infer<typeof DependencyDecisionSchema>;

/**
 * Schema for ArchitectureOutput
 */
export const ArchitectureOutputSchema = z.object({
  template: z.string(),
  templateReason: z.string(),
  techStack: z.array(TechStackDecisionSchema),
  dataModels: z.array(DataModelSchema),
  apiEndpoints: z.array(APIEndpointSchema),
  fileStructure: z.array(FileStructureNodeSchema),
  dependencies: z.array(DependencyDecisionSchema),
  securityConsiderations: z.array(z.string()),
});

export type ArchitectureOutput = z.infer<typeof ArchitectureOutputSchema>;

/**
 * Export Service with Documentation Generation
 * Extends the base export service to include auto-generated documentation
 */

import { ExportService } from './export-service';
import { DocGenerator } from './doc-generator';
import type { DocConfig } from './doc-types';
import type { ExportOptions, ExportResult, ExportMetadata } from './export-types';
import * as path from 'path';

export class ExportWithDocsService extends ExportService {
  private docGenerator: DocGenerator;

  constructor(projectsDir?: string) {
    super(projectsDir);
    this.docGenerator = new DocGenerator();
  }

  /**
   * Export project with generated documentation
   */
  async exportProjectWithDocs(
    projectId: string,
    options: Partial<ExportOptions> = {},
    metadata: Pick<ExportMetadata, 'version' | 'appName' | 'templateId' | 'userTier'>
  ): Promise<ExportResult> {
    // Ensure docs are included
    const exportOptions: Partial<ExportOptions> = {
      ...options,
      includeDocs: true,
    };

    // Start the export
    const result = await this.exportProject(projectId, exportOptions, metadata);

    // Generate documentation asynchronously
    this.generateDocsForExport(projectId, result.exportId).catch(error => {
      console.error(`[export-with-docs] Failed to generate docs for ${projectId}:`, error);
    });

    return result;
  }

  /**
   * Generate comprehensive documentation for an export
   */
  private async generateDocsForExport(projectId: string, exportId: string): Promise<void> {
    console.log(`[export-with-docs] Generating documentation for project ${projectId}`);

    const projectPath = path.join(
      process.env.PROJECTS_DIR || '/tmp/mobigen/projects',
      projectId
    );

    // Create temporary docs directory
    const tempDocsDir = path.join('/tmp', `docs-${exportId}`);

    const docConfig: DocConfig = {
      projectId,
      projectPath,
      outputPath: tempDocsDir,
      includeSetupInstructions: true,
      includeApiDocs: true,
      includeComponentDocs: true,
      includeScreenshots: false, // Can be enabled later
    };

    try {
      const docResult = await this.docGenerator.generateDocs(docConfig);

      if (docResult.success) {
        console.log(`[export-with-docs] Generated ${docResult.files.length} documentation files`);
        console.log(`[export-with-docs] Files: ${docResult.files.join(', ')}`);
      } else {
        console.error(`[export-with-docs] Documentation generation failed:`, docResult.errors);
      }

      if (docResult.warnings && docResult.warnings.length > 0) {
        console.warn(`[export-with-docs] Warnings:`, docResult.warnings);
      }
    } catch (error) {
      console.error(`[export-with-docs] Error generating documentation:`, error);
      throw error;
    }
  }

  /**
   * Generate documentation for a project (standalone)
   */
  async generateDocumentation(
    projectId: string,
    outputPath?: string
  ): Promise<{ success: boolean; files: string[]; errors?: string[] }> {
    const projectPath = path.join(
      process.env.PROJECTS_DIR || '/tmp/mobigen/projects',
      projectId
    );

    const docsOutputPath = outputPath || path.join(projectPath, 'docs');

    const docConfig: DocConfig = {
      projectId,
      projectPath,
      outputPath: docsOutputPath,
      includeSetupInstructions: true,
      includeApiDocs: true,
      includeComponentDocs: true,
      includeScreenshots: false,
    };

    return this.docGenerator.generateDocs(docConfig);
  }
}

// Singleton instance
let exportWithDocsService: ExportWithDocsService | null = null;

export function getExportWithDocsService(): ExportWithDocsService {
  if (!exportWithDocsService) {
    exportWithDocsService = new ExportWithDocsService();
  }
  return exportWithDocsService;
}

export default ExportWithDocsService;

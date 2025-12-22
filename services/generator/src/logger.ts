/**
 * Comprehensive Logger for Mobigen Generator
 *
 * Features:
 * - Console output with colors and timestamps
 * - File logging to project-specific log files
 * - Artifact saving (PRD, Architecture, UI Design, etc.)
 * - Phase timing and performance metrics
 */

import * as fs from 'fs';
import * as path from 'path';

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success' | 'phase';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  phase?: string;
  agent?: string;
  message: string;
  data?: unknown;
  duration?: number;
}

export class GenerationLogger {
  private projectId: string;
  private projectPath: string;
  private logFile: string;
  private artifactsDir: string;
  private logs: LogEntry[] = [];
  private phaseTimers: Map<string, number> = new Map();
  private startTime: number;

  constructor(projectId: string, projectPath: string) {
    this.projectId = projectId;
    this.projectPath = projectPath;
    this.startTime = Date.now();

    // Create logs and artifacts directories
    const logsDir = path.join(projectPath, 'logs');
    this.artifactsDir = path.join(projectPath, 'artifacts');

    this.ensureDir(logsDir);
    this.ensureDir(this.artifactsDir);

    // Create log file with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logFile = path.join(logsDir, `generation-${timestamp}.log`);

    this.info('Logger initialized', { projectId, projectPath });
  }

  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private getElapsed(): string {
    const elapsed = Date.now() - this.startTime;
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  private getLevelColor(level: LogLevel): string {
    switch (level) {
      case 'debug': return colors.dim;
      case 'info': return colors.blue;
      case 'warn': return colors.yellow;
      case 'error': return colors.red;
      case 'success': return colors.green;
      case 'phase': return colors.magenta;
      default: return colors.white;
    }
  }

  private getLevelPrefix(level: LogLevel): string {
    switch (level) {
      case 'debug': return 'DEBUG';
      case 'info': return 'INFO ';
      case 'warn': return 'WARN ';
      case 'error': return 'ERROR';
      case 'success': return '  OK ';
      case 'phase': return 'PHASE';
      default: return '     ';
    }
  }

  private log(level: LogLevel, message: string, data?: unknown, phase?: string, agent?: string, duration?: number): void {
    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      phase,
      agent,
      message,
      data,
      duration,
    };

    this.logs.push(entry);

    // Console output with colors
    const color = this.getLevelColor(level);
    const prefix = this.getLevelPrefix(level);
    const elapsed = this.getElapsed();
    const phaseStr = phase ? `[${phase}]` : '';
    const agentStr = agent ? `<${agent}>` : '';
    const durationStr = duration ? ` (${duration}ms)` : '';

    console.log(
      `${colors.dim}[${elapsed}]${colors.reset} ` +
      `${color}${prefix}${colors.reset} ` +
      `${colors.cyan}${phaseStr}${colors.reset}` +
      `${colors.yellow}${agentStr}${colors.reset} ` +
      `${message}${durationStr}`
    );

    if (data && level !== 'debug') {
      const dataStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      if (dataStr.length < 500) {
        console.log(`${colors.dim}  └─ ${dataStr}${colors.reset}`);
      }
    }

    // Write to log file
    this.writeToFile(entry);
  }

  private writeToFile(entry: LogEntry): void {
    const line = JSON.stringify(entry) + '\n';
    try {
      fs.appendFileSync(this.logFile, line);
    } catch (err) {
      // Ignore file write errors
    }
  }

  // Public logging methods
  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: unknown): void {
    this.log('error', message, data);
  }

  success(message: string, data?: unknown): void {
    this.log('success', message, data);
  }

  // Phase tracking
  phaseStart(phase: string, description?: string): void {
    this.phaseTimers.set(phase, Date.now());
    this.log('phase', `Starting: ${description || phase}`, undefined, phase);
    console.log(`${colors.bright}${'═'.repeat(60)}${colors.reset}`);
  }

  phaseEnd(phase: string, success: boolean = true): number {
    const startTime = this.phaseTimers.get(phase);
    const duration = startTime ? Date.now() - startTime : 0;

    if (success) {
      this.log('success', `Completed`, { duration: `${duration}ms` }, phase, undefined, duration);
    } else {
      this.log('error', `Failed`, { duration: `${duration}ms` }, phase, undefined, duration);
    }

    console.log(`${colors.dim}${'─'.repeat(60)}${colors.reset}\n`);
    return duration;
  }

  // Agent tracking
  agentStart(agent: string, phase?: string): void {
    this.phaseTimers.set(`agent:${agent}`, Date.now());
    this.log('info', `Agent starting`, undefined, phase, agent);
  }

  agentEnd(agent: string, success: boolean = true, phase?: string): number {
    const startTime = this.phaseTimers.get(`agent:${agent}`);
    const duration = startTime ? Date.now() - startTime : 0;

    if (success) {
      this.log('success', `Agent completed`, { duration: `${duration}ms` }, phase, agent, duration);
    } else {
      this.log('error', `Agent failed`, { duration: `${duration}ms` }, phase, agent, duration);
    }

    return duration;
  }

  agentOutput(agent: string, output: string, phase?: string): void {
    this.log('debug', `Agent output (${output.length} chars)`, undefined, phase, agent);
  }

  // Artifact saving
  saveArtifact(name: string, data: unknown, format: 'json' | 'md' | 'txt' = 'json'): string {
    const filename = `${name}.${format}`;
    const filepath = path.join(this.artifactsDir, filename);

    let content: string;
    if (format === 'json') {
      content = JSON.stringify(data, null, 2);
    } else if (format === 'md') {
      content = typeof data === 'string' ? data : this.toMarkdown(name, data);
    } else {
      content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    }

    try {
      fs.writeFileSync(filepath, content);
      this.success(`Artifact saved: ${filename}`, { path: filepath, size: `${content.length} bytes` });
      return filepath;
    } catch (err) {
      this.error(`Failed to save artifact: ${filename}`, err);
      return '';
    }
  }

  private toMarkdown(title: string, data: unknown): string {
    const lines: string[] = [];
    lines.push(`# ${title.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`);
    lines.push('');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push(`Project: ${this.projectId}`);
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('```json');
    lines.push(JSON.stringify(data, null, 2));
    lines.push('```');
    return lines.join('\n');
  }

  // Save specific artifacts
  savePRD(prd: unknown): string {
    this.info('Saving PRD artifact');
    return this.saveArtifact('prd', prd, 'json');
  }

  saveArchitecture(arch: unknown): string {
    this.info('Saving Architecture artifact');
    return this.saveArtifact('architecture', arch, 'json');
  }

  saveUIDesign(design: unknown): string {
    this.info('Saving UI Design artifact');
    return this.saveArtifact('ui-design', design, 'json');
  }

  saveTaskBreakdown(tasks: unknown): string {
    this.info('Saving Task Breakdown artifact');
    return this.saveArtifact('task-breakdown', tasks, 'json');
  }

  saveValidation(validation: unknown): string {
    this.info('Saving Validation Result artifact');
    return this.saveArtifact('validation-result', validation, 'json');
  }

  saveQAReport(qa: unknown): string {
    this.info('Saving QA Report artifact');
    return this.saveArtifact('qa-report', qa, 'json');
  }

  // Save raw agent output
  saveAgentOutput(agent: string, output: string): string {
    return this.saveArtifact(`agent-output-${agent}`, output, 'txt');
  }

  // Summary at the end
  printSummary(result: { success: boolean; files: string[]; requiresReview?: boolean }): void {
    const totalDuration = Date.now() - this.startTime;
    const minutes = Math.floor(totalDuration / 60000);
    const seconds = Math.floor((totalDuration % 60000) / 1000);

    console.log('\n');
    console.log(`${colors.bright}${'═'.repeat(60)}${colors.reset}`);
    console.log(`${colors.bright}  GENERATION SUMMARY${colors.reset}`);
    console.log(`${colors.bright}${'═'.repeat(60)}${colors.reset}`);
    console.log(`  Project ID:     ${this.projectId}`);
    console.log(`  Duration:       ${minutes}m ${seconds}s`);
    console.log(`  Files Created:  ${result.files.length}`);
    console.log(`  Status:         ${result.success ? colors.green + 'SUCCESS' : colors.red + 'FAILED'}${colors.reset}`);
    if (result.requiresReview) {
      console.log(`  ${colors.yellow}⚠ Requires human review${colors.reset}`);
    }
    console.log(`${colors.dim}${'─'.repeat(60)}${colors.reset}`);
    console.log(`  Log file:       ${this.logFile}`);
    console.log(`  Artifacts:      ${this.artifactsDir}`);
    console.log(`${colors.bright}${'═'.repeat(60)}${colors.reset}\n`);

    // Save summary
    this.saveArtifact('generation-summary', {
      projectId: this.projectId,
      duration: totalDuration,
      durationFormatted: `${minutes}m ${seconds}s`,
      filesCreated: result.files.length,
      files: result.files,
      success: result.success,
      requiresReview: result.requiresReview,
      logFile: this.logFile,
      artifactsDir: this.artifactsDir,
      timestamp: new Date().toISOString(),
    }, 'json');
  }

  // Get all logs
  getLogs(): LogEntry[] {
    return this.logs;
  }

  // Get log file path
  getLogFile(): string {
    return this.logFile;
  }

  // Get artifacts directory
  getArtifactsDir(): string {
    return this.artifactsDir;
  }
}

// Factory function
export function createLogger(projectId: string, projectPath: string): GenerationLogger {
  return new GenerationLogger(projectId, projectPath);
}

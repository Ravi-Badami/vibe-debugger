// Context Capture module
import * as vscode from 'vscode';
import { ErrorData } from './errorMonitor';

export interface DebugContext {
  error: ErrorData;
  fileName: string;
  fileContent: string;
  errorLine: number;
  surroundingCode: string;
  recentChanges: string[];
  language: string;
  timestamp: Date;
  activeSelection?: string;
  relatedImports?: string[];
  gitDiff?: string;
  terminalOutput?: string;
}

export class ContextCapture {
  async captureContext(error: ErrorData): Promise<DebugContext> {
    const timestamp = new Date();

    // Get active editor
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.uri.fsPath !== error.filePath) {
      throw new Error('No active editor or file mismatch');
    }

    const document = editor.document;
    const fileName = vscode.workspace.asRelativePath(document.uri);
    const fileContent = document.getText();
    const language = document.languageId;

    // Error line and surrounding code
    const errorLine = error.line;
    const startLine = Math.max(0, errorLine - 5);
    const endLine = Math.min(document.lineCount - 1, errorLine + 5);
    const surroundingCode = document.getText(
      new vscode.Range(startLine, 0, endLine, document.lineAt(endLine).text.length)
    );

    // Active selection
    const activeSelection = editor.selection.isEmpty
      ? undefined
      : document.getText(editor.selection);

    // Related imports/functions - basic parsing
    const relatedImports = this.extractImports(fileContent, language);
    const relatedFunctions = this.extractFunctions(fileContent, language, errorLine);

    // Recent changes - check file modification time
    const recentChanges: string[] = [];
    const stat = await vscode.workspace.fs.stat(document.uri);
    const lastModified = new Date(stat.mtime);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (lastModified > fiveMinutesAgo) {
      recentChanges.push(`File modified at ${lastModified.toISOString()}`);
    }

    // Git diff - try to get uncommitted changes
    let gitDiff: string | undefined;
    try {
      gitDiff = await this.getGitDiff(document.uri);
    } catch (e) {
      // Ignore if git not available
    }

    // Terminal output - placeholder, as VS Code doesn't expose this easily
    const terminalOutput = 'Terminal output capture not implemented';

    return {
      error,
      fileName,
      fileContent,
      errorLine,
      surroundingCode,
      recentChanges,
      language,
      timestamp,
      activeSelection,
      relatedImports,
      gitDiff,
      terminalOutput
    };
  }

  private extractImports(content: string, language: string): string[] {
    const lines = content.split('\n');
    const imports: string[] = [];
    for (const line of lines) {
      if (language === 'typescript' || language === 'javascript') {
        if (line.trim().startsWith('import') || line.trim().startsWith('from')) {
          imports.push(line.trim());
        }
      } else if (language === 'python') {
        if (line.trim().startsWith('import') || line.trim().startsWith('from')) {
          imports.push(line.trim());
        }
      }
      // Add more languages as needed
    }
    return imports.slice(0, 10); // Limit to 10
  }

  private extractFunctions(content: string, language: string, errorLine: number): string[] {
    // Basic function extraction - this is simplistic
    const lines = content.split('\n');
    const functions: string[] = [];
    for (let i = Math.max(0, errorLine - 20); i < Math.min(lines.length, errorLine + 20); i++) {
      const line = lines[i];
      if (language === 'typescript' || language === 'javascript') {
        if (line.includes('function') || line.includes('=>') || line.match(/\b\w+\s*\(/)) {
          functions.push(line.trim());
        }
      } else if (language === 'python') {
        if (line.trim().startsWith('def ')) {
          functions.push(line.trim());
        }
      }
    }
    return functions.slice(0, 5);
  }

  private async getGitDiff(uri: vscode.Uri): Promise<string> {
    // Use child_process to run git diff
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
    if (!workspaceFolder) {
      throw new Error('No workspace folder');
    }

    const cwd = workspaceFolder.uri.fsPath;
    const filePath = vscode.workspace.asRelativePath(uri);

    try {
      const { stdout } = await execAsync(`git diff HEAD -- ${filePath}`, { cwd });
      return stdout || 'No changes';
    } catch (e) {
      throw new Error('Git diff failed');
    }
  }

  formatContextAsString(context: DebugContext): string {
    let output = `Debug Context for ${context.fileName}\n`;
    output += `Language: ${context.language}\n`;
    output += `Timestamp: ${context.timestamp.toISOString()}\n\n`;

    output += `Error: ${context.error.message} at line ${context.error.line}\n`;
    output += `Severity: ${context.error.severity}\n\n`;

    output += `Surrounding Code:\n${context.surroundingCode}\n\n`;

    if (context.activeSelection) {
      output += `Active Selection:\n${context.activeSelection}\n\n`;
    }

    if (context.relatedImports && context.relatedImports.length > 0) {
      output += `Related Imports:\n${context.relatedImports.join('\n')}\n\n`;
    }

    if (context.recentChanges.length > 0) {
      output += `Recent Changes:\n${context.recentChanges.join('\n')}\n\n`;
    }

    if (context.gitDiff) {
      output += `Git Diff:\n${context.gitDiff}\n\n`;
    }

    output += `Terminal Output:\n${context.terminalOutput}\n`;

    return output;
  }
}

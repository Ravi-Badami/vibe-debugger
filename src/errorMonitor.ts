// Error Monitor module
import * as vscode from 'vscode';
import { EventEmitter } from 'events';

export interface ErrorData {
  filePath: string;
  line: number;
  message: string;
  severity: 'Error' | 'Warning';
  firstDetected: number;
  lastSeen: number;
  hasPersisted: boolean;
  fileChangedWhileError: boolean;
}

export class ErrorMonitor extends EventEmitter {
  private errorMap: Map<string, ErrorData[]> = new Map();
  private diagnosticListener: vscode.Disposable | undefined;
  private documentListener: vscode.Disposable | undefined;
  private fileChangeTimes: Map<string, number> = new Map();

  startMonitoring(): void {
    // Listen to diagnostic changes
    this.diagnosticListener = vscode.languages.onDidChangeDiagnostics(event => {
      this.onDiagnosticsChange(event);
    });

    // Listen to document changes to detect file edits
    this.documentListener = vscode.workspace.onDidChangeTextDocument(event => {
      this.onDocumentChange(event);
    });
  }

  stopMonitoring(): void {
    if (this.diagnosticListener) {
      this.diagnosticListener.dispose();
    }
    if (this.documentListener) {
      this.documentListener.dispose();
    }
  }

  private onDocumentChange(event: vscode.TextDocumentChangeEvent): void {
    const filePath = event.document.uri.fsPath;
    this.fileChangeTimes.set(filePath, Date.now());
  }

  onDiagnosticsChange(event: vscode.DiagnosticChangeEvent): void {
    const now = Date.now();

    // Process each URI in the event
    for (const uri of event.uris) {
      const filePath = uri.fsPath;
      const diagnostics = vscode.languages.getDiagnostics(uri);

      // Get existing errors for this file
      const existingErrors = this.errorMap.get(filePath) || [];

      // Create a map of current errors for quick lookup
      const currentErrorsMap = new Map<string, vscode.Diagnostic>();
      diagnostics.forEach(diag => {
        const key = `${diag.range.start.line}:${diag.message}`;
        currentErrorsMap.set(key, diag);
      });

      // Update existing errors and add new ones
      const updatedErrors: ErrorData[] = [];
      for (const existing of existingErrors) {
        const key = `${existing.line}:${existing.message}`;
        if (currentErrorsMap.has(key)) {
          // Error still exists
          existing.lastSeen = now;
          const timeDiff = now - existing.firstDetected;
          if (timeDiff >= 10000 && !existing.hasPersisted) {
            existing.hasPersisted = true;
            this.emit('errorPersisted', existing);
          }
          // Check if file changed while error persisted
          const lastChange = this.fileChangeTimes.get(filePath);
          if (
            lastChange &&
            lastChange > existing.firstDetected &&
            !existing.fileChangedWhileError
          ) {
            existing.fileChangedWhileError = true;
          }
          updatedErrors.push(existing);
          currentErrorsMap.delete(key);
        }
        // If not in current, remove it (error fixed)
      }

      // Add new errors
      for (const [key, diag] of currentErrorsMap) {
        const newError: ErrorData = {
          filePath,
          line: diag.range.start.line,
          message: diag.message,
          severity: diag.severity === vscode.DiagnosticSeverity.Error ? 'Error' : 'Warning',
          firstDetected: now,
          lastSeen: now,
          hasPersisted: false,
          fileChangedWhileError: false
        };
        updatedErrors.push(newError);
      }

      // Update the map
      if (updatedErrors.length > 0) {
        this.errorMap.set(filePath, updatedErrors);
      } else {
        this.errorMap.delete(filePath);
      }
    }
  }

  getCurrentErrors(filePath: string): ErrorData[] {
    return this.errorMap.get(filePath) || [];
  }

  getAllErrors(): Map<string, ErrorData[]> {
    return new Map(this.errorMap);
  }
}

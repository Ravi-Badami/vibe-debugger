import * as vscode from 'vscode';
import { ErrorMonitor, ErrorData } from './errorMonitor';
import { Config } from './config';

export class NotificationHandler {
  private lastNotificationTime: number = 0;
  private notificationCount: number = 0;
  private notificationResetTimer: NodeJS.Timeout | null = null;
  private shownErrorsInSession: Set<string> = new Set(); // Track shown errors

  constructor(private errorMonitor: ErrorMonitor) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // ⭐ CHANGED: Only listen to file open/switch events, not error persistence
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor && Config.autoNotify) {
        this.checkErrorsInActiveEditor(editor);
      }
    });

    // ⭐ NEW: Also check when user first opens a file
    vscode.workspace.onDidOpenTextDocument(document => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document === document && Config.autoNotify) {
        // Small delay to let diagnostics load
        setTimeout(() => {
          this.checkErrorsInActiveEditor(editor);
        }, 1000);
      }
    });

    // Reset notification count every hour
    this.notificationResetTimer = setInterval(
      () => {
        this.notificationCount = 0;
        if (Config.debugMode) {
          console.log('[Vibe Debugger] Notification count reset');
        }
      },
      60 * 60 * 1000
    );
  }

  /**
   * Check if the active editor has errors and show notification if needed
   */
  private checkErrorsInActiveEditor(editor: vscode.TextEditor): void {
    const diagnostics = vscode.languages.getDiagnostics(editor.document.uri);
    const errors = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Error);

    if (errors.length === 0) {
      return; // No errors, don't notify
    }

    const filePath = editor.document.uri.fsPath;
    const errorKey = `${filePath}:${errors[0].range.start.line}`;

    // ⭐ Don't show if already shown in this session
    if (this.shownErrorsInSession.has(errorKey)) {
      return;
    }

    // Check rate limiting
    if (!this.shouldShowNotification()) {
      return;
    }

    // Show notification
    this.showNotification(filePath);
    this.shownErrorsInSession.add(errorKey);

    if (Config.debugMode) {
      console.log(`[Vibe Debugger] Notification shown for: ${errorKey}`);
    }
  }

  /**
   * Check if we should show a notification based on rate limits
   */
  private shouldShowNotification(): boolean {
    const now = Date.now();
    const timeSinceLastNotification = now - this.lastNotificationTime;
    const minDelayMs = Config.notificationDelay * 1000;

    // Check if enough time has passed since last notification
    if (timeSinceLastNotification < minDelayMs) {
      if (Config.debugMode) {
        console.log('[Vibe Debugger] Notification suppressed (too soon)');
      }
      return false;
    }

    // Check if we've hit the hourly limit
    if (this.notificationCount >= Config.maxNotificationsPerHour) {
      if (Config.debugMode) {
        console.log('[Vibe Debugger] Notification suppressed (hourly limit reached)');
      }
      return false;
    }

    return true;
  }

  /**
   * Show the notification to the user
   */
  private async showNotification(filePath: string): Promise<void> {
    const fileName = filePath.split(/[\\/]/).pop() || filePath;

    const selection = await vscode.window.showInformationMessage(
      `🔍 Vibe Debugger: I can help fix this error in ${fileName}`,
      'Help Me',
      'Dismiss'
    );

    if (selection === 'Help Me') {
      // ⭐ Auto-paste "@vibedebugger fix this error" in chat
      const initialPrompt = '@vibedebugger fix this error';

      // Copy to clipboard
      await vscode.env.clipboard.writeText(initialPrompt);

      // Open chat
      await vscode.commands.executeCommand('workbench.action.chat.open');

      // Wait for chat to open
      await new Promise(resolve => setTimeout(resolve, 300));

      // Try to paste
      try {
        await vscode.commands.executeCommand('editor.action.clipboardPasteAction');

        if (Config.debugMode) {
          console.log('[Vibe Debugger] Auto-pasted initial prompt in chat');
        }
      } catch (error) {
        // Fallback if paste fails
        vscode.window.showInformationMessage(
          '📋 Paste (Ctrl/Cmd+V) "@vibedebugger fix this error" and press Enter'
        );
      }
    }

    this.lastNotificationTime = Date.now();
    this.notificationCount++;

    if (Config.debugMode) {
      console.log(
        `[Vibe Debugger] Notification shown (${this.notificationCount}/${Config.maxNotificationsPerHour} this hour)`
      );
    }
  }

  /**
   * Clear the session cache (call this when user explicitly dismisses or fixes an error)
   */
  public clearSessionCache(): void {
    this.shownErrorsInSession.clear();
    if (Config.debugMode) {
      console.log('[Vibe Debugger] Session cache cleared');
    }
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    if (this.notificationResetTimer) {
      clearInterval(this.notificationResetTimer);
    }
    this.shownErrorsInSession.clear();
  }
}

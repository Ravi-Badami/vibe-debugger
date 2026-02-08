// Notification Handler module
import * as vscode from 'vscode';
import { ErrorMonitor, ErrorData } from './errorMonitor';
import { Config } from './config';

export class NotificationHandler {
  private errorMonitor: ErrorMonitor;
  private dismissedErrors: Set<string> = new Set();
  private notificationTimes: number[] = [];

  constructor(errorMonitor: ErrorMonitor) {
    this.errorMonitor = errorMonitor;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.errorMonitor.on('errorPersisted', (errorData: ErrorData) => {
      this.handleErrorPersisted(errorData);
    });
  }

  private handleErrorPersisted(errorData: ErrorData): void {
    if (!Config.autoNotify) {
      return;
    }

    // Check if error was dismissed
    const errorKey = `${errorData.filePath}:${errorData.line}:${errorData.message}`;
    if (this.dismissedErrors.has(errorKey)) {
      return;
    }

    // Check persistence time (convert notificationDelay from seconds to milliseconds)
    const persistenceTime = errorData.lastSeen - errorData.firstDetected;
    const minPersistenceTime = Config.notificationDelay * 1000;
    if (persistenceTime < minPersistenceTime) {
      return;
    }

    // Check notification rate limit
    this.cleanOldNotifications();
    if (this.notificationTimes.length >= Config.maxNotificationsPerHour) {
      return;
    }

    // Show notification
    this.showNotification(errorData);
  }

  private showNotification(errorData: ErrorData): void {
    const message = `🔍 Vibe Debugger: I can help fix this error in ${vscode.workspace.asRelativePath(vscode.Uri.file(errorData.filePath))}`;

    vscode.window.showInformationMessage(message, 'Help Me', 'Dismiss').then(selection => {
      if (selection === 'Help Me') {
        this.openChatWithContext(errorData);
      } else if (selection === 'Dismiss') {
        this.dismissError(errorData);
      }
    });

    this.notificationTimes.push(Date.now());
  }

  private openChatWithContext(errorData: ErrorData): void {
    // Open chat view
    vscode.commands
      .executeCommand('workbench.action.chat.open', {
        query: `@vibedebugger I need help with an error`,
        isPartialQuery: true
      })
      .then(() => {
        // The chat will handle the context through the participant
        // We could pre-fill more context here if needed
      });
  }

  private dismissError(errorData: ErrorData): void {
    const errorKey = `${errorData.filePath}:${errorData.line}:${errorData.message}`;
    this.dismissedErrors.add(errorKey);
  }

  private cleanOldNotifications(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    this.notificationTimes = this.notificationTimes.filter(time => time > oneHourAgo);
  }

  // Method to reset dismissed errors (for testing or user action)
  resetDismissedErrors(): void {
    this.dismissedErrors.clear();
  }

  // Method to update configuration (convenience method - config is now handled centrally)
  async updateConfiguration(): Promise<void> {
    // Configuration is now handled centrally through Config class
    // This method is kept for backward compatibility but does nothing
    // as the class now reads from Config directly
  }
}

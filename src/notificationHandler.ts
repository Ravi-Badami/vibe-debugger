// Notification Handler module
import * as vscode from 'vscode';
import { ErrorMonitor, ErrorData } from './errorMonitor';

export class NotificationHandler {
    private errorMonitor: ErrorMonitor;
    private dismissedErrors: Set<string> = new Set();
    private notificationTimes: number[] = [];
    private config = {
        enabled: true,
        minPersistenceTime: 10000, // 10 seconds
        maxNotificationsPerHour: 5
    };

    constructor(errorMonitor: ErrorMonitor) {
        this.errorMonitor = errorMonitor;
        this.setupEventListeners();
        this.loadConfiguration();
    }

    private setupEventListeners(): void {
        this.errorMonitor.on('errorPersisted', (errorData: ErrorData) => {
            this.handleErrorPersisted(errorData);
        });
    }

    private loadConfiguration(): void {
        const config = vscode.workspace.getConfiguration('vibeDebugger');
        this.config.enabled = config.get('enableAutoNotifications', true);
        this.config.minPersistenceTime = config.get('minErrorPersistenceTime', 10000);
        this.config.maxNotificationsPerHour = config.get('maxNotificationsPerHour', 5);
    }

    private handleErrorPersisted(errorData: ErrorData): void {
        if (!this.config.enabled) {
            return;
        }

        // Check if error was dismissed
        const errorKey = `${errorData.filePath}:${errorData.line}:${errorData.message}`;
        if (this.dismissedErrors.has(errorKey)) {
            return;
        }

        // Check persistence time
        const persistenceTime = errorData.lastSeen - errorData.firstDetected;
        if (persistenceTime < this.config.minPersistenceTime) {
            return;
        }

        // Check notification rate limit
        this.cleanOldNotifications();
        if (this.notificationTimes.length >= this.config.maxNotificationsPerHour) {
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
        vscode.commands.executeCommand('workbench.action.chat.open', {
            query: `@vibedebugger I need help with an error`,
            isPartialQuery: true
        }).then(() => {
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

    // Method to update configuration
    updateConfiguration(newConfig: Partial<typeof this.config>): void {
        Object.assign(this.config, newConfig);
    }
}
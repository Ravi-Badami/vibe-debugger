// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import { ErrorMonitor } from './errorMonitor';
import { ContextCapture } from './contextCapture';
import { PromptEnhancer } from './promptEnhancer';

// Global variables
let statusBarItem: vscode.StatusBarItem;
let errorMonitor: ErrorMonitor;
let contextCapture: ContextCapture;
let promptEnhancer: PromptEnhancer;

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  try {
    console.log('Activating Vibe Debugger extension...');

    // Initialize components
    errorMonitor = new ErrorMonitor();
    contextCapture = new ContextCapture();
    promptEnhancer = new PromptEnhancer();

    // Start error monitoring
    errorMonitor.startMonitoring();

    // Listen to error persisted events
    errorMonitor.on('errorPersisted', errorData => {
      console.log('Error persisted:', errorData);
      // TODO: Trigger chat or notification
    });

    // Register chat participant
    const chatParticipant = vscode.chat.createChatParticipant(
      'vibedebugger',
      async (
        request: vscode.ChatRequest,
        context: vscode.ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
      ) => {
        // Handle chat requests - basic implementation
        const enhancedPrompt = promptEnhancer.enhance(request.prompt);
        stream.markdown(`Vibe Debugger: ${enhancedPrompt}`);
      }
    );
    chatParticipant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'icon.png'); // Optional icon
    context.subscriptions.push(chatParticipant);

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = '🔍 Vibe Debugger Active';
    statusBarItem.tooltip = 'Vibe Debugger is monitoring for errors';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Log activation success
    console.log('Vibe Debugger extension activated successfully!');
    vscode.window.showInformationMessage('Vibe Debugger is now active.');
  } catch (error) {
    console.error('Failed to activate Vibe Debugger extension:', error);
    vscode.window.showErrorMessage(
      'Failed to activate Vibe Debugger. Check the console for details.'
    );
    throw error;
  }
}

// This method is called when your extension is deactivated
export function deactivate() {
  try {
    if (errorMonitor) {
      errorMonitor.stopMonitoring();
    }
    if (statusBarItem) {
      statusBarItem.hide();
    }
    console.log('Vibe Debugger extension deactivated.');
  } catch (error) {
    console.error('Error during deactivation:', error);
  }
}

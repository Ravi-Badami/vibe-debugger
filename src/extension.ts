// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import * as path from 'path';
import { ErrorMonitor } from './errorMonitor';
import { ContextCapture, DebugContext } from './contextCapture';
import { PromptEnhancer } from './promptEnhancer';
import { NotificationHandler } from './notificationHandler';
import { QuestionGenerator } from './questionGenerator';
import { Config } from './config';

// Global variables
let statusBarItem: vscode.StatusBarItem;
let errorMonitor: ErrorMonitor;
let contextCapture: ContextCapture;
let promptEnhancer: PromptEnhancer;
let notificationHandler: NotificationHandler;
let questionGenerator: QuestionGenerator;
let debugContexts: Map<string, DebugContext> = new Map();

async function handleChatRequest(
  request: vscode.ChatRequest,
  chatContext: vscode.ChatContext,
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken
): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    stream.markdown('No active editor found. Please open a file with errors.');
    return;
  }

  const filePath = editor.document.uri.fsPath;
  const diagnostics = vscode.languages.getDiagnostics(editor.document.uri);
  const errors = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Error);

  if (errors.length === 0) {
    stream.markdown(
      'No errors found in the current file. The Vibe Debugger helps with code errors.'
    );
    return;
  }

  // Check if this is an answer to a previous question
  const lastResponse = chatContext.history
    .filter(h => h instanceof vscode.ChatResponseTurn)
    .slice(-1)[0] as vscode.ChatResponseTurn | undefined;

  const lastMessage = lastResponse?.response
    .filter(r => r instanceof vscode.ChatResponseMarkdownPart)
    .map(r => (r as vscode.ChatResponseMarkdownPart).value.value)
    .join('');

  const isAnsweringQuestion =
    lastMessage &&
    (lastMessage.includes('?') || lastMessage.includes('What') || lastMessage.includes('How'));

  if (isAnsweringQuestion && debugContexts.has(filePath)) {
    // User is answering a clarifying question
    const debugContext = debugContexts.get(filePath)!;
    stream.progress('Copilot is analyzing your response and generating a fix...');

    const enhancedPrompt = promptEnhancer.enhancePrompt(
      request.prompt,
      debugContext,
      request.prompt, // user answer
      undefined, // analyzed problem
      undefined // specific steps
    );

    // Use language model to generate fix
    const models = await vscode.lm.selectChatModels();
    const model = models[0];
    const messages = [vscode.LanguageModelChatMessage.User(enhancedPrompt)];

    const response = await model.sendRequest(messages, {}, token);
    let fullResponse = '';
    for await (const fragment of response.text) {
      fullResponse += fragment;
      stream.markdown(fullResponse);
    }

    // Clear the stored context
    debugContexts.delete(filePath);
  } else {
    // Ask clarifying question
    stream.progress('Analyzing error and generating clarifying question...');

    const error = errors[0]; // Take the first error
    const errorData = {
      filePath,
      line: error.range.start.line,
      message: error.message,
      severity: 'Error' as const,
      firstDetected: Date.now(),
      lastSeen: Date.now(),
      hasPersisted: false,
      fileChangedWhileError: false
    };

    const debugContext = await contextCapture.captureContext(errorData);
    debugContexts.set(filePath, debugContext);

    // Generate clarifying question using QuestionGenerator
    const questionData = questionGenerator.generateQuestion(debugContext);

    stream.markdown(questionData.question);
  }
}

// Demo function to showcase the extension
async function runDemo(): Promise<void> {
  try {
    // Get the demo files path
    const extensionPath = vscode.extensions.getExtension('vibe-debugger')?.extensionPath;
    if (!extensionPath) {
      vscode.window.showErrorMessage('Could not find extension path');
      return;
    }

    const demoPath = vscode.Uri.file(path.join(extensionPath, 'demo', 'sample-errors'));

    // Show demo file picker
    const demoFiles = [
      { label: 'Null Reference Error (JavaScript)', file: 'null-error.js', description: 'Common null/undefined reference errors' },
      { label: 'Async/Promise Error (JavaScript)', file: 'async-error.js', description: 'Promise handling and async/await issues' },
      { label: 'DOM Manipulation Error (HTML)', file: 'dom-error.html', description: 'DOM element access and manipulation errors' }
    ];

    const selectedDemo = await vscode.window.showQuickPick(demoFiles, {
      placeHolder: 'Select a demo file to open and see Vibe Debugger in action',
      matchOnDescription: true
    });

    if (!selectedDemo) {
      return;
    }

    // Open the selected demo file
    const fileUri = vscode.Uri.joinPath(demoPath, selectedDemo.file);
    const document = await vscode.workspace.openTextDocument(fileUri);
    await vscode.window.showTextDocument(document);

    // Show information about the demo
    const message = `Demo file opened! This file contains intentional errors to demonstrate Vibe Debugger.

**What to expect:**
1. Errors will be detected automatically
2. After ${Config.notificationDelay} seconds, you'll get a notification
3. Click "Help Me" to start the debugging conversation
4. Vibe Debugger will ask clarifying questions before suggesting fixes

**Current settings:**
- Auto-notify: ${Config.autoNotify}
- Notification delay: ${Config.notificationDelay}s
- Debug mode: ${Config.debugMode}

Try modifying the code or click the notification when it appears!`;

    const panel = vscode.window.createWebviewPanel(
      'vibeDebuggerDemo',
      'Vibe Debugger Demo Guide',
      vscode.ViewColumn.Beside,
      { enableScripts: true }
    );

    panel.webview.html = getDemoGuideHtml(message, selectedDemo);

  } catch (error) {
    console.error('Error running demo:', error);
    vscode.window.showErrorMessage('Failed to run demo. Check the console for details.');
  }
}

function getDemoGuideHtml(message: string, demoFile: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: var(--vscode-font-family); padding: 20px; }
        .demo-title { color: var(--vscode-textLink-foreground); font-size: 1.2em; margin-bottom: 10px; }
        .demo-description { color: var(--vscode-descriptionForeground); margin-bottom: 15px; }
        .settings { background: var(--vscode-textBlockQuote-background); padding: 10px; border-radius: 3px; margin: 10px 0; }
        .instruction { margin: 10px 0; }
        .highlight { background: var(--vscode-textBlockQuote-border); padding: 2px 4px; border-radius: 2px; }
      </style>
    </head>
    <body>
      <h2 class="demo-title">🚀 Vibe Debugger Demo</h2>
      <p class="demo-description">${demoFile.description}</p>

      <div class="settings">
        <strong>Current Configuration:</strong><br>
        • Auto-notify: ${Config.autoNotify ? '✅ Enabled' : '❌ Disabled'}<br>
        • Notification delay: <span class="highlight">${Config.notificationDelay}s</span><br>
        • Debug mode: ${Config.debugMode ? '✅ Enabled' : '❌ Disabled'}<br>
        • Max notifications/hour: <span class="highlight">${Config.maxNotificationsPerHour}</span>
      </div>

      <div class="instruction">
        <strong>What happens next:</strong>
        <ol>
          <li>Errors in the opened file will be detected automatically</li>
          <li>After the delay period, you'll receive a notification</li>
          <li>Click "Help Me" in the notification to start debugging</li>
          <li>Vibe Debugger will ask clarifying questions before suggesting fixes</li>
        </ol>
      </div>

      <div class="instruction">
        <strong>Demo Tips:</strong>
        <ul>
          <li>Try modifying the code to see how errors are detected</li>
          <li>Use <code>@vibedebugger</code> in chat to interact directly</li>
          <li>Check VS Code settings to customize behavior</li>
        </ul>
      </div>
    </body>
    </html>
  `;
}

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  try {
    console.log('Activating Vibe Debugger extension...');

    // Initialize components
    errorMonitor = new ErrorMonitor();
    contextCapture = new ContextCapture();
    promptEnhancer = new PromptEnhancer();
    questionGenerator = new QuestionGenerator();

    // Start error monitoring
    errorMonitor.startMonitoring();

    // Create notification handler
    notificationHandler = new NotificationHandler(errorMonitor);

    // Listen to error persisted events
    errorMonitor.on('errorPersisted', errorData => {
      console.log('Error persisted:', errorData);
      // TODO: Trigger chat or notification
    });

    // Listen for configuration changes
    const configSubscription = Config.onDidChangeConfiguration(newConfig => {
      console.log('Vibe Debugger configuration changed:', newConfig);

      // Update notification handler with new settings
      if (notificationHandler) {
        // The notification handler will automatically pick up new config values
        // when its methods are called
      }

      // Update error monitor behavior if needed
      if (errorMonitor) {
        // Error monitor can check Config.debugMode for additional logging
        if (Config.debugMode) {
          console.log('Debug mode enabled - additional logging active');
        }
      }

      // Update status bar based on autoNotify setting
      if (statusBarItem) {
        const icon = Config.autoNotify ? '🔍' : '🔍❌';
        statusBarItem.text = `${icon} Vibe Debugger ${Config.autoNotify ? 'Active' : 'Notifications Off'}`;
        statusBarItem.tooltip = `Vibe Debugger is monitoring for errors. Auto-notify: ${Config.autoNotify}`;
      }
    });
    context.subscriptions.push(configSubscription);

    // Register chat participant
    const chatParticipant = vscode.chat.createChatParticipant(
      'vibedebugger',
      async (
        request: vscode.ChatRequest,
        chatContext: vscode.ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
      ) => {
        await handleChatRequest(request, chatContext, stream, token);
      }
    );
    chatParticipant.iconPath = new vscode.ThemeIcon('debug-alt');
    context.subscriptions.push(chatParticipant);

    // Register demo command
    const demoCommand = vscode.commands.registerCommand('vibedebugger.runDemo', async () => {
      await runDemo();
    });
    context.subscriptions.push(demoCommand);

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    const icon = Config.autoNotify ? '🔍' : '🔍❌';
    statusBarItem.text = `${icon} Vibe Debugger ${Config.autoNotify ? 'Active' : 'Notifications Off'}`;
    statusBarItem.tooltip = `Vibe Debugger is monitoring for errors. Auto-notify: ${Config.autoNotify}`;
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

// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
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

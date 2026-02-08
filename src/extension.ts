// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import * as path from 'path';
import { ErrorMonitor } from './errorMonitor';
import { ContextCapture, DebugContext } from './contextCapture';
import { PromptEnhancer } from './promptEnhancer';
import { NotificationHandler } from './notificationHandler';
import { QuestionGenerator, QuestionData } from './questionGenerator';
import { Config } from './config';

// Global variables
let statusBarItem: vscode.StatusBarItem;
let errorMonitor: ErrorMonitor;
let contextCapture: ContextCapture;
let promptEnhancer: PromptEnhancer;
let notificationHandler: NotificationHandler;
let questionGenerator: QuestionGenerator;

// Store conversation context
interface ConversationContext {
  debugContext: DebugContext;
  questionData: QuestionData;
  timestamp: number;
}
let conversationContexts: Map<string, ConversationContext> = new Map();

/**
 * Main chat request handler
 */
async function handleChatRequest(
  request: vscode.ChatRequest,
  chatContext: vscode.ChatContext,
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken
): Promise<void> {
  try {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      stream.markdown('❌ **No active editor found.**\n\nPlease open a file with code errors.');
      return;
    }

    const filePath = editor.document.uri.fsPath;
    const diagnostics = vscode.languages.getDiagnostics(editor.document.uri);
    const errors = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Error);

    if (errors.length === 0) {
      stream.markdown(
        '✅ **No errors found!**\n\nYour code looks good. Vibe Debugger helps when you have errors in your code.'
      );
      return;
    }

    if (Config.debugMode) {
      console.log(`[Vibe Debugger] Processing request: "${request.prompt}"`);
      console.log(`[Vibe Debugger] Found ${errors.length} error(s) in ${filePath}`);
    }

    // Check if user is answering a previous question
    const isAnsweringQuestion = await checkIfAnsweringQuestion(chatContext, filePath);

    if (isAnsweringQuestion) {
      // USER ANSWERED - AUTO-PASTE ENHANCED PROMPT
      await handleUserAnswerAndPastePrompt(request, stream, token, filePath);
    } else {
      // NEW REQUEST - ASK CLARIFYING QUESTION
      await askClarifyingQuestion(request, stream, editor, errors);
    }
  } catch (error) {
    console.error('[Vibe Debugger] Error in handleChatRequest:', error);
    stream.markdown(
      `❌ **Something went wrong.**\n\n${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if user is answering a previous question
 */
async function checkIfAnsweringQuestion(
  chatContext: vscode.ChatContext,
  filePath: string
): Promise<boolean> {
  if (!conversationContexts.has(filePath)) {
    return false;
  }

  const lastResponse = chatContext.history
    .filter(h => h instanceof vscode.ChatResponseTurn)
    .slice(-1)[0] as vscode.ChatResponseTurn | undefined;

  if (!lastResponse) {
    return false;
  }

  const lastMessage = lastResponse.response
    .filter(r => r instanceof vscode.ChatResponseMarkdownPart)
    .map(r => (r as vscode.ChatResponseMarkdownPart).value.value)
    .join('');

  return lastMessage.includes('❓') || lastMessage.includes('🤔');
}

/**
 * Ask clarifying question to understand user intent
 */
async function askClarifyingQuestion(
  request: vscode.ChatRequest,
  stream: vscode.ChatResponseStream,
  editor: vscode.TextEditor,
  errors: vscode.Diagnostic[]
): Promise<void> {
  stream.progress('🔍 Analyzing error...');

  const filePath = editor.document.uri.fsPath;
  const error = errors[0];

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

  if (Config.debugMode) {
    console.log(`[Vibe Debugger] Error: ${error.message} at line ${error.range.start.line}`);
  }

  stream.progress('📋 Gathering context...');
  const debugContext = await contextCapture.captureContext(errorData);

  stream.progress('💡 Generating question...');
  const questionData = questionGenerator.generateQuestion(debugContext);

  if (Config.debugMode) {
    console.log(`[Vibe Debugger] Question category: ${questionData.errorCategory}`);
  }

  // Store conversation context
  conversationContexts.set(filePath, {
    debugContext,
    questionData,
    timestamp: Date.now()
  });

  // Show the question
  stream.markdown('## 🤔 Let me understand what you need\n\n');
  stream.markdown(questionData.question);
  stream.markdown('\n\n---\n\n');
  stream.markdown("*Once you answer, I'll prepare an enhanced prompt for Copilot to fix it!* 🚀");
}

/**
 * User answered - auto-paste enhanced prompt into chat input
 */
async function handleUserAnswerAndPastePrompt(
  request: vscode.ChatRequest,
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken,
  filePath: string
): Promise<void> {
  const conversationContext = conversationContexts.get(filePath);
  if (!conversationContext) {
    stream.markdown('❌ **Context lost.** Please try again with `@vibedebugger fix this error`');
    return;
  }

  const { debugContext, questionData } = conversationContext;
  const userAnswer = request.prompt;

  if (Config.debugMode) {
    console.log(`[Vibe Debugger] User answered: "${userAnswer}"`);
    console.log('[Vibe Debugger] Building enhanced prompt for Copilot');
  }

  stream.progress('💭 Understanding your answer...');
  stream.progress('📦 Building enhanced prompt...');

  // Build the enhanced prompt (NO @copilot, NO @vibedebugger, NO code blocks)
  const enhancedPrompt = buildEnhancedPrompt(debugContext, questionData, userAnswer);

  if (Config.debugMode) {
    console.log(`[Vibe Debugger] Enhanced prompt:\n${enhancedPrompt}`);
  }

  stream.markdown('## ✅ Enhanced Prompt Ready!\n\n');
  stream.markdown(`I've analyzed your answer and prepared an optimized prompt for Copilot:\n\n`);
  stream.markdown(`- **Error type:** ${questionData.errorCategory}\n`);
  stream.markdown(`- **Location:** ${debugContext.fileName}:${debugContext.errorLine}\n`);
  stream.markdown(`- **Your intent:** "${userAnswer}"\n\n`);

  // Copy to clipboard
  await vscode.env.clipboard.writeText(enhancedPrompt);

  // Open/focus chat
  await vscode.commands.executeCommand('workbench.action.chat.open');

  // Wait for chat to be ready
  await new Promise(resolve => setTimeout(resolve, 300));

  // ⭐ KEY FIX: Select all text in chat input first (to clear @vibedebugger)
  let pasteSuccess = false;
  try {
    // Select all in the chat input to replace @vibedebugger
    await vscode.commands.executeCommand('editor.action.selectAll');

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 50));

    // Now paste (this will replace the @vibedebugger mention)
    await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
    pasteSuccess = true;

    if (Config.debugMode) {
      console.log('[Vibe Debugger] Auto-paste successful');
    }
  } catch (error) {
    if (Config.debugMode) {
      console.log('[Vibe Debugger] Auto-paste failed:', error);
    }
  }

  // Show appropriate message
  if (pasteSuccess) {
    stream.markdown('---\n\n');
    stream.markdown('✅ **Prompt pasted in chat input!**\n\n');
    stream.markdown('👉 **Just press Enter** (or click Send 📤) to send it to Copilot.\n\n');
    stream.markdown(
      '⚠️ *Make sure `@vibedebugger` is removed from the chat input before sending!*\n\n'
    );
  } else {
    stream.markdown('---\n\n');
    stream.markdown('📋 **Prompt copied to clipboard!**\n\n');
    stream.markdown('👉 **Steps:**\n');
    stream.markdown('1. Clear the chat input (remove `@vibedebugger`)\n');
    stream.markdown('2. Paste (Ctrl+V / Cmd+V)\n');
    stream.markdown('3. Press Enter to send to Copilot\n\n');
  }

  // Show preview
  stream.markdown('**Preview:**\n');
  stream.markdown('```\n');
  const preview =
    enhancedPrompt.length > 250 ? enhancedPrompt.substring(0, 250) + '...' : enhancedPrompt;
  stream.markdown(preview);
  stream.markdown('\n```\n');

  // Cleanup
  conversationContexts.delete(filePath);

  if (Config.debugMode) {
    console.log('[Vibe Debugger] Conversation completed');
  }
}

/**
 * Build enhanced prompt for Copilot (clean, no code blocks, no @copilot)
 * Copilot will read the actual file content itself!
 */
function buildEnhancedPrompt(
  debugContext: DebugContext,
  questionData: QuestionData,
  userAnswer: string
): string {
  // Start with clear instruction
  let prompt = `Fix the ${questionData.errorCategory} error in ${debugContext.fileName} at line ${debugContext.errorLine}.\n\n`;

  // Add error details
  prompt += `Error: "${debugContext.error.message}"\n\n`;

  // Add user's intent (THE KEY PART - reduces hallucination!)
  prompt += `User wants: "${userAnswer}"\n\n`;

  // Add imports if available (helps Copilot understand context)
  if (debugContext.relatedImports && debugContext.relatedImports.length > 0) {
    const imports = debugContext.relatedImports.slice(0, 5).join(', ');
    prompt += `Related imports: ${imports}\n\n`;
  }

  // Clear instruction for complete fix
  prompt += `Provide a complete working fix that addresses the user's intent.`;

  return prompt;
}

/**
 * Demo function to showcase the extension
 */
async function runDemo(): Promise<void> {
  try {
    const extensionPath = vscode.extensions.getExtension(
      'RavikumarBadami.vibe-debugger'
    )?.extensionPath;
    if (!extensionPath) {
      vscode.window.showErrorMessage('Could not find extension path');
      return;
    }

    const demoPath = vscode.Uri.file(path.join(extensionPath, 'demo', 'sample-errors'));

    const demoFiles = [
      {
        label: 'Null Reference Error (JavaScript)',
        file: 'null-error.js',
        description: 'Common null/undefined reference errors'
      },
      {
        label: 'Async/Promise Error (JavaScript)',
        file: 'async-error.js',
        description: 'Promise handling and async/await issues'
      },
      {
        label: 'DOM Manipulation Error (HTML)',
        file: 'dom-error.html',
        description: 'DOM element access and manipulation errors'
      }
    ];

    const selectedDemo = await vscode.window.showQuickPick(demoFiles, {
      placeHolder: 'Select a demo file to open and see Vibe Debugger in action',
      matchOnDescription: true
    });

    if (!selectedDemo) {
      return;
    }

    const fileUri = vscode.Uri.joinPath(demoPath, selectedDemo.file);
    const document = await vscode.workspace.openTextDocument(fileUri);
    await vscode.window.showTextDocument(document);

    const panel = vscode.window.createWebviewPanel(
      'vibeDebuggerDemo',
      'Vibe Debugger Demo Guide',
      vscode.ViewColumn.Beside,
      { enableScripts: true }
    );

    panel.webview.html = getDemoGuideHtml(selectedDemo);
  } catch (error) {
    console.error('Error running demo:', error);
    vscode.window.showErrorMessage('Failed to run demo. Check the console for details.');
  }
}

/**
 * Generate demo guide HTML
 */
function getDemoGuideHtml(demoFile: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: var(--vscode-font-family);
          padding: 20px;
          line-height: 1.6;
        }
        .title {
          color: var(--vscode-textLink-foreground);
          font-size: 1.5em;
          margin-bottom: 10px;
        }
        .description {
          color: var(--vscode-descriptionForeground);
          margin-bottom: 20px;
        }
        .section {
          background: var(--vscode-textBlockQuote-background);
          padding: 15px;
          border-radius: 5px;
          margin: 15px 0;
          border-left: 3px solid var(--vscode-textLink-foreground);
        }
        .highlight {
          background: var(--vscode-textBlockQuote-border);
          padding: 2px 6px;
          border-radius: 3px;
          font-family: monospace;
        }
        ol, ul {
          margin: 10px 0;
          padding-left: 25px;
        }
        li {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <h1 class="title">🚀 Vibe Debugger Demo</h1>
      <p class="description">${demoFile.description}</p>

      <div class="section">
        <strong>📋 How Vibe Debugger Works:</strong>
        <ol>
          <li>Open Copilot Chat (Ctrl/Cmd + Shift + I)</li>
          <li>Type: <span class="highlight">@vibedebugger fix this error</span></li>
          <li>Answer the clarifying question in plain English</li>
          <li>Enhanced prompt is pasted in chat automatically</li>
          <li>Press Enter to send to Copilot</li>
          <li>Copilot responds with a fix you can apply!</li>
        </ol>
      </div>

      <div class="section">
        <strong>💡 Why This Helps:</strong>
        <ul>
          <li><strong>Reduces hallucination:</strong> Copilot knows exactly what you want</li>
          <li><strong>Better context:</strong> Error type, location, and user intent</li>
          <li><strong>Beginner-friendly:</strong> Questions in simple language</li>
          <li><strong>Faster fixes:</strong> No back-and-forth with Copilot</li>
        </ul>
      </div>

      <div class="section">
        <strong>🎯 Try it now:</strong>
        <ol>
          <li>Look at the error in the editor (red squiggly line)</li>
          <li>Open Copilot Chat</li>
          <li>Type: <span class="highlight">@vibedebugger fix this error</span></li>
          <li>Answer in your own words</li>
          <li>Press Enter when prompt appears</li>
          <li>Click Apply on Copilot's response! ✨</li>
        </ol>
      </div>
    </body>
    </html>
  `;
}

/**
 * Activation function - called when extension is activated
 */
export function activate(context: vscode.ExtensionContext) {
  try {
    console.log('🚀 Activating Vibe Debugger extension...');

    // Initialize components
    errorMonitor = new ErrorMonitor();
    contextCapture = new ContextCapture();
    promptEnhancer = new PromptEnhancer();
    questionGenerator = new QuestionGenerator();

    // Start error monitoring
    errorMonitor.startMonitoring();

    // Create notification handler
    notificationHandler = new NotificationHandler(errorMonitor);

    context.subscriptions.push({
      dispose: () => notificationHandler.dispose()
    });

    // Listen to error persisted events
    errorMonitor.on('errorPersisted', errorData => {
      if (Config.debugMode) {
        console.log('[Vibe Debugger] Error persisted:', errorData);
      }
    });

    // Listen for configuration changes
    const configSubscription = Config.onDidChangeConfiguration(newConfig => {
      if (Config.debugMode) {
        console.log('[Vibe Debugger] Configuration changed:', newConfig);
      }

      if (statusBarItem) {
        const icon = Config.autoNotify ? '🔍' : '🔍❌';
        statusBarItem.text = `${icon} Vibe Debugger`;
        statusBarItem.tooltip = `Vibe Debugger - ${Config.autoNotify ? 'Active' : 'Paused'}. Enhances Copilot with smart context.`;
      }
    });
    context.subscriptions.push(configSubscription);

    // Register chat participant
    const chatParticipant = vscode.chat.createChatParticipant('vibedebugger', handleChatRequest);
    chatParticipant.iconPath = new vscode.ThemeIcon('debug-alt');
    context.subscriptions.push(chatParticipant);

    if (Config.debugMode) {
      console.log('[Vibe Debugger] Chat participant registered with ID: vibedebugger');
    }

    // Register demo command
    const demoCommand = vscode.commands.registerCommand('vibedebugger.runDemo', runDemo);
    context.subscriptions.push(demoCommand);

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    const icon = Config.autoNotify ? '🔍' : '🔍❌';
    statusBarItem.text = `${icon} Vibe Debugger`;
    statusBarItem.tooltip = `Vibe Debugger - ${Config.autoNotify ? 'Active' : 'Paused'}. Enhances Copilot with smart context.`;
    statusBarItem.command = 'workbench.action.openSettings';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Clean up old conversation contexts (older than 30 minutes)
    setInterval(
      () => {
        const now = Date.now();
        for (const [filePath, context] of conversationContexts.entries()) {
          if (now - context.timestamp > 30 * 60 * 1000) {
            conversationContexts.delete(filePath);
            if (Config.debugMode) {
              console.log(`[Vibe Debugger] Cleaned up old conversation context for ${filePath}`);
            }
          }
        }
      },
      5 * 60 * 1000
    ); // Run every 5 minutes

    console.log('✅ Vibe Debugger extension activated successfully!');
    vscode.window.showInformationMessage(
      '🚀 Vibe Debugger is now active! Helps Copilot understand errors better.'
    );
  } catch (error) {
    console.error('❌ Failed to activate Vibe Debugger extension:', error);
    vscode.window.showErrorMessage(
      'Failed to activate Vibe Debugger. Check the console for details.'
    );
    throw error;
  }
}

/**
 * Deactivation function - called when extension is deactivated
 */
export function deactivate() {
  try {
    if (errorMonitor) {
      errorMonitor.stopMonitoring();
    }
    if (statusBarItem) {
      statusBarItem.dispose();
    }
    conversationContexts.clear();
    console.log('✅ Vibe Debugger extension deactivated.');
  } catch (error) {
    console.error('❌ Error during deactivation:', error);
  }
}

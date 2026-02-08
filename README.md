# Vibe Debugger

[![Visual Studio Marketplace](https://img.shields.io/visual-studio-marketplace/v/vibe-debugger.vibe-debugger)](https://marketplace.visualstudio.com/items?itemName=vibe-debugger.vibe-debugger)
[![Visual Studio Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/vibe-debugger.vibe-debugger)](https://marketplace.visualstudio.com/items?itemName=vibe-debugger.vibe-debugger)

An AI-powered debugging assistant for Visual Studio Code that helps beginners fix code errors by asking clarifying questions before providing solutions.

## ✨ Features

- 🔍 **Automatic Error Detection**: Monitors your code for errors in real-time
- 🤖 **Smart Question Generation**: Asks context-aware clarifying questions before suggesting fixes
- 💬 **Interactive Chat Support**: Chat with the AI debugger using `@vibedebugger`
- ⚙️ **Configurable Notifications**: Customize when and how you receive error notifications
- 🎯 **Context-Aware Analysis**: Captures file content, recent changes, and error context
- 🚀 **Demo Mode**: Try the extension with sample error files

## 🚀 Quick Start

### Installation

1. Open Visual Studio Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Vibe Debugger"
4. Click Install

### First Use

1. Open any file with code errors
2. Wait for automatic error detection (default: 10 seconds)
3. Click "Help Me" when the notification appears
4. Answer the clarifying questions
5. Receive AI-powered fix suggestions

## 🎮 Demo Mode

Experience Vibe Debugger with intentionally buggy sample files:

1. Open Command Palette (Ctrl+Shift+P)
2. Run "Vibe Debugger: Run Demo"
3. Select a demo file:
   - **Null Reference Error**: Common JavaScript null/undefined issues
   - **Async/Promise Error**: Promise handling and async/await problems
   - **DOM Error**: HTML/DOM manipulation issues

The demo will open a guide panel explaining what to expect and how the extension works.

## 💬 Chat Interface

Interact directly with Vibe Debugger using the chat interface:

```
@vibedebugger I need help with an error
```

The AI will analyze your current file and ask clarifying questions to provide better assistance.

## ⚙️ Configuration

Customize Vibe Debugger through VS Code settings:

### Auto Notifications

- **Setting**: `vibedebugger.autoNotify`
- **Type**: Boolean
- **Default**: `true`
- **Description**: Enable automatic error notifications

### Notification Delay

- **Setting**: `vibedebugger.notificationDelay`
- **Type**: Number (seconds)
- **Default**: `10`
- **Description**: Delay before showing error notifications

### Debug Mode

- **Setting**: `vibedebugger.debugMode`
- **Type**: Boolean
- **Default**: `false`
- **Description**: Enable additional logging for troubleshooting

### Max Notifications per Hour

- **Setting**: `vibedebugger.maxNotificationsPerHour`
- **Type**: Number
- **Default**: `5`
- **Description**: Maximum number of notifications per hour

## 🔧 How It Works

1. **Error Detection**: Monitors VS Code diagnostics for errors
2. **Persistence Check**: Waits for errors to persist (configurable delay)
3. **Context Capture**: Gathers file content, error details, and recent changes
4. **Question Generation**: Creates context-aware clarifying questions
5. **AI Enhancement**: Uses language models to provide intelligent suggestions
6. **Interactive Fixes**: Guides users through understanding and fixing errors

## 📁 Project Structure

```
vibe-debugger/
├── src/
│   ├── extension.ts          # Main extension entry point
│   ├── errorMonitor.ts       # Error detection and monitoring
│   ├── contextCapture.ts     # Debug context gathering
│   ├── promptEnhancer.ts     # AI prompt enhancement
│   ├── notificationHandler.ts # User notifications
│   ├── questionGenerator.ts  # Smart question generation
│   ├── config.ts            # Configuration management
│   └── test/
│       ├── suite/
│       │   └── extension.test.ts
│       └── questionGenerator.test.ts
├── demo/
│   └── sample-errors/
│       ├── null-error.js
│       ├── async-error.js
│       └── dom-error.html
├── package.json
└── README.md
```

## 🧪 Testing

### Running Tests

The extension includes comprehensive test coverage. To run the test suite:

```bash
npm test
```

**Note**: If you encounter path resolution issues (common with workspace paths containing spaces), you can run tests manually:

```bash
# Compile tests
npm run compile-tests

# Run compiled tests with Node.js
node out/test/extension.test.js
node out/test/questionGenerator.test.js
node out/test/suite/extension.test.js
```

### Test Coverage

Tests cover:

- ✅ Error detection functionality
- ✅ Context capture accuracy
- ✅ Prompt enhancement
- ✅ Notification triggering
- ✅ Configuration management
- ✅ Component integration
- ✅ Question generation logic

### Test Structure

```
test/
├── extension.test.ts          # Basic extension tests
├── questionGenerator.test.ts  # Unit tests for question generation
└── suite/
    └── extension.test.ts      # Comprehensive integration tests
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details.

## 🐛 Known Issues

- Demo mode requires the extension to be properly installed
- Some complex error patterns may need additional context
- Performance may vary based on file size and complexity
- Test runner may have issues with workspace paths containing spaces (use manual test execution as workaround)

## 🙏 Acknowledgments

- Built with VS Code Extension API
- Uses GitHub Copilot Chat for AI assistance
- Inspired by the need for better debugging education

---

**Happy Debugging!** 🎉

For support, please file an issue on GitHub or use the VS Code chat interface with `@vibedebugger`.

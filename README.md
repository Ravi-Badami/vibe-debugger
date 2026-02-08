# Vibe Debugger

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/RavikumarBadami.vibe-debugger)](https://marketplace.visualstudio.com/items?itemName=RavikumarBadami.vibe-debugger)
[![Visual Studio Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/RavikumarBadami.vibe-debugger)](https://marketplace.visualstudio.com/items?itemName=RavikumarBadami.vibe-debugger)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An intelligent AI-powered debugging assistant for Visual Studio Code that transforms how beginners learn to debug code. Instead of providing direct answers, Vibe Debugger asks targeted questions to guide developers through the debugging process, building problem-solving skills.

## ✨ Key Features

### 🤖 Intelligent Error Analysis

- **Real-time Error Detection**: Automatically monitors your code for syntax and runtime errors
- **Context-Aware Analysis**: Captures file content, error details, and surrounding code context
- **Smart Diagnostics**: Understands error patterns and provides relevant insights

### 🎓 Educational Approach

- **Guided Learning**: Asks clarifying questions instead of giving direct answers
- **Progressive Disclosure**: Builds understanding step by step
- **Problem-Solving Skills**: Teaches debugging methodology, not just fixes

### 💬 Interactive Chat Interface

- **Natural Language Support**: Chat with the AI debugger using `@vibedebugger`
- **Conversational Debugging**: Explain your issues in plain English
- **Follow-up Questions**: Refines understanding based on your responses

### ⚙️ Customizable Experience

- **Flexible Notifications**: Configure when and how you receive error alerts
- **Rate Limiting**: Control notification frequency to avoid disruption
- **Debug Mode**: Enable detailed logging for troubleshooting

### 🚀 Demo Mode

- **Interactive Learning**: Try the extension with pre-built error scenarios
- **Sample Cases**: Null reference errors, async/await issues, DOM manipulation problems
- **Guided Experience**: Learn through hands-on examples

## 🚀 Getting Started

### Installation

1. Open **Visual Studio Code**
2. Navigate to the **Extensions** view (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for **"Vibe Debugger"**
4. Click **Install**

### Quick Start

1. **Open a JavaScript or TypeScript file** in your workspace
2. **Introduce an error** (e.g., reference an undefined variable)
3. **Wait for the notification** (appears after 10 seconds by default)
4. **Click "Help Me"** when the notification appears
5. **Answer the questions** posed by the AI debugger
6. **Learn and apply** the suggested debugging approach

## 💬 Using the Chat Interface

Interact naturally with Vibe Debugger through VS Code's chat interface:

```
@vibedebugger I have a null reference error on line 25
@vibedebugger Help me debug this async function
@vibedebugger Why is my variable undefined?
```

The AI will analyze your current file context and ask targeted questions to guide your debugging process.

## 🎮 Try the Demo

Experience Vibe Debugger's capabilities with our interactive demo:

1. Open the **Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run **"Vibe Debugger: Run Demo"**
3. Choose from sample error scenarios:
   - **Null Reference Errors**: Common undefined/null issues
   - **Async/Await Problems**: Promise and asynchronous code issues
   - **DOM Manipulation**: Browser API and DOM-related errors

## ⚙️ Configuration

Customize Vibe Debugger through VS Code settings (`Ctrl+,`):

| Setting                                | Description                                  | Default |
| -------------------------------------- | -------------------------------------------- | ------- |
| `vibedebugger.autoNotify`              | Enable automatic error notifications         | `true`  |
| `vibedebugger.notificationDelay`       | Delay before showing notifications (seconds) | `10`    |
| `vibedebugger.debugMode`               | Enable detailed logging                      | `false` |
| `vibedebugger.maxNotificationsPerHour` | Maximum notifications per hour               | `5`     |

## 🔧 How It Works

Vibe Debugger follows a systematic approach to teaching debugging:

1. **Error Detection**: Monitors VS Code's diagnostic system for errors
2. **Context Analysis**: Gathers relevant code context and error details
3. **Question Generation**: Creates targeted questions based on error type and context
4. **Interactive Learning**: Guides you through the debugging process
5. **Skill Building**: Helps you develop independent debugging abilities

## 📋 Requirements

- **Visual Studio Code**: Version 1.109.0 or higher
- **Supported Languages**: JavaScript, TypeScript
- **Internet Connection**: Required for AI-powered features

## 🐛 Known Issues

- Complex error patterns may require additional context
- Performance may vary with very large files
- Some advanced debugging scenarios need manual intervention

## 🙋 Support

- **Documentation**: [GitHub Repository](https://github.com/Ravi-Badami/vibe-debugger)
- **Issues**: [GitHub Issues](https://github.com/Ravi-Badami/vibe-debugger/issues)
- **Chat Support**: Use `@vibedebugger` in VS Code's chat interface

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This extension is licensed under the [MIT License](LICENSE).

---

**Transform your debugging experience with AI-powered guidance.** 🚀

_Built with ❤️ for the developer community_
  
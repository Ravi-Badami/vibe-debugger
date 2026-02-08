# Vibe Debugger 🚀

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/RavikumarBadami.vibe-debugger)](https://marketplace.visualstudio.com/items?itemName=RavikumarBadami.vibe-debugger)
[![Visual Studio Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/RavikumarBadami.vibe-debugger)](https://marketplace.visualstudio.com/items?itemName=RavikumarBadami.vibe-debugger)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Enhance GitHub Copilot with intelligent error analysis and clarifying questions.**

Vibe Debugger doesn't replace Copilot—it makes it smarter! By asking clarifying questions and gathering comprehensive context, it helps Copilot understand your intent and generate better fixes.

## ✨ Features

- 🤔 **Asks clarifying questions** in simple, beginner-friendly language
- 📋 **Gathers comprehensive context** (code, imports, git changes, etc.)
- 💡 **Provides enhanced context** for Copilot to generate perfect fixes
- 🎯 **11 specialized error categories** with tailored questions
- 🚀 **No API calls needed** - works seamlessly with your existing Copilot

## 📋 Requirements

- **GitHub Copilot** subscription (required)
- **Visual Studio Code**: Version 1.109.0 or higher
- **Supported Languages**: JavaScript, TypeScript
- **Internet Connection**: Required for AI-powered features

## 🚀 Getting Started

### Installation

1. Install [GitHub Copilot](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot) (if not already installed)
2. Install Vibe Debugger from the marketplace
3. That's it! Start using `@vibedebugger` in Copilot Chat

### Usage

#### Basic Workflow

1. Open a file with errors
2. Open Copilot Chat (`Ctrl/Cmd+Shift+I`)
3. Type: `@vibedebugger fix this error`
4. Answer the clarifying question in your own words
5. Vibe Debugger provides enhanced context
6. Ask `@copilot` to fix using that context
7. Get your perfect fix! ✨

#### Example

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

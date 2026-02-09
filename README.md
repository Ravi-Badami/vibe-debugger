# Vibe Debugger

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/RavikumarBadami.vibe-debugger)](https://marketplace.visualstudio.com/items?itemName=RavikumarBadami.vibe-debugger)
[![Visual Studio Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/RavikumarBadami.vibe-debugger)](https://marketplace.visualstudio.com/items?itemName=RavikumarBadami.vibe-debugger)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Enhance GitHub Copilot with intelligent error analysis and clarifying questions.**

Vibe Debugger enhances GitHub Copilot by providing intelligent error analysis and generating clarifying questions to improve code fix suggestions. It works seamlessly with Copilot to deliver more accurate and context-aware solutions.

## Features

- **Clarifying Questions**: Generates targeted questions in clear, accessible language to understand error context
- **Comprehensive Context Gathering**: Collects code, imports, git changes, and other relevant information
- **Enhanced Context for Copilot**: Provides structured context to enable Copilot to generate more precise fixes
- **Specialized Error Categories**: Supports 11 distinct error types with tailored analysis approaches
- **Seamless Integration**: Operates without external API calls, working directly with existing Copilot installations

## Requirements

- **GitHub Copilot**: Active subscription required
- **Visual Studio Code**: Version 1.109.0 or higher
- **Supported Languages**: JavaScript, TypeScript
- **Internet Connection**: Required for AI-powered features

## Getting Started

### Installation

1. Ensure [GitHub Copilot](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot) is installed and configured
2. Install Vibe Debugger from the Visual Studio Marketplace
3. Restart VS Code if necessary
4. Begin using `@vibedebugger` in the Copilot Chat interface

### Usage

#### Basic Workflow

1. Open a file containing errors in VS Code
2. Access Copilot Chat (`Ctrl/Cmd+Shift+I`)
3. Enter: `@vibedebugger fix this error`
4. Respond to the generated clarifying question
5. Allow Vibe Debugger to provide enhanced context
6. Request `@copilot` to generate a fix using the provided context

#### Detailed Steps

To use Vibe Debugger effectively:

1. **Start the Chat**: Open the Copilot Chat interface in VS Code.
2. **Invoke Vibe Debugger**: Type `@vibedebugger` followed by your request, such as "fix this error".
3. **Provide Error Details**: Describe the error you're encountering.
4. **Select an Option**: When Vibe Debugger presents clarifying questions or options, choose the most relevant one and press Enter.
5. **Auto-Paste**: The selected option will automatically paste into the chat input.
6. **Confirm**: Press Enter again to submit your response.
7. **Receive Context**: Vibe Debugger will analyze and provide enhanced context for Copilot.
8. **Generate Fix**: Use `@copilot` to request a fix based on the provided context.

#### Example Interaction

```
User: @vibedebugger fix this error
Vibe Debugger: What type of error are you encountering?
  1. Null reference error
  2. Async/await issue
  3. DOM manipulation error
  4. Other
User: 1 [presses Enter]
Vibe Debugger: [Provides enhanced context for Copilot]
User: @copilot Please fix this null reference error using the context above
```

## Chat Interface

Interact with Vibe Debugger through VS Code's integrated chat interface:

```
@vibedebugger I have a null reference error on line 25
@vibedebugger Help me debug this async function
@vibedebugger Why is my variable undefined?
```

The extension analyzes the current file context and generates targeted questions to facilitate effective debugging.

## Demo

Explore Vibe Debugger's capabilities with the interactive demo:

1. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Execute "Vibe Debugger: Run Demo"
3. Select from available error scenarios:
   - Null Reference Errors
   - Async/Await Issues
   - DOM Manipulation Errors

## Configuration

Customize Vibe Debugger through VS Code settings (`Ctrl+,`):

| Setting                                | Description                                  | Default |
| -------------------------------------- | -------------------------------------------- | ------- |
| `vibedebugger.autoNotify`              | Enable automatic error notifications         | `true`  |
| `vibedebugger.notificationDelay`       | Delay before showing notifications (seconds) | `10`    |
| `vibedebugger.debugMode`               | Enable detailed logging                      | `false` |
| `vibedebugger.maxNotificationsPerHour` | Maximum notifications per hour               | `5`     |

## How It Works

Vibe Debugger employs a systematic approach to error analysis:

1. **Error Detection**: Monitors VS Code's diagnostic system for errors and warnings
2. **Context Analysis**: Collects relevant code context, dependencies, and error details
3. **Question Generation**: Creates targeted questions based on error type and code context
4. **Interactive Guidance**: Facilitates step-by-step debugging assistance
5. **Skill Development**: Promotes independent debugging capabilities through guided learning

## Known Issues

- Complex error patterns may require additional context
- Performance may vary with very large files
- Some advanced debugging scenarios require manual intervention

## Support

- **Documentation**: [GitHub Repository](https://github.com/Ravi-Badami/vibe-debugger)
- **Issues**: [GitHub Issues](https://github.com/Ravi-Badami/vibe-debugger/issues)
- **Chat Support**: Use `@vibedebugger` in VS Code's chat interface

## Contributing

Contributions are welcome. Please refer to the [Contributing Guide](CONTRIBUTING.md) for detailed information.

## 📄 License

This extension is licensed under the [MIT License](LICENSE).

---

**Enhance your debugging workflow with AI-powered assistance.**

Developed for the developer community.

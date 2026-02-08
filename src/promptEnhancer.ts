// Prompt Enhancer module
import { DebugContext } from './contextCapture';

export class PromptEnhancer {
  enhance(prompt: string): string {
    // Simple enhancement for chat
    return `Please help debug this: ${prompt}`;
  }

  enhancePrompt(userInput: string, context: DebugContext): string {
    const prompt = this.buildPromptTemplate(userInput, context);
    return prompt;
  }

  private buildPromptTemplate(userInput: string, context: DebugContext): string {
    let prompt = `# Code Debugging Request\n\n`;

    // Technical context section
    prompt += `## Technical Context\n`;
    prompt += `- **Language**: ${context.language}\n`;
    prompt += `- **File**: ${context.fileName}\n`;
    prompt += `- **Error Line**: ${context.errorLine}\n`;
    prompt += `- **Error Message**: ${context.error.message}\n`;
    prompt += `- **Error Severity**: ${context.error.severity}\n`;
    prompt += `- **Error Persisted**: ${context.error.hasPersisted ? 'Yes' : 'No'}\n`;
    if (context.error.fileChangedWhileError) {
      prompt += `- **File Changed While Error Present**: Yes (possible Copilot attempt)\n`;
    }
    prompt += `\n`;

    // Surrounding code
    prompt += `## Code Context\n`;
    prompt += `Error location and surrounding code:\n\`\`\`${context.language}\n${context.surroundingCode}\n\`\`\`\n\n`;

    // User input
    prompt += `## User Request\n`;
    prompt += `${userInput}\n\n`;

    // Error history
    prompt += `## Error History\n`;
    prompt += `- First detected: ${context.error.firstDetected}\n`;
    prompt += `- Last seen: ${context.error.lastSeen}\n`;
    prompt += `- Duration: ${Math.round((context.error.lastSeen - context.error.firstDetected) / 1000)} seconds\n`;
    if (context.recentChanges.length > 0) {
      prompt += `- Recent file changes: ${context.recentChanges.join(', ')}\n`;
    }
    prompt += `\n`;

    // Additional context
    if (context.activeSelection) {
      prompt += `## Active Selection\n\`\`\`${context.language}\n${context.activeSelection}\n\`\`\`\n\n`;
    }

    if (context.relatedImports && context.relatedImports.length > 0) {
      prompt += `## Related Imports\n${context.relatedImports.map(imp => `- ${imp}`).join('\n')}\n\n`;
    }

    if (context.gitDiff) {
      prompt += `## Recent Git Changes\n\`\`\`diff\n${context.gitDiff}\n\`\`\`\n\n`;
    }

    // Instructions
    prompt += `## Instructions\n`;
    prompt += `1. Analyze the error and context above\n`;
    prompt += `2. Provide a complete, working code fix\n`;
    prompt += `3. Explain what was wrong and how the fix addresses it\n`;
    prompt += `4. Ensure the fix is in the correct language (${context.language})\n`;
    prompt += `5. Include only the necessary code changes, not the entire file\n`;
    prompt += `6. Use proper error handling and best practices\n\n`;

    // Code formatting
    prompt += `## Code Formatting Requirements\n`;
    prompt += `- Use ${context.language} syntax\n`;
    prompt += `- Include line numbers if showing multiple lines\n`;
    prompt += `- Show the exact replacement code\n`;
    prompt += `- Explain any new imports or dependencies needed\n\n`;

    prompt += `Please provide the fix now.`;

    return prompt;
  }
}

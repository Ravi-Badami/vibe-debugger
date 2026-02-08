// Prompt Enhancer module
import { DebugContext } from './contextCapture';

export class PromptEnhancer {
  enhance(prompt: string): string {
    // Simple enhancement for chat
    return `Please help debug this: ${prompt}`;
  }

  enhancePrompt(
    userInput: string,
    context: DebugContext,
    userAnswer?: string,
    analyzedProblem?: string,
    specificFixSteps?: string
  ): string {
    const prompt = this.buildPromptTemplate(
      userInput,
      context,
      userAnswer,
      analyzedProblem,
      specificFixSteps
    );
    return prompt;
  }

  private buildPromptTemplate(
    userInput: string,
    context: DebugContext,
    userAnswer?: string,
    analyzedProblem?: string,
    specificFixSteps?: string
  ): string {
    let prompt = `CONTEXT:\n\n`;
    prompt += `File: ${context.fileName}\n`;
    prompt += `Error: ${context.error.message}\n`;
    prompt += `Line: ${context.errorLine}\n`;
    prompt += `Language: ${context.language}\n\n`;

    prompt += `SURROUNDING CODE:\n${context.surroundingCode}\n\n`;

    prompt += `USER CLARIFICATION:\n${userAnswer || 'Not provided'}\n\n`;

    prompt += `TASK:\n${analyzedProblem || this.analyzeErrorPattern(context)}\n\n`;

    prompt += `INSTRUCTIONS:\n${specificFixSteps || this.generateFixInstructions(context)}\n\n`;

    prompt += `Please provide a complete code fix based on the context above.`;

    return prompt;
  }

  private analyzeErrorPattern(context: DebugContext): string {
    const errorMsg = context.error.message.toLowerCase();
    const code = context.surroundingCode.toLowerCase();

    if (errorMsg.includes('null') || errorMsg.includes('undefined')) {
      return 'The error suggests a null/undefined reference. Check for proper null checks and initialization.';
    }

    if (errorMsg.includes('async') || errorMsg.includes('await') || errorMsg.includes('promise')) {
      return 'This appears to be an async/await or Promise-related error. Verify proper async handling and error catching.';
    }

    if (context.language === 'javascript' || context.language === 'typescript') {
      if (code.includes('document.') || code.includes('element')) {
        return 'DOM manipulation error detected. Check element existence and timing of DOM access.';
      }
    }

    if (errorMsg.includes('cannot find') || errorMsg.includes('module not found')) {
      return 'Module import error. Verify import paths and module availability.';
    }

    return 'General error analysis: Review the code for common issues like variable scoping, type mismatches, or missing dependencies.';
  }

  private generateFixInstructions(context: DebugContext): string {
    let instructions = `1. Analyze the error "${context.error.message}" in ${context.language}\n`;
    instructions += `2. Focus on line ${context.errorLine} and surrounding code\n`;
    instructions += `3. Provide a complete, working code fix\n`;
    instructions += `4. Explain what was wrong and how the fix addresses it\n`;
    instructions += `5. Use proper ${context.language} syntax and best practices\n`;
    instructions += `6. Include any necessary imports or dependencies\n`;
    instructions += `7. Show only the changed code, not the entire file`;

    return instructions;
  }
}

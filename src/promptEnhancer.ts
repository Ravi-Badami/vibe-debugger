// Prompt Enhancer module - Enhanced version
import { DebugContext } from './contextCapture';
import { QuestionData } from './questionGenerator';

export class PromptEnhancer {
  /**
   * Enhances a prompt for the language model with full context
   */
  enhancePrompt(
    userInput: string,
    context: DebugContext,
    userAnswer?: string,
    questionData?: QuestionData
  ): string {
    if (userAnswer) {
      // User has answered a clarifying question
      return this.buildFixPromptWithAnswer(userInput, context, userAnswer, questionData);
    } else {
      // Initial analysis without user answer
      return this.buildInitialAnalysisPrompt(userInput, context);
    }
  }

  /**
   * Build prompt when user has answered the clarifying question
   */
  private buildFixPromptWithAnswer(
    userInput: string,
    context: DebugContext,
    userAnswer: string,
    questionData?: QuestionData
  ): string {
    let prompt = `You are an expert debugging assistant helping a developer fix their code. You asked them a clarifying question and they responded. Now provide a complete, working fix.

=== CONTEXT ===

**File:** ${context.fileName}
**Language:** ${context.language}
**Error Location:** Line ${context.errorLine}
**Error Message:** ${context.error.message}
${questionData ? `**Error Category:** ${questionData.errorCategory}` : ''}

=== CODE WITH ERROR ===

\`\`\`${context.language}
${context.surroundingCode}
\`\`\`

${this.buildImportsSection(context)}
${this.buildGitDiffSection(context)}
${this.buildRecentChangesSection(context)}

=== YOUR QUESTION ===

${questionData ? questionData.question : 'What should this code do?'}

=== USER'S ANSWER ===

${userAnswer}

=== YOUR TASK ===

Based on the user's answer, provide a complete fix that:

1. **Fixes the error completely** - address the root cause, not just symptoms
2. **Matches user intent** - implement exactly what they described in their answer
3. **Follows best practices** - use proper ${context.language} patterns
4. **Includes explanation** - explain what was wrong and how your fix addresses it
5. **Shows complete code** - provide the corrected code block with syntax highlighting

**Format your response as:**

## 🔍 What Was Wrong

[Brief explanation of the error]

## ✅ The Fix

\`\`\`${context.language}
[Complete fixed code]
\`\`\`

## 📝 Explanation

[Explain how this fix addresses the user's intent and why it works]

${context.language === 'typescript' ? '\n**Note:** Use proper TypeScript types.' : ''}
${context.language === 'javascript' ? '\n**Note:** Follow modern JavaScript (ES6+) best practices.' : ''}

Begin your response now:`;

    return prompt;
  }

  /**
   * Build initial analysis prompt (without user answer)
   */
  private buildInitialAnalysisPrompt(userInput: string, context: DebugContext): string {
    let prompt = `You are an expert debugging assistant. Analyze this error and provide insights.

=== CONTEXT ===

**File:** ${context.fileName}
**Language:** ${context.language}
**Error Location:** Line ${context.errorLine}
**Error Message:** ${context.error.message}

=== CODE WITH ERROR ===

\`\`\`${context.language}
${context.surroundingCode}
\`\`\`

${this.buildImportsSection(context)}

=== USER REQUEST ===

${userInput}

=== YOUR TASK ===

Provide a preliminary analysis of this error. Explain what's happening and potential causes.

Begin your analysis:`;

    return prompt;
  }

  /**
   * Build imports section if available
   */
  private buildImportsSection(context: DebugContext): string {
    if (!context.relatedImports || context.relatedImports.length === 0) {
      return '';
    }

    return `
=== RELATED IMPORTS ===

\`\`\`${context.language}
${context.relatedImports.join('\n')}
\`\`\`
`;
  }

  /**
   * Build git diff section if available
   */
  private buildGitDiffSection(context: DebugContext): string {
    if (
      !context.gitDiff ||
      context.gitDiff === 'No changes' ||
      context.gitDiff.includes('failed')
    ) {
      return '';
    }

    return `
=== RECENT CODE CHANGES (Git Diff) ===

\`\`\`diff
${context.gitDiff}
\`\`\`
`;
  }

  /**
   * Build recent changes section
   */
  private buildRecentChangesSection(context: DebugContext): string {
    if (!context.recentChanges || context.recentChanges.length === 0) {
      return '';
    }

    return `
=== RECENT ACTIVITY ===

${context.recentChanges.map(change => `- ${change}`).join('\n')}
`;
  }

  /**
   * Analyze error pattern for additional context
   */
  analyzeErrorPattern(context: DebugContext): string {
    const errorMsg = context.error.message.toLowerCase();
    const code = context.surroundingCode.toLowerCase();

    if (errorMsg.includes('null') || errorMsg.includes('undefined')) {
      return 'Null/undefined reference - likely missing initialization or async timing issue.';
    }

    if (errorMsg.includes('async') || errorMsg.includes('await') || errorMsg.includes('promise')) {
      return 'Async/await issue - verify proper async handling and error catching.';
    }

    if (context.language === 'javascript' || context.language === 'typescript') {
      if (code.includes('document.') || code.includes('element')) {
        return 'DOM manipulation error - check element existence and timing.';
      }
    }

    if (errorMsg.includes('cannot find') || errorMsg.includes('module not found')) {
      return 'Module import error - verify import paths and package installation.';
    }

    if (errorMsg.includes('is not a function')) {
      return 'Function reference error - check if function is properly defined or imported.';
    }

    return 'General error - review code logic and syntax.';
  }

  /**
   * Generate fix instructions based on context
   */
  generateFixInstructions(context: DebugContext): string {
    return `
1. Analyze the error "${context.error.message}" in ${context.language}
2. Focus on line ${context.errorLine} and surrounding context
3. Consider the user's clarification about their intent
4. Provide a complete, working code fix
5. Explain what was wrong and how the fix addresses it
6. Use proper ${context.language} syntax and best practices
7. Include any necessary imports or dependencies
8. Show the complete fixed code block
`.trim();
  }
}

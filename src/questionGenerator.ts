// Question Generator module
import { DebugContext } from './contextCapture';

export interface QuestionData {
  question: string;
  errorCategory: string;
  suggestedAnswerFormat: string;
}

export class QuestionGenerator {
  generateQuestion(context: DebugContext): QuestionData {
    const errorMsg = context.error.message.toLowerCase();
    const code = context.surroundingCode.toLowerCase();

    // Null/undefined errors
    if (
      errorMsg.includes('null') ||
      errorMsg.includes('undefined') ||
      errorMsg.includes('cannot read property')
    ) {
      const variable = this.extractVariableFromError(errorMsg, code);
      return {
        question: `What should ${variable || 'this value'} contain?`,
        errorCategory: 'null-undefined',
        suggestedAnswerFormat: 'Describe the expected value or object'
      };
    }

    // Navigation/routing errors
    if (
      errorMsg.includes('navigation') ||
      errorMsg.includes('route') ||
      errorMsg.includes('redirect') ||
      code.includes('navigate') ||
      code.includes('router')
    ) {
      const action = this.extractActionFromCode(code);
      return {
        question: `Where should the user go after ${action || 'this action'}?`,
        errorCategory: 'navigation',
        suggestedAnswerFormat: 'Specify the target page or route'
      };
    }

    // API/network errors
    if (
      errorMsg.includes('fetch') ||
      errorMsg.includes('api') ||
      errorMsg.includes('network') ||
      errorMsg.includes('http') ||
      code.includes('fetch') ||
      code.includes('axios')
    ) {
      const endpoint = this.extractEndpointFromCode(code);
      return {
        question: `What data should ${endpoint || 'the API'} return?`,
        errorCategory: 'api',
        suggestedAnswerFormat: 'Describe the expected response structure'
      };
    }

    // Styling/CSS errors
    if (
      errorMsg.includes('style') ||
      errorMsg.includes('css') ||
      errorMsg.includes('class') ||
      code.includes('style') ||
      code.includes('css') ||
      code.includes('class')
    ) {
      const element = this.extractElementFromCode(code);
      return {
        question: `What should ${element || 'this element'} look like?`,
        errorCategory: 'styling',
        suggestedAnswerFormat: 'Describe appearance, colors, or layout'
      };
    }

    // Logic/conditional errors
    if (
      errorMsg.includes('logic') ||
      errorMsg.includes('condition') ||
      errorMsg.includes('if') ||
      code.includes('if ') ||
      code.includes('else') ||
      code.includes('switch')
    ) {
      const condition = this.extractConditionFromCode(code);
      return {
        question: `What should happen when ${condition || 'this condition'}?`,
        errorCategory: 'logic',
        suggestedAnswerFormat: 'Describe the expected behavior or outcome'
      };
    }

    // Function/method errors
    if (
      errorMsg.includes('function') ||
      errorMsg.includes('method') ||
      errorMsg.includes('is not a function')
    ) {
      const functionName = this.extractFunctionFromError(errorMsg, code);
      return {
        question: `What should ${functionName || 'this function'} do?`,
        errorCategory: 'function',
        suggestedAnswerFormat: "Describe the function's purpose or expected behavior"
      };
    }

    // Variable/scope errors
    if (errorMsg.includes('not defined') || errorMsg.includes('referenceerror')) {
      const variable = this.extractVariableFromError(errorMsg, code);
      return {
        question: `Where should ${variable || 'this variable'} be defined?`,
        errorCategory: 'scope',
        suggestedAnswerFormat: 'Specify the correct scope or import location'
      };
    }

    // Type errors
    if (
      errorMsg.includes('type') ||
      errorMsg.includes('expected') ||
      errorMsg.includes('typeerror')
    ) {
      return {
        question: 'What type should this value be?',
        errorCategory: 'type',
        suggestedAnswerFormat: 'Specify the correct data type'
      };
    }

    // Fallback generic question
    return {
      question: 'What should happen instead of this error?',
      errorCategory: 'general',
      suggestedAnswerFormat: 'Describe the expected behavior'
    };
  }

  private extractVariableFromError(errorMsg: string, code: string): string | null {
    // Try to extract variable name from error message
    const patterns = [
      /cannot read property ['"]([^'"]+)['"] of/i,
      /['"]([^'"]+)['"] is (null|undefined)/i,
      /variable ['"]([^'"]+)['"] is not defined/i
    ];

    for (const pattern of patterns) {
      const match = errorMsg.match(pattern);
      if (match) {
        return match[1];
      }
    }

    // Try to extract from code context
    const varPatterns = [
      /\b(let|const|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*[=]/g
    ];

    for (const pattern of varPatterns) {
      const matches = code.match(pattern);
      if (matches && matches.length > 0) {
        // Return the last variable found (likely the problematic one)
        const lastMatch = matches[matches.length - 1];
        const varMatch = lastMatch.match(/[a-zA-Z_$][a-zA-Z0-9_$]*/);
        if (varMatch) {
          return varMatch[0];
        }
      }
    }

    return null;
  }

  private extractActionFromCode(code: string): string | null {
    const actionPatterns = [
      /navigate\s*\(\s*['"]([^'"]+)['"]/i,
      /router\.\w+\s*\(\s*['"]([^'"]+)['"]/i,
      /\b(click|submit|change|load)\b/i
    ];

    for (const pattern of actionPatterns) {
      const match = code.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }

    return null;
  }

  private extractEndpointFromCode(code: string): string | null {
    const endpointPatterns = [
      /fetch\s*\(\s*['"]([^'"]+)['"]/i,
      /axios\.\w+\s*\(\s*['"]([^'"]+)['"]/i,
      /['"](\/api\/[^'"\s]+)['"]/i
    ];

    for (const pattern of endpointPatterns) {
      const match = code.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  private extractElementFromCode(code: string): string | null {
    const elementPatterns = [
      /document\.getElementById\s*\(\s*['"]([^'"]+)['"]/i,
      /document\.querySelector\s*\(\s*['"]([^'"]+)['"]/i,
      /class\s*=\s*['"]([^'"]+)['"]/i,
      /id\s*=\s*['"]([^'"]+)['"]/i
    ];

    for (const pattern of elementPatterns) {
      const match = code.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  private extractConditionFromCode(code: string): string | null {
    const conditionPatterns = [
      /if\s*\(\s*([^)]+)/i,
      /else\s+if\s*\(\s*([^)]+)/i,
      /switch\s*\(\s*([^)]+)/i
    ];

    for (const pattern of conditionPatterns) {
      const match = code.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  private extractFunctionFromError(errorMsg: string, code: string): string | null {
    // Try to extract function name from error
    const funcPatterns = [/['"]([^'"]+)['"] is not a function/i, /function ['"]([^'"]+)['"]/i];

    for (const pattern of funcPatterns) {
      const match = errorMsg.match(pattern);
      if (match) {
        return match[1];
      }
    }

    // Extract from code
    const codeFuncPatterns = [
      /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g
    ];

    for (const pattern of codeFuncPatterns) {
      const matches = code.match(pattern);
      if (matches && matches.length > 0) {
        const lastMatch = matches[matches.length - 1];
        const funcMatch = lastMatch.match(/[a-zA-Z_$][a-zA-Z0-9_$]*/);
        if (funcMatch) {
          return funcMatch[0];
        }
      }
    }

    return null;
  }
}
